# What each column will accept

Columns marked **fixed list** only accept the words below, spelled exactly as
shown, in lowercase. The converter will tell you the row and column if you type
something else.

Columns marked **open** accept anything, but please reuse existing wording so
that filters stay tidy, every distinct spelling becomes its own filter option.

Lists go in a single cell separated by a vertical bar: `AB|SK`.

---

## format, fixed list, one value

| Value | Shown as |
|---|---|
| `in-person` | In person |
| `virtual` | Virtual |
| `hybrid` | Hybrid |
| `phone` | Phone |
| `online-forum` | Online forum |

## province, fixed list, one or more

`national` (anywhere in Canada), `AB`, `BC`, `MB`, `NB`, `NL`, `NS`, `NT`,
`NU`, `ON`, `PE`, `QC`, `SK`, `YT`

A national organization with a chapter in one province may list both, e.g.
`national|ON`.

## language, fixed list, one or more

`en`, `fr`, `other`, the language the **group is run in**, not the language of
the listing.

## cost, fixed list, one value

`free`, `membership-required`, `fee`, `unknown`

Use `cost_notes_en` for the detail ("Suggested $5, nobody turned away").

## how_to_access, fixed list, one value

`self-refer`, `sign-up-form`, `referral-needed`, `membership-required`,
`contact-first`, `drop-in`, `unknown`

## facilitator_type, fixed list, one value

`peer-volunteer`, `staff`, `health-professional`, `mixed`, `unknown`

## moderated, fixed list, one value

`yes`, `no`, `unknown`

**`unknown` is an honest answer. Never record `unknown` as `yes`.** If you put
`yes`, the converter requires you to also fill in `moderation_notes_en` saying
who moderates and what the rules are. This is deliberate: moderation and
privacy are the parts people most need to be able to trust.

## audience, fixed list, one or more

`adults`, `youth`, `children`, `seniors`, `caregivers`, `families`, `women`,
`men`, `anyone`

## conditions, open, one or more

Preferred wording (reuse these where they fit):

`any arthritis`, `rheumatoid arthritis`, `psoriatic arthritis`,
`ankylosing spondylitis`, `osteoarthritis`, `juvenile arthritis`, `lupus`,
`gout`, `fibromyalgia`, `chronic pain`

## focus_areas, open, one or more

Preferred wording:

`emotional support`, `newly diagnosed`, `self-management`, `movement`,
`pain and fatigue`, `treatment decisions`, `work and school`, `young adults`,
`caregivers`, `women's health`, `advocacy`

---

## A note on French

Every column ending in `_fr` may be left empty. French readers then see the
English text instead of an empty space. For the fixed lists above, the French
wording is already built into the website; you never translate those values.

When you add a **new** open-list term (a new condition or focus area), add its
French translation to the `terms` list at the bottom of `assets/i18n.js`. Until
you do, French readers see the English term, which is not a failure, just not
yet finished.
