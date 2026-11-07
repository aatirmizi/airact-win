# Component Specification

**Status:** design. A **component** implements one Slide Type. Users see slides; components are the code behind them. Terms: `GLOSSARY.md`. Field lists and limits are **not** repeated here: component manifests and schemas are canonical artefacts (`SCHEMA_GOVERNANCE.md`), written just before the component's stage.

## 1. Contract

Each component is a folder `schema/components/<type_id>/` containing:

1. **A manifest file** (validated by a component-manifest schema, written before Stage 2), declaring:
   - `type_id`, **`type_version`** (integer, section 7), display name, default participant visibility, default response mode;
   - **authoring fields:** name, type, whether mandatory, limits (by registry ID), and whether each is *content* or *cosmetic*. Fields not marked cosmetic are locked once responses exist;
   - **steps:** ordered list; for each, what advances it (Facilitator, timer, or all-answered);
   - **response rule:** `one_per_participant` (default), `replace_until_closed`, or `multiple`;
   - **close policy support:** whether Immediate and Grace period are allowed, and the default;
   - **content schema** and **response schema:** what valid authored content and a valid response look like, including maximum sizes;
   - **moderation:** none, optional, or required; the states a contribution can be in (received, approved, hidden);
   - **aggregates:** what the projector needs (counts per option, lists, averages) from a small built-in set;
   - **participant view model per step:** exactly which fields are sent to phones in that step (and so the participant view size budget, `LIM-NET-PARTICIPANT-VIEW-*`);
   - **report representation:** the columns and summary values the component contributes to reports, including how *no answer* and *incorrect* are distinguished;
   - **migrations:** how older `type_version` content and responses are upgraded (section 7).
2. **Three React views:** Editor, Projector view, Participant view. The Participant view lives in the small participant bundle.
3. **Optional Rust hook:** only for logic the generic engine cannot express (quiz scoring).

TypeScript types are generated from the schemas so the manifest, the Rust engine and the three views cannot drift.

## 2. Rules the engine enforces

- **Completeness:** a slide is Ready only when all mandatory fields pass validation. Incomplete slides cannot be previewed or presented (`SLIDE_INCOMPLETE`).
- **Submission integrity:** every submission carries a submission ID. The engine checks state, participant, schema, size, rule and timing in the order defined by `PROTOCOL_SPEC.md` section 5, stores the response in a transaction, and acknowledges **only after the commit**. A repeat of the same submission ID returns the original outcome. A different submission that breaks the response rule is refused with a stable reason code from the catalogue (`reference/error-codes.md`). Components cannot bypass this path.
- **Close policy:** applied by the engine for every component (immediate cutoff or grace period), including for reconnecting phones. After a slide is finalised, late submissions are refused and cannot alter results.
- **Edit lock:** when responses exist, only cosmetic fields can change (`SLIDE_LOCKED_BY_RESPONSES`).
- **Leak prevention:** the participant view model is built on the server per step. Correct answers, unrevealed results and held reveals are not sent early. Hiding with CSS is never sufficient.
- **Accepting responses and visibility:** the per-slide switches are checked on every submission and view.
- **Server time:** elapsed time for scoring comes from the server clock, not the phone.
- **Output escaping:** all participant-entered text is treated as data. It is escaped for every view and report and never interpreted as HTML, script, or a spreadsheet formula.

## 3. Registry

Components are compiled in. Adding a Slide Type means adding a folder and registering it. Runtime plugins and arbitrary code from files are not planned; imported Activity files are data only. **Adding a Slide Type does not change the core schemas**: a slide is a generic envelope, and the type's own schemas validate its content and responses.

## 4. Version 1 and near-term components

**Multiple Choice Poll (Stage 2).** Question and options (mandatory), response rule, response mode, results visibility, optional timer, close policy. Steps: Question, Results. Content limits: `LIM-CONTENT-QUESTION-MAX-CHARS`, `LIM-CONTENT-OPTION-MAX-CHARS`, `LIM-CONTENT-POLL-OPTIONS-MIN/MAX`.

**Content (Stage 3).** Fixed layouts: title; title + text; title + image; image only. No responses. Hidden from phones by default. Images are validated (`VAL-X-005`, `VAL-X-006`, `VAL-X-007`).

**Quiz Question (Stage 4).** Question, options, exactly one correct option, time limit, points, optional explanation, reveal timing, close policy. Steps: Question, Reveal, Stats. Scoring hook: points for correct answers; speed bonus if enabled in the Activity-wide Quiz settings. Scores accumulate per participant across **all** Quiz Questions in the Activity. Resetting a slide removes that slide's points. *No answer* and *incorrect* are separate outcomes.

**Leaderboard (Stage 4).** Single step. Shows totals across Quiz Questions. Off, Top 5 or Full list. Requires Display name or Roster login join mode.

**Open Question (Stage 6).** Free text, `multiple` response rule with a per-participant limit; optional moderation. Display shows approved items.

**Word Cloud (Stage 6).** Short entries normalised for aggregation (case-folded, trimmed, Unicode normalised); optional moderation. Rendering must handle right-to-left and mixed-script words.

**Q&A (Stage 6).** Participants submit questions; states received → approved → shown; the Facilitator can hide an item that was already shown. The projector shows only approved, non-hidden items. Upvoting is a later version.

Moderation is one shared mechanism used by Open Question, Word Cloud and Q&A, not three.

## 5. Preview

The same engine and views run against the in-memory store. The Preview pane shows the projector view and a phone-sized participant view. "Simulate responses" adds random valid responses to the throwaway store. Preview shares code paths with Present, so the idempotency, close-policy and refusal behaviour can be exercised without a network.

## 6. Anonymous responses

For a slide in Anonymous response mode under Display name or Roster login join mode, the response is stored without the participant's name or ID. A salted one-way key, kept in a separate table, enforces "one response per participant". The per-slide salt is stored in the file (in the slide's runtime row) so that duplicate prevention survives interruption. Therefore reports and screens never show names, but someone with the file and technical skill could link responses to people. This is stated in the manual and in `project_vision.md`.

## 7. Versioning and old data

Activity files hold responses for years, so components must be able to interpret them after software upgrades.

- Every slide in the file records its `type_id` and `type_version`. Responses are interpreted through the slide they belong to.
- A component that changes its content or response schema increments `type_version` and supplies a **migration** from each earlier version. Migrations run on the working copy when the file is opened and are covered by tests that use stored sample files from each released version (`QUALITY_AND_RELEASE.md` section 4).
- If a migration is impossible, the component declares the slide **legacy read-only**: it can be displayed and exported but not edited or presented.
- If the file contains a `type_id` or `type_version` this application does not know (a file from a newer version), the Activity opens **read-only and cannot be saved over**; *Save As* an independent copy is offered, with the unsupported slides shown as unsupported (`VAL-M-005`).
- Retiring a component requires a migration or an explicit legacy read-only path. A component is never simply deleted from the registry.
- When saving a copy for an older format, slide types the older version lacks are listed in the compatibility check and left out only if the user agrees (`SCHEMA_GOVERNANCE.md` section 7).

## 8. Limits

Every input has a bound enforced on the server, defined in the limits registry (`reference/limits.md`): content lengths (`LIM-CONTENT-*`), identity fields (`LIM-ID-*`), message and body sizes and rates (`LIM-NET-*`), and component-declared maximums that reference registry IDs. Oversized input is refused with `too_large`, never truncated silently.
