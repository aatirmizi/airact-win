# Product Specification: Functional Requirements and User Experience

**Status:** design. Terms are defined in `GLOSSARY.md`. Decisions and their status are in `DECISIONS.md`. Screen-by-screen behaviour is in `SCREEN_SPEC.md`; message contracts in `PROTOCOL_SPEC.md`; testable scenarios in `ACCEPTANCE_TESTS.md`. Numeric limits are cited by registry ID (`reference/limits.md`); values marked *initial* there are starting points to be tuned by measurement, not promises.

## 1. Roles and surfaces

- **Facilitator Workspace:** a desktop window with a native menu (File, Edit, Window, Help), one tab per open Activity, and, inside a tab: a left **slide sidebar** with thumbnails, a centre **canvas**, a right **Inspector** for settings (timer, close policy, response mode and rule, participant visibility, results visibility, theme), a top bar for adding slides by category, and a **Preview** pane showing the projector view beside a phone-sized participant view. The baseline layout is in `sketches/01_workspace.svg`; it is refined during Stage 2 and must not copy another product's layout.
- **Projector view:** a display-only page in a browser window on the Facilitator's computer, normally full screen on a second screen. It shows the lobby, questions, aggregate results, leaderboards and approved Q&A. It sends no commands.
- **Participant page:** a lightweight page opened on phones, tablets or laptops over the local network by scanning a QR code or typing the full join address.

## 2. Facilitator Workspace behaviour

- **Documents:** New, Open, Open Recent, Save, Save As, Save a Copy Without Responses, Save as Template, Close. Dirty indicator on each tab; unsaved-work prompt on close. Opening an already-open file focuses its tab.
  - **Save a Copy Without Responses** keeps slides, theme and roster, and removes all responses and participant records.
  - **Save as Template** removes responses and participant records **and asks whether to keep the roster (default: remove it)**.
  - Both, like Save As, create a **new Activity** (new Activity ID, empty event log, its own lock). A copy never inherits participant identities.
  - **Save As "type" list:** the current format and, from the second format onward, up to two older ones, each preceded by a compatibility check (`SCHEMA_GOVERNANCE.md` section 7). Version 1 offers only the current format.
- **Several Activities at once:** each tab has its own working directory, lock, undo history and runtime state. Only one Activity may be Live; the others stay editable. The Live Activity's editor is read-only except for cosmetic changes (section 8).
- **Copy, cut and paste of slides** within and between Activities. A paste is a deep copy: new slide IDs, no shared references, no stored responses, no roster. Media is copied into the target Activity. The pasted slide takes the target Activity's theme; slide-level settings are kept. Editing one Activity never changes another.
- **Duplicate slide** (without data) and **drag-and-drop reorder**, each with a keyboard equivalent.
- **Undo and redo** cover authoring edits only (section 18).
- **Autosave for recovery:** authoring changes are journaled into the working directory so a crash does not lose work. This is not the same as Save; the file on disk changes only on Save (and when Live ends, section 6).
- **Starter templates** and clear **empty states** for a new Activity.
- **Recent files** list (`LIM-OPS-RECENT-FILES`) with a *Clear list* action.

## 3. Slides, steps and Slide Types

An Activity is an ordered list of **slides**. A slide has one **Slide Type** and moves through one or more **steps** when presented.

| Slide Type | Steps | Notes | Stage |
|---|---|---|---|
| Multiple Choice Poll | Question, Results | Single choice in version 1. One response per participant by default; optional "replace until closed" | 2 |
| Content (fixed layouts) | Display | Title, title + text, title + image, image only. No responses. Hidden from phones by default | 3 |
| Quiz Question | Question, Reveal, Stats | One correct option, timer, points, optional explanation | 4 |
| Leaderboard | Leaderboard | Totals across Quiz Questions. Off, Top 5 or Full list | 4 |
| Open Question | Collect, Display | Free-text answers, optional moderation | 6 |
| Word Cloud | Collect, Display | Short text entries aggregated; optional moderation | 6 |
| Q&A | Collect, Moderate, Display | Participants submit questions; the Facilitator approves; the projector shows approved ones | 6 |

Version 1 does **not** include free-form content layout, video or PowerPoint import.

**Content limits** (question, option, explanation, answer and entry lengths, option counts, notes, slide count) are defined in the registry (`LIM-CONTENT-*`, `LIM-SLIDE-NOTES-MAX-CHARS`, `LIM-ACTIVITY-MAX-SLIDES`) and enforced in the editor and again on the server.

## 4. Slide status and completeness

A slide is **Incomplete** until its mandatory fields are filled, then **Ready**. (This is the *slide status*; it is unrelated to an *incomplete result*, section 17.)

- The Activity can always be saved, including with Incomplete slides, so that drafts, autosave and crash recovery never lose work. Incomplete slides are badged in the sidebar and list the missing fields.
- Only Ready slides can be previewed or presented; the disabled control says why (`SLIDE_INCOMPLETE`).
- Before presenting, the app lists any Incomplete slides and skips them if the Facilitator continues. Skipped slides are recorded in the event log.

## 5. Quiz settings and feedback

**Quiz settings are Activity-wide** and apply to every Quiz Question in the Activity, because scores accumulate across them.

| Setting | Learning (default) | Competitive | Custom |
|---|---|---|---|
| Speed bonus | Off | On | Choose |
| Leaderboard | Off | Top 5 | Off / Top 5 / Full |
| Show correct / incorrect to participants | On | On | Choose |
| Show the explanation to participants | On (if written) | On (if written) | Choose |
| Show the participant their own score | Off | On | Choose |

Per Quiz Question: question, options, the correct option, time limit (`LIM-CONTENT-TIMER-MIN-S` to `LIM-CONTENT-TIMER-MAX-S`), points (default `LIM-CONTENT-POINTS-DEFAULT`, up to `LIM-CONTENT-POINTS-MAX`), optional explanation (`LIM-CONTENT-EXPLANATION-MAX-CHARS`), and **reveal timing**:

- **After the question** (default): the Reveal step follows the question.
- **Held until I reveal**: the Reveal step shows "Answers held". The Facilitator later opens a **Review** list in the Facilitator panel and presents the held Reveal steps. *The exact interaction is designed in Stage 4 (open item `O-008`).*
- **Not during the presentation**: answers are never revealed to participants; they appear only in the report.

**Scoring:** a correct answer earns the slide's points. An incorrect answer and *no answer* both earn zero but are reported separately. The speed bonus (if on) is `floor(points × 0.5 × remaining_time / time_limit)` for correct answers, using the server clock from when the step opened to when the submission arrived. The formula is fixed and documented in Stage 4. Network delay still affects it slightly; the manual says so. Speed bonuses disadvantage slower readers, non-native speakers and people with disabilities, so they default to off. Tie-breaking on leaderboards is specified in Stage 4 (audit finding F-14).

**Locking:** Quiz settings, points, time limits and correct answers are locked once any Quiz Question has stored responses (section 8).

**Fairness rule:** once a Quiz Question's Reveal step has been shown, *Accepting responses* cannot be switched back on for that slide.

## 6. Preview and Present

### Preview
Preview uses the same engine as Present but writes to a throwaway store. Nothing is kept and no network server is started. The Facilitator can tap through as a participant in the phone pane and press **Simulate responses** to add random valid responses. Preview is disabled for Incomplete slides.

### Starting a Presentation
The **Start presenting** dialog asks for:
- **Where to start:** the beginning, the selected slide, or a selected range of slides.
- **Join mode:** Anonymous, Display name, or Roster login (only if the Activity has a roster).
- **Participant limit:** default is the validated capacity recorded for the release; until a validation exists the default is `LIM-PRES-DEFAULT-PARTICIPANT-LIMIT` and the dialog says that higher numbers are not yet validated. The limit is a Facilitator setting, not licence enforcement.
- **Network interface:** the recommended interface, with the full list available (see `NETWORKING_AND_DEPLOYMENT.md`).
- A summary of Incomplete slides that will be skipped.

Going Live starts the participant server and shows the Lobby.

### During a Presentation
- Responses are stored and accumulate in the Activity. Presenting a slide again without Reset adds to what is stored, respecting the slide's response rule.
- There is **no confirmation prompt** when presenting a slide that already has responses; the Facilitator may want to show earlier results. Instead: the thumbnail shows a badge such as "48 stored"; the Facilitator can switch **Accepting responses** off; a participant who already answered sees "You have already answered this"; and, under the conditions in section 9, **Reset this slide** is available.
- Identity is limited to what the app can know: Participant ID (roster login), display name, or participant token.
- While Live the app asks the operating system not to sleep or blank the display. If a suspend or a large clock jump is detected, timers pause, the Facilitator is alerted, and presenting continues only when the Facilitator resumes.
- The Facilitator can navigate forward, back and to any slide. A late joiner sees the current step and may answer if the slide is accepting.
- Interface changes, interruptions and recovery are handled as described in `NETWORKING_AND_DEPLOYMENT.md` and section 9.

### Ending a Presentation
*End presenting* shows a confirmation listing: slides still open, active participants, and what will happen. On confirm the app applies each open slide's close policy, labels slides that were still open as having **incomplete results**, stops the participant server, saves the Activity automatically (Save As if never saved), and writes the event log entry. Participant-facing access is then off.

## 7. Responses, close policy and accepting

- **Submission integrity.** Every submission carries a submission ID. The server acknowledges only after the response is durably stored. A retry with the same submission ID returns the original outcome and creates no second response. A phone whose acknowledgement was lost reconciles with stored state after reconnecting. There is no offline answer queue in version 1. The exact contract is `PROTOCOL_SPEC.md` section 5.
- **Response rules** (per component): *one per participant* (default; later attempts are refused with "You have already answered"), *replace until closed* (Poll option), *multiple* (Open Question, Word Cloud, Q&A).
- **Close policy** (per slide): **Immediate** (default) or **Grace period** of `LIM-PRES-GRACE-MIN-S` to `LIM-PRES-GRACE-MAX-S` seconds. The policy applies to timer expiry and to the Facilitator pressing *Close*, and equally to reconnecting phones. During a grace period the phone shows "Closing…". A submission arriving after the close, or after the grace period, is refused with "Responses are closed" and never changes finalised results.
- **Accepting responses** is the Facilitator's manual switch. Switching it off uses the slide's close policy; *Close now* skips the grace period.
- **Re-opening:** for a Poll the Facilitator may switch Accepting back on; this is recorded in the event log. For a Quiz Question this is not allowed after Reveal (section 5).
- **Participant limit:** new participants are refused with "This activity is full" once the limit is reached. A participant already admitted who reconnects is never counted twice and is not refused. Limitation: an anonymous participant who clears browser data or switches browser looks new and counts again; the Facilitator can raise the limit.

## 8. Editing rules once responses exist

Content editing is locked as soon as a slide has stored responses, because even small text changes can change the meaning of the results.

- **Allowed (cosmetic), when not Live:** theme (fonts, colours), speaker notes, slide order, the "Show on participant devices" setting, adding new slides, and deleting a slide (with confirmation; its responses are deleted with it and the deletion is logged).
- **Locked:** question and option text, correct answers, points, time limits, close policy, response rules, quiz settings, slide type. Locked fields show a lock icon and the message "Reset this slide's data to edit" (`SLIDE_LOCKED_BY_RESPONSES`).
- **Ways to fix a mistake:** Reset the slide (a safety copy is made and the app offers an export first), or Duplicate the slide without data, or Save a Copy Without Responses.
- **While an Activity is Live, its editor is read-only** except for three cosmetic settings: theme, speaker notes and "Show on participant devices". It is not possible to add, delete, reorder or paste slides while Live. Other open Activities remain editable.
- Resetting or deleting a Quiz Question also removes its points from the leaderboard; the confirmation says so.

## 9. Reset, safety copies and recovery

- **Reset** applies to one slide or to the entire Activity. **Reset this slide** deletes that slide's stored responses (and, for a Quiz Question, its points and its "Reveal shown" flag). **Reset the entire Activity** deletes all stored responses and all stored participant records. Authored content and the roster are always kept.
- **While the Activity is Live,** the entire-Activity Reset is unavailable. *Reset this slide* is allowed only for a slide that is **not the current slide and is closed**, with the same confirmation and safety copy; if it is a Quiz Question the confirmation says that leaderboard totals will change.
- Neither Reset is available while a Recovered state is unresolved. The Facilitator resolves the recovery first.
- Every Reset shows a confirmation naming what will be deleted (for example "312 responses from 41 participants on 6 slides"), offers **Export results first**, and **makes an automatic safety copy** before deleting anything (`SECURITY_FILE_FORMAT.md` section 8). Reset itself cannot be undone with Undo.
- **Recovered state.** If the app exits unexpectedly while Live, the next start finds the leftover working directory and offers **Recover** (default) or **Discard**. Recovery restores the data that had been committed, plus journaled authoring changes. It does **not** resume the Live state: the Facilitator starts presenting again. The message states how many responses were recovered and that answers in flight at the moment of the crash cannot be known. Discarding asks for confirmation and says how many committed responses will be lost.
- Nothing is silently discarded, reopened or edited.

## 10. Activity runtime states

- **Idle:** not being presented.
- **Live:** being presented; the participant server is on.
- **Recovered:** a leftover working directory was found; resolve it before anything else with that Activity.

Slide status (Incomplete or Ready) and data status (empty or has stored responses) are separate and shown separately. The Presentation's own states, as the participant pages see them, are in `PROTOCOL_SPEC.md` section 7.

## 11. Join and identity

**Join mode** is chosen in the Start presenting dialog:

| Join mode | How participants identify themselves | Use for |
|---|---|---|
| Anonymous | Nothing; a participant token prevents repeat answers on one device | Low-stakes polls |
| Display name | A name they type. Duplicates are allowed. They may correct it later | Quizzes with a visible leaderboard |
| Roster login | Participant ID + PIN from the roster | Graded or attendance-tracked work |

**Display names are labels, never identities.** Identity comes from the participant token (or, in roster mode, the Participant ID). Therefore:
- Duplicate display names are allowed; in a large group they will happen.
- In Display name mode a participant may correct their own name without losing identity or history. Name changes are limited (`LIM-ID-NAME-CHANGES-PER-MINUTE`).
- Names are normalised (trimmed, Unicode normalised, control characters removed, bidirectional control characters restricted) and limited to `LIM-ID-DISPLAY-NAME-MAX-CHARS`.
- The Facilitator panel always shows a small **disambiguator** (join number) beside each name. On the projector, names appear as typed, and a number is added only when two identical names appear in the same visible list.
- In roster mode the displayed name is the roster's; participants cannot rename themselves.
- The Facilitator can **Hide name** (the projector shows "Participant 17" instead) and **Remove participant** (disconnects the device and refuses its token for the rest of the Presentation). Both are recorded in the event log without the name.

**Response mode** is a setting on each slide, **Anonymous** or **Identified**:

| | Anonymous join | Display name join | Roster login |
|---|---|---|---|
| Anonymous slide | answers kept without names | answers kept without names | answers kept without names |
| Identified slide | not available | linked to the participant | linked to the Participant ID |

Defaults: Multiple Choice Poll, Open Question, Word Cloud and Q&A = Anonymous; Quiz Question = Identified. A Leaderboard needs Display name or Roster login; otherwise it shows a warning.

Honest wording for Anonymous slides in the app and reports: "Not linked to names in the app or reports." Duplicate prevention still needs a one-way key (see the security document), so someone with technical skill and the file may be able to link responses. **Graded use needs Roster login**; in other modes identity does not reliably survive interruptions, phone changes or cleared browsers.

**Roster login** details (import, PINs, protocol, lockout, anti-impersonation layers) are in `SECURITY_FILE_FORMAT.md` section 9.

## 12. Counters

Shown to the Facilitator and on the projector:

- **Active:** participants connected now. At the bottom of **every** slide.
- **Answered:** on interactive slides, of the active participants how many have a response stored, e.g. "Answered 28 / 31 active".
- **Stored responses:** shown only when different, e.g. "48 responses stored". It can be larger than Active because it includes earlier Presentations.
- In roster mode the Facilitator also sees **Joined**, **Not yet joined** (with names) and flagged logins.

A participant counts as **Active** while their connection is alive and answering pings (`ARCHITECTURE.md` section 7).

## 13. Participant visibility

Each slide has "Show on participant devices". Defaults: Poll, Quiz Question, Open Question, Word Cloud and Q&A on; Content off. When off, phones show "Look at the main screen". The Facilitator can change it live. Phones show a clear waiting state between steps.

## 14. Facilitator switches

**Version 1:**
- Timer controls: pause, extend, skip.
- **Results on the projector:** live, or hidden until the Facilitator reveals (avoids audience herding).
- Speed bonus on or off (default off); leaderboard Off / Top 5 / Full list; quiz scoring preset (Learning / Competitive / Custom).
- Accepting responses on or off; close policy (Immediate / Grace).
- Blank / freeze the projector.
- Hide name; Remove participant.

**Later versions:** team mode, per-learner extra time, prediction-before-reveal, think-pair-share timers, confidence rating.

## 15. Projector view requirements

- Large minimum type; high-contrast themes (projectors wash out colours). A theme warns at creation if text contrast falls below 4.5:1.
- A persistent corner area with the full join address and QR code on every slide.
- The join address shown is supplied by the core from the chosen network interface, not derived from the page's own address.
- Never rely on colour alone for correct/incorrect.
- Active count at the bottom of every slide.
- Results updates throttled (`LIM-NET-RESULT-COALESCE-MS`).
- A visible but unobtrusive "reconnecting" overlay if the link to the app drops; the page recovers by itself.
- Baseline layout: `sketches/03_projector_question.svg`.

## 16. Participant page requirements

- Works on phones from roughly the last four to five years; one-handed use; large tap targets (at least 44 × 44 CSS pixels).
- A countdown that uses the **server-provided remaining time**, re-synchronised on every view (never the phone's own clock); immediate "sending…" then "answer received" feedback; clear waiting, closed, disconnected and reconnecting states; "You have already answered this".
- No external resources and no reliance on browser features that exist only on secure origins (see `NETWORKING_AND_DEPLOYMENT.md` section 8).
- Screen-reader labels, reduced-motion support, colour-blind-safe themes, keyboard operation on laptops.
- A "keep your screen on" tip on the join page (the browser feature that holds the screen awake is unavailable on plain HTTP).
- Baseline layout: `sketches/04_phone_question.svg`.

## 17. Reports and analytics

Version 1 exports **HTML, CSV and XLSX** (PDF through the system print dialog later). Every report contains a **provenance block**:

- Activity name, report time (shown in the Facilitator's local time with the UTC offset), application version.
- Data collected from (first response) to (last response); number of Presentations that contributed; date of the last Reset.
- Join modes used, response modes, and participant limit.
- Slides whose results are **incomplete** (still open when a Presentation ended or was interrupted), clearly labelled.
- The denominator for every percentage.

Contents:
- Per slide: option distribution, % correct, response count, response-time summary.
- **No answer** and **Incorrect** reported separately. The denominator for "no answer" is the participants who were active while the slide was open; anyone who joined later is not counted.
- Participation rate.
- Per participant (Identified slides and roster mode only): answers, score, attendance.
- An LMS-friendly CSV (for example for importing grades into Moodle).
- Anonymous slides never appear with names.

**Spreadsheet safety:** text cells beginning with `=`, `+`, `-`, `@`, tab or carriage return are neutralised in CSV (prefixed with an apostrophe), and XLSX text is always written as a string, never as a formula. HTML output escapes all user text. See `SECURITY_FILE_FORMAT.md` section 10.

## 18. Undo, redo and copy

Undo/redo covers **authoring edits only**: typing, adding, deleting, duplicating, reordering and pasting slides, setting changes, and roster edits. It never covers live data: a submitted response or a Reset cannot be undone with Undo. Each open Activity has its own history, cleared when the Activity is closed.

## 19. Accessibility and language

- **Target:** WCAG 2.2 AA for the Facilitator Workspace, Projector view and Participant page. This is a target, not a claim; no conformance is claimed until an audit is documented.
- Keyboard operation of every Facilitator Workspace function; visible focus; labels; error identification; status messages announced to assistive technology; reorder and other drag actions have a non-drag alternative; reduced motion respected.
- Quiz timers conflict with adjustable-time needs; per-learner extra time is a later version, and the manual says so.
- **Language:** English interface only in version 1, but all interface text lives in language resource files. User-entered text is rendered bidirectionally safe (`dir="auto"` behaviour), tested with long strings, emoji, mixed Arabic and Latin, and malformed input. Bundled, offline fonts that cover the scripts we choose to support are an open decision (`O-005`).

## 20. Not in version 1

Runs, free-form content layout, video, PowerPoint import, saving for older formats (no older format exists), macOS, translated interface, Projector view on another computer, automatic scheduled backups, licence enforcement.
