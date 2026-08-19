# From the report, but not in the directory

Everything here comes from **CAPA Peer Support Report** (the scan of arthritis
peer support models, May 2026). These entries were left out of `groups.csv` on
purpose. Nothing has been thrown away — this file is the record, so the
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
this project's git history — `git show` the commit that added `data/groups.csv`.

## 3. Not peer support

| Source | Why not |
|---|---|
| Karp et al. 2023, *Peer Support in Rheumatic Diseases* | Evidence review — supports the case for peer support, is not a service |
| EULAR 2021 self-management recommendations | Clinical guidance |
| ArthritisPower / PatientSpot | A research registry. Mentioned inside the CreakyJoints listing rather than listed as a support group, because signing up for research is not the same as getting support |

---

## What still needs a human

Every published listing carries the programme model from the report, because
that is what the report recorded. It does **not** carry the operational detail,
because the report was not written to collect it. Right now:

- **Cost is `unknown` on all 8 listings.**
- **Moderation is `unknown` on 6 of 8.** Only NRAS and the Psoriasis Association
  were explicitly described as moderated, and even for those two the actual
  rules were not recorded.
- **Facilitator type is `unknown` on all 8.** Laurie asked specifically who
  facilitates and whether they are volunteers — that answer is not yet in here.
- **How to join** was inferred as "sign yourself up" for the open online
  communities. That is a reasonable reading, not a confirmed fact, and each one
  says so in its notes.

None of this is a defect in the report — it answered the question it was asked.
Filling these in is a website-and-phone-call exercise against the eight source
URLs, and it is the single highest-value thing to do before launch.
