# Decision Register

**Status labels**
- **Confirmed (`D-nnn`):** explicitly accepted by the project owner.
- **Proposed (`PR-nnn`):** made by the drafter while writing these documents to fill a gap; **not yet accepted by the owner**. Treat as a default that can be changed.
- **Open (`O-nnn`):** undecided, with what it blocks.

A recommendation is **not** a decision until the owner accepts it. When a decision replaces an earlier one, the earlier one is listed under *Superseded* with a pointer. Confirmed decisions were made during design review conversations between 2026-10-28 and 2026-10-30. Decisions `D-030` to `D-066` were drafter proposals (`PR-001` to `PR-037` in version 0.1) that the owner then confirmed; the old number is shown in the *Formerly* column.

The identifiers R, P and L followed by a number (for example R1, P6, L4) used in `READINESS_AUDIT.md` refer to the items of the second-pack review table, not to proposals.

## 1. Confirmed decisions

### 1.1 Foundations (D-001 to D-029)

| ID | Decision | Docs affected |
|---|---|---|
| D-001 | One cumulative dataset per Activity. **Reset** (with export-first and a safety copy) clears it. **Save as Template / Save a Copy Without Responses** covers reuse. Runs (separate datasets in one file) are a later version | vision, spec, security |
| D-002 | Open files use a **working directory** with the live database inside; saving writes a database snapshot, packages, and replaces the file atomically | architecture, security |
| D-003 | **Optional file protection** using zip-native AES (the `zip` crate) with **generic entry names**; protected only while the file is closed (like Word or Excel); limits stated honestly; a wrong password and a damaged file give one generic message | security |
| D-004 | Facilitator control uses **in-process IPC only**; no HTTP control endpoint | architecture, vision |
| D-005 | The **Projector view is a display-only browser window** at a loopback address (`127.0.0.1`), not a native second window | architecture, networking, spec |
| D-006 | The **join address is a complete URL**; the QR code encodes exactly it; the join code is never shown alone | networking, spec |
| D-007 | **Roster login:** generated PINs shaped like a pronounceable word plus four digits; "light hash" storage (salted SHA-256); challenge–response so the PIN is not sent; five anti-impersonation layers in version 1; honest limits documented | security |
| D-008 | **Anonymity is per slide** (response mode), not only per join mode | spec, component spec |
| D-009 | A slide can always be saved but cannot be previewed or presented until its mandatory fields are complete (**Ready**) | spec |
| D-010 | **Preview uses an isolated throwaway store**, never "present then reset" | spec, architecture |
| D-011 | **Presenting accumulates data**, respecting response rules; **no prompt** before presenting a slide that already has responses (the Facilitator may show earlier results); an **Accepting responses** switch; thumbnail "stored" badge; counters **Active / Answered / Stored responses** shown as specified | spec |
| D-012 | **No content edits once a slide has stored responses**; only cosmetic changes (theme and similar); Reset to edit. The **editor is read-only while Live** (cosmetic changes excepted) | spec |
| D-013 | Terminology: Activity, Slide, Step, Component, Facilitator, Participant, PIN and the rest of `GLOSSARY.md` | all |
| D-014 | **Quiz:** one slide per question; scores accumulate across the Activity; a separate Leaderboard slide | spec, component spec |
| D-015 | **Content slides:** fixed layouts in Stage 3; free-form editing, local-file video and PowerPoint import (images first) later | spec, roadmap |
| D-016 | A **per-slide "Show on participant devices"** setting; the Facilitator can change it live | spec |
| D-017 | **Platforms:** Windows 10 and 11, current Fedora and Ubuntu; **macOS deferred** ("not supported in version 1, planned later") | vision, architecture |
| D-018 | **No CDN or external resources** on participant (and projector) pages | architecture, networking |
| D-019 | **Honesty rule:** no false claims, no boasting; limitations stated; education must not rest on any dishonesty | all |
| D-020 | **Undo and redo cover authoring edits only**, never live data | spec, architecture |
| D-021 | **Facilitator switches:** version 1 and later lists as in `PRODUCT_SPEC.md` section 14 | spec |
| D-022 | Target **30 to 200 participants**; **English-only** version 1 (Unicode-safe content); **freemium intent** with the cap undecided | vision |
| D-023 | **Roster rules while responses exist:** rows may be added; display names edited; PINs regenerated; rows cannot be deleted, IDs changed, or the roster removed | security, spec |
| D-024 | **Duplicate display names are allowed** and participants may correct their names (overrides the earlier plan to refuse duplicates) | spec, glossary |
| D-025 | **Adopted from the second-document-pack review:** every technical and product item (R1 to R16), every process and governance item (P1 to P11), and the lessons L1, L3, L4 and L5. Traceability is in `READINESS_AUDIT.md` section 4 | all |
| D-026 | Lesson **L2** is kept only as **one test** (QR content is never loopback) and one sentence in the join-address requirement | networking, quality |
| D-027 | **Agreed with the reference-pack comparison:** keep zip AES with the generic message; plaintext copy and backup stance with warnings; no accounts and no templates beyond Save as Template; Open Question and Word Cloud after Quiz; present a selected range; optional local-HTTPS spike later | security, roadmap |
| D-028 | **Roadmap** as proposed (vertical slice, projector as browser, early Windows check), then extended on adoption of D-025 (see revision log) | roadmap |
| D-029 | **Reports:** HTML, CSV, XLSX; PDF via the system print dialog later; an LMS-friendly CSV | spec |

### 1.2 Defaults the owner confirmed (D-030 to D-066)

| ID | Formerly | Decision | Docs affected |
|---|---|---|---|
| D-030 | PR-001 | At most **one Activity Live** per application instance; other open Activities stay editable | spec |
| D-031 | PR-002 | Incomplete slides are **skipped with a warning** when presenting, and the skip is logged | spec |
| D-032 | PR-003 | The Activity is **saved automatically when Live ends** | spec |
| D-033 | PR-004 | A Leaderboard requires Display name or Roster login join mode | spec |
| D-034 | PR-005 | Join mode and participant limit are chosen in the **Start presenting** dialog; default limit `LIM-PRES-DEFAULT-PARTICIPANT-LIMIT` until a capacity is validated | spec, networking |
| D-035 | PR-006 | Multiple Choice Poll is **single choice** in version 1 | spec |
| D-036 | PR-007 | Facilitator actions **Hide name** and **Remove participant**; a name-change rate limit | spec |
| D-037 | PR-008 | Safety copies in a `<name>.backups` folder beside the file, newest kept (`LIM-OPS-SAFETY-COPIES-KEPT`); one `.bak` generation | security |
| D-038 | PR-009 (changed) | **Activity files are created with the operating system's default permissions, openable by all users on Windows and Linux** (not owner-only); the working directory stays private | security |
| D-039 | PR-010 | **Held reveal** with a Review list (design to be finished in Stage 4) | spec, roadmap |
| D-040 | PR-011 | Quiz settings presets (**Learning** default, Competitive, Custom) and the speed-bonus formula | spec |
| D-041 | PR-012 | Close policy default **Immediate**; grace within registry bounds | spec |
| D-042 | PR-013 | Every numeric limit marked *initial* in the registry is a starting value to be tuned | several |
| D-043 | PR-014 | Windows: **CI from Stage 1, hands-on check at the end of Stage 2 if a machine is available**, full verification in Stage 8 | roadmap, networking |
| D-044 | PR-015 | Recovery restores data and journaled edits, **not the Live state**; **Recover** is the default | spec, security |
| D-045 | PR-016 | PIN generator: consonant–vowel pattern plus four digits 2 to 9 (about 25 bits); offensive-word filter | security |
| D-046 | PR-017 | Roadmap of **eight stages** (reports and protection separate from validation) | roadmap |
| D-047 | PR-018 | Event log contents; it survives Reset and holds no personal data | security |
| D-048 | PR-019 | A pasted slide adopts the **target Activity's theme** | spec |
| D-049 | PR-020 | Projector **one-time token exchange**; participant cookie named by Activity, lifetime in the registry; header fallback if cookies are blocked | architecture, security |
| D-050 | PR-021 | Anonymous duplicate key salt **stored in the file** (so prevention survives interruption) | component spec, security |
| D-051 | PR-022 | Report provenance block contents and denominator definitions | spec |
| D-052 | PR-023 | **No re-opening** of a Quiz Question after Reveal | spec |
| D-053 | PR-024 | Quiz settings are **Activity-wide** | spec |
| D-054 | PR-025 | Participants already admitted are never refused when reconnecting at the limit | spec, networking |
| D-055 | PR-026 | File validation limits (in the registry) and exclusion of SVG images in version 1 | security |
| D-056 | PR-027 | Open Question, Word Cloud and Q&A in Stage 6 with one shared moderation mechanism | roadmap, component spec |
| D-057 | PR-028 | **Active** means a pong within the registry timeout, with pings at the registry interval | architecture, spec |
| D-058 | PR-029 | Document set additions: `AGENTS.md`, `VERIFIED_VS_ASSUMED.md`, `QUALITY_AND_RELEASE.md`, `READINESS_AUDIT.md`, `README.md` | all |
| D-059 | PR-030 | **Slide Reset while Live** only for a closed slide that is not current; entire-Activity Reset never while Live | spec, security |
| D-060 | PR-031 | While Live the editor allows only theme, speaker notes and participant visibility changes (no add, delete, reorder, paste) | spec |
| D-061 | PR-032 | Each Activity has an **Activity ID**; Save As, Save a Copy and Save as Template create a new one and start with an empty event log | security, spec |
| D-062 | PR-033 | **Save as Template** removes responses and asks about the roster (default removed); **Save a Copy Without Responses** keeps the roster | spec |
| D-063 | PR-034 | Safety copies are made from the **working state including unsaved changes**; never-saved Activities use the application data area | security |
| D-064 | PR-035 | A **data inventory** (where participant data can exist) in the security document and manual; no compliance claim | security, vision |
| D-065 | PR-036 | **Informal pilots** with a real group at the end of Stage 2 and Stage 4 | roadmap |
| D-066 | PR-037 | **Storage-failure** and **suspend/clock-jump** handling as specified (refuse and alert; pause timers; stay-awake request while Live) | architecture, spec, quality |

### 1.3 Screens, schemas, protocol and tests (D-067 to D-080)

| ID | Decision | Docs affected |
|---|---|---|
| D-067 | **`SCREEN_SPEC.md`:** cross-cutting interaction rules, a full screen inventory, contract cards for Stage 1 and 2 screens now and the rest just before their stage, plus four low-fidelity sketches | screen spec, sketches |
| D-068 | **Canonical artefacts:** JSON Schema for every JSON structure and numbered SQL migrations for the database; types, reference tables and fixtures are derived from or validated against them; the docs do not duplicate them | schema governance |
| D-069 | **One limits registry** (`schema/limits.json`) | schema governance |
| D-070 | **Strict versioning:** unknown fields are rejected, so every added field bumps `format_version` and older applications refuse newer files; `format_version` is independent of the application version and changes only when the file scheme changes or a substantial capability needs it; a new extension (for example `.actvtyx`) only for a container change older readers cannot handle | schema governance, security |
| D-071 | **Saving for older formats:** one entry point (Save As type list), at most two versions back, preceded by a compatibility check, chained one-step converters, original untouched; none in version 1 | schema governance, spec |
| D-072 | **File layout:** several named JSON files (manifest, theme, settings, optional roster, one file per slide) plus media and an always-present `data.db` SQLite snapshot | security, schema governance |
| D-073 | **Schemas are written just before their stage** (Stage 1 first); before the first release they may change freely; adding a Slide Type does not change the core schemas | schema governance, roadmap |
| D-074 | **Message formats and the error-code catalogue** are canonical artefacts | schema governance, protocol |
| D-075 | **`PROTOCOL_SPEC.md`** with Stage 2 scope now; its draft field tables are replaced by generated ones when the message schemas are written | protocol spec |
| D-076 | **State-based protocol:** each message carries the complete current view; reconnecting means receiving the current view | protocol spec, architecture |
| D-077 | **Business refusals are returned as HTTP 200** with `status: "refused"` and a reason code; genuine problems use HTTP error statuses | protocol spec |
| D-078 | **Facilitator IPC commands** are listed just before their stage (the Stage 1 and 2 list now) and generate the capability allowlist | protocol spec |
| D-079 | **`ACCEPTANCE_TESTS.md`:** stable scenario IDs, a CI check that every Must scenario has a test or a manual run record, Stage 1 and 2 scenarios now with the four requested examples, plain Given/When/Then, test names carry the IDs | acceptance tests, quality |
| D-080 | **Cautions accepted:** participant views stay small (budget and cap, measured in Stage 2); the catalogue stays lean with priorities so only Must scenarios block | protocol spec, acceptance tests |

## 2. Proposed (drafter's defaults, awaiting confirmation)

| ID | Proposal | Where |
|---|---|---|
| PR-101 | The Given/When/Then text of a behaviour lives **only** in `ACCEPTANCE_TESTS.md`; screen cards cite scenario IDs (a refinement of D-067) | screen spec |
| PR-102 | **Document precedence:** decisions, then canonical artefacts, then protocol, screen and acceptance documents, then the rest | schema governance |
| PR-103 | A single **revision counter (`rev`)** orders views; clients apply a view only if newer | protocol spec |
| PR-104 | The **order of checks** for a submission, with the idempotency lookup before the live, closed and rule checks | protocol spec |
| PR-105 | Idempotency records exist **only for accepted submissions**; refusals are re-evaluated on retry; concurrent duplicates are single-flight | protocol spec |
| PR-106 | A pending submission is kept in `sessionStorage` so a refresh can resolve it | protocol spec |
| PR-107 | A slide's **grace window** stays valid even after the Facilitator navigates away | protocol spec |
| PR-108 | WebSocket **close codes** 1000 and 4001 to 4007 with the stated client behaviours | protocol spec |
| PR-109 | In Stage 1 `settings.json` holds only the content language; further sections arrive with later stages | schema governance |
| PR-110 | Identifier formats: Activity ID 16 characters (a–z, 2–7), slide ID 12, media ID 16, submission ID at least 128 random bits | schemas |
| PR-111 | Database application identifier `1094931542` (the bytes "ACTV"), not checked against any public registry | migrations |
| PR-112 | The four sketches are the **layout baseline**; the Facilitator Workspace layout (`O-003`) stays open until reviewed | screen spec |
| PR-113 | Scenario priorities **Must / Should / Could**; only Must blocks a release | acceptance tests |
| PR-114 | The **initial values** of limits that are new in the registry (slide count, file sizes, rate limits, queue sizes, timeouts, roster size) | limits registry |
| PR-115 | `reference/` is **generated, committed and checked for drift** in CI | schema governance |
| PR-116 | Participant view **size budget and hard cap** | limits registry, protocol |
| PR-117 | Common slide **settings** in the envelope (response mode, response rule, close policy, participant visibility, results visibility, timer) | slide schema |
| PR-118 | The prototype validator, golden-file builder and generators in `tools/` are **not product code** | tools, AGENTS |
| PR-119 | Duplicate slide IDs are reported by rule `VAL-M-003`, not by the schema, so the error is specific | manifest schema |
| PR-120 | **Default keymap** (`SCREEN_SPEC.md` SR-4), fixed during Stage 2 usability checks | screen spec |
| PR-121 | The join page shows a **short privacy line** about what is collected in the current join mode | screen spec |
| PR-122 | Deleting a slide **without** stored responses needs no confirmation (it is undoable) | screen spec |
| PR-123 | A newly written package is **re-validated before it replaces the target** (rule `VAL-S-001`) | security, quality |
| PR-124 | The Stage 2 layout of the Facilitator panel, including where counters, join address and QR code sit (sketch 02) | screen spec |

## 3. Open decisions

| ID | Open item | Blocks | Decide by |
|---|---|---|---|
| O-001 | Default participant **port** | Firewall guidance, QR stability | Stage 2 |
| O-002 | Participant page **bundle size budget** | Participant page design | Stage 2 |
| O-003 | **Layout and navigation** (menu, top bar, sidebar, Inspector): baseline sketches exist | Facilitator Workspace | Stage 2 review |
| O-004 | **Product name**, name screening, **product licence**, freemium terms and cap | Public release, branding | Before Stage 8 |
| O-005 | **Fonts** for non-Latin scripts (and their licences) | Word Cloud, Projector view | Stage 6 |
| O-006 | **Access to a Windows machine** | Windows verification | End of Stage 2 |
| O-007 | **Installer formats** and the update mechanism | Packaging | Stage 8 |
| O-008 | **Held reveal / Review** interaction | Quiz reveal timing | Stage 4 |
| O-009 | Whether a **local-HTTPS** spike is needed | Participant page | After Stage 2 data |
| O-010 | Whether to claim **any capacity figure**, and which | Release notes | Stage 8 |
| O-011 | **Schema toolchain:** generate Rust and TypeScript types from the schemas, or hand-write and prove equal (spike S0-7) | Stage 1 | Before Stage 1 |
| O-012 | The **mapping of format versions to application versions** shown in the Save As list | First release | First release |
| O-013 | **Speed-bonus formula details and leaderboard tie-breaking** | Stage 4 | Stage 4 |

## 4. Superseded

| Earlier decision or text | Replaced by |
|---|---|
| "Rosters are locked while responses exist" (original vision) | D-023 |
| Argon2id plus AES-GCM encryption (original security doc); the `age` library suggestion | D-003 |
| Native second window for the projector; "loopback binding plus tokens" for Facilitator control | D-004, D-005 |
| "Sessions/Runs" as part of the first fix for cumulative data | D-001 |
| Quiz steps that included a per-question leaderboard | D-014 |
| Test Windows only at packaging time | D-043 |
| Lock handling that offered automatic take-over of a dead process's lock and used a heartbeat as the staleness test | Lock protocol in `SECURITY_FILE_FORMAT.md` section 12: never automatic; the refreshed modification time is diagnostic only |
| Refusing duplicate display names in Display name mode | D-024 |
| A "readable join code" alone | D-006 |
| The original seven-stage roadmap, then the revised seven-stage plan | D-046 (eight stages) |
| Original "Presenter/Component" wording and "session" as a data term | D-013 |
| Original boasting phrases in the vision ("absolute", "uncompromising", "operating similarly to Word, Excel or PowerPoint") | D-019 |
| New Activity files owner-only on Linux (`PR-009`) | D-038 |
| "Downgrading is not supported" | D-071 |
| One `manifest.json` holding slides, roster and media | D-072 |
| Field lists, limits and error codes repeated across the documents | D-068, D-069, D-074 |
| Per-connection event sequence numbers with gap repair | D-076 (state-based views and one revision counter) |
| Reason codes listed in the component specification | The error-code catalogue (D-074) |

## 5. Revision log

| Date | Change |
|---|---|
| 2026-10-28 | Critical review of the first five documents; first rounds of decisions |
| 2026-10-29 | Further decision rounds; second-pack review; adoption of R1–R16, P1–P11, L1, L3–L5; duplicate display names allowed; **version 0.1 draft** of the document set |
| 2026-10-30 | Conflicts A to D resolved; all drafter defaults confirmed (with the permissions change); **version 0.2**: new `SCREEN_SPEC.md`, `SCHEMA_GOVERNANCE.md`, `PROTOCOL_SPEC.md`, `ACCEPTANCE_TESTS.md`; Stage 1 canonical artefacts, generated reference tables, prototype validator and golden file; four sketches; multi-file layout, state-based protocol, limits registry and catalogues; documents rewritten to point to the canonical artefacts |
