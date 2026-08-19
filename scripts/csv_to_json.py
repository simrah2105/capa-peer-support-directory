#!/usr/bin/env python3
"""
Convert the CAPA peer support spreadsheet (CSV export) into data/groups.json,
validating every row against data/groups.schema.json.

Usage
-----
  python3 scripts/csv_to_json.py data/groups-template.csv
  python3 scripts/csv_to_json.py my-export.csv --out data/groups.json
  python3 scripts/csv_to_json.py --check          # re-validate the existing groups.json

Nothing is written if there are any errors. Errors name the spreadsheet row
number (the number you see in Excel or Google Sheets) and the column heading.

No installation needed. Uses only the Python standard library.
"""

import argparse
import csv
import datetime as dt
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SCHEMA_PATH = os.path.join(ROOT, "data", "groups.schema.json")
DEFAULT_OUT = os.path.join(ROOT, "data", "groups.json")

# Columns whose spreadsheet cell holds several values separated by "|".
LIST_SEPARATOR = "|"
BOOL_COLUMNS = {"placeholder"}


# --------------------------------------------------------------------------
# A small validator for the subset of JSON Schema this project uses.
# Reading the rules from the schema file means the schema is the only place
# the field rules are written down.
# --------------------------------------------------------------------------

class Problem:
    def __init__(self, row, column, message):
        self.row = row          # spreadsheet row number, or None
        self.column = column    # column heading, or None
        self.message = message

    def __str__(self):
        where = []
        if self.row is not None:
            where.append("row %d" % self.row)
        if self.column:
            where.append('column "%s"' % self.column)
        prefix = " / ".join(where)
        return ("  %s: %s" % (prefix, self.message)) if prefix else ("  %s" % self.message)


def resolve(schema, root):
    """Follow a $ref into $defs."""
    seen = 0
    while "$ref" in schema and seen < 10:
        ref = schema["$ref"]
        if not ref.startswith("#/"):
            raise ValueError("only local $ref supported, got %r" % ref)
        node = root
        for part in ref[2:].split("/"):
            node = node[part]
        schema = node
        seen += 1
    return schema


def type_ok(value, expected):
    types = expected if isinstance(expected, list) else [expected]
    for t in types:
        if t == "string" and isinstance(value, str):
            return True
        if t == "boolean" and isinstance(value, bool):
            return True
        if t == "array" and isinstance(value, list):
            return True
        if t == "object" and isinstance(value, dict):
            return True
        if t == "null" and value is None:
            return True
    return False


def validate_value(value, schema, root, row, column, problems):
    schema = resolve(schema, root)

    if "type" in schema and not type_ok(value, schema["type"]):
        want = schema["type"]
        want = " or ".join(want) if isinstance(want, list) else want
        problems.append(Problem(row, column, "expected %s, got %s (%r)" % (want, type(value).__name__, value)))
        return

    if "enum" in schema and value not in schema["enum"]:
        problems.append(Problem(
            row, column,
            "%r is not an allowed value. Allowed: %s" % (value, ", ".join(map(str, schema["enum"])))
        ))
        return

    if isinstance(value, str):
        if "minLength" in schema and len(value.strip()) < schema["minLength"]:
            problems.append(Problem(row, column, "must not be empty"))
        if "pattern" in schema and not re.match(schema["pattern"], value):
            hint = {
                r"^\d{4}-\d{2}-\d{2}$": "must be a date written as YYYY-MM-DD, e.g. 2026-03-14",
                r"^[a-z0-9]+(-[a-z0-9]+)*$": "must be lowercase letters, numbers and hyphens only, e.g. arthritis-connections-online",
            }.get(schema["pattern"], "does not match the required format (%s)" % schema["pattern"])
            problems.append(Problem(row, column, "%r %s" % (value, hint)))

    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            problems.append(Problem(row, column, "needs at least %d value(s); it is empty" % schema["minItems"]))
        item_schema = schema.get("items")
        if item_schema:
            for item in value:
                validate_value(item, item_schema, root, row, column, problems)


def validate_record(record, schema, root, row, problems):
    schema = resolve(schema, root)
    known = schema.get("properties", {})

    for field in schema.get("required", []):
        if field not in record or record[field] in (None, "", []):
            problems.append(Problem(row, field, "is required but is empty"))

    if schema.get("additionalProperties") is False:
        for field in record:
            if field not in known:
                problems.append(Problem(
                    row, field,
                    "is not a field this directory understands. Check the spelling against data/groups-template.csv"
                ))

    for field, value in record.items():
        if field in known:
            validate_value(value, known[field], root, row, field, problems)


# --------------------------------------------------------------------------
# Cross-record and common-sense checks that JSON Schema cannot express
# --------------------------------------------------------------------------

def extra_checks(records, rows, problems):
    seen_ids = {}
    today = dt.date.today()

    for record, row in zip(records, rows):
        rid = record.get("id")
        if isinstance(rid, str) and rid:
            if rid in seen_ids:
                problems.append(Problem(
                    row, "id",
                    'duplicate id "%s", already used on row %d. Every listing needs its own id.' % (rid, seen_ids[rid])
                ))
            else:
                seen_ids[rid] = row

        verified = record.get("last_verified")
        if isinstance(verified, str) and re.match(r"^\d{4}-\d{2}-\d{2}$", verified):
            try:
                when = dt.date.fromisoformat(verified)
                if when > today:
                    problems.append(Problem(row, "last_verified", "%s is in the future" % verified))
            except ValueError:
                problems.append(Problem(row, "last_verified", "%r is not a real calendar date" % verified))

        for url_field in ("access_url", "source_url"):
            url = record.get(url_field)
            if url and not str(url).startswith(("http://", "https://")):
                problems.append(Problem(row, url_field, '%r must start with https:// (or http://)' % url))

        email = record.get("contact_email")
        if email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", str(email)):
            problems.append(Problem(row, "contact_email", "%r does not look like an email address" % email))

        if record.get("format") == "in-person" and not record.get("city"):
            problems.append(Problem(
                row, "city",
                "an in-person group needs a city, otherwise people cannot tell whether they can get there"
            ))

        if record.get("moderated") == "yes" and not (record.get("moderation_notes_en") or "").strip():
            problems.append(Problem(
                row, "moderation_notes_en",
                'is empty. When moderated = "yes", say who moderates and what the rules are, '
                "CAPA surfaces this on every listing."
            ))


# --------------------------------------------------------------------------
# CSV -> records
# --------------------------------------------------------------------------

def cell_to_value(raw, field, schema_props):
    """Turn one spreadsheet cell into the right JSON shape for its field."""
    raw = (raw or "").strip()
    prop = schema_props.get(field, {})

    if field in BOOL_COLUMNS:
        return raw.lower() in ("true", "yes", "y", "1")

    is_array = prop.get("type") == "array"
    if is_array:
        return [part.strip() for part in raw.split(LIST_SEPARATOR) if part.strip()]

    allows_null = prop.get("type") == ["string", "null"] or (
        isinstance(prop.get("$ref"), str) and prop["$ref"].endswith("nullableString")
    )
    if raw == "":
        return None if allows_null else ""
    return raw


def read_csv(path, schema_props):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames is None:
            raise SystemExit("Error: %s appears to be empty." % path)
        headers = [h.strip() for h in reader.fieldnames]
        records, rows = [], []
        for line_number, raw_row in enumerate(reader, start=2):  # row 1 is the heading row
            if not any((v or "").strip() for v in raw_row.values()):
                continue  # skip blank spreadsheet rows
            record = {}
            for header in headers:
                if not header:
                    continue
                value = cell_to_value(raw_row.get(header, ""), header, schema_props)
                # Drop empty optional text so the JSON stays tidy
                if value == "" and header not in schema_props:
                    continue
                if value == "" and header in schema_props and schema_props[header].get("type") == "string":
                    continue
                record[header] = value
            records.append(record)
            rows.append(line_number)
    return headers, records, rows


def main():
    parser = argparse.ArgumentParser(description="Convert the peer support spreadsheet into groups.json")
    parser.add_argument("csv_file", nargs="?", help="CSV exported from the spreadsheet")
    parser.add_argument("--out", default=DEFAULT_OUT, help="where to write the JSON (default: data/groups.json)")
    parser.add_argument("--check", action="store_true", help="validate the existing groups.json instead of converting")
    args = parser.parse_args()

    with open(SCHEMA_PATH, encoding="utf-8") as fh:
        schema = json.load(fh)
    group_schema = schema["$defs"]["group"]
    schema_props = group_schema["properties"]

    problems = []

    if args.check:
        with open(args.out, encoding="utf-8") as fh:
            payload = json.load(fh)
        records = payload.get("records", [])
        rows = list(range(1, len(records) + 1))
        print("Checking %s (%d listing%s)\n" % (args.out, len(records), "" if len(records) == 1 else "s"))
        for record, row in zip(records, rows):
            validate_record(record, group_schema, schema, row, problems)
        extra_checks(records, rows, problems)
        label = "listing"
    else:
        if not args.csv_file:
            parser.error("give me a CSV file, or use --check to re-validate the existing groups.json")
        headers, records, rows = read_csv(args.csv_file, schema_props)

        required = set(group_schema["required"])
        missing = required - set(headers)
        if missing:
            print("Error: your spreadsheet is missing these required columns:\n")
            for column in sorted(missing):
                print("  - %s" % column)
            print("\nCompare your headings against data/groups-template.csv. Nothing was written.")
            return 1

        print("Reading %s, %d listing%s, %d columns\n"
              % (args.csv_file, len(records), "" if len(records) == 1 else "s", len(headers)))
        for record, row in zip(records, rows):
            validate_record(record, group_schema, schema, row, problems)
        extra_checks(records, rows, problems)
        label = "row"

    if problems:
        print("Found %d problem%s. Nothing was written.\n" % (len(problems), "" if len(problems) == 1 else "s"))
        by_row = {}
        for problem in problems:
            by_row.setdefault(problem.row, []).append(problem)
        for row in sorted(by_row, key=lambda r: (r is None, r)):
            for problem in by_row[row]:
                print(str(problem))
        print("\nFix these in the spreadsheet and run this again.")
        return 1

    if args.check:
        print("All good, %d listings, no problems." % len(records))
        return 0

    payload = {
        "version": "1",
        "last_updated": dt.date.today().isoformat(),
        "records": records,
    }
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    placeholders = sum(1 for r in records if r.get("placeholder"))
    print("Wrote %d listings to %s" % (len(records), args.out))
    if placeholders:
        print("Note: %d of them are still marked placeholder: true and will show a "
              "SAMPLE label on the website." % placeholders)
    return 0


if __name__ == "__main__":
    sys.exit(main())
