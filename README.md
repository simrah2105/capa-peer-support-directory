# CAPA Peer Support Directory

A searchable directory of arthritis and chronic pain peer support groups and
services across Canada, built for the
[Canadian Arthritis Patient Alliance](https://arthritispatient.ca/).

It is a plain website, no database, no logins, no accounts, no cookies, and
nothing stored on the visitor's computer. Everything a visitor picks (their
language, their search, their filters) is kept in the web address, so any view
of the directory can be copied and shared as a link.

---

## Before this goes live

These are the things that still need a person to decide. Everything else works.

| What | Where to change it | Status |
|---|---|---|
| Email for "Suggest a group" | `assets/config.js` → `contactEmail` | **Guessed**, currently `info@arthritispatient.ca` |
| Useful Resources link | `assets/config.js` → `resourcesUrl` | **Guessed**, the URL responds, but confirm it is the right page |
| Cost, moderation and facilitator detail | `data/groups.csv` | **Mostly `unknown`**, see `data/NOT-LISTED.md` |
| French wording | `assets/i18n.js` | **Drafted, not reviewed**, see `REVIEW-FR.md` |

The directory currently holds **31 listings**. Twenty five are run from Canada
and come first in the results. The other six are online communities based
abroad that a person here can still use, each carrying a "Based in" label so
nobody mistakes one for a Canadian service.

Coverage now spans arthritis and rheumatic disease, psoriatic disease, lupus,
scleroderma, Sjogren's, myositis, vasculitis, autoinflammatory disease, chronic
pain and related conditions, across every province except the territories.

Cost is still unknown on 22 of them and moderation on 23. `data/NOT-LISTED.md`
sets out those gaps, plus three listings held back for a specific reason.

`data/groups-template.csv` still holds six invented sample rows, marked
`placeholder: true`. It is the blank form to copy, not live data.

---

## Updating the listings

The listings live in a spreadsheet. You edit the spreadsheet, export it as a
CSV, and run one command that turns it into the file the website reads.

### 1. Edit the spreadsheet

The live listings are `data/groups.csv`. `data/groups-template.csv` is a copy
with sample rows in it, to show the shape. Open either in Excel, Numbers, or
Google Sheets. Each row is one group. The column headings must not be renamed.

A few rules the spreadsheet has to follow:

- **Lists go in one cell, separated by a vertical bar `|`.** For example, a
  group serving both Alberta and Saskatchewan has `AB|SK` in the `province`
  column. A group about two conditions has
  `rheumatoid arthritis|chronic pain` in `conditions`.
- **Dates are written year-month-day**: `2026-08-19`, not `19/08/2026`.
- **Some columns only accept certain words.** They are listed in
  `data/vocabularies.md`. If you type something else, the converter will tell
  you which row and column to fix.
- **`id` must be unique** and use only lowercase letters, numbers and hyphens.
  Never change or reuse an id once a listing is published, the id is what a
  shared link points at.
- **Anything ending in `_fr` is optional.** If you leave it blank, the website
  shows the English text to French readers rather than showing nothing.

### 2. Export as CSV

In Excel: **File → Save As → CSV UTF-8**.
In Google Sheets: **File → Download → Comma-separated values**.

### 3. Run the converter

Open Terminal, and type this (replacing the file name with yours):

```bash
python3 scripts/csv_to_json.py data/groups.csv
```

If everything is fine you will see:

```
Wrote 8 listings to data/groups.json
```

If something is wrong, nothing is written and you get a list like this:

```
  row 3 / column "last_verified": '15/06/2026' must be a date written as YYYY-MM-DD, e.g. 2026-03-14
  row 5 / column "province": 'Ontario' is not an allowed value. Allowed: AB, BC, MB, ..
```

The row number is the row you see in the spreadsheet. Fix those cells and run
the command again.

### 4. Check it before publishing

```bash
python3 scripts/csv_to_json.py --check
```

This re-reads `data/groups.json` and confirms it is still valid.

### If the spreadsheet is ever lost or damaged

You can rebuild it from the published listings:

```bash
python3 scripts/csv_to_json.py --to-csv data/groups.csv
```

This writes a fresh spreadsheet from `data/groups.json`. Useful if a find and
replace goes wrong, which is easier to do than it sounds: replacing `,,` with
`,` in a CSV silently deletes an empty column from every row.

---

## Looking at the site on your own computer

Because the site loads its listings from a separate file, opening
`index.html` by double-clicking it will show an error. Web browsers block that
for security reasons. Instead, open Terminal, go to this folder, and run:

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765> in your browser. Press `Ctrl` and `C` in
Terminal to stop it when you are done.

---

## Publishing it

The site is plain files, so it can go almost anywhere.

**On GitHub Pages (no cost, recommended):** push this folder to a GitHub
repository. In the repository, go to **Settings → Pages** and set **Source**
to **GitHub Actions**. Every time the `main` branch changes, the site
re-publishes itself. Before publishing it also re-checks the listings, the
colour contrast, and that no file is missing, if any of those fail, the
broken version is not published.

**On the CAPA website:** copy `index.html`, `assets/` and `data/` onto the
server, keeping them in the same arrangement. Nothing needs to be installed
or compiled.

**Inside a page on the CAPA website:** it also works in an `<iframe>`. Give
the frame a title and let it be tall, for example:

```html
<iframe src="/peer-support/" title="Peer Support Directory"
        style="width:100%; height:1200px; border:0;"></iframe>
```

If the site sits in a sub-folder, everything still works, every path in the
project is relative.

---

## Colours and type

The look follows the **Good Care Visual Identity Guidelines**
(`Good Care Branding.pdf`):

| Colour | Used for |
|---|---|
| `#582D80` deep purple | Headings and links |
| `#9F3E94` magenta | The one action colour, buttons, the top rule, active filters |
| `#E8B8E5` lilac | Tints, and the accent colour in dark mode |
| `#FCF0C2` pale yellow | The disclaimer and "please re-check" notes |
| `#FFFFFF` white | Cards |

The two pale tints are backgrounds only, they are far too light to put text on.
All of these live at the top of `assets/styles.css`; change them there and
nowhere else, then run `python3 scripts/check_contrast.py`.

The directory is **light only**. A dark theme was built and then removed, to
keep the site matching the identity sheet, which is built entirely on white and
the pale tints. If it is ever wanted back, it is in the git history.

Note this identity sheet was made for the Good Care project and is co-branded
with Psoriasis Canada. Its two purples are the same purples in the CAPA logo, so
it carries over cleanly, but if CAPA has a separate palette for the main
website, that one should win.

### About the font

The brand face is **Poppins**, and it is **included in this project** at
`assets/fonts/`, three weights, two character subsets, 39 KB in total.

It is hosted inside the project rather than linked from Google Fonts on
purpose. It means the page works with no internet, it keeps working if Google
changes something, and no visitor's browser has to make a request to a third
party just to read a page about their health.

Poppins is free under the SIL Open Font License; the licence travels with the
files in `assets/fonts/OFL.txt` and must stay there if you pass this project on.

If a listing ever contains letters outside those subsets, an Indigenous
language name, for instance, that text quietly falls back to the next font in
the list. That is intended behaviour, not a bug.

## Checking the site is still accessible

Accessibility is the point of this project, not a finishing touch. Two of the
checks can be run at any time without the internet:

```bash
python3 scripts/check_contrast.py     # every colour pair against WCAG 2.2 AA
python3 scripts/check_links.py        # every link and every referenced file
```

Run the contrast check after changing any colour. It reads the colours
straight out of the stylesheet, so it stays honest.

What was verified when this was built:

- **axe-core 4.13** found **no violations** across English, French, mobile
  width, the empty state, and with all panels expanded.
- **All 22 colour pairs** pass WCAG 2.2 AA.
- Every filter option and checkbox is at least 44 x 44 pixels.
- **Everything you can press** is at least 44 x 44 pixels.
- **No sideways scrolling** at 320 pixels wide, at 200% text size, or both at
  once, in either language.
- Keyboard-only: every control reachable in a sensible order, with a visible
  focus ring, and a working "skip to results" link.

---

## Giving this to another organization

That is what the MIT licence is for, anyone may take this, change it, and use
it, including commercially, as long as they keep the copyright notice.

A group taking this over needs to change:

1. `assets/config.js`, their email address and their links.
2. `assets/capa-logo.png`, their logo.
3. `assets/styles.css`, the colours at the very top of the file. Then run
   `python3 scripts/check_contrast.py`, which will tell them whether their
   brand colours are readable enough. If it fails, the colours need to change,
   not the check.
4. `assets/i18n.js`, the wording, including the name of their organization
   and the disclaimer.
5. `data/`, their own listings.

Nothing in this project is tied to a personal account, a paid service, or a
particular company.

---

## What is in each file

```
index.html                    the page itself
assets/config.js              email address and links, start here
assets/fonts/                 the Poppins brand font + its licence
assets/i18n.js                every word on the site, English and French
assets/styles.css             all the styling; the colours are at the top
assets/app.js                 the search and filter logic
data/groups.json              the listings the website reads (generated)
data/groups.schema.json       the rules every listing must follow
data/groups.csv               the live listings, edit this one
data/groups-template.csv      a blank copy with sample rows, for reference
data/NOT-LISTED.md            what was left out of the directory, and why
data/vocabularies.md          the words each column will accept
scripts/csv_to_json.py        spreadsheet -> website, with error checking
scripts/check_contrast.py     colour contrast against WCAG 2.2 AA
scripts/check_links.py        link and missing-file checker
REVIEW-FR.md                  French text awaiting human review
.github/workflows/deploy.yml  publishes the site automatically
```

## Licence

MIT, see [LICENSE](LICENSE).
