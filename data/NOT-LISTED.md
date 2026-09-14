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

## 2. Held back, ready to go once something is confirmed

| Listing | Why it is not published |
|---|---|
| Versus Arthritis online community | `versusarthritis.org` returned **403 "This web app is stopped"** on 19 August 2026, in a command line check and in a real browser. That is a stopped server, not a blocked bot. |
| Lupus SK | `lupussk.com` has an **expired TLS certificate** as of 14 September 2026. The server answers, but every browser shows a full page security warning first. Sending someone living with lupus into that is worse than not listing it. The row is written and waiting. |
| Sherwood Park peer support group | Recommended by Laurie, who knows the lead volunteer. The source note says to confirm the group's official name and preferred public description with Laurie or the volunteer **before publishing**, so it has not been published. It is a Facebook group at `facebook.com/groups/1198216584008127/`. |

**To publish any of these:** fix the one blocking thing, then add the row to
`data/groups.csv` and run the converter. The finished rows for Versus Arthritis
and Lupus SK are in this project's git history.

## 3. Moved

| Listing | What happened |
|---|---|
| Cassie + Friends TAG | `cassieandfriends.ca/taggroups/` started returning 404 on 14 September 2026, though the programme is clearly still running. The listing now points at their support hub at `/support/` instead, and its notes say to ask which chapter is nearest. Worth repointing at the dedicated page once it reappears. |

## 3. Not peer support

| Source | Why not |
|---|---|
| Karp et al. 2023, *Peer Support in Rheumatic Diseases* | Evidence review, supports the case for peer support, is not a service |
| EULAR 2021 self-management recommendations | Clinical guidance |
| ArthritisPower / PatientSpot | A research registry. Mentioned inside the CreakyJoints listing rather than listed as a support group, because signing up for research is not the same as getting support |

---

## What still needs a human

Thirty one listings. The gaps are concentrated in two fields:

- **Cost is unknown on 22 of 31.**
- **Moderation is unknown on 23 of 31.**
- Facilitator type is known for 10.

Laurie asked specifically who facilitates and whether they are volunteers. That
is answered for the Arthritis Society, Pain BC and its three equity groups,
People In Pain Network, Cassie + Friends TAG, the Sjogren's Society of Canada
and Scleroderma BC. For the rest it is still open.

Most of the newer listings came from an organization's own support page, which
says what a group **is** but rarely what it costs or who runs it. Closing these
gaps means visiting the source URLs and sending a handful of emails. Contact
addresses are already recorded for almost every listing, so it is a
straightforward pass rather than research.

## Also considered and left out

| Programme | Why |
|---|---|
| Arthritis Rehabilitation and Education Program (AREP), Arthritis Society Canada | Ontario only, and it is a clinical rehabilitation service delivered by health professionals rather than peer support. It runs group education sessions, which makes it a reasonable thing to signpost from the Useful Resources page instead |
