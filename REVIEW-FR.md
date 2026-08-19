# French text awaiting review

All French wording in this project was **drafted by a machine and has not been
reviewed by a French speaker.** It should not be treated as final.

Nothing is technically broken if the review is delayed — the site works in both
languages today — but the French should be read by a person before CAPA points
the public at it, especially the disclaimer, which carries a liability meaning.

## What needs reviewing

| Where | What it is | Priority |
|---|---|---|
| `assets/i18n.js` → `fr` | Every interface word: buttons, filter names, headings, the empty state | All of it |
| `assets/i18n.js` → `fr` → `disclaimer.body` | The "CAPA does not run or endorse these groups" paragraph | **Highest** — this is the legal framing |
| `assets/i18n.js` → `fr` → `filter.moderatedHint` | The explanation of what moderation means | High |
| `assets/i18n.js` → `terms` | French for conditions and focus areas | Medium |
| `data/groups.json` → the `_fr` fields | French descriptions of each listing | Comes from the spreadsheet, not from here |

## Specific things to look at

1. **The organization's name.** The site currently renders CAPA as
   *Alliance canadienne des patients arthritiques*. Confirm this is the name
   CAPA actually uses in French, and that *ACPA* is the right short form.
2. **"Peer support".** Drafted as *soutien par les pairs* throughout. Confirm
   this is the term Canadian patient organizations use.
3. **"Moderated".** Drafted as *modéré*. In the context of an online group this
   should read as "someone enforces the rules", not "moderate in amount".
4. **Canadian French, not French from France.** Check date wording, *courriel*
   rather than *e-mail*, and dollar formatting (`25 $` rather than `$25`).
5. **Length.** French runs longer than English. The layout was tested in French
   at 320 pixels and at 200% text with no overflow, but a much longer
   translation of a button label is worth re-checking.

## How to make a correction

Open `assets/i18n.js`, find the line under `fr:`, and change the text between
the quote marks. Change nothing to the left of the colon — that is the name the
website looks the wording up by.

```js
"disclaimer.heading": "Avant d'utiliser ce répertoire",
                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ only this part
```

Then reload the page with `?lang=fr` on the end of the address to see it.

When the review is done, delete this file.
