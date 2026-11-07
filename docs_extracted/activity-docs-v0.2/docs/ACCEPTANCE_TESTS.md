# Acceptance Scenarios

**Status:** catalogue. Stage 1 and Stage 2 scenarios are written in full; scenarios for later stages are listed in section 6 and written just before their stage. A few Stage 3 scenarios are written now because they were requested as worked examples.

## 1. How to use this catalogue

- **Scenario IDs are stable** (`AT-<DOMAIN>-<NNN>`) and never reused. Automated tests carry the ID in their name; manual scenarios are recorded with date, build and result.
- **Priority:** **Must** blocks a release; **Should** is expected but does not block alone; **Could** is nice to have. A CI check fails if a Must scenario of a finished stage has neither an automated test nor a manual run record.
- **Layer:** `unit`, `integration`, `file`, `network`, `ui` (automated interface test) or `manual`. Real-device and venue trials are in `QUALITY_AND_RELEASE.md` section 7.
- **Single source:** the expected result of a behaviour is written here, once. Specifications, screen cards, error codes and validation rules cite the ID.
- **Coverage:** every error code in `reference/error-codes.md` and every rule in `reference/validation-rules.md` lists at least one scenario here, and `tools/check_docs.py` checks both directions.
- Message texts are shown by key or in quotes as the intent; the exact wording lives in the language resource files.
- "Nothing changes" means the file or data is byte-for-byte identical afterwards.

## 2. Domains

FILE (files and formats), LOCK (locking), REC (recovery), PERM (permissions), ISO (test isolation), MIGR (migration), TAB (tabs), SLIDE (authoring), PREV (preview), PRES (presenting), JOIN (joining), RESP (responses), RECON (reconnection), PROJ (projector), CNT (counters), NET (network exposure), UI (interface behaviour), and, written later, DATA, RESET, IDEN, QUIZ, AUTH, ROST, MOD, REPORT, PROT.

## 3. Stage 1: files, locking, recovery and tabs

### 3.1 Saving and opening

#### AT-FILE-001 Create, save, close and reopen
**Must · file · Stage 1.** **Given** a new Activity with one slide, a theme and a media image. **When** it is saved, closed and opened again. **Then** every slide, the theme, the settings and the media are identical, the Activity ID is unchanged, no lock file remains, and no temporary files remain.

#### AT-FILE-002 Save fails because the disk is full
**Must · file · Stage 1.** **Given** an Activity with unsaved changes and not enough free space to write the package. **When** the Facilitator chooses Save. **Then** an error dialog says the disk is full and that nothing was changed (`FILE_SAVE_DISK_FULL`); the original file is identical to before; no temporary file remains; the tab stays open and marked unsaved; Save As to another location works.

#### AT-FILE-003 Save fails because the folder is read-only
**Must · file · Stage 1.** **Given** an Activity opened from a folder the user can read but not write. **When** Save is chosen. **Then** `FILE_PERMISSION_DENIED` is shown with *Save As…* offered; the original is unchanged; the tab stays dirty; saving to a writable folder succeeds.

#### AT-FILE-004 Save interrupted by a crash
**Must · file · Stage 1.** **Given** a save in progress. **When** the process is killed after the temporary file is written and before the replacement. **Then** the original file is intact and valid; on the next start the app reports `FILE_SAVE_FAILED`-class recovery information, offers to recover the working copy, and the stray temporary file is listed and removable by the user (never deleted silently).

#### AT-FILE-005 Open a file from a newer version
**Must · file · Stage 1.** **Given** a file whose `format_version` is greater than the application supports. **When** it is opened. **Then** it is refused with "created by a newer version" (`FILE_UNSUPPORTED_NEWER`, rule `VAL-M-002`); nothing is unpacked; the file is unchanged.

#### AT-FILE-006 Open a file with an unknown slide type
**Must · file · Stage 1.** **Given** a valid file in a supported format whose `requires` lists a slide type this application does not know. **When** it is opened. **Then** it opens read-only with a banner (`FILE_OPEN_READ_ONLY_UNKNOWN_TYPE`, rule `VAL-M-005`), unknown slides are shown as unsupported, Save to the original is refused, and *Save As an independent copy* is offered.

#### AT-FILE-007 Archive with a path-traversal entry
**Must · file · Stage 1.** **Given** an archive containing an entry named `../evil.json` (or an absolute path, a backslash, a drive letter or a symbolic link). **When** it is opened. **Then** it is refused (`FILE_INVALID_CONTAINER`, rule `VAL-C-003`); nothing is written to disk outside the working area; the file is unchanged.

#### AT-FILE-008 Archive with an extreme compression ratio
**Must · file · Stage 1.** **Given** an archive with an entry whose compression ratio exceeds the limit. **When** it is opened. **Then** it is refused (`VAL-C-008`) without expanding it fully, and memory use stays bounded.

#### AT-FILE-009 Manifest with an unknown field
**Must · file · Stage 1.** **Given** a manifest that contains a field the schema does not define. **When** it is opened. **Then** it is refused (`FILE_INVALID_MANIFEST`, `VAL-M-001`); the technical details name the field.

#### AT-FILE-010 Duplicate slide or media IDs
**Must · file · Stage 1.** **Given** a manifest listing the same slide ID twice (or two media entries with one ID). **When** it is opened. **Then** it is refused (`VAL-M-003` or `VAL-M-004`) with a message naming the duplicate.

#### AT-FILE-011 Missing, orphan or mismatched slide file
**Must · file · Stage 1.** **Given** (a) a listed slide with no file, (b) a slide file not listed, or (c) a slide file whose `id` differs from its name. **When** opened. **Then** each is refused (`FILE_INVALID_CONTENT`; `VAL-X-001`, `VAL-X-002`, `VAL-X-003`).

#### AT-FILE-012 Media does not match its index
**Must · file · Stage 1.** **Given** a media file whose size or SHA-256 differs from the index, or a media file not in the index. **When** opened. **Then** it is refused (`FILE_INVALID_MEDIA`, `VAL-X-005`).

#### AT-FILE-013 Database with a trigger, view or unexpected schema
**Must · file · Stage 1.** **Given** a `data.db` containing a trigger, a view, a virtual table or an unexpected table. **When** opened. **Then** it is refused (`FILE_INVALID_DATABASE`, `VAL-D-001`/`VAL-D-004`); the database is never executed beyond the defensive checks.

#### AT-FILE-014 Damaged file with a backup available
**Must · file · Stage 1.** **Given** a damaged Activity and a `.bak` beside it. **When** it is opened. **Then** the app reports `FILE_CORRUPTED_RESTORE_AVAILABLE`, offers to restore from the `.bak` (or the newest safety copy) or to open read-only what can be read, and never overwrites the damaged file without an explicit choice.

#### AT-FILE-016 Save As in version 1 offers only the current format
**Should · ui · Stage 1.** **Given** version 1 of the application. **When** the Save As dialog is opened. **Then** the only format offered is the current one and no compatibility check appears.

#### AT-FILE-017 Oversized file, too many entries or oversized entry
**Must · file · Stage 1.** **Given** a file over the size limit, or an archive with too many entries, or an entry that exceeds its size while being read. **When** opened. **Then** it is refused (`FILE_TOO_LARGE`; `VAL-C-005`, `VAL-C-006`, `VAL-C-007`) before or during reading, not after unpacking everything.

#### AT-FILE-018 Roster file does not match the manifest
**Should · file · Stage 1.** **Given** `has_roster` true with no `roster.json`, or a `roster.json` with `has_roster` false. **When** opened. **Then** it is refused (`FILE_INVALID_MANIFEST`, `VAL-X-004`).

#### AT-FILE-019 Versions or Activity ID disagree with the database
**Must · file · Stage 1.** **Given** a manifest whose `data_schema_version` or `activity_id` differs from the database. **When** opened. **Then** it is refused (`FILE_INVALID_MANIFEST`; `VAL-D-003`, `VAL-D-006`).

#### AT-FILE-020 Media content type does not match
**Should · file · Stage 1.** **Given** a file named `.png` whose bytes are a different type than declared. **When** opened. **Then** it is refused (`FILE_INVALID_MEDIA`, `VAL-X-006`).

#### AT-FILE-021 Verification of a newly written package fails
**Must · file · Stage 1.** **Given** a save in which the written temporary package fails re-validation (fault injected). **When** Save runs. **Then** `FILE_SAVE_VERIFY_FAILED` is shown, the temporary file is deleted, the original is unchanged and the tab stays dirty (`VAL-S-001`).

#### AT-FILE-022 Invalid theme, settings or slide file
**Must · file · Stage 1.** **Given** a theme with an invalid colour, settings with an invalid language tag, or a slide with an extra field. **When** opened. **Then** each is refused (`FILE_INVALID_CONTENT`; `VAL-X-008`, `VAL-X-009`).

#### AT-FILE-023 Required entry missing
**Must · file · Stage 1.** **Given** an archive without `manifest.json`, `theme.json`, `settings.json` or `data.db`. **When** opened. **Then** it is refused (`FILE_INVALID_CONTAINER`, `VAL-C-009`).

#### AT-FILE-024 Entry name not allowed or duplicated
**Must · file · Stage 1.** **Given** an entry with a name outside the allowed set, or two names equal ignoring case. **When** opened. **Then** it is refused (`FILE_INVALID_CONTAINER`; `VAL-C-002`, `VAL-C-004`).

#### AT-FILE-025 Database integrity or identity fails
**Must · file · Stage 1.** **Given** a `data.db` with a wrong application identifier or a failed integrity check. **When** opened. **Then** it is refused (`FILE_INVALID_DATABASE`; `VAL-D-002`, `VAL-D-005`).

#### AT-FILE-026 Open a missing file from the Recent list
**Should · ui · Stage 1.** **Given** a Recent entry whose file was deleted. **When** it is chosen. **Then** `FILE_NOT_FOUND` is shown with *Remove from list* offered; nothing else changes.

#### AT-FILE-027 File cannot be read (input/output error)
**Should · file · Stage 1.** **Given** a read error part-way through opening. **When** opened. **Then** `FILE_UNREADABLE` is shown; no partial working directory remains.

#### AT-FILE-028 No permission to read the file
**Should · file · Stage 1.** **Given** a file the user cannot read. **When** opened. **Then** `FILE_PERMISSION_DENIED` is shown with the next safe action.

#### AT-FILE-029 A file that is not an Activity
**Must · file · Stage 1.** **Given** a file with the right extension but arbitrary bytes. **When** opened. **Then** it is refused (`FILE_INVALID_CONTAINER`, `VAL-C-001`); nothing is created.

#### AT-FILE-030 `requires` does not match the slides
**Should · file · Stage 1.** **Given** a `requires` list that differs from the types used by the slide files. **When** opened. **Then** it is refused (`FILE_INVALID_MANIFEST`, `VAL-M-006`).

#### AT-FILE-031 Media reference to an unknown ID
**Should · file · Stage 1.** **Given** slide content referencing a media ID not in the index. **When** opened. **Then** it is refused (`FILE_INVALID_CONTENT`, `VAL-X-007`).

### 3.2 Locking

#### AT-LOCK-001 File already open in another instance
**Must · file · Stage 1.** **Given** an Activity open in application instance A. **When** instance B opens the same file. **Then** B shows the lock-conflict dialog (`FILE_LOCKED`) naming host, user and time; offers *Open read-only* (default), *Open an independent copy*, *Cancel*, *Take over*; choosing *Open read-only* opens a view that cannot be saved over the original; A is unaffected.

#### AT-LOCK-002 Partial or unreadable lock file
**Must · file · Stage 1.** **Given** a lock file that is empty, truncated or not valid JSON. **When** the Activity is opened. **Then** it is treated as a conflict (`FILE_LOCKED`), never deleted or overwritten automatically, and the dialog explains the lock could not be read.

#### AT-LOCK-003 Stale lock after a crash
**Must · file · Stage 1.** **Given** a lock file left by a crashed instance whose process no longer exists. **When** the Activity is opened. **Then** the dialog is shown with the diagnostic "process not running, last active N minutes ago"; no choice is taken automatically; *Take over* needs a second explicit confirmation and Enter never selects it.

#### AT-LOCK-004 Read-only view cannot save over the original
**Must · file · Stage 1.** **Given** an Activity opened read-only. **When** the user edits and chooses Save. **Then** saving to the original is refused in the core, *Save As* to another name creates an independent copy with its own lock and a new Activity ID, and the original is unchanged.

#### AT-LOCK-005 Save As to a new path reserves the destination
**Must · file · Stage 1.** **Given** a Save As to a new path. **When** the destination lock cannot be created (fault injected). **Then** the source document and its lock are kept, no destination file exists, and an error is shown.

#### AT-LOCK-006 Save As over an existing locked file is refused
**Must · file · Stage 1.** **Given** a Save As targeting a file that is locked by another instance. **When** it runs. **Then** it is refused (`FILE_LOCKED`); the target is unchanged; the source remains open.

#### AT-LOCK-007 Lock file removed while the Activity is open
**Should · file · Stage 1.** **Given** an open Activity whose lock file is deleted externally. **When** Save is chosen. **Then** Save is refused (`FILE_LOCK_LOST`) with the options to re-acquire the lock if free or to Save As a copy; nothing is overwritten.

#### AT-LOCK-008 Target replaced outside the application
**Should · file · Stage 1.** **Given** an open Activity whose file was replaced by another program. **When** Save is chosen. **Then** Save is refused (`FILE_TARGET_CHANGED`) and the user can Save As a copy; the external file is untouched.

### 3.3 Recovery, permissions, isolation, migration and tabs

#### AT-REC-001 Recovery after a crash while editing
**Must · file · Stage 1.** **Given** unsaved edits and a crash. **When** the application restarts. **Then** the recovery prompt appears (`FILE_RECOVERY_AVAILABLE`); *Recover* reopens the Activity with the journaled edits, marked Recovered and unsaved; the original file on disk is unchanged until Save.

#### AT-REC-002 Recovery after a crash during a save
**Must · file · Stage 1.** **Given** a crash in the middle of Save. **When** the application restarts. **Then** the original file is valid, the recovery prompt offers the working copy, and recovering and saving produces a valid file.

#### AT-REC-003 Discarding recovered work needs confirmation
**Should · ui · Stage 1.** **Given** the recovery prompt. **When** *Discard* is chosen. **Then** a confirmation names the number of committed responses (and unsaved edits) that will be lost; Enter selects the safe choice; Esc cancels.

#### AT-PERM-001 New files use default permissions
**Should · file · Stage 1.** **Given** a default environment on Linux and on Windows. **When** an Activity is saved for the first time. **Then** the file's permissions equal the system default for new files in that folder, so another local user who may read the folder can open it; replacing an existing file keeps its permissions.

#### AT-PERM-002 The working directory is private
**Should · file · Stage 1.** **Given** an open Activity. **When** the working directory's permissions are inspected. **Then** it is accessible only to the current user (owner-only on Linux; user-profile ACL on Windows).

#### AT-ISO-001 Test mode refuses to start without a data directory
**Must · unit · Stage 1.** **Given** the application started in test mode with no explicit data-directory override. **When** it starts. **Then** it fails with `APP_TEST_MODE_NEEDS_DATA_DIR` and touches no real directory.

#### AT-MIGR-001 A failed migration changes nothing
**Must · file · Stage 1.** **Given** a test-only migration set whose second migration fails. **When** an older test file is opened. **Then** `MIGRATION_FAILED` is shown; the working copy and the source file are unchanged.

#### AT-TAB-001 A second Activity opens in a new tab
**Should · ui · Stage 1.** **Given** one open Activity. **When** another file is opened. **Then** it opens in its own tab with its own state, and editing one does not change the other.

#### AT-TAB-002 Opening the same file twice focuses the existing tab
**Should · ui · Stage 1.** **Given** an open Activity. **When** the same file is opened again in the same instance. **Then** its existing tab is focused and no second lock attempt is made.

#### AT-TAB-003 Closing a tab with unsaved changes
**Must · ui · Stage 1.** **Given** a dirty tab. **When** it is closed. **Then** a prompt offers Save (default), Don't save and Cancel; Cancel keeps the tab; a failed Save keeps it open and dirty.

## 4. Stage 2: authoring, presenting, joining and responding

### 4.1 Authoring and preview

#### AT-SLIDE-001 An incomplete Poll cannot be previewed or presented
**Must · ui · Stage 2.** **Given** a Poll with a question and one empty option. **When** the Facilitator looks at Preview or opens Start presenting. **Then** Preview is disabled with the reason "Complete the question to preview" (`SLIDE_INCOMPLETE`); Start presenting lists the slide as skipped; saving the Activity still works.

#### AT-SLIDE-002 A Poll becomes Ready
**Must · ui · Stage 2.** **Given** an Incomplete Poll. **When** a question and at least two non-empty options are entered. **Then** the sidebar badge changes from Incomplete to Ready and Preview and Present become available.

#### AT-SLIDE-003 Option count bounds
**Should · ui · Stage 2.** **Given** a Poll with the maximum number of options. **When** another is added. **Then** it is refused with a message naming the maximum. **And when** options are removed below the minimum **then** the slide becomes Incomplete.

#### AT-PREV-001 Preview stores nothing
**Must · integration · Stage 2.** **Given** a Poll with zero stored responses. **When** it is previewed, answered in the phone pane, 20 responses are simulated, and the pane is closed. **Then** the stored-response count is still zero, the database is unchanged, no participant listener was started, and the Activity is not marked changed by the preview.

#### AT-PREV-002 Simulate responses
**Should · ui · Stage 2.** **Given** the Preview pane. **When** *Simulate responses* is used with a count. **Then** exactly that many valid responses appear in the preview results, distributed across the options, and are discarded on close.

### 4.2 Presenting

#### AT-PRES-001 Start presenting is disabled until it can work
**Must · ui · Stage 2.** **Given** (a) no interface chosen, (b) no Ready slide, (c) no roster. **When** the dialog is opened. **Then** in (a) Start is disabled with "Choose a network interface"; in (b) with "No slide is ready to present"; in (c) Roster login is not offered.

#### AT-PRES-002 A limit above the validated capacity warns
**Should · ui · Stage 2.** **Given** a validated capacity recorded for the release. **When** the limit entered exceeds it. **Then** a warning appears and Start stays enabled.

#### AT-PRES-003 The participant server fails to bind
**Must · integration · Stage 2.** **Given** the chosen port is in use. **When** Start is chosen. **Then** `NET_BIND_FAILED` is shown, nothing is listening on any other address (no fallback), the dialog stays open, and the Activity is not Live.

#### AT-PRES-004 Network Check with a real device
**Must · manual · Stage 2.** **Given** a phone on the same network. **When** it scans the QR code in Network Check and answers the test. **Then** the panel shows the device and its round-trip time and "Test answer received"; closing the check stops the participant listener.

#### AT-PRES-005 The join address and QR code are never loopback
**Must · integration · Stage 2.** **Given** the chosen interface `192.168.1.23`, port `47831` and code `K7M2`. **When** the Lobby is shown. **Then** the QR payload and the displayed address both equal `http://192.168.1.23:47831/j/K7M2`, neither contains `127.0.0.1` or `localhost`, and both update if another interface is chosen.

#### AT-PRES-006 End presenting
**Must · ui · Stage 2.** **Given** a Live Activity with one slide open and participants connected. **When** *End presenting* is chosen. **Then** the confirmation lists open slides and active participants with *Keep presenting* as default; on confirm the open slide is closed by its policy, its results are labelled incomplete, participants see "This activity has ended", the participant listener stops, and the Activity is saved.

#### AT-PRES-007 The participant listener exists only while Live
**Must · integration · Stage 2.** **Given** an idle Activity. **When** a socket listing is taken before Start, during Live, after End and after application exit. **Then** nothing listens before Start; during Live exactly one participant listener is bound to the chosen address (not `0.0.0.0`, not loopback); nothing listens after End or exit.

#### AT-PRES-008 No usable network interface
**Should · ui · Stage 2.** **Given** a computer with no usable interface. **When** Start presenting is opened. **Then** `NET_NO_INTERFACE` explains the problem, Start is disabled and manual address entry is offered.

#### AT-PRES-009 Incomplete slides are skipped with a warning
**Should · ui · Stage 2.** **Given** an Activity with one Incomplete slide among three. **When** presenting starts. **Then** the summary listed the skipped slide before Start, and navigation during Live omits it.

#### AT-PRES-010 The Activity is saved when Live ends
**Should · integration · Stage 2.** **Given** (a) a saved Activity, (b) a never-saved Activity, (c) a failing save. **When** presenting ends. **Then** (a) is saved; (b) prompts for Save As; (c) shows `FD-04` with the Activity left open and unsaved.

### 4.3 Joining

#### AT-JOIN-001 A phone scans the QR code and joins
**Must · manual · Stage 2.** **Given** a Live Lobby. **When** a phone scans the QR code. **Then** the page opens, the participant is admitted, and the Active count on the projector and in the Facilitator panel increases by one.

#### AT-JOIN-002 Invalid or expired join code
**Must · network · Stage 2.** **Given** a wrong or expired code. **When** the participant submits it. **Then** `join_code_invalid` is shown under the field ("That code isn't right or has expired"), the field keeps its text and focus, and wrong and expired codes produce the same message.

#### AT-JOIN-003 The landing page with a typed code
**Should · network · Stage 2.** **Given** the address without a code. **When** the participant opens it and types the code. **Then** the participant joins as in AT-JOIN-001.

#### AT-JOIN-004 The activity is full
**Must · network · Stage 2.** **Given** a participant limit of N and N admitted participants. **When** another phone joins. **Then** it is refused (`activity_full`, HTTP 200) with "This activity is full. Ask the facilitator."; the N admitted participants are unaffected.

#### AT-JOIN-005 An admitted participant reconnects at the limit
**Must · network · Stage 2.** **Given** the limit is reached. **When** an admitted participant's phone reconnects. **Then** it is not refused and is not counted twice.

#### AT-JOIN-006 Protocol mismatch asks for a refresh
**Should · network · Stage 2.** **Given** a page speaking an unsupported protocol version. **When** it joins or submits. **Then** `protocol_mismatch` (HTTP 400) leads to "Please refresh this page"; nothing is stored.

#### AT-JOIN-007 Join attempts are rate limited
**Should · network · Stage 2.** **Given** more join attempts from one address in a minute than the limit. **When** one more arrives. **Then** it is refused with `rate_limited` (HTTP 429); after the delay a join succeeds.

#### AT-JOIN-008 An unknown or expired token re-joins silently
**Must · network · Stage 2.** **Given** a browser holding a token the server does not know. **When** it requests its view. **Then** the server answers `unauthorized` (HTTP 401); the page re-joins once without showing an error and receives a new join number, unless the limit refuses it.

### 4.4 Responses

#### AT-RESP-001 A vote is accepted and acknowledged after commit
**Must · integration · Stage 2.** **Given** an open Poll and a commit delayed by fault injection. **When** a participant submits. **Then** no acknowledgement is sent before the commit completes; after it, the outcome is `accepted`, one response is stored, and the projector and Facilitator counters update.

#### AT-RESP-002 A duplicate retry returns the original outcome
**Must · integration · Stage 2.** **Given** an accepted submission. **When** the same `submission_id` and payload are sent again. **Then** the outcome is `duplicate` (HTTP 200) carrying the original acceptance, and the stored-response count does not change.

#### AT-RESP-003 A second, different answer is refused
**Must · integration · Stage 2.** **Given** a participant with an accepted answer under *one per participant*. **When** they submit a different answer with a new `submission_id`. **Then** it is refused with `already_answered` and the stored answer is unchanged.

#### AT-RESP-004 The same ID with a different payload
**Must · integration · Stage 2.** **Given** an accepted submission. **When** the same `submission_id` arrives with a different payload. **Then** it is refused with `id_conflict` and nothing changes.

#### AT-RESP-005 A submission after the slide closed
**Must · integration · Stage 2.** **Given** a closed slide with an Immediate close policy. **When** a participant who had not answered submits. **Then** it is refused with `closed` ("Responses are closed") and stored responses do not change.

#### AT-RESP-006 Accepting responses is switched off
**Must · integration · Stage 2.** **Given** an open slide with Accepting switched off. **When** a participant submits. **Then** it is refused with `not_accepting`; after the Facilitator switches Accepting on, a new submission is accepted.

#### AT-RESP-007 An oversized submission
**Must · network · Stage 2.** **Given** a request body above the size limit. **When** it is sent. **Then** the server answers 413 `too_large` without parsing it and stores nothing.

#### AT-RESP-008 An invalid option
**Must · network · Stage 2.** **Given** a payload naming an option that does not exist. **When** it is submitted. **Then** it is refused with `invalid` and nothing is stored.

#### AT-RESP-009 Submission rate limit
**Should · network · Stage 2.** **Given** more submissions per second from one participant than the limit. **When** one more arrives. **Then** it is refused with `rate_limited` (HTTP 429); retrying the same `submission_id` after a short delay is accepted or returns `duplicate`.

#### AT-RESP-010 A submission for a slide that is not current
**Must · network · Stage 2.** **Given** the Facilitator has moved to another slide. **When** a stale page submits for the old slide outside any grace window. **Then** it is refused with `not_current`.

#### AT-RESP-011 A submission when not Live
**Should · integration · Stage 2.** **Given** a Presentation that is ending. **When** a submission arrives before the listener stops. **Then** it is refused with `not_live`.

#### AT-RESP-012 A malformed request
**Should · network · Stage 2.** **Given** invalid JSON, a missing field or an unknown field. **When** it is sent. **Then** the server answers 400 `bad_request` and stores nothing.

#### AT-RESP-013 Storage failure during Live
**Must · integration · Stage 2.** **Given** a Live Poll and a full or read-only disk (fault injected). **When** a participant submits. **Then** the server answers 503 `storage_error`; nothing is acknowledged or stored; the Facilitator Workspace shows an alert; the participant sees "Something went wrong. Please try again."; after the fault clears, retrying with the same `submission_id` is accepted.

### 4.5 Reconnection

#### AT-RECON-001 Reconnect after submitting
**Must · manual and network · Stage 2.** **Given** a participant has answered a Poll and seen "Answer received". **When** the phone is locked for 30 seconds and unlocked. **Then** the page reconnects without user action and shows "You have already answered this" with their choice; the stored responses remain one; tapping another option is refused with `already_answered` and changes nothing.

#### AT-RECON-002 A lost acknowledgement
**Must · network · Stage 2.** **Given** a submission whose acknowledgement is dropped (fault injected). **When** the client times out and retries the same `submission_id`. **Then** the outcome is `duplicate`, the page shows "Answer received", and exactly one response is stored.

#### AT-RECON-003 A reconnect storm
**Should · network · Stage 2.** **Given** many simulated participants and an interruption that drops them all. **When** they reconnect. **Then** each receives the current view, some may be answered with `server_busy` and retry with jitter, reconnects are spread over time (not synchronised), no response is lost or duplicated, and submissions made meanwhile are not starved. Timing results are recorded under `QUALITY_AND_RELEASE.md` section 6.

#### AT-RECON-004 A phone is locked during a question
**Must · manual · Stage 2.** **Given** a participant mid-question. **When** the phone locks and the Facilitator moves to the next step. **Then** on unlock the page shows the current step, not the old one.

#### AT-RECON-005 A page refresh keeps identity and answer
**Must · network · Stage 2.** **Given** an answered participant. **When** the page is refreshed. **Then** the same join number is shown and the answer is still marked as given.

#### AT-RECON-006 Cookies are blocked
**Should · network · Stage 2.** **Given** a browser that blocks cookies. **When** it joins and answers. **Then** the token travels in the request header and WebSocket subprotocol, never in a URL, and everything works.

### 4.6 Projector, counters and network exposure

#### AT-PROJ-001 Opening the Projector view with a one-use link
**Must · integration · Stage 2.** **Given** a Live Activity. **When** *Open projector view* is used. **Then** the default browser opens the loopback address with a token, the server redirects to the token-less address, and the address bar and logs hold no token afterwards.

#### AT-PROJ-002 Reuse or expiry of the link is refused
**Must · integration · Stage 2.** **Given** a used or expired projector link. **When** it is opened. **Then** the server refuses it with a plain message ("This link has expired. Open the projector from the application."), and no view is served.

#### AT-PROJ-003 The projector reconnects
**Must · manual · Stage 2.** **Given** a Projector view whose connection to the application is interrupted. **When** the connection returns. **Then** a "reconnecting" overlay shows after the first failed attempt and disappears when the next view arrives; the page never sends a command.

#### AT-PROJ-004 Counters and the join area on every screen
**Must · ui · Stage 2.** **Given** the Projector view. **When** each screen (Lobby, question, results, closed) is shown. **Then** the Active count and the join address with QR code are present on every one.

#### AT-CNT-001 The counters
**Must · integration · Stage 2.** **Given** 31 connected participants, 28 of whom answered, and 48 responses stored including earlier Presentations. **When** the counters are shown. **Then** they read Active 31, Answered 28 / 31 active and "48 responses stored"; when stored equals answered the stored indicator is hidden; a participant disconnecting lowers Active but not Stored.

#### AT-NET-001 Facilitator routes do not exist on the participant listener
**Must · network · Stage 2.** **Given** a Live Activity. **When** paths such as `/api/facilitator/state`, `/projector` and `/ws/projector` are requested on the participant listener. **Then** each returns 404, not 401 or 403.

#### AT-NET-002 Binding exposure
**Must · integration · Stage 2.** **Given** a Live Activity. **When** the operating-system socket listing is read. **Then** the participant listener is bound only to the chosen address, the projector listener only to `127.0.0.1`, and nothing is bound to `0.0.0.0`.

#### AT-NET-003 No external requests
**Must · network · Stage 2.** **Given** a computer with no internet access. **When** a full Presentation is run with the Projector view and a phone. **Then** every page loads completely, and a capture of outgoing requests shows no request to any host other than the application's own.

### 4.7 Interface behaviour (Stage 1 and Stage 2)

#### AT-UI-001 Workspace regions and tabs
**Must · ui · Stage 2.** **Given** two open Activities. **When** the Workspace is shown. **Then** menu, tabs, top bar, slide sidebar, canvas, Preview pane, Inspector and status bar are present and labelled; switching tabs keeps each tab's state; a dirty tab has a marker with text "unsaved changes".

#### AT-UI-002 A disabled control shows its reason
**Must · ui · Stage 2.** **Given** the disabled controls of Stage 1 and 2 (Preview on an Incomplete slide, Save when clean, Start with no interface, Reset this slide while current). **When** each is focused or hovered. **Then** it is visible (not hidden) and its reason is available as tooltip and as accessible description.

#### AT-UI-003 A keyboard-only workflow
**Must · ui · Stage 2.** **Given** only a keyboard. **When** the user creates an Activity, adds and completes a Poll, saves, and starts presenting. **Then** every step is reachable, focus is always visible, there is no trap, and focus returns to the opening control after each dialog.

#### AT-UI-004 Enter never confirms a destructive action
**Must · ui · Stage 2.** **Given** the discard-recovery, delete-slide-with-responses and take-over confirmations. **When** Enter is pressed on opening. **Then** the safe choice is selected and nothing destructive happens.

#### AT-UI-005 The error dialog is layered
**Must · ui · Stage 2.** **Given** a forced `FILE_SAVE_DISK_FULL`. **When** the dialog appears. **Then** a friendly message and next action are visible, Details is collapsed and holds the code and a copy button, only the file name (not the path) is shown until expanded, and no secret appears.

#### AT-UI-006 Start presenting validation
**Must · ui · Stage 2.** **Given** the Start presenting dialog. **When** the limit is `0` or not a number. **Then** an inline message appears beneath the field, Start is disabled, and Enter does nothing; with a valid limit Enter starts.

#### AT-UI-007 The Network Check flow
**Should · ui · Stage 2.** **Given** Network Check. **When** it runs with no device, then with a device. **Then** it shows "Waiting for a device…", then the device's round-trip time and "Test answer received"; after the timeout with no device the troubleshooting sequence appears.

#### AT-UI-008 The Live panel
**Must · ui · Stage 2.** **Given** a Live Activity. **When** the Live panel is shown. **Then** it has every control and counter in `FD-07`; counters are a polite live region; *Reset this slide* is disabled for the current slide with its reason; *End presenting* opens its confirmation.

#### AT-UI-009 The projector Lobby
**Must · ui · Stage 2.** **Given** the Lobby. **When** it is shown. **Then** the complete join address in large type, the QR code and the Active count are visible, and there are no interactive elements.

#### AT-UI-010 The phone screens and states
**Must · ui · Stage 2.** **Given** the Poll screen and every system state in `PP-03`. **When** each is shown. **Then** its intended message appears, option buttons are at least 44 × 44 CSS pixels, and the connection indicator has text.

#### AT-UI-011 Screen-reader support on the phone page
**Should · manual · Stage 2.** **Given** a screen reader. **When** a Poll is answered. **Then** the question and options are labelled controls, "Answer received" is announced, and the countdown is announced only at thresholds, not every second.

#### AT-UI-012 Projector legibility
**Should · manual · Stage 2.** **Given** the Projector view at 1280 × 720. **When** it is viewed from the back of a room. **Then** text meets the theme's minimum size, contrast is at least 4.5:1, bars carry text labels, and nothing is conveyed by colour alone.

#### AT-UI-013 The recovery prompt
**Must · ui · Stage 1.** **Given** a leftover working directory. **When** the prompt appears. **Then** it shows the Activity name, when it was last active, the number of committed responses and whether journaled edits exist; *Recover* is default; *Decide later* and *Discard* are offered; it states that answers in flight at the crash cannot be known and that Live is not resumed.

#### AT-UI-014 The lock-conflict dialog
**Must · ui · Stage 1.** **Given** a locked file. **When** the dialog appears. **Then** it shows holder, host, process, time acquired and last activity; *Open read-only* is default; *Take over* is separate, labelled with the risk and needs a second confirmation.

#### AT-UI-015 Slide sidebar interactions
**Should · ui · Stage 2.** **Given** three slides. **When** a slide is reordered by drag and by Alt+Up/Down, duplicated, and deleted. **Then** each works; deleting a slide without responses needs no confirmation and is undoable; deleting one with responses asks, naming how many will be deleted.

#### AT-UI-016 Poll editor validation
**Must · ui · Stage 2.** **Given** the Poll editor. **When** a required field is empty or too long. **Then** an inline message appears beneath it, focus stays, input is never cleared, a summary links to each problem, and messages are announced to assistive technology.

#### AT-UI-017 The Preview pane
**Should · ui · Stage 2.** **Given** the Preview pane. **When** it is used. **Then** it always shows "Preview: nothing is stored", its phone panel is operable by keyboard, and closing it discards everything.

#### AT-UI-018 The End presenting confirmation
**Must · ui · Stage 2.** **Given** a Live Activity. **When** *End presenting* is chosen. **Then** the confirmation lists open slides and active participants, says results of open slides will be labelled incomplete and the Activity will be saved, and *Keep presenting* is the default.

#### AT-UI-019 The landing and join page
**Must · ui · Stage 2.** **Given** the participant landing page. **When** a wrong code is entered. **Then** the message appears beneath the field, the field keeps its text and focus, and a privacy line about what is collected in this join mode is visible.

#### AT-UI-020 Projector states
**Should · ui · Stage 2.** **Given** the Projector view. **When** the Facilitator blanks, freezes, or ends the Presentation, or the connection drops. **Then** the matching state is shown with plain text: Blank shows only the join corner; Frozen shows a small "paused" mark; Ended shows "This activity has ended"; reconnecting shows the overlay.

#### AT-UI-021 The unsaved-changes prompt
**Must · ui · Stage 1.** **Given** unsaved changes. **When** the tab or application is closed. **Then** the prompt "Save changes to <name>?" offers Save (default), Don't save and Cancel; Enter never selects Don't save.

## 5. Stage 3 scenarios written now

These runs start in Stage 3. They are written now because they were requested as worked examples or because earlier scenarios depend on them.

#### AT-DATA-001 The Facilitator tries to edit a slide with stored responses
**Must · ui · Stage 3.** **Given** a Poll with 48 stored responses. **When** the Facilitator tries to change the question, an option, the response rule or the close policy (by typing, pasting or any keyboard action). **Then** each locked field shows a lock icon and "Reset this slide's data to edit this field" (`SLIDE_LOCKED_BY_RESPONSES`) and cannot be changed; theme, speaker notes, slide order and "Show on participant devices" remain editable; *Duplicate slide* (without data) and *Save a Copy Without Responses* are offered as ways to fix a mistake.

#### AT-DATA-002 A Live Activity's editor is read-only
**Must · ui · Stage 3.** **Given** a Live Activity. **When** the Facilitator tries to add, delete, reorder or paste a slide, or edit slide content. **Then** each is refused with the reason "Editing is locked while Live"; only theme, speaker notes and "Show on participant devices" can change; other open Activities remain editable.

#### AT-RESP-014 A grace period accepts an in-flight answer
**Must · integration · Stage 3.** **Given** a slide with a grace close policy whose timer has expired (Closing). **When** a submission arrives inside the grace window and another after it. **Then** the first is accepted; the second is refused with `closed`; results finalised at the end of the grace window do not change afterwards.

#### AT-NET-004 The network interface changes while Live
**Must · manual · Stage 3.** **Given** a Live Activity and the chosen interface goes away or changes address. **When** the change is detected. **Then** everything committed is kept; the Facilitator sees a warning (`NET_INTERFACE_CHANGED`) and the projector says participants may need to rejoin; the app never switches networks silently; after the Facilitator confirms an interface the new QR code and address appear; participants reconnect by scanning; the change is recorded in the event log.

#### AT-RECON-007 A Reset clears participant records and phones rejoin
**Should · integration · Stage 3.** **Given** admitted participants, a finished Presentation and a Reset of the entire Activity. **When** presenting starts again and the old phones reconnect. **Then** their requests are answered `unauthorized` (HTTP 401), each page re-joins without showing an error and receives a new join number.

#### AT-RESET-001 Resetting a slide makes a safety copy first
**Must · integration · Stage 3.** **Given** a closed slide that is not current, with 48 stored responses. **When** *Reset this slide* is confirmed. **Then** the confirmation named the counts and offered export first; a safety copy exists before anything is deleted; afterwards the slide has zero responses; Undo does not restore them; other slides are unchanged; the event log records the Reset (counts only).

## 6. Scheduled scenarios

Written in full just before the stage named. IDs are reserved now so that references cannot drift.

| ID | Title | Priority | Stage | Covers |
|---|---|---|---|---|
| AT-FILE-015 | An older-format file is upgraded in the working copy only | Must | format 2 | migrations, golden files |
| AT-FILE-032 | Save As an older format with a compatibility check | Must | format 2 | `SCHEMA_GOVERNANCE.md` section 7 |
| AT-DATA-003 | Duplicate a slide without data | Should | 3 | |
| AT-DATA-004 | Paste a slide between Activities makes a deep copy | Must | 3 | |
| AT-DATA-005 | Save a Copy and Save as Template semantics | Must | 3 | new Activity ID, empty event log |
| AT-RESET-002 | Reset the entire Activity | Must | 3 | |
| AT-RESET-003 | Reset is unavailable while Live or Recovered | Must | 3 | |
| AT-RESET-004 | A failed safety copy stops the Reset until the Facilitator decides | Must | 3 | |
| AT-RESET-005 | Only the newest safety copies are kept | Should | 3 | |
| AT-EVENT-001 | Event log entries are written and survive a Reset | Should | 3 | |
| AT-PRES-011 | A suspend or clock jump pauses timers until the Facilitator resumes | Must | 3 | |
| AT-IDEN-001 | Duplicate display names are allowed and disambiguated | Must | 4 | |
| AT-IDEN-002 | A name correction keeps identity and history | Must | 4 | |
| AT-IDEN-003 | Hide name replaces it on the projector | Should | 4 | |
| AT-IDEN-004 | Removing a participant refuses their token (`removed`) | Must | 4 | `removed` |
| AT-QUIZ-001 | The correct answer is never sent before Reveal | Must | 4 | |
| AT-QUIZ-002 | Scoring is deterministic and reproducible | Must | 4 | |
| AT-QUIZ-003 | No answer and incorrect are reported separately | Must | 4 | |
| AT-QUIZ-004 | A Quiz Question cannot be re-opened after Reveal | Must | 4 | |
| AT-QUIZ-005 | Reveal timing options | Should | 4 | |
| AT-QUIZ-006 | Resetting a Quiz Question changes leaderboard totals and says so | Must | 4 | |
| AT-QUIZ-007 | Quiz settings are locked once responses exist | Must | 4 | |
| AT-ROST-001 | Roster import and re-import conflicts | Must | 5 | |
| AT-ROST-002 | Roster limits while responses exist | Must | 5 | |
| AT-ROST-003 | Generated PINs are unique and filtered | Must | 5 | |
| AT-ROST-004 | The credential sheet | Should | 5 | |
| AT-AUTH-001 | Known and unknown IDs give the same refusal (`credentials_invalid`) | Must | 5 | `credentials_invalid` |
| AT-AUTH-002 | One active login per ID (`id_in_use`) and Release | Must | 5 | `id_in_use` |
| AT-AUTH-003 | Lockout applies to unknown IDs too (`locked_out`) | Must | 5 | `locked_out` |
| AT-AUTH-004 | Device binding | Should | 5 | |
| AT-AUTH-005 | The PIN never appears on the wire or in logs | Must | 5 | |
| AT-ANON-001 | An Anonymous slide stores no name or ID | Must | 5 | |
| AT-MOD-001 | Unapproved items are never shown | Must | 6 | |
| AT-MOD-002 | An item can be hidden after it was shown | Should | 6 | |
| AT-MOD-003 | Hostile text is escaped on every screen | Must | 6 | |
| AT-MOD-004 | Long, emoji and bidirectional text render safely | Should | 6 | |
| AT-REPORT-001 | The provenance block | Must | 7 | |
| AT-REPORT-002 | Incomplete results are labelled | Must | 7 | |
| AT-REPORT-003 | Spreadsheet formulas are neutralised in every export | Must | 7 | |
| AT-REPORT-004 | Denominators are stated | Should | 7 | |
| AT-REPORT-005 | Anonymous slides never appear with names | Must | 7 | |
| AT-PROT-001 | A wrong password and a damaged file give one message | Must | 7 | `FILE_PASSWORD_OR_DAMAGED`, `VAL-P-001` |
| AT-PROT-002 | Set, change and remove a password round-trips | Must | 7 | |
| AT-PROT-003 | No plaintext appears in temporary files | Must | 7 | |
| AT-PROT-004 | Safety copies and `.bak` keep protection | Should | 7 | |
| AT-DIAG-001 | The diagnostic report contains no secrets | Must | 7 | |

## 7. The worked examples that were requested

| Requested example | Scenario |
|---|---|
| Save fails because the disk is full | `AT-FILE-002` |
| A file is already open | `AT-LOCK-001` (and `AT-TAB-002` within one instance) |
| A participant reconnects after submitting | `AT-RECON-001` |
| The Facilitator tries to edit a slide with stored responses | `AT-DATA-001` |
