# Screen Specification: Interaction Contracts

**Status:** design. Cross-cutting rules and the full screen inventory are complete; **contract cards are written for Stage 1 and Stage 2 screens**. Cards for later stages are written just before their stage. This is an interaction contract, not a visual design: it fixes behaviour (states, validation, confirmations, keyboard, recovery), not colours or exact layout. Baseline layouts are in `sketches/`.

**Single source of truth for expected results:** the Given/When/Then text for every screen behaviour lives only in `ACCEPTANCE_TESTS.md` (scenarios `AT-UI-*` and the behavioural families). A card lists the scenario IDs that prove it and never repeats their text. Message texts come from the language resource files by message key; error and refusal codes from `reference/error-codes.md`.

## 1. Cross-cutting rules

These apply to every screen. A card states only exceptions.

### SR-1 Validation
- Validate as the user types or leaves a field, and again on submit. Show the message **inline, directly beneath the field**, in plain words that say what is wrong and how to fix it ("Option text can't be empty.").
- The field keeps focus after a failed submit; the user's input is **never cleared**.
- A form with several problems shows a summary at the top, each item linking to its field; the first problem receives focus.
- Messages are announced to assistive technology and never rely on colour alone.

### SR-2 Disabled controls
- A control that cannot be used **stays visible and is disabled**, never hidden. Its reason is available as a tooltip **and** as accessible description text ("Complete the question to preview").
- If the reason is something the user can fix, the message says what to do.

### SR-3 Confirmations
- Confirm only actions that are destructive or hard to reverse. Everything undoable is not confirmed.
- The confirmation **names exactly what will be lost**, with counts ("312 responses from 41 participants on 6 slides").
- Buttons are labelled with the verb ("Delete responses", "Discard recovered work"), never "OK". The **safe choice is the default**; **Enter never triggers a destructive action**; Esc cancels.
- Where data could be exported or copied first, the dialog offers it.

### SR-4 Keyboard
- Every Facilitator Workspace function works from the keyboard; tab order follows reading order; focus is visible; there are no keyboard traps.
- Dialogs take focus when opened and **return focus** to the control that opened them.
- Every drag action (reorder) has a keyboard alternative.
- Default shortcuts (the final keymap is fixed during Stage 2 usability checks):

| Action | Shortcut |
|---|---|
| New / Open / Save / Save As / Close tab | Ctrl+N / Ctrl+O / Ctrl+S / Ctrl+Shift+S / Ctrl+W |
| Next / previous tab | Ctrl+Tab / Ctrl+Shift+Tab |
| Undo / Redo | Ctrl+Z / Ctrl+Shift+Z |
| Preview / Present | Shift+F5 / F5 |
| Live: next step / previous step | Right arrow or Page Down / Left arrow or Page Up (when the Live panel has focus) |
| Live: close now | Ctrl+Shift+C |
| Live: blank projector / freeze projector | B / F (when the Live panel has focus) |
| Help | F1 |

Ending a presentation has no single-key shortcut; it always goes through its confirmation.

### SR-5 Errors (layered)
- Every error shows a **friendly message** (what happened, and the safest next action) first. A collapsed **Details** area shows the error code, the technical cause and a *Copy details* button.
- File paths are shown as file names unless the user expands Details. Secrets never appear.
- The message key and the code come from the catalogue; an unknown code shows a generic message plus the code.

### SR-6 Recovery prompts
One pattern: **what happened**, **what is safe**, **choices with the safest as default**, **a way out**. Nothing destructive happens without an explicit choice. Applies to recovery after a crash, lock conflicts, corrupted files and failed saves.

### SR-7 Busy states
Any operation that can take longer than about half a second shows progress; operations that can be cancelled safely have a Cancel button; the interface stays responsive. Opening or saving a large Activity names the step ("Checking the file…").

### SR-8 Empty states
Every list or canvas that can be empty explains what it is and offers the next action ("No slides yet. Add a Poll").

### SR-9 Text and language
All text comes from language resource files; nothing is hard-coded. User-entered text is displayed bidirectionally safe and may be long: layouts truncate with an accessible full text, never overflow.

### SR-10 Messages that must not vanish
A message that reports a failure or asks for a decision never auto-dismisses. Transient toasts are only for successful, non-critical events ("Saved") and are also announced to assistive technology.

### SR-11 Projector rules
The Projector view is display-only: no buttons, no focus targets. Text is large (minimum sizes set by the theme check), contrast at least 4.5:1, state never conveyed by colour alone, the join address and QR code present on every screen, the Active count at the bottom.

### SR-12 Participant-page rules
Touch targets at least 44 × 44 CSS pixels; one primary action per screen; plain, kind wording that never blames the participant; every state in the table in `PP-03` has a defined message; the page never shows a technical error code except as small reference text.

## 2. Screen inventory

Stage 1 and 2 cards are in section 3. "Scheduled" means the card is written just before that stage.

### Facilitator Workspace

| ID | Screen | Stage | Card | Sketch |
|---|---|---|---|---|
| FW-01 | Workspace window and tabs | 1 | Written | 01 |
| FW-02 | Slide sidebar | 2 | Written | 01 |
| FW-03 | Canvas and Inspector (Poll) | 2 | Written | 01 |
| FW-04 | Preview pane | 2 | Written | 01 |
| FD-01 | File actions and unsaved-changes prompt | 1 | Written | |
| FD-02 | Lock-conflict dialog | 1 | Written | |
| FD-03 | Recovery prompt | 1 | Written | |
| FD-04 | Error dialog | 1 | Written | |
| FD-05 | Start presenting dialog | 2 | Written | |
| FD-06 | Network Check | 2 | Written | |
| FD-07 | Live control panel | 2 | Written | 02 |
| FD-08 | End presenting confirmation | 2 | Written | |
| FD-09 | Reset confirmation, safety copies manager | 3 | Scheduled | |
| FD-10 | Interface-change alert | 3 | Scheduled | |
| FD-11 | Save As type list and compatibility check | format 2 | Scheduled | |
| FD-12 | Quiz settings and Quiz Question editor | 4 | Scheduled | |
| FD-13 | Review list (held reveals) | 4 | Scheduled | |
| FD-14 | Roster editor and import | 5 | Scheduled | |
| FD-15 | Credential sheet | 5 | Scheduled | |
| FD-16 | Participants panel (roster mode, flags, release) | 5 | Scheduled | |
| FD-17 | Moderation panel | 6 | Scheduled | |
| FD-18 | Reports and export dialog | 7 | Scheduled | |
| FD-19 | Password dialogs (set, change, remove, open) | 7 | Scheduled | |
| FD-20 | Diagnostic report | 7 | Scheduled | |
| FD-21 | Help and manual viewer | 8 | Scheduled | |

### Projector view

| ID | Screen | Stage | Card | Sketch |
|---|---|---|---|---|
| PJ-01 | Lobby | 2 | Written | |
| PJ-02 | Poll question and results | 2 | Written | 03 |
| PJ-03 | Wait, closed, reconnecting, blank, frozen and ended states | 2 | Written | |
| PJ-04 | Content slide | 3 | Scheduled | |
| PJ-05 | Quiz screens and Leaderboard | 4 | Scheduled | |
| PJ-06 | Open Question, Word Cloud, Q&A | 6 | Scheduled | |

### Participant page

| ID | Screen | Stage | Card | Sketch |
|---|---|---|---|---|
| PP-01 | Landing and join | 2 | Written | |
| PP-02 | Poll screen | 2 | Written | 04 |
| PP-03 | System states (full, error, reconnecting, ended, hidden slide, wait) | 2 | Written | 04 |
| PP-04 | Name entry and correction | 4 | Scheduled | |
| PP-05 | Roster login | 5 | Scheduled | |
| PP-06 | Quiz screens | 4 | Scheduled | |
| PP-07 | Open Question, Word Cloud, Q&A | 6 | Scheduled | |

## 3. Contract cards (Stage 1 and 2)

### FW-01 Workspace window and tabs
- **Purpose:** the main window: menu, one tab per open Activity, the working area for the selected tab, a status bar.
- **Entry:** application start; opening or creating an Activity.
- **Elements:** native menu (File, Edit, Window, Help); tab strip with a dirty marker per tab, a `+` for new; status bar showing runtime state (Idle or Live), network state, slide position and slide status (`sketches/01_workspace.svg` markers 1 and 7).
- **States:** no Activity open (empty state with New and Open actions and the Recent list); one or more tabs; a tab that is read-only (banner "Opened read-only: <reason>"); a tab in Recovered state (banner with Resolve).
- **Validation and disabled:** Save is disabled with the reason "No changes to save" when clean; Present and Preview follow `FW-03`.
- **Actions:** closing a tab with unsaved changes opens `FD-01`. Opening a file that is already open focuses its tab. Only one Activity can be Live; presenting from another tab is disabled with "Another Activity is live".
- **Keyboard:** shortcuts in SR-4; Ctrl+Tab cycles tabs.
- **Accessibility:** tabs are a labelled tab list; the dirty marker has text ("unsaved changes").
- **Recovery:** see `FD-03`, `FD-02`, `FD-04`.
- **Scenarios:** AT-UI-001, AT-UI-003, AT-TAB-001, AT-TAB-002, AT-TAB-003.

### FW-02 Slide sidebar
- **Purpose:** list, select, reorder, add, duplicate and delete slides.
- **Elements:** a thumbnail card per slide with number, type, status (Ready or Incomplete with the first missing field), a "N stored" badge when responses exist, a "hidden on phones" note; an Add slide button (`sketches/01_workspace.svg` marker 3).
- **States:** empty (SR-8); selected; incomplete (dashed outline plus text, not colour alone); locked by responses (lock icon with text).
- **Validation and disabled:** Delete, Reorder and Add are disabled while the Activity is Live (reason shown), except that nothing is allowed that would change a Live Activity's slides.
- **Actions:** reorder by drag **and** by Alt+Up/Alt+Down; duplicate (without data); delete a slide: no confirmation if it has no stored responses (it is undoable); with stored responses a confirmation names the count and that the responses are deleted too.
- **Keyboard:** Up/Down to move selection; Enter to open; Delete to delete; Alt+Up/Down to reorder.
- **Accessibility:** a listbox with announced position ("Slide 2 of 3, Poll, Incomplete").
- **Scenarios:** AT-UI-015, AT-SLIDE-001.

### FW-03 Canvas and Inspector (Poll)
- **Purpose:** author a Multiple Choice Poll.
- **Elements:** question field with a character counter; option rows (add, remove, reorder) with a counter of options; Inspector fields: response mode, response rule, timer, close policy, results on projector, show on participant devices, speaker notes (`sketches/01_workspace.svg` markers 4 and 6); Preview and Present buttons in the top bar.
- **States:** editable; Incomplete (messages per SR-1); locked (once responses exist: fields show a lock icon and "Reset this slide's data to edit"; cosmetic fields stay editable); read-only (a Live Activity).
- **Validation:** question required and within its limit; at least two and at most the maximum options; option text required and within its limit; timer within its bounds; grace seconds required when close policy is Grace. Limits come from the registry.
- **Disabled:** Preview is disabled while the slide is Incomplete, with the reason "Complete the question to preview" (`SLIDE_INCOMPLETE`).
- **Actions:** every change is undoable and journaled; no confirmation except removing an option that has stored responses (not possible: locked).
- **Keyboard:** all fields in tab order; Enter in the last option field adds an option.
- **Scenarios:** AT-UI-016, AT-UI-002, AT-SLIDE-001, AT-SLIDE-002, AT-SLIDE-003.

### FW-04 Preview pane
- **Purpose:** try the slide without storing anything.
- **Elements:** a projector-view mini panel and a phone-sized panel; a *Simulate responses* control with a count; a persistent label "Preview: nothing is stored" (`sketches/01_workspace.svg` marker 5).
- **States:** closed; open; slide Incomplete (the pane is unavailable with the reason).
- **Actions:** tapping an option in the phone panel behaves as a participant; Simulate adds random valid responses to the throwaway store; closing the pane discards everything.
- **Keyboard:** the phone panel options are focusable and operable by keyboard.
- **Scenarios:** AT-PREV-001, AT-PREV-002, AT-UI-017.

### FD-01 File actions and unsaved-changes prompt
- **Purpose:** New, Open, Save, Save As, Close with safe handling of unsaved work.
- **Elements:** native file dialogs; a prompt when closing or quitting with unsaved changes: "Save changes to <name>?" with **Save**, **Don't save**, **Cancel**.
- **Behaviour:** Save is the default; *Don't save* is never default; Enter does not choose *Don't save*. A save that fails opens `FD-04` and keeps the tab open and dirty. Save As to a different location warns when the location looks like cloud-synchronised or a network share.
- **Busy:** a progress line for saving large files (SR-7).
- **Keyboard:** SR-4.
- **Scenarios:** AT-UI-021, AT-TAB-003, AT-FILE-001, AT-FILE-002, AT-FILE-003.

### FD-02 Lock-conflict dialog
- **Purpose:** handle a file that is locked by another instance (or has an unreadable lock).
- **Elements:** who holds it (host, user, process, time acquired, last activity as a diagnostic); choices **Open read-only** (default), **Open an independent copy**, **Cancel**, **Take over**.
- **Behaviour:** Take over is separate, visually distinct, labelled with the risk ("Changes made elsewhere may be lost"), and needs a second explicit confirmation; it is never default and Enter never selects it. A process that looks dead does not change the choices.
- **Scenarios:** AT-UI-014, AT-LOCK-001, AT-LOCK-002, AT-LOCK-003.

### FD-03 Recovery prompt
- **Purpose:** after an unexpected exit, offer Recover or Discard for each leftover working directory.
- **Elements:** Activity name, when it was last active, the number of committed responses, whether journaled edits exist; **Recover** (default), **Decide later**, **Discard**.
- **Behaviour:** Discard opens a confirmation naming the number of committed responses that will be lost (SR-3). The prompt says that answers in flight at the moment of the crash cannot be known and that recovery does not resume the Live state.
- **Scenarios:** AT-UI-013, AT-REC-001, AT-REC-002, AT-REC-003.

### FD-04 Error dialog
- **Purpose:** the single pattern for reporting a failure.
- **Elements:** friendly message, next safe action, **Details** (collapsed: code, cause, copy button), a primary action appropriate to the error (for example *Save As…* after a failed save).
- **Behaviour:** SR-5 and SR-10; focus moves to the dialog and returns afterwards.
- **Scenarios:** AT-UI-005, AT-FILE-002, AT-FILE-003, AT-FILE-004, AT-FILE-005, AT-FILE-007.

### FD-05 Start presenting dialog
- **Purpose:** choose how to go Live.
- **Elements:** start point (beginning, selected slide, range); join mode (Roster login only if a roster exists); participant limit; network interface list (recommended one preselected, address shown); a summary of Incomplete slides that will be skipped; **Start** and **Cancel**.
- **Validation and disabled:** Start is disabled until an interface is chosen ("Choose a network interface") and the limit is a whole number of at least 1. If the chosen limit exceeds the validated capacity a warning appears and Start stays enabled. If no slide is Ready, Start is disabled ("No slide is ready to present").
- **Actions:** Start binds the participant listener; on failure `NET_BIND_FAILED` opens `FD-04` and the dialog stays open.
- **Keyboard:** Enter starts only when valid; Esc cancels.
- **Scenarios:** AT-UI-006, AT-PRES-001, AT-PRES-002, AT-PRES-003, AT-PRES-008, AT-PRES-009.

### FD-06 Network Check
- **Purpose:** prove, before an event, that a real phone can join.
- **Elements:** the chosen interface and join address with the QR code; a live line "Waiting for a device…" then the device's round-trip time and "Test answer received"; the troubleshooting sequence if nothing connects (`NETWORKING_AND_DEPLOYMENT.md` section 6); a note that local checks cannot prove every device in the venue can connect.
- **Behaviour:** starting the check starts the participant listener; closing it stops the listener; it never leaves a listener running.
- **Scenarios:** AT-UI-007, AT-PRES-004, AT-PRES-005.

### FD-07 Live control panel
- **Purpose:** run the Presentation (`sketches/02_live_panel.svg`).
- **Elements:** LIVE banner with LAN state and the join address; current slide and step with Previous slide, Next step, Next slide; *Accepting responses* switch, *Close now*, close policy shown; *Results on projector* (Live or Hidden); timer with Pause, +30 s, Skip; Blank and Freeze projector; slide data ("N responses stored") and *Reset this slide*; counters Active, Answered, Stored; the participant list; QR code and *Copy projector link*; *Open projector view*; *End presenting*.
- **States:** a banner "Editing is locked while Live" with what can still change; a Quiz Question after Reveal shows Accepting as unavailable with the reason; suspended timers show "Paused: the computer was suspended. Resume".
- **Disabled:** *Reset this slide* is disabled unless the slide is closed and not current ("Available only for a closed slide that is not current").
- **Actions:** Close now and Reset this slide follow SR-3 where destructive; navigation never asks for confirmation; End presenting opens `FD-08`.
- **Keyboard:** SR-4 (arrow keys, Ctrl+Shift+C, B, F).
- **Accessibility:** counters are a live region (polite) updated at most every few seconds; the LIVE state is text, not only colour.
- **Scenarios:** AT-UI-008, AT-CNT-001, AT-PRES-007.

### FD-08 End presenting confirmation
- **Purpose:** end the Presentation safely.
- **Elements:** a summary: slides still open, active participants, "results of open slides will be labelled incomplete", "the Activity will be saved"; **End presenting** and **Keep presenting** (default).
- **Behaviour:** Enter selects Keep presenting. On confirm the sequence in `PRODUCT_SPEC.md` section 6 runs with progress (SR-7); if the automatic save fails, `FD-04` opens and the Activity stays open and dirty.
- **Scenarios:** AT-UI-018, AT-PRES-006, AT-PRES-010.

### PJ-01 Projector lobby
- **Elements:** title, the complete join address in large type and the QR code, the Active count; in later stages the joined names. No controls.
- **States:** waiting (no one joined: "Waiting for participants"); participants joining (count updates); reconnecting overlay (`PJ-03`).
- **Scenarios:** AT-UI-009, AT-PRES-005, AT-PROJ-004.

### PJ-02 Projector Poll question and results
- **Elements** (`sketches/03_projector_question.svg`): the question, option labels, result bars with percentages (or hidden until revealed), the timer, the join address and QR code, the counters bar (Active, Answered of active, Stored when different).
- **States:** question (results live or hidden); results step; closing (a visible "Closing…" mark); closed.
- **Rules:** SR-11; bars carry text labels, never colour alone.
- **Scenarios:** AT-UI-012, AT-PROJ-004, AT-CNT-001.

### PJ-03 Projector states
- **Wait, closed, reconnecting, blank, frozen, ended:** each a distinct full-screen or overlay state with plain text. *Reconnecting* is an unobtrusive overlay shown after the first failed attempt and removed when a view arrives. *Blank* shows nothing but the join corner; *Frozen* keeps the last view with a small "paused" mark; *Ended* shows "This activity has ended".
- **Scenarios:** AT-UI-020, AT-PROJ-001, AT-PROJ-002, AT-PROJ-003.

### PP-01 Landing and join
- **Elements:** a code field (when the page is opened without a code), a *Join* button, a short privacy line about what is collected in this join mode.
- **Validation:** an empty or wrong code shows "That code isn't right or has expired" (`join_code_invalid`) under the field; the field keeps its text and focus.
- **States:** joining (spinner with text), full (`PP-03`), not live.
- **Scenarios:** AT-UI-019, AT-JOIN-001, AT-JOIN-002, AT-JOIN-003.

### PP-02 Poll screen
- **Elements** (`sketches/04_phone_question.svg`): question, option buttons (at least 44 px), a timer, a connection indicator with text, "Active participants" at the bottom.
- **States:** answering; sending ("Sending…", buttons disabled); answered (chosen option marked, "Answer received"); already answered; closing; closed; results (if the step shows results).
- **Behaviour:** the chosen option is marked with a check **and** text; the countdown uses the server-provided time; messages are announced to screen readers.
- **Scenarios:** AT-UI-010, AT-UI-011, AT-RESP-001, AT-RECON-001.

### PP-03 System states
| State | Message intent | Action offered |
|---|---|---|
| Waiting for the next step | "Waiting for the next step…" | none |
| Slide hidden on phones | "Look at the main screen." | none |
| Activity full | "This activity is full. Ask the facilitator." | Try again later |
| Reconnecting | "Reconnecting…" with a small spinner, answers disabled | none (automatic) |
| Connection lost, retrying | Same as reconnecting, never alarming | none |
| Activity ended | "This activity has ended." | none |
| Removed | "You have been removed from this activity." (Stage 4) | none |
| Page opened in another tab | "This page is open in another tab." | Use this tab |
| Refresh needed | "Please refresh this page." (`protocol_mismatch`) | Refresh |
| Something went wrong | "Something went wrong. Please try again." (`storage_error`, `server_busy`) | Try again (automatic where safe) |
- **Scenarios:** AT-UI-010, AT-JOIN-004, AT-JOIN-006, AT-RECON-004.

## 4. Sketch legends

The yellow numbered markers in the sketches refer to these regions. The sketches fix layout intent only (`PR-112`); the Facilitator Workspace layout stays open (`O-003`) until reviewed.

| Sketch | Marker | Region |
|---|---|---|
| `01_workspace.svg` | 1 | Menu and tabs (`FW-01`) |
| | 2 | Top bar: add slide, Preview, Present |
| | 3 | Slide sidebar (`FW-02`) |
| | 4 | Canvas: Poll editor (`FW-03`) |
| | 5 | Preview pane (`FW-04`) |
| | 6 | Inspector (`FW-03`) |
| | 7 | Status bar (`FW-01`) |
| `02_live_panel.svg` | 1 | Menu and tabs |
| | 2 | LIVE banner with join address, Open projector view, End presenting |
| | 3 | Slide sidebar |
| | 4 | Controls for the current slide (steps, Accepting, close, timer, projector, slide data) |
| | 5 | Participants: counters, connected devices, QR code, join address |
| | 6 | Status bar |
| `03_projector_question.svg` | 1 | The whole screen: display only, no controls |
| | 2 | Timer |
| | 3 | Question and result bars with text labels |
| | 4 | Join address and QR code |
| | 5 | Counters bar |
| `04_phone_question.svg` | 1 | Connection indicator with text |
| | 2 | Answer buttons (at least 44 px) |
| | 3 | "Answer received" state |
| | 4 | "Responses are closed" state |
