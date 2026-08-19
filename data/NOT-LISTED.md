# From the report, but not in the directory

Everything here comes from **CAPA Peer Support Report** (the scan of arthritis
peer support models, May 2026). These entries were left out of `groups.csv` on
purpose. Nothing has been thrown away, this file is the record, so the
decisions can be revisited.

The report was written to answer "what models could CAPA learn from?", which is
a different question from "where can a person in Canada get peer support?".
Most of what it covers is the first kind.

---

## 1. Services that only serve people in another country

A person in Canada cannot use these. Listing them would waste the reader's time
at the moment they are looking for help.

| Organization | What it is | Where |
|---|---|---|
| NRAS | Local volunteer-run groups | UK |
| NRAS | Telephone peer support volunteers | UK |
| NRAS | Right Start newly-diagnosed pathway | UK |
| Versus Arthritis | Helpline, local services, "In Your Area" directory | UK |
| Arthritis Ireland | Helpline with trained volunteers | Ireland |
| Arthritis Ireland | Private Facebook support group | Ireland |
| Arthritis Australia | State and Territory Arthritis Offices, national Infoline | Australia |
| Arthritis NZ | Arthritis Assist, peer support volunteers, local groups | New Zealand |
| Arthritis Foundation | The **local** Connect Groups (the online ones **are** listed) | US |

**Worth reconsidering:** the Arthritis Ireland Facebook group and the NRAS
telephone service. A private Facebook group has no border, and some phone
services will talk to anyone. If CAPA confirms either is open to Canadians, they
belong in the directory.

## 2. Temporarily unreachable

| Organization | What happened |
|---|---|
| Versus Arthritis online community | `versusarthritis.org` returned **403 "This web app is stopped"** on 19 August 2026, in both a command-line check and a real browser. That is a stopped server, not a blocked bot. The listing was written and then pulled rather than pointing people at a dead page. |

**To restore it:** re-check the address. If it is back, the finished row is in
this project's git history, `git show` the commit that added `data/groups.csv`.

## 3. Not peer support

| Source | Why not |
|---|---|
| Karp et al. 2023, *Peer Support in Rheumatic Diseases* | Evidence review, supports the case for peer support, is not a service |
| EULAR 2021 self-management recommendations | Clinical guidance |
| ArthritisPower / PatientSpot | A research registry. Mentioned inside the CreakyJoints listing rather than listed as a support group, because signing up for research is not the same as getting support |

---

## What still needs a human

Sixteen listings, and the picture splits neatly in two.

**The eight researched in August 2026** have confirmed cost, moderation and
facilitator details, because those came from reading the organizations' own
pages.

**The eight from the report** still say "not known" for cost, and mostly for
moderation and facilitator type, because the report recorded what each programme
**is** rather than how it operates. Across all sixteen:

- Cost is known on 8, unknown on 8.
- Moderation is known on 8, unknown on 8.
- Facilitator type is known on 8, unknown on 8. Laurie asked specifically
  whether facilitators are volunteers. For the eight Canadian and Pain BC
  listings the answer is now yes, trained peer volunteers. For the rest it is
  still open.

Closing the remaining gaps means visiting eight source URLs and, in a few cases,
sending an email. That is the highest value work left.

## Also considered and left out

| Programme | Why |
|---|---|
| Arthritis Rehabilitation and Education Program (AREP), Arthritis Society Canada | Ontario only, and it is a clinical rehabilitation service delivered by health professionals rather than peer support. It runs group education sessions, which makes it a reasonable thing to signpost from the Useful Resources page instead |
