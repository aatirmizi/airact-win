# Roadmap

**Status:** plan. Sequence is organised around thin vertical slices so that the riskiest assumptions (network, files, phones) are tested first, and a live poll works end to end at Stage 2. Each stage ends with working software **and recorded evidence** (`VERIFIED_VS_ASSUMED.md`). A stage is not complete until its exit criteria are ticked, including: **every *Must* scenario of the stage in `ACCEPTANCE_TESTS.md` has an automated test or a dated manual run record, and the contract and artefact checks pass** (`QUALITY_AND_RELEASE.md` section 4.11).

Canonical artefacts, protocol sections, screen cards and scenarios for a stage are written **just before** the stage (`SCHEMA_GOVERNANCE.md` section 11). Those for Stage 1 and Stage 2 already exist.

## Spikes (before Stage 1)

Short experiments whose only product is **recorded facts**. Throwaway code is allowed. Results go into the ledger and decide open items.

| # | Spike | Question answered |
|---|---|---|
| S0-1 | Network and scale | Can one laptop serve about 100 simulated participants on a real access point (join burst, answer burst, reconnect storm)? What breaks first? |
| S0-2 | File model | Does the working-directory model work: SQLite in write-ahead mode snapshotted with the backup mechanism, zip packaging, **AES entry writing in the pinned `zip` version**, atomic replace, exclusive-create lock, kill-during-save recovery? |
| S0-3 | Browser projector | Does a browser window go full screen on a second display on Fedora and Ubuntu (Wayland and X11)? Does the one-time-token redirect work? |
| S0-4 | Phones on plain HTTP | On real Android and iOS browsers: is `crypto.getRandomValues` available? Do cookies and `SameSite` behave? Does a WebSocket authenticate with the cookie? Does the `sessionStorage` fallback work? What happens at screen lock and unlock? |
| S0-5 | Firewall | Do the Fedora and Ubuntu rule examples in `NETWORKING_AND_DEPLOYMENT.md` work as written? |
| S0-6 | Tauri on target systems | Do the native menu, file dialogs, single-instance handling and rendering work on the target Fedora and Ubuntu releases? |
| S0-7 | Schema toolchain | Can Rust and TypeScript types be generated from the JSON Schemas with strictness (no unknown fields) and the registry limits? If not, hand-written types plus tests proving they match the schemas. |

**Exit:** the ledger records each result (verified or refuted). Open items "default participant port" (`O-001`), "participant bundle budget" (`O-002`) and the schema-toolchain choice are decided or explicitly deferred. Any refuted assumption triggers a design review before Stage 1 proceeds.

## Stage 1: Foundation and file model

**Artefacts (draft exists):** manifest, theme, settings and slide-envelope schemas, limits registry, error and validation-rule catalogues, migration 0001, golden file, prototype validator.

**Scope**
- Tauri shell, Rust core, IPC with a minimal capability set generated from `PROTOCOL_SPEC.md` section 11, strict content security policy for the Facilitator webview.
- **Application data directory resolver and test isolation**; tests cannot touch real data.
- **CI on Linux and Windows** building and running tests.
- File model: container layout, schema validation from the canonical artefacts, **untrusted-file validation (all `VAL-*` rules)**, working directory, journaled autosave, atomic save with verification and `.bak`, **lock protocol**, recovery scaffold.
- **Versioning and migration framework**, numbered SQL migrations, golden-file test harness, slide type versioning in the manifest.
- Component registry skeleton and the generic engine contract.
- Multiple open Activities in tabs.
- Screens `FW-01`, `FD-01` to `FD-04` (`SCREEN_SPEC.md`).
- Language resource files; layered error messages; redacting log layer.
- Licence inventory and vulnerability checks in CI; neutral internal name and one display-name constant.
- `AGENTS.md`, decision register, ledger, and the drift checks live in the repository.

**Exit criteria**
- [ ] New, Open, Save, Save As, Close work; Save leaves the original intact when failures are injected at each step (`AT-FILE-001` to `AT-FILE-004`, `AT-FILE-021`).
- [ ] Every `VAL-*` rule has a failing test and the hostile-file scenarios pass (`AT-FILE-005` to `AT-FILE-031`).
- [ ] Lock and recovery scenarios pass, including partial and stale locks (`AT-LOCK-*`, `AT-REC-*`).
- [ ] Default permissions behave as specified (`AT-PERM-*`); test isolation passes (`AT-ISO-001`); a failed migration changes nothing (`AT-MIGR-001`).
- [ ] The first golden file is stored and reopened by the harness.
- [ ] CI is green on Linux and Windows; no test or tool writes outside its temporary directory.

## Stage 2: Vertical slice, anonymous Poll end to end

**Artefacts (written before the stage):** Poll component manifest and schemas, participant and projector message schemas (replacing the draft tables), migration 0002 (participants, responses, duplicate keys, slide runtime), network limits and protocol codes in the registries.

**Scope**
- Multiple Choice Poll: authoring (completeness rule, Ready status), **Preview** with the throwaway store and Simulate responses.
- Present: Start presenting dialog (interface, join mode Anonymous, participant limit), participant listener, projector listener and browser Projector view with the one-time token exchange, Lobby, join address and QR from the core, **Network Check** with real-device test, LAN indicator.
- Participant page (small bundle, no external resources, no secure-origin-only features).
- **Submission integrity** exactly as `PROTOCOL_SPEC.md` section 5: submission IDs, acknowledgement after commit, idempotent retries, group commit, explicit durability settings.
- **Real-time protocol** exactly as `PROTOCOL_SPEC.md` sections 3 and 6: revisions, full views, reconnect with jitter, visibility-triggered refresh, liveness, backpressure, coalescing.
- Participant tokens (hashed, cookies, header fallback), join code rules, Host and Origin checks, input bounds, participant limit enforcement.
- Counters (Active, Answered, Stored responses).
- Screens `FW-02` to `FW-04`, `FD-05` to `FD-08`, `PJ-01` to `PJ-03`, `PP-01` to `PP-03`, using `sketches/` as the layout baseline; the keymap fixed during usability checks.
- Listener separation tests; offline page-load test; all Stage 2 scenarios.
- First capacity measurement under the protocol (not a claim yet).

**Exit criteria**
- [ ] Real phones scan the QR code and vote on a real access point; the projector shows live results (`AT-JOIN-001`, `AT-PRES-004`).
- [ ] All Must scenarios in `ACCEPTANCE_TESTS.md` sections 4.1 to 4.7 pass or have manual run records, including `AT-NET-001` to `AT-NET-003`, `AT-RESP-001` to `AT-RESP-013`, `AT-RECON-001` to `AT-RECON-006`.
- [ ] The QR content is correct and never loopback (`AT-PRES-005`).
- [ ] A phone locked and unlocked mid-poll recovers and sees its recorded answer (`AT-RECON-001`).
- [ ] **Hands-on Windows check** (join, firewall prompt, Projector view) done if a Windows machine is available; otherwise recorded as pending with the reason.
- [ ] First measurements recorded with raw data.
- [ ] **Informal pilot** with a small real group (the Facilitator plus willing participants on their own phones); what confused people and what failed is recorded.
- [ ] Layout baseline confirmed or revised (`O-003`).

## Stage 3: Facilitator controls and data rules

**Artefacts:** event log table (migration 0003), Content slide schemas, close-policy fields and edit-lock rules in the component manifests, further screen cards (`FD-09`, `FD-10`, `PJ-04`) and scenarios.

**Scope**
- Accepting responses; **close policy** (Immediate and Grace); Poll re-open; participant visibility; Present from the beginning, a selected slide or a range.
- **End presenting workflow**; **event log** and the data needed for the report provenance block; incomplete-result labelling.
- **Reset** (slide and Activity) with confirmation, export-first prompt, **automatic safety copy** from the working state, `.bak` and **corruption detection with restore**; entire-Activity Reset unavailable while Live, slide Reset while Live only for a closed non-current slide; neither while Recovered; full **Recovered** flow.
- New Activity ID and empty event log for Save As, copies and templates.
- Edit locking (cosmetic whitelist), Live editor read-only, delete slide with data.
- Save as Template / Save a Copy Without Responses; Duplicate slide.
- **Copy, cut and paste of slides between Activities** (deep copy).
- Undo and redo for authoring.
- **Content slides** (fixed layouts), hidden from phones by default.
- Interface change workflow while Live; suspend and clock-jump handling.

**Exit criteria**
- [ ] `AT-DATA-*`, `AT-RESET-*`, `AT-EVENT-001`, `AT-NET-004`, `AT-PRES-011`, `AT-RESP-014`, `AT-RECON-007` pass.
- [ ] A crash during Live recovers committed responses and does not claim more.
- [ ] A copied slide never carries responses or shared references.
- [ ] Late submissions after close or grace never change finalised results.

## Stage 4: Quiz and Leaderboard

**Artefacts:** Quiz Question and Leaderboard component manifests and schemas, quiz settings in `settings.schema.json` (a scheme change, pre-release), screen cards `FD-12`, `FD-13`, `PJ-05`, `PP-04`, `PP-06`.

**Scope**
- Quiz Question (steps, timer, points, one correct option), Activity-wide **Quiz settings** (Learning, Competitive, Custom), **explanations**, **reveal timing** (after the question, held with a Review list, not during the presentation), personal score visibility, speed bonus formula and tie-breaking fixed and documented, *no answer* versus *incorrect*.
- Leaderboard slide (Off, Top 5, Full list); Display name join mode with duplicates allowed, disambiguators, name correction, Hide name, Remove participant.
- Quiz fairness rules: no re-opening after Reveal; locked scoring once responses exist.

**Exit criteria**
- [ ] `AT-QUIZ-*` and `AT-IDEN-*` pass.
- [ ] Scores are deterministic and reproducible from stored responses.
- [ ] Correct answers and held reveals never reach phones early.
- [ ] Reveal timing and Review work with real phones.
- [ ] **Informal pilot** of a short quiz with a real group; findings recorded.

## Stage 5: Roster and identity

**Artefacts:** `roster.json` schema, login message schemas and codes, migration for any roster-related runtime data, screen cards `FD-14` to `FD-16`, `PP-05`.

**Scope**
- Roster import (CSV, Excel, pasted grid) with a library grid; conflict handling; roster rules while responses exist.
- PIN generation, credential sheet, light hash storage; **challenge–response login**; the five **anti-impersonation layers**; lockout keyed on the ID string; identical responses for known and unknown IDs; input limits.
- Roster login join mode; per-slide response mode (Anonymous and Identified) with the dedupe key; the Lobby joined list and the Facilitator panel (Joined, Not yet joined, flags).
- Release and flag handling; recovery of identity after a lost token.

**Exit criteria**
- [ ] `AT-ROST-*`, `AT-AUTH-*`, `AT-ANON-001` pass.
- [ ] PINs never appear in any request, log, response or file.
- [ ] Unknown-ID and known-ID behaviour are indistinguishable within tolerance, including lockout.
- [ ] A shared or replaced phone can be released and used.

## Stage 6: Open Question, Word Cloud and Q&A

**Artefacts:** the three component manifests and schemas, moderation states, screen cards `FD-17`, `PJ-06`, `PP-07`.

**Scope**
- Open Question, Word Cloud, Q&A with **one shared moderation mechanism** (received, approved, hidden; hide after display).
- Word normalisation; right-to-left and mixed-script rendering; hostile-text handling in every view.

**Exit criteria**
- [ ] `AT-MOD-*` pass; hostile-text tests pass on every screen.
- [ ] Moderation never shows unapproved items on the projector or phones.
- [ ] Bidirectional text, long strings and emoji render safely.

## Stage 7: Reports and protection

**Artefacts:** report formats, protection rules in the validation catalogue, screen cards `FD-18` to `FD-20`.

**Scope**
- Reports: HTML, CSV, XLSX, **provenance block**, denominators, incomplete labelling, no answer versus incorrect, LMS-friendly CSV, **spreadsheet-injection and escaping safeguards**.
- **Optional file protection** (zip AES), including all required protection tests.
- User-initiated redacted **diagnostic report**.
- `THIRD_PARTY_LICENSES`.

**Exit criteria**
- [ ] `AT-REPORT-*`, `AT-PROT-*`, `AT-DIAG-001` pass; hostile names are neutralised in every format.
- [ ] A protected file round-trips; wrong password and damaged file give the same message.
- [ ] The diagnostic report passes the redaction test.

## Stage 8: Validation and release

**Scope**
- **Capacity validation** under the full protocol; **real-device and venue trials**; **accessibility checks**; internationalisation checks.
- Packaging and installation for each claimed operating system; file association; update-check decision.
- **Hands-on Windows verification** in full (or Windows remains unclaimed).
- Manual and in-app help covering the topics in `NETWORKING_AND_DEPLOYMENT.md` section 13; screen card `FD-21`.
- Documentation honesty review; refresh of `VERIFIED_VS_ASSUMED.md` and `READINESS_AUDIT.md`; release checklist.

**Exit criteria:** every item of the release checklist in `QUALITY_AND_RELEASE.md` section 10 is ticked, or the corresponding claim is removed.

## Windows verification plan

1. CI builds and tests on Windows from Stage 1.
2. A hands-on check of joining, the firewall prompt and the Projector view at the end of Stage 2, if a Windows machine is available. This replaces the earlier plan to test Windows only at packaging time.
3. Full hands-on verification in Stage 8.
4. Until step 3 is done, Windows is described as "builds and passes automated tests; not verified on a Windows machine".

If no Windows machine becomes available, the risk stays open and visible in `READINESS_AUDIT.md` (`O-006`).

## Later versions (not scheduled)

See `project_vision.md` section 6, and: saving for older formats arrives with the first format change after release; scales, ranking, true/false, multi-correct, confidence rating; free-form content layout; video; PowerPoint import; Runs and cohort comparison; audited response invalidation; macOS; translated and right-to-left interface; automatic backups; Projector view on another computer; slide-clicker support; optional local HTTPS.
