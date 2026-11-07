# Interface and Protocol Contracts

**Status:** design, Stage 2 scope. This document is the contract between the core, the Projector view, the Participant page and the Facilitator Workspace. **Message field tables in sections 2, 4 and 5 are drafts**: at the start of Stage 2 the message schemas are written as canonical JSON Schemas (`SCHEMA_GOVERNANCE.md`) and these tables are replaced by generated ones. Everything else here (sequences, algorithms, state machines, precedence of checks, outcomes) is normative. Error and refusal codes are defined only in `schema/error-codes.json` (`reference/error-codes.md`); limits only in `schema/limits.json` (`reference/limits.md`). Scenarios proving this behaviour are in `ACCEPTANCE_TESTS.md`.

**Deferred to just before their stage:** name change (Stage 4), roster login messages (Stage 5), moderation messages (Stage 6), Facilitator commands beyond Stage 2.

## 1. Conventions and versioning

- JSON, UTF-8, over HTTP/1.1 and WebSocket. API responses send `Cache-Control: no-store`.
- **Protocol version.** An integer `proto` (currently `1`) is sent in `POST /api/p/join`, `POST /api/p/submit` and the WebSocket `hello`. A mismatch is answered with `protocol_mismatch` and the page asks the participant to refresh.
- **Outcome envelope** for every `POST` response:

| Field | Meaning |
|---|---|
| `status` | `accepted`, `duplicate`, `refused` or `error` |
| `code` | An error-catalogue code, or `null` when `status` is `accepted` or `duplicate` |
| `message_key` | Language-resource key for the participant-facing text |
| `rev` | The current revision of the Presentation state, so the client can order what it receives |

- **Business refusals** (a normal outcome: already answered, closed, full, not accepting, not current, invalid answer, id conflict, wrong join code, not live, locked out) return **HTTP 200** with `status: "refused"` and a `code`. A phone's generic network-error handling therefore never fires for ordinary outcomes.
- **Genuine problems** return an HTTP error with `status: "error"`: 400 (`bad_request`, `protocol_mismatch`), 401 (`unauthorized`), 403 (`removed`), 413 (`too_large`), 429 (`rate_limited`), 503 (`storage_error`, `server_busy`). The catalogue records the HTTP status of each code.
- **Identifiers.** `slide_id`, `activity_id` and media IDs follow the schemas. A `submission_id` is at least 128 random bits encoded in base64url (22 to 32 characters). A participant is shown a **join number** (a small integer in order of admission) for disambiguation; it is not an identifier.
- **Time.** Views carry durations (`remaining_ms`), never absolute times, so phone clocks are never involved.
- **Reason codes are stable.** A code is never reused for a different meaning; a new meaning needs a new code.

## 2. Participant endpoints (Stage 2)

| Method and path | Purpose | Auth | Idempotent | Notes |
|---|---|---|---|---|
| `GET /` | Landing page asking for the join code | none | yes | Static |
| `GET /j/{code}` | Join page for a code | none | yes | Static page; the code is checked by `POST /api/p/join` |
| `GET /p/*` | Participant bundle assets | none | yes | Versioned file names, long cache |
| `POST /api/p/join` | Admit this browser | none (cookie if already known) | yes | See below |
| `GET /api/p/view` | Current participant view (first load, fallback, reconcile) | token | yes | Returns the same view as the WebSocket |
| `POST /api/p/submit` | Submit a response | token | yes, by `submission_id` | Section 5 |
| `GET /ws/p` | WebSocket upgrade | token (cookie or subprotocol) | n/a | Section 3 |
| `POST /api/p/name` | Correct display name | token | yes | Reserved, Stage 4 |
| `POST /api/p/login/challenge`, `POST /api/p/login/verify` | Roster login | none | no | Reserved, Stage 5 |

Any other path or method on this listener does not exist: unknown paths return 404 (`ARCHITECTURE.md` section 3).

### `POST /api/p/join` (draft field table)

| Direction | Fields |
|---|---|
| Request | `proto`, `code` |
| Success (`accepted`) | `participant.number`, `participant.display_name` (null in Anonymous mode), `join_mode`, `rev`; the token is set as a cookie (never in the body) |
| Refusals (HTTP 200) | `join_code_invalid`, `activity_full`, `not_live` |
| Errors | `bad_request` (400), `protocol_mismatch` (400), `rate_limited` (429) |

Behaviour: a browser whose token is already known is **re-joined** without counting again towards the participant limit. A new browser is admitted if the limit allows (a participant already admitted is never refused at the limit). Joining is rate limited per address (`LIM-NET-JOINS-PER-ADDRESS-PER-MINUTE`).

## 3. WebSockets

**Participant socket `/ws/p`**
1. The client opens the socket. Authentication is the participant cookie; if cookies are unavailable the token is sent as a WebSocket subprotocol. `Origin` must match the listener. Connections per address are capped (`LIM-NET-CONNECTIONS-PER-ADDRESS`; over the cap, the upgrade fails with 429).
2. The client sends `hello` within a few seconds: `{ "type": "hello", "proto": 1, "rev": <last applied rev or 0> }`.
3. The server replies with a `view` message (below) and sends a new one whenever the participant's view changes. Messages are limited to `LIM-NET-WS-MESSAGE-MAX-BYTES`.
4. The server pings with WebSocket ping frames (`LIM-NET-PING-INTERVAL-MS`); browsers answer automatically. A participant is **Active** while a pong arrived within `LIM-NET-PONG-TIMEOUT-MS`.
5. A client sends nothing else on the socket (submissions use HTTP). Anything else closes it with 4007.

**Server messages:** `view` (section 4) and `bye` (`{ "type": "bye", "code": "...", "retry": false }`, sent just before a close, for display).

**Close codes**

| Close code | Meaning | Client behaviour |
|---|---|---|
| 1000 | The Presentation ended normally | Terminal: show "The activity has ended" |
| 4001 | `not_live` | Terminal |
| 4002 | `removed` | Terminal: show "You have been removed" |
| 4003 | `protocol_mismatch` | Terminal: ask to refresh |
| 4004 | `unauthorized` | Re-join once (`POST /api/p/join`), then reconnect; if that is refused as `join_code_invalid` or `not_live`, terminal |
| 4005 | `server_busy` | Reconnect after full-jitter backoff |
| 4006 | `replaced` | Terminal for this page: another page with the same token connected ("opened in another tab") |
| 4007 | `bad_message` (malformed, oversized or unexpected message) | Terminal |
| anything else (including 1006 abnormal) | Network loss | Reconnect with backoff (section 6) |

**Projector socket `/ws/projector`** has the same message shapes with `audience: "projector"`, is authenticated by the projector cookie, accepts only `hello`, and is read-only.

## 4. Views (draft field tables)

A **view** is the complete current screen state for one audience. It is sent whole every time (state-based protocol, `ARCHITECTURE.md` section 2) and is small by design (section 8).

### Participant view

| Field | Meaning |
|---|---|
| `type` | `"view"` |
| `rev` | Revision of the Presentation state |
| `presentation.state` | `lobby`, `live` or `ended` |
| `me.number` | The participant's join number |
| `me.name` | Display name, or `null` |
| `me.answered` | Whether a response is stored for the current slide |
| `me.answer` | `null`, or `{ "submission_id", "summary" }` describing the stored response |
| `slide` | `null` in the lobby, else the object below |

`slide` object: `id`, `type_id`, `step`, `screen`, `accepting`, `closing`, `remaining_ms` (or `null`), `content` (the component's view model for this step).

`screen` values: `interact` (the participant may answer), `wait` (waiting for the next step), `closed` (responses closed), `main_screen` (the slide is hidden on phones: "Look at the main screen"), `results` (the step shows results to participants).

For a **Multiple Choice Poll** the `content` is `{ "question", "options": [ { "id", "text" } ] }` during `interact`, and additionally the aggregate counts when the step shows results to participants.

### Projector view

| Field | Meaning |
|---|---|
| `type`, `rev`, `audience` | `"view"`, revision, `"projector"` |
| `join.url`, `join.qr_payload` | The complete join address and exactly what the QR code encodes, **supplied by the core** |
| `presentation.state` | `lobby`, `live`, `blank`, `frozen` or `ended` |
| `counters` | `active`, `answered` and `stored` (section 12 of the product spec) |
| `slide` | `id`, `type_id`, `step`, `remaining_ms`, `results_visible`, and `content` (question, options, aggregates) |

## 5. Submission contract

### Request and response (draft)

| Direction | Fields |
|---|---|
| Request `POST /api/p/submit` | `proto`, `submission_id`, `slide_id`, `step`, `payload` (for a Poll: `{ "option_id": "<id>" }`) |
| Response | The outcome envelope (section 1) plus `submission_id` and, when accepted or duplicate, `me.answered: true` |

### Order of checks (normative)

The server applies these checks in this order and stops at the first that fails. The order is what makes retries safe and refusals predictable.

| # | Check | Failure | HTTP |
|---|---|---|---|
| 1 | Body size within `LIM-NET-SUBMISSION-BODY-MAX-BYTES` (before parsing) | `too_large` | 413 |
| 2 | Well-formed JSON, known fields only, `proto` matches | `bad_request` or `protocol_mismatch` | 400 |
| 3 | Participant token known and not expired | `unauthorized` | 401 |
| 4 | Participant not removed | `removed` | 403 |
| 5 | Submission rate within `LIM-NET-SUBMISSIONS-PER-SECOND` | `rate_limited` | 429 |
| 6 | **Idempotency lookup** on (participant, `submission_id`): found with the same slide and payload returns the original outcome as `duplicate`; found with a different slide or payload is `id_conflict` | `duplicate` / `id_conflict` | 200 |
| 7 | The Presentation is Live | `not_live` | 200 |
| 8 | `slide_id` is the current slide (or its grace window is still open) and `step` is the current step | `not_current` | 200 |
| 9 | The slide has not closed (`closed`) and Accepting responses is on (`not_accepting`) | `closed` / `not_accepting` | 200 |
| 10 | The response rule allows another response | `already_answered` | 200 |
| 11 | The payload is valid against the slide type's response schema | `invalid` | 200 |
| 12 | Commit (group commit) succeeds | `storage_error` | 503 |
| | Otherwise | `accepted` | 200 |

The idempotency lookup (6) precedes the live, closed and rule checks on purpose: a phone retrying an answer that was already accepted gets the original acceptance even if the slide has since closed.

### Duplicate and retry matrix (normative)

| Situation | Outcome |
|---|---|
| Same `submission_id`, same payload, original already committed | `duplicate` (HTTP 200) carrying the original acceptance; nothing stored |
| Same `submission_id`, same payload, original still being committed | The second request waits for the first commit and returns the same result (single flight) |
| Same `submission_id`, different slide or payload | `id_conflict` (refused); nothing stored |
| Different `submission_id` after an accepted answer under *one per participant* | `already_answered` (refused) |
| Same `submission_id` retried after the slide closed, original accepted | `duplicate`, **not** `closed` |
| Same `submission_id` retried when the original was **refused** | Re-evaluated from the start: refusals are not recorded, only accepted submissions are |
| *Replace until closed*: new `submission_id` while open | `accepted`, replacing the earlier response |
| *Replace until closed*: new `submission_id` after close | `closed` |
| Retry after the participant's records were cleared by a Reset | `unauthorized` (the page re-joins as a new participant) |

### Client behaviour (normative)

- Show **Sending…** immediately. The control is disabled while a submission is in flight.
- If no response arrives within `LIM-NET-SUBMIT-TIMEOUT-MS`, the state is **uncertain**: keep the pending submission and retry the **same** `submission_id` (after reconnecting if needed), never a new one.
- The pending submission is stored in `sessionStorage` under a key made from the Activity, slide and step, so a page refresh can still resolve it. It is removed as soon as an outcome is known.
- Outcomes map to participant text through message keys: `accepted` and `duplicate` show "Answer received"; each refusal shows its catalogue text.
- There is no offline answer queue: a submission is only ever retried while the slide is still current and open.

## 6. Reconnect algorithm (normative)

1. **Detecting loss.** A closed socket, a failed request, or the page becoming visible again with the socket not open.
2. **Backoff.** After the n-th consecutive failed attempt wait `random(0, min(LIM-NET-RECONNECT-MAX-MS, LIM-NET-RECONNECT-BASE-MS × 2^n))` milliseconds (full jitter). A successful `view` resets n to 0.
3. **Visibility.** When the page becomes visible, wait `random(0, LIM-NET-VISIBILITY-JITTER-MS)`, then (a) fetch `GET /api/p/view` once, applying it if its `rev` is newer, and (b) open the socket if it is not open. The fetch covers sockets that look open but are dead (a common mobile behaviour).
4. **Terminal codes** (section 3) stop reconnecting and show the matching message; `4004` re-joins once first.
5. **On connect** the client sends `hello` with its last `rev`; the server answers with the current `view` regardless.
6. **Applying views.** Apply a view only if its `rev` is greater than the one held; otherwise ignore it. There is no replay and no gap repair.
7. **Reconciling a pending submission** after any applied view:

| Situation in the new view | Action |
|---|---|
| `me.answer.submission_id` equals the pending one | Acknowledged: clear pending, show "Answer received" |
| `me.answered` is true with a different `submission_id` | Another submission was accepted: clear pending, show "You have already answered this" |
| `me.answered` is false, same slide and step, and the screen is `interact` | Resend the same `submission_id` |
| `me.answered` is false and the slide or step changed, or the screen is `closed` | Clear pending, show "Your answer was not recorded because responses closed" |

8. **Server side.** The server builds at most `LIM-NET-VIEW-BUILD-CONCURRENCY` views at once. Beyond that it closes with 4005 (`server_busy`) and the client retries with jitter. A second connection with the same token closes the older one with 4006.
9. **Projector.** The Projector view applies the same rules, shows its "reconnecting" overlay after the first failed attempt, and hides it when a view arrives. It never sends a command.

## 7. State machines (normative)

### 7.1 Presentation

| From | Event | Guard | To | Effects |
|---|---|---|---|---|
| Idle | Start presenting | Interface chosen; slides skipped listed | Starting | Join code generated; participant listener binds |
| Starting | Bind succeeds | | Lobby | QR and join address shown; participants can join |
| Starting | Bind fails | | Idle | `NET_BIND_FAILED`; no fallback |
| Lobby | Facilitator goes to first slide | | Live | First slide opens |
| Live | End presenting confirmed | | Ending | Open slides closed by their policy; incomplete results labelled |
| Ending | Auto-save complete | | Idle | Listener stopped; sockets closed with 1000; event log entry |
| Lobby / Live | Application exits unexpectedly | | (Recovered on next start) | Working directory kept |
| Live | Suspend or clock jump detected | | Live, paused | Timers paused; Facilitator must resume |

### 7.2 Slide response state (while Live)

| From | Event | Guard | To | Effects |
|---|---|---|---|---|
| NotStarted | Facilitator navigates to the slide | Slide Ready | Open | Timer starts if set; Accepting on by default |
| Open | Timer expires or Facilitator presses Close | Close policy = Grace | Closing | Phones show "Closing…" |
| Open | Timer expires or Close | Close policy = Immediate, or *Close now* | Closed | |
| Closing | Grace period elapses | | Closed | |
| Closed | Facilitator switches Accepting on | Poll, or Quiz Question before Reveal | Open | Event log entry |
| Closed | Accepting on attempted | Quiz Question after Reveal | Closed | Refused in the Facilitator Workspace |
| Any | Reset this slide | Slide closed and not current | NotStarted | Responses deleted; safety copy made |

### 7.3 Participant connection

| State | Meaning | Leaves when |
|---|---|---|
| Connecting | First attempt | Socket opens and a `view` arrives (to Connected) |
| Connected | Receiving views | Socket closes or a request fails (to Reconnecting) |
| Reconnecting | Backoff cycle (section 6) | A `view` arrives (to Connected) or a terminal code (to Terminal) |
| Terminal | Presentation ended, removed, protocol mismatch, replaced, bad message | Never; the page shows the reason |

### 7.4 Participant submission

| State | Event | To |
|---|---|---|
| Idle | Participant taps an answer | Sending |
| Sending | Outcome `accepted` or `duplicate` | Acknowledged |
| Sending | Outcome `refused` | Refused (message shown; back to Idle if retry is allowed) |
| Sending | `LIM-NET-SUBMIT-TIMEOUT-MS` elapses with no outcome | Uncertain |
| Uncertain | Connection available | Retrying (same `submission_id`) |
| Retrying | Outcome received | Acknowledged or Refused |
| Uncertain / Retrying | A new view resolves it (section 6, step 7) | Acknowledged or Refused |

## 8. Limits, budgets and abuse controls

All values are in the registry; this section says what happens when one is exceeded.

| Limit | On exceeding |
|---|---|
| `LIM-NET-SUBMISSION-BODY-MAX-BYTES` | 413 `too_large`, nothing parsed |
| `LIM-NET-WS-MESSAGE-MAX-BYTES` | Close 4007 |
| `LIM-NET-PARTICIPANT-VIEW-BUDGET-BYTES` | Not enforced: a target. A view above it is reported in the diagnostic counters |
| `LIM-NET-PARTICIPANT-VIEW-MAX-BYTES` | A defect: the view is not sent and the Facilitator is alerted; tests fail the build if any component can produce one |
| `LIM-NET-CONNECTIONS-PER-ADDRESS` | WebSocket upgrade refused with 429 |
| `LIM-NET-SUBMISSIONS-PER-SECOND` | 429 `rate_limited` (retry after a short delay; the same `submission_id` stays valid) |
| `LIM-NET-JOINS-PER-ADDRESS-PER-MINUTE` | 429 `rate_limited` |
| `LIM-NET-SEND-QUEUE-MESSAGES` | The connection is closed; the client reconnects and receives the current view |

The participant view budget is deliberately small: phones receive only their own view, never the whole leaderboard, word cloud or question list. Stage 2 measures the bandwidth.

## 9. Token lifecycle

| State | How entered | Effects |
|---|---|---|
| Issued | First successful `POST /api/p/join` | Random token set as an `HttpOnly`, `SameSite=Lax` cookie named for the Activity; only its hash is stored |
| Admitted | At issue, if the limit allows | Counts once towards the participant limit; a join number is assigned |
| Active / inactive | Socket connected and ponging, or not | Drives the Active counter |
| Refreshed | Any authenticated request | Lifetime counted from last use (`LIM-AUTH-PARTICIPANT-TOKEN-DAYS`) |
| Removed | Facilitator action (Stage 4) | All requests refused (`removed`); socket closed with 4002 |
| Expired or unknown | Lifetime passed, or records cleared by an Activity Reset | `unauthorized` (401); the page re-joins as a new participant |
| Replaced connection | A second socket with the same token | The older socket closes with 4006 |

If cookies are unavailable the token is kept in `sessionStorage` and sent in a request header and as a WebSocket subprotocol; it never appears in a URL. A token is bound to one Activity ID and is meaningless to any other Activity. The same rules, with their tests, apply to the projector cookie.

## 10. Worked sequences

**A. Join and answer**
1. Phone scans the QR code, opens `/j/K7M2`; the page calls `POST /api/p/join`.
2. Server admits it, sets the cookie, returns `accepted`; the page opens `/ws/p` and sends `hello`.
3. Server sends the `view` (screen `interact`).
4. Participant taps an option; page sends `submit` with a new `submission_id`; shows Sending….
5. Server runs checks 1 to 11, group-commits, replies `accepted`; the page shows "Answer received". Projector and Facilitator views update with a new `rev`.

**B. Lost acknowledgement**
1. As A to step 5, but the reply is lost; after `LIM-NET-SUBMIT-TIMEOUT-MS` the page is uncertain.
2. It retries the same `submission_id`; the server finds it (check 6) and returns `duplicate`.
3. The page shows "Answer received". Exactly one response is stored.

**C. Reconnect after submitting**
1. Participant has answered; the phone locks; the socket dies.
2. On unlock the page waits a small random delay, fetches `/api/p/view`, and reopens the socket.
3. The `view` has `me.answered: true` with the stored `submission_id`; the page shows "You have already answered this" with the stored choice. Tapping another option is refused as `already_answered`.

**D. Close during a submit**
1. The slide's close policy is Grace. The timer expires; the slide is Closing; phones show "Closing…".
2. A submission arrives inside the grace window: checks 7 to 11 pass (the slide is still within its grace window); it is accepted.
3. A submission arriving after the grace window is refused with `closed`. Finalised results never change afterwards.

**E. Projector link**
1. The Facilitator chooses Open projector; the core mints a one-use token and opens `http://127.0.0.1:<port>/projector?t=<token>` in the browser.
2. The server validates the token, sets the cookie, redirects to `/projector`. The token is now invalid.
3. Reloading `/projector` works through the cookie; reusing the old link is refused.

**F. Activity full**
1. The limit is 30 and 30 participants are admitted. A new phone joins: `activity_full` with "This activity is full".
2. An admitted participant whose phone reconnects is **not** refused.
3. The Facilitator raises the limit; the new phone retries and is admitted.

## 11. Facilitator commands (IPC, Stage 1 and 2)

Commands are called in-process from the main window only. Arguments are validated; no command ever returns a secret; errors use catalogue codes. The Tauri capability allowlist is **generated from this table**.

| Command | Arguments (summary) | Returns / effect | Notable errors |
|---|---|---|---|
| `app_get_info` | none | version, platform, data-directory status | `APP_TEST_MODE_NEEDS_DATA_DIR` |
| `activity_new` | name | new tab | |
| `activity_open` | path, mode (`normal`, `read_only`, `copy`, `take_over`) | tab, warnings | `FILE_*` family |
| `activity_save` | tab | saved time | `FILE_SAVE_DISK_FULL`, `FILE_SAVE_FAILED`, `FILE_PERMISSION_DENIED`, `FILE_LOCK_LOST`, `FILE_TARGET_CHANGED`, `FILE_SAVE_VERIFY_FAILED` |
| `activity_save_as` | tab, path | new Activity | same, `FILE_LOCKED` |
| `activity_close` | tab, discard flag | | |
| `recovery_list`, `recovery_resolve` | list; id and action (`recover`, `discard`) | | `FILE_RECOVERY_AVAILABLE` |
| `recent_list`, `recent_clear` | | | |
| `activity_get_state` | tab | dirty flag, slide list with status, runtime state | |
| `slide_add`, `slide_update`, `slide_delete`, `slide_reorder`, `slide_duplicate` | tab, slide, patch | updated state | `SLIDE_LOCKED_BY_RESPONSES` (Stage 3) |
| `slide_validate` | tab, slide | Ready or the list of missing fields | `SLIDE_INCOMPLETE` |
| `edit_undo`, `edit_redo` | tab | | |
| `preview_open`, `preview_step`, `preview_submit`, `preview_simulate`, `preview_close` | tab, slide, count | Preview state (throwaway store) | `SLIDE_INCOMPLETE` |
| `network_list_interfaces` | none | interfaces with recommendation | `NET_NO_INTERFACE` |
| `network_check_start`, `network_check_stop` | interface | join address, device status | `NET_BIND_FAILED` |
| `present_prepare` | tab | incomplete-slide summary, capacity warning | |
| `present_start` | tab, start point, join mode, limit, interface | join address | `NET_BIND_FAILED`, `NET_NO_INTERFACE` |
| `present_end` | confirm | | |
| `present_goto`, `present_step`, `present_set_accepting`, `present_close_now`, `present_timer`, `present_results_visibility`, `present_projector_blank`, `present_projector_freeze` | slide, direction, flags | | |
| `projector_mint_link`, `projector_open` | none | one-use link, opens the browser | |
| `counters_get` | none | Active, Answered, Stored | |

**Events** pushed from the core to the window: `state_changed` (tab, rev), `alert` (code, details), `network_changed`.

## 12. What this document does not yet define

Name change, login, moderation and Quiz messages; Facilitator commands for Reset, export, roster, quiz and moderation; the JSON Schemas of the messages above. These are written just before their stages and the document is extended, never silently changed (`SCHEMA_GOVERNANCE.md` section 8).
