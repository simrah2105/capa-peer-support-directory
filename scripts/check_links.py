#!/usr/bin/env python3
"""
Check the links in the directory.

    python3 scripts/check_links.py            # local files + external links
    python3 scripts/check_links.py --local    # local files only (no internet)

Local check : every file the page references (stylesheet, scripts, logo, data)
              actually exists.
External    : every http(s) link in groups.json and config.js answers.

example.org and example.com are the addresses used by the sample listings.
They are reported separately so real broken links are not lost among them.
"""

import argparse
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from urllib import error, request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLACEHOLDER_HOSTS = ("example.org", "example.com")
TIMEOUT = 15


def local_references():
    """Files referenced from index.html, plus the data file named in config.js."""
    refs = []
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    for match in re.finditer(r'(?:href|src)="([^"#][^"]*)"', html):
        target = match.group(1)
        if target.startswith(("http://", "https://", "mailto:", "//", "?")):
            continue          # "?" is the language toggle, which points at this same page
        refs.append(target)

    config = open(os.path.join(ROOT, "assets", "config.js"), encoding="utf-8").read()
    data_url = re.search(r'dataUrl:\s*"([^"]+)"', config)
    if data_url:
        refs.append(data_url.group(1))
    return sorted(set(refs))


def collect_urls():
    urls = {}

    def add(url, where):
        if url and url.startswith(("http://", "https://")):
            urls.setdefault(url, set()).add(where)

    data_path = os.path.join(ROOT, "data", "groups.json")
    if os.path.exists(data_path):
        with open(data_path, encoding="utf-8") as fh:
            payload = json.load(fh)
        for record in payload.get("records", []):
            add(record.get("access_url"), "%s / access_url" % record["id"])
            add(record.get("source_url"), "%s / source_url" % record["id"])

    config = open(os.path.join(ROOT, "assets", "config.js"), encoding="utf-8").read()
    for match in re.finditer(r'(\w+):\s*"(https?://[^"]+)"', config):
        add(match.group(2), "config.js / %s" % match.group(1))

    return urls


def probe(url):
    headers = {"User-Agent": "CAPA-Peer-Support-Directory-link-check/1.0"}
    for method in ("HEAD", "GET"):
        try:
            req = request.Request(url, method=method, headers=headers)
            with request.urlopen(req, timeout=TIMEOUT) as response:
                return response.status, ""
        except error.HTTPError as exc:
            if method == "HEAD" and exc.code in (403, 405, 501):
                continue          # some servers refuse HEAD; try GET
            return exc.code, exc.reason
        except error.URLError as exc:
            return None, str(exc.reason)
        except Exception as exc:                       # noqa: BLE001
            return None, str(exc)
    return None, "no response"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--local", action="store_true", help="skip the internet check")
    args = parser.parse_args()

    failures = 0

    print("LOCAL FILES")
    print("-" * 74)
    for ref in local_references():
        path = os.path.join(ROOT, ref.split("?")[0])
        ok = os.path.exists(path)
        if not ok:
            failures += 1
        print("  %-6s %s" % ("OK" if ok else "MISSING", ref))

    urls = collect_urls()
    placeholders = {u: w for u, w in urls.items() if any(h in u for h in PLACEHOLDER_HOSTS)}
    real = {u: w for u, w in urls.items() if u not in placeholders}

    if placeholders:
        print("\nPLACEHOLDER LINKS (sample listings, not checked)")
        print("-" * 74)
        for url in sorted(placeholders):
            print("  SKIP   %s" % url)

    if args.local:
        print("\nSkipped the internet check (--local).")
    elif real:
        print("\nEXTERNAL LINKS")
        print("-" * 74)
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(probe, sorted(real)))
        for url, (status, note) in zip(sorted(real), results):
            ok = status is not None and status < 400
            if not ok:
                failures += 1
            label = "OK" if ok else "FAIL"
            detail = str(status) if status else note[:44]
            print("  %-6s %-6s %s" % (label, detail, url))
            if not ok:
                for where in sorted(real[url]):
                    print("           used by %s" % where)

    print("")
    if failures:
        print("%d problem(s) found." % failures)
        return 1
    print("No broken links.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
