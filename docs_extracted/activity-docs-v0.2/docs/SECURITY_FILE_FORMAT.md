# Security, File Format and Data Integrity

**Status:** design, with draft Stage 1 artefacts. Statements about third-party library behaviour are assumptions until `VERIFIED_VS_ASSUMED.md` says otherwise. **Field lists, limits and codes are not repeated here**: they live in the canonical artefacts (`SCHEMA_GOVERNANCE.md`) and the generated tables in `reference/`. Numeric limits are cited by ID (`LIM-...`); their values and status are in `reference/limits.md`.

## 1. Scope and trust boundaries

- The Facilitator owns the computer. Local operating-system access is a trust boundary we do not defend against beyond sensible handling of working files (section 4).
- **Participant browsers are untrusted.** Every input, timing, identity, capacity, visibility and scoring rule is checked on the server.
- **`.actvty` files received from others are untrusted input** until validated (section 5).
- The local network is **not** confidential. The participant listener uses plain HTTP; other devices on the same network can read traffic. The manual says so and advises a Facilitator-controlled network.
- Nothing is executed from Activity files, rosters or participant input.

## 2. Container layout

An Activity is a **standard ZIP archive** with the extension `.actvty`. All entry names are generic.

| Entry | Content | Defined by |
|---|---|---|
| `manifest.json` | Identity, versions, slide order, required slide types, media index | `schema/manifest.schema.json` |
| `theme.json` | Colours and fonts | `schema/theme.schema.json` |
| `settings.json` | Activity-wide settings | `schema/settings.schema.json` |
| `roster.json` | Optional roster, present only if the manifest says so (Stage 5) | written before Stage 5 |
| `slides/<id>.json` | One file per slide | `schema/slide.schema.json` plus the type's content schema |
| `media/<id>.<ext>` | Images (`png`, `jpg`, `webp`, `gif`) | media index in the manifest |
| `data.db` | A single-file SQLite snapshot of runtime data, **always present** | `schema/migrations/` |

No other entries are allowed. SVG and any format that can carry script are not accepted in version 1.

Design points that the schemas cannot show:
- **Slide order is the order of the manifest's slide list.** There is no separate order that could disagree.
- `activity_id` is a random identifier created with the Activity. **Save As, Save a Copy Without Responses and Save as Template assign a new one**, so copies never inherit participant identities or tokens. Ordinary Save keeps it. It names the working directory and the participant cookie.
- `data.db` holds participants, responses, anonymous-duplicate keys, per-slide runtime state (including the per-slide duplicate-key salt) and the event log. Its tables are defined only by the migrations. An Activity that has never been presented holds only the metadata table.
- Text is UTF-8. Identifiers are plain ASCII.
- Limits on slide count, name length, notes, media and entry sizes are in the registry (`LIM-ACTIVITY-*`, `LIM-SLIDE-*`, `LIM-FILE-*`).

## 3. Event log

A small append-only table inside `data.db` (added by a Stage 3 migration): Presentation started/ended/interrupted, recovery or discarded recovery, Reset (scope and counts only), slide deleted with stored responses, slides skipped as incomplete, *Accepting responses* re-opened, interface changed, participant removed (count only), suspend or clock jump, report exported.

- It contains **no names, no response content, no tokens and no PINs.**
- A new Activity made by Save As, Save a Copy or Save as Template starts with an **empty** event log plus its own creation entry.
- It survives a Reset (it records the Reset). Reports describe only data since the last Reset and state that date.
- It is what lets a report say how many Presentations contributed (`PRODUCT_SPEC.md` section 17).

## 4. Working directory, saving and recovery

### 4.1 Opening
1. Acquire the lock (section 12), or open a read-only view.
2. Validate the file (section 5).
3. Unpack into a private **working directory** under the application data directory, readable only by the current user (owner-only permissions on Linux; the user-profile ACL on Windows, to be verified). The live `data.db` is used there with write-ahead logging.
4. Apply migrations to the working copy if needed (section 6).

Large media makes opening slower because everything is unpacked; lazy unpacking is a later optimisation.

### 4.2 Autosave journal
Authoring changes are journaled into the working directory (a `.working` copy of the authored files) a short time after each edit (`LIM-OPS-JOURNAL-DEBOUNCE-S`), so a crash does not lose them. This is **not** Save; the file on disk changes only on Save and when Live ends.

### 4.3 Saving
1. Verify we still own the lock and the target is still the file we opened (section 12). If not, stop; nothing is changed.
2. Write a consistent snapshot of the database using the SQLite backup mechanism (never copy a live database file), and run an integrity check on it.
3. Write all entries to a temporary file in the **same directory** as the target, with a random name. Flush it to disk.
4. **Verify the new package:** re-open the temporary file and apply every file rule (rule `VAL-S-001`). If it fails, delete it, change nothing, and report `FILE_SAVE_VERIFY_FAILED`.
5. Re-verify lock ownership immediately before replacing (time-of-check to time-of-use guard).
6. Copy the existing target to `<name>.actvty.bak` (one generation) and flush.
7. Replace the target atomically with the platform primitive (rename on Linux; replace-file semantics on Windows). On Windows, antivirus or indexing may briefly hold the file; retry with backoff; failure leaves the original intact. *This Windows behaviour is assumed until tested.*
8. Flush the directory, clear the dirty flag, update the identity record.
9. On **every** error path, delete the temporary file we created and leave the original untouched. A failed save never damages the last good file. A full disk is reported as `FILE_SAVE_DISK_FULL`, a read-only folder or missing permission as `FILE_PERMISSION_DENIED`, anything else as `FILE_SAVE_FAILED`.

**Permissions.** Activity files, `.bak` files, safety copies and temporary save files are created with the operating system's **default permissions** so that other users of the computer can open them where the folder allows (on both Windows and Linux). Replacing an existing file keeps its permissions. This means an Activity file, which may contain a roster and responses, can be readable by other local users; the manual says so and points to optional file protection (section 7). The **working directory** is different: it is a private temporary area, not a document, and stays owner-only.

### 4.4 Closing
Close releases the lock only after positively verifying we own it, then deletes the working directory. Deletion is ordinary file removal, **not secure erasure**; the manual says so.

### 4.5 Recovery after an unexpected exit
On start, the app scans the working-directory area. A directory whose owner is not running is offered for recovery:
- **Recover** (default): reopens the Activity from the working directory, including committed responses and journaled authoring changes, and marks it Recovered until the Facilitator saves or discards.
- **Discard:** asks for confirmation and states how many committed responses will be lost.
- Recovery does **not** resume the Live state, and it never claims to restore answers that were not committed. A crash can leave plaintext working data on disk, even for a protected file, until it is recovered or discarded.
- Directories are never deleted automatically unless the Facilitator chose Discard.

## 5. Validating untrusted `.actvty` files

Before anything is unpacked into the working directory, every rule in `reference/validation-rules.md` that applies to a file is checked, in this order: container rules (`VAL-C-*`), manifest rules (`VAL-M-*`), cross-file rules (`VAL-X-*`), database rules (`VAL-D-*`). The rules and the error code each raises are defined only in `schema/validation-rules.json`. Design points:

- **Limits are enforced while reading**, not only from declared sizes (`LIM-FILE-MAX-*`).
- **Unknown fields are rejected, not ignored**, in every JSON structure. This is what makes a newer file safe to refuse.
- Names are validated before anything is written to disk; nothing is extracted to a path derived from an entry name (the working directory uses our own names).
- Media is checked by real content (magic bytes), size and SHA-256, never by extension.
- **The database is opened defensively:** read-only first, `trusted_schema` off, no extension loading, no attached databases; the schema must match the expected tables exactly; triggers, views and virtual tables are refused; the application identifier, `user_version` and an integrity check are verified.
- Participant-entered and author-entered text is data: escaped on display and in exports. Nothing in the file is run.
- A file that fails validation is refused with a clear message and a technical details view; nothing is partially opened. The failed file is not modified.
- A file that uses slide types this application does not know opens **read-only and cannot be saved over** (`FILE_OPEN_READ_ONLY_UNKNOWN_TYPE`); *Save As* an independent copy is offered.

A **prototype validator** (`tools/reference_validator.py`) implements most of these rules against a golden file and crafted bad files, to prove they are implementable and testable. It is not product code; the product re-implements the same rules in Rust.

## 6. Versioning and migration

The numbering, bump rules, strictness, migration rules, golden files and saving for older versions are specified once, in `SCHEMA_GOVERNANCE.md` sections 6 to 8. Security-relevant points:

- A newer `format_version` or `data_schema_version` than the application supports is **refused**; the application never guesses.
- Upgrades run in the working copy only; the saved file changes only on Save.
- Migrations run in one transaction; a failure changes nothing (`MIGRATION_FAILED`).
- Saving for an older version (from the second format onward) always goes through a compatibility check and produces a new, independent Activity. It never modifies the source.

## 7. Optional file protection

Protection is optional, like a Word or Excel password.

**Design.** A protected Activity is the same zip archive with **every entry encrypted with AES-256** using the zip format's AES mode (through the `zip` crate, if that crate's current version supports writing it; to be verified when the dependency is pinned). Entry names remain generic. A protected file is detected from the archive's encryption flags.

**Honest properties:**
- It protects contents against casual access when the file is lost or shared. It is **protected only while the file is closed**. While open, the working directory is plaintext on disk (section 4).
- The zip AES format derives its key with a fixed, modest key-stretching setting. **A weak password can be guessed quickly if someone obtains the file.** The app shows a password-strength hint, but cannot enforce strength.
- Each entry is authenticated, but the archive structure is not. Someone without the password could delete or swap entries, causing damage but not disclosure.
- Entry sizes, entry count and their (generic) names remain visible.
- **A lost password cannot be recovered.** There is no backdoor and no key escrow.

**Behaviour.**
- *Set password*: typed twice, with the no-recovery warning shown prominently before confirming. *Change password* and *Remove protection* rewrite all entries.
- *Opening*: asks for the password. A wrong password and a damaged file produce **the same message** (`FILE_PASSWORD_OR_DAMAGED`).
- The password is held in memory while the Activity is open so that Save can re-protect the file, and is overwritten (zeroized) on close where the platform allows.
- Safety copies and `.bak` files keep the file's protection. The temporary file used in a save is created protected.
- Rate limiting on repeated wrong passwords in the UI is a courtesy only; it does not stop offline guessing.

**Required tests:** `QUALITY_AND_RELEASE.md` section 4.5.

## 8. Backups, safety copies and corruption

- **`.bak`:** the previous saved version, one generation, beside the file (section 4.3).
- **Safety copy before Reset.** Every Reset (slide or Activity) first writes a full copy of the **current working state, including unsaved changes,** into a `<name>.backups` folder beside the file, named with date and time, and keeps the newest `LIM-OPS-SAFETY-COPIES-KEPT`. An Activity that has never been saved has no folder beside it, so its safety copy goes into a `backups` area of the application data directory. The Reset proceeds only if the copy succeeded; if it failed, the Facilitator is told and chooses whether to continue. Safety copies contain participant data; the manual says so and tells the Facilitator how to delete them. They follow the default-permissions rule (section 4.3).
- **Corruption detection.** If a file fails validation or its database fails an integrity check, the app says what failed and offers, in order: restore from the `.bak` (`FILE_CORRUPTED_RESTORE_AVAILABLE`), restore from the newest safety copy, or open read-only what can be read. It never overwrites the damaged file without an explicit choice.
- **Not in version 1:** automatic scheduled backups to a chosen folder, and encrypted backups. Backups made by copying files are as sensitive as the Activity itself.

## 9. Roster and PIN login

### 9.1 Roster
A roster lives in `roster.json`. Import from CSV, Excel or a pasted grid. Columns: `user_id` (required, unique, `LIM-ID-USER-ID-MAX-CHARS`), `display_name` (required, `LIM-ID-DISPLAY-NAME-MAX-CHARS`), optional `pin`. At most `LIM-ID-ROSTER-MAX-ROWS` rows.

- Uniqueness of `user_id` is checked after Unicode normalisation and case folding.
- A **re-import** reports conflicts (matching `user_id`) and lets the Facilitator skip or update each.
- **While responses exist** the roster is limited: rows can be **added**; display names can be edited; PINs can be regenerated; rows **cannot be deleted**, `user_id` cannot be changed, and the roster cannot be removed. *Reset* lifts the limits. (This also governs re-import.)
- A source file with plaintext PINs triggers a warning that the source file itself is sensitive.

### 9.2 PINs
- If the import has no PIN, the app generates one per participant, shaped like `zogo-4821`: a consonant–vowel–consonant–vowel word from consonants `b d f g h j k l m n p r s t v z` and vowels `a e i o u`, then four digits `2` to `9`. That is 6,400 words × 4,096 digit groups = 26,214,400 combinations, about **24.6 bits** (`V-001` in the ledger). Generated PINs are unique within the roster and pass an offensive-word filter.
- PINs are case-insensitive, the hyphen and spaces are optional. A Facilitator may set a custom PIN of at least `LIM-ID-PIN-CUSTOM-MIN-CHARS` characters; input is bounded by `LIM-ID-PIN-MAX-CHARS`.
- A printable and CSV **credential sheet** is produced at generation time only. It contains the plaintext PIN and is sensitive. The app does not keep plaintext PINs and cannot show them again; *Regenerate* issues a new one.
- Stored per participant: a random 16-byte `salt` and `verifier = SHA-256(salt ‖ normalised PIN)` (the "light hash").

### 9.3 Login protocol (challenge–response)
The PIN is never sent over the network. The exact messages are in `PROTOCOL_SPEC.md` (written before Stage 5); the design is:
1. The phone asks for a challenge for a `user_id`. The server returns the participant's `salt` and a random 128-bit **nonce** (single use, memory only, lifetime `LIM-AUTH-NONCE-TTL-S`). For an unknown `user_id` the server returns a **deterministic fake salt** (an HMAC of the ID under a per-Presentation secret), so unknown and known IDs look alike.
2. The phone computes `v = SHA-256(salt ‖ normalised PIN)` and `proof = HMAC-SHA-256(key = v, message = nonce ‖ user_id)` using a small bundled JavaScript implementation (the browser's built-in cryptography is unavailable on plain HTTP; `NETWORKING_AND_DEPLOYMENT.md` section 8).
3. The server recomputes the proof from the stored verifier (or a fake one), compares in constant time, and consumes the nonce.
4. On success the server issues a participant token bound to that Participant ID.

**Honest limits.** This deters casual snooping on the network; it does not stop a determined attacker. A passive observer who records the salt, nonce and proof can attempt offline guesses against a ~25-bit PIN. Anyone with the Activity file holds verifiers that act as the secret for this protocol, so a roster-bearing file should be protected if it is shared. The real defences are the layers below.

### 9.4 Anti-impersonation layers (all in version 1)
1. **Facilitator-issued PINs** that learners cannot guess for a classmate.
2. **One active login per ID.** A second login for an ID that is already connected is refused (`id_in_use`), and the Facilitator sees a flag. The Facilitator can **Release** the ID for a learner who changed phones.
3. **Device binding.** A browser already authenticated as one ID that tries another is refused and flagged. Release lifts it (shared phones).
4. **Rate limiting and lockout.** After `LIM-AUTH-LOCKOUT-THRESHOLD` failed attempts for an ID within `LIM-AUTH-LOCKOUT-WINDOW-MIN` minutes, that ID is locked for `LIM-AUTH-LOCKOUT-FIRST-S` seconds, doubling up to `LIM-AUTH-LOCKOUT-MAX-MIN` minutes. **The counter is keyed on the ID string, whether or not the ID exists,** so the lockout cannot reveal who is on the roster. There is also a per-device limit (`LIM-AUTH-DEVICE-FAILURES`).
5. **Visible joined list.** Names appear in the Lobby and the Facilitator panel as people join, so a real participant sees if someone has taken their ID.

Failed attempts always show the same message (`credentials_invalid`), with timing kept the same for known and unknown IDs.

## 10. Participant tokens, input hygiene and exports

**Participant tokens**
- 128 bits or more from the operating system's random generator. The server stores only a **hash** of each token.
- Delivered as an `HttpOnly`, `SameSite=Lax` cookie on the participant origin, named with the Activity's short identifier (cookies are not isolated by port, so two Activities must not collide). It lasts `LIM-AUTH-PARTICIPANT-TOKEN-DAYS` days so that re-presenting the same Activity recognises the same browser. Two unrelated Activities never share a token.
- **If cookies are unavailable**, the token is kept in `sessionStorage` and sent in a request header (and as a WebSocket subprotocol), never in a URL. *Browser behaviour is to be verified.*
- Tokens never appear in URLs, QR codes, logs, the projector, exports, diagnostic reports or error messages.

**Join code.** `LIM-ID-JOIN-CODE-CHARS` characters from an alphabet without look-alikes (no I, L, O, 0 or 1), generated from the random generator, new for each Presentation, valid only while Live. Attempts are rate limited. Wrong and expired codes give the same message (`join_code_invalid`).

**Listener checks.** The participant listener accepts only its own `Host`, and checks `Origin` on every state-changing request and WebSocket handshake. The projector listener accepts only loopback hosts and origins.

**Input bounds and abuse limits.** Every field, request and message has a bound in the registry (`LIM-CONTENT-*`, `LIM-ID-*`, `LIM-NET-*`). Oversized input is refused with a reason (`too_large`), never silently truncated.

**Exports**
- CSV: text cells beginning with `=`, `+`, `-`, `@`, tab or carriage return are prefixed with an apostrophe. Numeric columns are not altered.
- XLSX: text is always written as a string cell, never a formula.
- HTML: all participant and author text is escaped.
- Tests use hostile names and answers (for example formulas and markup) and check every export format.

## 11. Information that must never leave the application

Participant tokens, PINs, the roster verifiers, per-Presentation secrets, anonymous-duplicate salts and the optional file password never appear in logs, diagnostic reports, error text, the projector or any export. A test searches logs and exports for known test values.

## 12. Locking

Locking is **cooperative protection on local disks only**. It is not a security control and not absolute (section 12.6).

### 12.1 Lock file
`<name>.actvty.lock`, visible, beside the file. JSON with: `version`, `lock_id`, `instance_id` (one per running application instance), `pid`, `hostname`, `username`, `app_version`, `acquired_at`, `file_id` (best-effort identity of the target). The process details are **diagnostics only**.

### 12.2 Acquiring
- Create the lock file with a single **exclusive-create** operation, then write and flush the complete JSON. A lock that is not completely written is not acquired.
- If creation fails because the file exists, read it. If it carries our own `lock_id` and `instance_id`, treat it as ours. Otherwise it is a **conflict**.
- A lock file that is partial, unparseable or unreadable is also a conflict. **It is never deleted or overwritten automatically.**

### 12.3 Conflict dialog
The Facilitator is shown who holds the lock (host, user, process, time acquired, and last activity as a diagnostic), and chooses: **Open read-only**, **Open an independent copy**, **Cancel**, or **Take over**. Take over is explicit, warns that changes may be lost if another instance is really using the file, and is never automatic. **A process that appears to be dead does not authorise an automatic take-over** (process identifiers can be reused). While a lock is held, the app refreshes the lock file's modification time every `LIM-OPS-LOCK-REFRESH-S` seconds so the dialog can say "last active 14 minutes ago".

### 12.4 Read-only view and independent copy
A **read-only view** holds no lock, rejects every mutation and Save to the original in the core (not only in the interface), and may be dirty in memory. **Save As to a different name** creates an **independent copy** with its own lock. Saving over the locked original is refused in every case.

### 12.5 Save As
- **To a new path:** write the package to a temporary file, then acquire the destination lock by exclusive creation (reserving it), then re-check ownership and install atomically. The source document and its lock are kept until all of this succeeded.
- **To an existing unlocked path:** record its identity, write the temporary package, acquire the destination lock **before** replacing, re-verify the lock and the identity immediately before replacing, make the `.bak`, then replace. If anything changed or cannot be verified, refuse and roll back (remove only a lock this instance created and still owns).
- If safe reservation or replacement cannot be guaranteed, the overwrite is refused.

### 12.6 Guarantee boundaries
- Not protected: an operating-system file manager deleting or replacing the file or lock, another program editing the file, or hard links (two names for one file can carry separate locks). Where identity cannot be established the app says so instead of claiming protection.
- **Network shares and cloud-synchronised folders are not supported for locking guarantees** (exclusive creation and atomic replacement behave differently there, and sync clients make conflicted copies). The app warns when it recognises a likely cloud-sync or network location. Removable drives can be unplugged mid-save; the save rules keep the original intact, and locks may be left behind (handled by 12.3).
- If the target is missing or changed externally at save time, the save is refused (`FILE_TARGET_CHANGED`), never silently recreated. A missing lock at save time is `FILE_LOCK_LOST`.
- If the filesystem's guarantees are uncertain, the app fails safely and offers read-only or cancel.

## 13. Reset and recovery rules (data safety)

- Entire-Activity Reset is unavailable while Live; slide Reset while Live only for a closed slide that is not current; neither while a Recovered state is unresolved (`PRODUCT_SPEC.md` section 9).
- A safety copy is made before every Reset (section 8).
- No path in the application silently discards unfinalised or committed responses. Recovery states how many committed responses it restored and does not claim to restore uncommitted ones.

## 14. Known limitations of this design

- Plain HTTP on the local network; no traffic confidentiality.
- ~25-bit PINs; offline guessing is feasible if verifiers are obtained.
- Anonymous responses are not strictly untraceable.
- Protected files depend on password strength; plaintext working directory while open and after a crash.
- Activity files are created with default permissions and may be readable by other local users.
- Locking is cooperative; unsupported on network and cloud-sync locations.
- Windows behaviour (atomic replace, permissions) is unverified.

## 15. Where participant data can exist

Participant names, answers and (in roster mode) IDs and verifiers can exist in more places than the Activity file. The manual lists these and says how to remove each:

| Location | Contains | Removed by |
|---|---|---|
| The Activity file | Roster, responses, participant records, event log (no personal data) | Reset (responses and participant records); deleting the file |
| The `.bak` file | The previous saved version | Deleting it |
| Safety copies (`<name>.backups`, or the application data area) | Full copies made before Resets | Deleting them (the app lists them) |
| The working directory | An unpacked, **unprotected** copy while open, and after a crash until recovered or discarded | Closing normally; Discard; manual deletion (ordinary deletion, not secure erasure) |
| Exports (CSV, XLSX, HTML) | Names and answers as exported | Deleting the files |
| Credential sheets and source roster files | Names, IDs and plaintext PINs | Deleting them; the app cannot track copies |
| Logs and diagnostic reports | **No** names, answers, tokens or PINs by design (tested) | Not applicable |

The product makes **no claim of compliance** with any privacy or data-protection regulation. The Facilitator remains responsible for lawful, proportionate use, for telling participants what is collected, and for deleting data when it is no longer needed.
