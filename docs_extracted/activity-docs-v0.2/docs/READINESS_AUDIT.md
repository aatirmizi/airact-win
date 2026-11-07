# Implementation Readiness Audit

**Date:** 2026-10-30. **Scope:** the whole document set and artefact folder (version 0.2).

## 1. Method, and what this audit is not

**Done:** a full read-through for internal contradictions and gaps by the drafter; and automated checks that are run, not merely described: (a) `tools/validate_artefacts.py` (schemas, registries, migration, golden file, prototype validator against crafted bad files); (b) `tools/gen_reference.py --check` (generated tables current); (c) `tools/check_docs.py` (every "section N" cross-reference, every document and identifier reference, every limit and error code named in prose exists, forbidden or stale terms, table structure, both-way coverage between scenarios and the error-code and validation-rule catalogues, adoption traceability targets).

**Not done:** no independent review; no product code exists; no product test has been run; none of the assumptions in `VERIFIED_VS_ASSUMED.md` marked Assumed has been checked. The prototype validator and golden file show that the file rules are implementable and consistent, **not** that the product works. This audit finds problems in the design; it does not prove the design works.

## 2. Problems found and fixed

### In version 0.1 (during the first audit)

| # | Problem | Fix |
|---|---|---|
| 1 | The spec offered *Reset this slide* during a Presentation while another section said Reset is unavailable while Live | Slide Reset allowed while Live only for a closed, non-current slide; entire-Activity Reset never (`D-059`) |
| 2 | The Live editor allowance included deleting and reordering slides during a Presentation | Only theme, notes and participant visibility while Live (`D-060`) |
| 3 | No Activity identifier existed, yet cookie names and working directories depended on one | `activity_id` added; copies get a new one (`D-061`) |
| 4 | The per-slide duplicate-key salt was specified but stored nowhere | Added to the slide runtime row |
| 5 | The participant landing page `/` was missing from the route allowlist | Added |
| 6 | *Save as Template* and *Save a Copy Without Responses* were not distinguished | Defined (`D-062`) |
| 7 | *Reset* was defined as clearing "participant identities" for a single slide | Slide and Activity Reset separated |
| 8 | Safety copy source and the never-saved case were undefined | Working state including unsaved changes; application data area when never saved (`D-063`) |
| 9 | Disk-full or read-only storage during Live was unspecified | `storage_error` path (`D-066`) |
| 10 | Laptop sleep or clock jumps during Live would corrupt timers | Stay-awake request, suspend detection, timers pause (`D-066`) |
| 11 | Phone countdowns could drift using the phone clock | Server-provided remaining time |
| 12 | A section reference pointed at the wrong section and several roadmap exit criteria did not name their document | Corrected |
| 13 | The words *presenter* and *session* appeared as product terms | Replaced |
| 14 | Proposal IDs collided with review items and ledger IDs | Renamed |
| 15 | Participant data could live in several places with no inventory | Inventory and non-claim added (`D-064`) |
| 16 | A limit on anonymous participants who clear browser data was not mentioned | Stated in the spec |

### In version 0.2 (found while building and running the artefacts)

| # | Problem | Fix |
|---|---|---|
| 17 | The duplicate-slide rule `VAL-M-003` could never fire, because the schema's own uniqueness check caught duplicates first with a generic message | Uniqueness removed from the schema; the rule is the single place (`PR-119`) |
| 18 | The database application identifier was worked out by hand and was wrong (a different number from the bytes "ACTV") | Recomputed by script; fixed in the migration, validator and decisions (`PR-111`) |
| 19 | Two bugs in my own test helpers and validator loop (a helper returned a value instead of the changed entries; a loop's `else` ran at the wrong time) | Found because the checks were run; fixed |
| 20 | Per-connection event sequence numbers (adopted item R2) are pointless once every message is a complete view | Replaced by one revision counter and state-based views (`D-076`) |
| 21 | A retry arriving after the slide closed would have been refused as `closed` even though the answer had been accepted | The idempotency lookup was placed before the live, closed and rule checks (`PR-104`) |
| 22 | Numeric limits were repeated in five documents and could disagree | One limits registry; documents cite IDs; a check proves schema limits equal registry values (`D-069`) |
| 23 | Reason codes were listed in two documents | One error-code catalogue (`D-074`) |
| 24 | Saving never re-checked the file it had just written | New step and rule `VAL-S-001` (`PR-123`) |
| 25 | "Downgrading is not supported" contradicted the decision to offer saving for older formats | Replaced throughout (`D-071`) |
| 26 | Strict readers and "new Slide Types need no format change" appeared to conflict | Clarified: a slide is a generic envelope; unknown types open read-only (`D-070`, `D-073`) |
| 27 | The relationship between database migrations and `format_version` was undefined | Every migration after the first release bumps both (`SCHEMA_GOVERNANCE.md` section 6) |
| 28 | Sketch 1 showed a slide with stored responses being edited; sketch 4 showed "already answered" text for a first answer; some markers overlapped content and one percentage ran into the QR box | Sketches corrected and re-rendered |
| 29 | The permission decision (default permissions) removed an earlier owner-only rule and its test | Documents and scenarios updated (`D-038`, `AT-PERM-001`) |
| 30 | Registry `explained_in` pointers, acceptance IDs in registries, and prose references to limits and codes could silently drift | `tools/check_docs.py` checks them both ways |

## 3. Open findings

Severity: **Gate** = must be resolved before the stage named can start; **Important** = resolve in the stage named; **Later** = recorded so it is not forgotten.

| ID | Sev. | Area | Finding | Resolution | By |
|---|---|---|---|---|---|
| F-01 | Gate | Whole design | No spike has been run; every platform, browser and library assumption is unverified | Run S0-1 to S0-7, update the ledger, review the design for anything refuted | Before Stage 1 |
| F-02 | Resolved in draft | File model | Manifest schema and first migration | Drafts exist and are checked; final after spike S0-7 | |
| F-03 | Important | UI | Layout and navigation (`O-003`): baseline sketches exist but have not been reviewed with a real Facilitator | Review; usability check; refine | Stage 2 |
| F-04 | Important | Network | Default participant port undecided (`O-001`) | Choose after spike S0-5; record | Stage 2 |
| F-05 | Important | Participant page | Bundle budget and browser support matrix undefined (`O-002`, A-040) | Set from spike S0-4 results | Stage 2 |
| F-06 | Important | Windows | No Windows machine identified (`O-006`) | Find access; otherwise Windows stays unverified and unclaimed | End of Stage 2 |
| F-07 | Important | Capacity | The default limit is arbitrary (`D-034`, A-045) | Replace with a measured value | Stage 2 |
| F-08 | Important | Performance | Full synchronous commits plus grouped writes might limit throughput on slow disks | Measure; decide per `ARCHITECTURE.md` section 8 | Stage 2 |
| F-09 | Important | Validation | No usability evidence exists yet | Informal pilots (`D-065`) | Stage 2 and 4 |
| F-10 | Important | Security | PINs are about 25 bits and verifiers live in the file | Accepted limitation, documented; mitigated by layers and optional protection | Stage 5 |
| F-11 | Important | Privacy | Anonymous duplicate keys are re-linkable by someone with the file | Accepted limitation, documented | Stage 5 |
| F-12 | Important | Library | The `zip` crate's AES writing and wrong-password detection are assumed (A-020) | S0-2; fall back to another approach if refuted and record it | Before Stage 1 |
| F-13 | Later | Quiz | Held-reveal Review interaction unspecified (`O-008`, `D-039`) | Design with mockups | Stage 4 |
| F-14 | Later | Quiz | Speed-bonus formula is a proposal; leaderboard tie-breaking unspecified (`O-013`) | Specify and test | Stage 4 |
| F-15 | Later | Quiz | Presenting a range that skips Quiz Questions: effect on totals unspecified | Specify | Stage 4 |
| F-16 | Later | Roster | Credential sheet layout and CSV columns not specified | Specify | Stage 5 |
| F-17 | Later | Reports | Report layouts, column definitions and the LMS CSV format not specified | Specify against a real LMS import | Stage 7 |
| F-18 | Important | Slides | The Poll component manifest and schemas are not yet written | Write at the start of Stage 2 (`SCHEMA_GOVERNANCE.md` section 11) | Stage 2 start |
| F-19 | Later | Interface | The message catalogue (actual participant-facing texts) is not written | Create alongside resource files | Stage 2 onward |
| F-20 | Later | Accessibility | Quiz timers vs adjustable time; no per-learner extra time in version 1 | Documented limitation | Later |
| F-21 | Later | Fonts | Offline fonts for non-Latin scripts undecided (`O-005`) | Choose with licence check | Stage 6 |
| F-22 | Later | Product | Name, licence, freemium cap (`O-004`) | Owner decisions | Before Stage 8 |
| F-23 | Later | Packaging | Installer formats, updater (`O-007`) | Decide | Stage 8 |
| F-24 | Later | Open time | Large media makes opening slower (everything unpacked) | Measure; lazy unpacking later | Later |
| F-25 | Later | HTTPS | Whether local HTTPS is needed (`O-009`) | Decide from spike and trial evidence | After Stage 2 |
| F-26 | Important | Protocol | Message field tables in `PROTOCOL_SPEC.md` are drafts; message schemas do not exist yet | Write the schemas, regenerate the tables | Stage 2 start |
| F-27 | Later | Screens | Contract cards for Stage 3 onward exist only as inventory entries | Write each before its stage | Per stage |
| F-28 | Later | Tests | Scenarios for Stage 3 onward are listed by title only (a few written in full) | Write each before its stage | Per stage |
| F-29 | Gate | Tooling | The schema toolchain (generated or hand-written types, a Rust validator crate) is undecided (`O-011`) | Spike S0-7 | Before Stage 1 |
| F-30 | Important | Limits | Every registry value is *initial*; none is measured | Measure in Stage 2 and Stage 8; record status changes | Stage 2, 8 |
| F-31 | Later | Keymap | The default keymap is unvalidated (A-047) | Usability checks | Stage 2 |
| F-32 | Later | Versions | The mapping of format versions to application versions is empty (`O-012`) | Fill at first release | First release |

**Inherent risk (not a defect):** the product cannot work on networks that block device-to-device traffic, and some venue networks do. The design states this plainly, provides a readiness check, and recommends a Facilitator-controlled access point. No software change removes this risk.

**Open blockers:** none for the documents. F-01 and F-29 gate the start of Stage 1; F-12 is part of F-01.

## 4. Adoption traceability

The identifiers R1 to R16, P1 to P11 and L1 to L5 are those of the second-pack review table that the owner adopted (`DECISIONS.md` D-025). L2 was reduced to one test (D-026).

| Item | Where it now lives |
|---|---|
| R1 Submission integrity | `PROTOCOL_SPEC.md` section 5; `ARCHITECTURE.md` section 8; `COMPONENT_SPEC.md` section 2; `PRODUCT_SPEC.md` section 7; `QUALITY_AND_RELEASE.md` section 4.2 |
| R2 Revisions, snapshots and jitter | `PROTOCOL_SPEC.md` sections 3, 4 and 6; `ARCHITECTURE.md` section 7; `QUALITY_AND_RELEASE.md` section 4.3 |
| R3 Untrusted file validation | `SECURITY_FILE_FORMAT.md` section 5; `reference/validation-rules.md`; `QUALITY_AND_RELEASE.md` section 4.4 |
| R4 Schema migration and durability | `SCHEMA_GOVERNANCE.md` sections 6 to 8; `SECURITY_FILE_FORMAT.md` section 6; `ARCHITECTURE.md` sections 8 and 9 |
| R5 Component schema versioning | `COMPONENT_SPEC.md` section 7; `schema/slide.schema.json` |
| R6 Spreadsheet injection | `SECURITY_FILE_FORMAT.md` section 10; `PRODUCT_SPEC.md` section 17; `QUALITY_AND_RELEASE.md` section 4.7 |
| R7 Listener separation tests | `ARCHITECTURE.md` section 3; `QUALITY_AND_RELEASE.md` section 4.1 |
| R8 Token hygiene, lockout parity, input bounds | `SECURITY_FILE_FORMAT.md` sections 9 and 10; `PROTOCOL_SPEC.md` section 9; `QUALITY_AND_RELEASE.md` section 4.6 |
| R9 Report provenance and incompleteness | `PRODUCT_SPEC.md` section 17; `SECURITY_FILE_FORMAT.md` section 3; `project_vision.md` section 3a |
| R10 Safety copies, `.bak`, corruption restore | `SECURITY_FILE_FORMAT.md` section 8; `PRODUCT_SPEC.md` section 9 |
| R11 Tabs and slide copy between Activities | `PRODUCT_SPEC.md` sections 2 and 18; `ARCHITECTURE.md` section 13 |
| R12 Quiz feedback controls | `PRODUCT_SPEC.md` section 5; `COMPONENT_SPEC.md` section 4 |
| R13 Close policy and grace | `PRODUCT_SPEC.md` section 7; `PROTOCOL_SPEC.md` section 7; `ACCEPTANCE_TESTS.md` section 5 |
| R14 Participant limit | `PRODUCT_SPEC.md` sections 6 and 7; `NETWORKING_AND_DEPLOYMENT.md` section 10 |
| R15 Performance protocol | `QUALITY_AND_RELEASE.md` section 6 |
| R16 Venue readiness | `NETWORKING_AND_DEPLOYMENT.md` sections 3 to 9 and 12 |
| P1 Agent workflow | `AGENTS.md` |
| P2 Decision register | `DECISIONS.md` |
| P3 Readiness audit | this file |
| P4 Release checklist | `QUALITY_AND_RELEASE.md` section 10 |
| P5 Verified versus assumed | `VERIFIED_VS_ASSUMED.md` |
| P6 Behavioural scenarios as tests | `QUALITY_AND_RELEASE.md` section 5; `ACCEPTANCE_TESTS.md` |
| P7 Test isolation | `ARCHITECTURE.md` section 14; `QUALITY_AND_RELEASE.md` section 3 |
| P8 Windows early | `ROADMAP.md` (Windows verification plan); `QUALITY_AND_RELEASE.md` section 3; `NETWORKING_AND_DEPLOYMENT.md` section 11 |
| P9 Governance | `QUALITY_AND_RELEASE.md` section 9 |
| P10 Diagnostics and errors | `ARCHITECTURE.md` section 11; `NETWORKING_AND_DEPLOYMENT.md` section 11 |
| P11 Interface text, bidirectional text, accessibility | `PRODUCT_SPEC.md` section 19; `QUALITY_AND_RELEASE.md` section 8; `ARCHITECTURE.md` section 12 |
| L1 No token in URLs (projector) | `ARCHITECTURE.md` sections 2 and 3; `PROTOCOL_SPEC.md` section 10 |
| L2 (as one test) | `NETWORKING_AND_DEPLOYMENT.md` section 3; `ACCEPTANCE_TESTS.md` section 4.2 |
| L3 Secure-origin-only features | `NETWORKING_AND_DEPLOYMENT.md` section 8; `ARCHITECTURE.md` section 8 |
| L4 Locking refinements | `SECURITY_FILE_FORMAT.md` section 12 |
| L5 Reset during Live or Recovered | `PRODUCT_SPEC.md` section 9; `SECURITY_FILE_FORMAT.md` section 13 |

## 5. Coverage of the owner's explicit requirements

| Requirement stated in review | Where |
|---|---|
| Honest documents; no boasting; education not built on dishonesty | `project_vision.md` principle 1 and section 5; all documents; `QUALITY_AND_RELEASE.md` section 10 item 17 |
| Terminology consistent | `GLOSSARY.md` |
| Single cumulative dataset, Reset, Template | `PRODUCT_SPEC.md` sections 2, 6, 9 |
| Optional protection like Word or Excel, zip-native | `SECURITY_FILE_FORMAT.md` section 7 |
| Roster PIN login, light hash, encrypted transfer, no impersonation | `SECURITY_FILE_FORMAT.md` section 9 |
| Facilitator control by IPC | `ARCHITECTURE.md` sections 2 and 3; `PROTOCOL_SPEC.md` section 11 |
| Complete join URL | `NETWORKING_AND_DEPLOYMENT.md` section 3 |
| Per-slide anonymity | `PRODUCT_SPEC.md` section 11; `COMPONENT_SPEC.md` section 6 |
| Slide saveable when incomplete, presentable when Ready | `PRODUCT_SPEC.md` section 4 |
| Preview does not store; presenting accumulates and respects response rules | `PRODUCT_SPEC.md` section 6 |
| Projector as a browser window | `ARCHITECTURE.md` section 2; `NETWORKING_AND_DEPLOYMENT.md` |
| LAN guidance in program and manual | `NETWORKING_AND_DEPLOYMENT.md` sections 5 to 9, 12, 13 |
| Phone reconnection | `PROTOCOL_SPEC.md` section 6; `SECURITY_FILE_FORMAT.md` section 10 |
| Stale locks | `SECURITY_FILE_FORMAT.md` section 12 |
| No CDN on participant pages | `ARCHITECTURE.md`; `NETWORKING_AND_DEPLOYMENT.md` section 8; `ACCEPTANCE_TESTS.md` (`AT-NET-003`) |
| Facilitator switches, some in vision for later | `PRODUCT_SPEC.md` section 14; `project_vision.md` section 6 |
| Counters on every slide (Active, Answered, Stored) | `PRODUCT_SPEC.md` section 12; `AT-CNT-001` |
| No editing once responses exist | `PRODUCT_SPEC.md` section 8; `AT-DATA-001` |
| Quiz scoring across the Activity | `PRODUCT_SPEC.md` section 5; `COMPONENT_SPEC.md` section 4 |
| macOS deferred; scale, platforms, English-only, freemium | `project_vision.md` section 2 |
| Duplicate display names allowed | `PRODUCT_SPEC.md` section 11 |
| Default permissions: files openable by all users on both systems | `SECURITY_FILE_FORMAT.md` section 4.3; `AT-PERM-001` |
| Conflict A: screen-level interaction specifications | `SCREEN_SPEC.md`; `sketches/`; `AT-UI-*` |
| Conflict B: canonical schemas, multi-file layout, limits registry, strict versioning, saving for older formats | `SCHEMA_GOVERNANCE.md`; `schema/`; `reference/`; `SECURITY_FILE_FORMAT.md` section 2 |
| Conflict C: interface and protocol contracts | `PROTOCOL_SPEC.md`; `reference/error-codes.md` |
| Conflict D: acceptance tests for user-visible behaviour | `ACCEPTANCE_TESTS.md` (four requested examples in section 7) |
| Items A, B and C of the second-pack review adopted | section 4 above |
