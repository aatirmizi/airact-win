# System Architecture and Technology Stack

**Status:** design. Nothing here is implemented. Performance and platform statements are expectations, not measurements; see `VERIFIED_VS_ASSUMED.md`. Limits are cited by ID (`reference/limits.md`); message shapes and state machines are in `PROTOCOL_SPEC.md`; structures are defined by the canonical artefacts (`SCHEMA_GOVERNANCE.md`).

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Desktop shell | Tauri v2 | Native menu, file dialogs, opening the Projector view in the default browser, single-instance handling |
| Core | Rust | File model, working directory, locking, response storage, step engine, participant server |
| Local server | Axum on Tokio | Two HTTP listeners (section 3) |
| Storage | SQLite (WAL) via `rusqlite` with the bundled SQLite build, numbered SQL migrations, no ORM | One database per open Activity; the bundled build pins the SQLite version |
| Facilitator UI | React, TypeScript, Tailwind | Runs in the Tauri webview |
| Projector view | React bundle served on the loopback listener | Display-only |
| Participant page | Separate, very small bundle served on the LAN listener | Must not share the Facilitator bundle; size budget set at Stage 2 |
| Shared types | Derived from the canonical JSON Schemas (generated, or hand-written and proven equal by tests: decided by spike S0-7) | TypeScript types are generated from the schemas |
| Libraries to evaluate | `zip` (AES-256 entries), `calamine` (xlsx import), an xlsx writer, `qrcode`, `zeroize`, a JSON Schema validator crate, a virtualized grid library for the roster (for example TanStack Table or Glide Data Grid) | Do not hand-build a grid. Each needs a licence check (`QUALITY_AND_RELEASE.md` section 9) |

Platform note: Tauri uses WebView2 on Windows and WebKitGTK on Linux. WebKitGTK is less consistent than WebView2 and needs testing on the target Fedora and Ubuntu releases. Windows has not been tested on a Windows machine (see `ROADMAP.md`).

## 2. Control and data flow

- **Facilitator control:** Tauri IPC only. The Facilitator Workspace calls Rust commands in-process (`PROTOCOL_SPEC.md` section 11). **No HTTP endpoint exists for Facilitator control.** Only the main window may invoke commands (minimal Tauri capability set, generated from the command list); no remote URL may be loaded in the Facilitator webview, and its content security policy allows only the application's own resources.
- **Projector view:** a browser window on the same computer. It is opened with a **one-time token** that is exchanged for a cookie, then redirected to a token-less URL (section 3). It receives views through a read-only WebSocket and sends nothing back.
- **Participants:** open pages on the LAN listener. They submit with HTTP `POST` (carrying a submission ID) and receive live views through a WebSocket.
- The Rust core is the single source of truth. Every screen is a rendering of core state.
- **The protocol is state-based.** Each live message carries the complete current view for that audience (small by design), stamped with a revision number `rev`. A client applies a view only if its `rev` is newer than the one it holds. There is no event replay and no gap repair: a reconnecting or confused client simply receives the current full view.
- **The join address, the QR code and the projector's displayed address are produced by the core** from the chosen interface address, the participant port and the join code, and delivered to the Projector view as data. A page never derives them from its own location.

## 3. Listeners

| Listener | Binds to | Exists | Route namespaces | Protection |
|---|---|---|---|---|
| Facilitator IPC | In-process | Always | Rust commands | Only the main window; minimal capabilities |
| Projector listener | `127.0.0.1`, random port per launch | While the Activity is open and the Projector view is wanted | `/projector`, `/projector/assets/*`, `/ws/projector` | One-time token then `HttpOnly`, `SameSite=Strict` cookie; Host and Origin checks; read-only; access logs omit query strings |
| Participant listener | The chosen LAN interface address, fixed configurable port | **Only while Live** | `/` (landing page asking for the join code), `/j/*`, `/p/*` (static assets), `/api/p/*`, `/ws/p` | Join code; participant token; rate limits; size limits; no Facilitator or projector routes |

Rules:
- The two HTTP listeners are separate server instances with **separate route tables**. A route that is not in a listener's allowlist must not exist: a request to it returns 404, never 401 or 403.
- The participant listener never binds to `0.0.0.0`, to loopback, or to more than the chosen interface. A bind failure produces a clear error (`NET_BIND_FAILED`); it never falls back to a wider binding and never exposes anything else on the LAN.
- Stopping presenting stops the participant listener. Application exit stops both.
- **Projector token handling.** *Open Projector* mints a token valid for one use and for `LIM-AUTH-PROJECTOR-TOKEN-TTL-S` seconds, builds `http://127.0.0.1:<port>/projector?t=<token>` and opens it in the default browser. The server validates the token, sets the cookie, and responds with a redirect to `/projector`. The token never remains in the address bar, history entry or logs beyond that single request. *Copy projector link* mints a fresh token each time.
- Mandatory automated tests for all of the above are listed in `QUALITY_AND_RELEASE.md` section 4.

## 4. Open-file model (summary)

On open, the Activity file is unpacked into a private **working directory**; the live SQLite database lives there. Saving writes a consistent snapshot of the database, packages it with the authored files and media into a temporary file beside the target, **verifies the new package**, and replaces the target atomically, keeping the previous version as a `.bak`. Locking, validation of untrusted files, protection, recovery and migration are specified in `SECURITY_FILE_FORMAT.md`.

## 5. Slide engine (summary)

Components are compiled in and described by a declarative manifest file validated against a component-manifest schema. The Rust engine is generic: it validates authored content and responses against schemas, runs each slide's step machine, applies response rules and close policy, stores responses, and computes declared aggregates. Custom Rust exists only where a component needs it (quiz scoring). The server decides what each phone receives at each step, so a quiz's correct answer never reaches participant devices before Reveal. Full contract: `COMPONENT_SPEC.md`.

## 6. Storage abstraction

Response storage sits behind a trait with two implementations: a SQLite store (Present) and an in-memory throwaway store (Preview). This is what makes Preview safe: it cannot touch real data.

## 7. Real-time behaviour

The contract (messages, close codes, algorithms) is in `PROTOCOL_SPEC.md`. Architectural points:

- **Views and revisions.** The core keeps one revision counter for the Presentation state. A change builds new views for affected audiences; a view is sent only if different. Persisted state is authoritative; WebSocket delivery is only notification.
- **Reconnect with jitter.** A client that loses its connection retries after a random delay (full jitter) from a base of `LIM-NET-RECONNECT-BASE-MS`, doubling up to `LIM-NET-RECONNECT-MAX-MS`. When the page becomes visible again (a phone is unlocked) it retries at once with a random delay up to `LIM-NET-VISIBILITY-JITTER-MS`. This avoids a reconnect storm after a Wi-Fi hiccup.
- **View-build rate.** The server builds at most `LIM-NET-VIEW-BUILD-CONCURRENCY` views at once and queues the rest, so a mass reconnect cannot starve the response-storage path. If the server is overloaded it may answer `server_busy`, and the client retries with jitter.
- **Liveness.** The server sends WebSocket ping frames every `LIM-NET-PING-INTERVAL-MS`; a participant is **Active** if a pong arrived within `LIM-NET-PONG-TIMEOUT-MS`.
- **Backpressure.** Each connection has a bounded send queue (`LIM-NET-SEND-QUEUE-MESSAGES`). If a slow client overflows it, the server closes that connection; the client reconnects and receives the current view. One slow phone never blocks others.
- **Coalescing.** Results updates to the projector and phones are coalesced to about one every `LIM-NET-RESULT-COALESCE-MS`.
- **Message limits.** `LIM-NET-WS-MESSAGE-MAX-BYTES`, `LIM-NET-SUBMISSION-BODY-MAX-BYTES`, and the participant view budget and cap (`LIM-NET-PARTICIPANT-VIEW-*`).

## 8. Submission path

The contract (checks, outcomes, retries) is in `PROTOCOL_SPEC.md` section 5. Architecturally:

1. The phone generates a **submission ID** (see `NETWORKING_AND_DEPLOYMENT.md` section 8 for how, without secure-origin-only browser features) and sends `POST /api/p/submit` with its participant token.
2. The server validates in the order defined by the contract.
3. The response is written by a **single writer task** that groups submissions into short transactions (up to `LIM-NET-GROUP-COMMIT-MS` milliseconds or `LIM-NET-GROUP-COMMIT-MAX` submissions). **Acknowledgements are sent only after the transaction commits.**
4. A unique constraint on (slide, participant key, submission ID) makes retries idempotent; a repeat returns the original outcome.
5. If the phone does not receive an acknowledgement, it retries the same submission ID. After a reconnect its view says whether an answer is stored. There is no offline answer queue.
6. A crash can leave an in-flight request with an uncertain outcome. The client never assumes success; it reconciles with stored state.
7. **Storage failure** (disk full, read-only filesystem, I/O error): the core refuses new submissions with `storage_error`, acknowledges nothing, alerts the Facilitator on the Facilitator Workspace, and shows participants a neutral "Something went wrong, please try again". Live continues only if the Facilitator chooses to; nothing is silently dropped.

**Durability settings** are explicit, not inherited: write-ahead logging, foreign keys on, a busy timeout, and `synchronous` set to FULL as the starting point. NORMAL may be considered only if measurement shows FULL is a bottleneck and the power-loss consequence is documented. No claim of crash or power-loss durability is made until the interruption tests in `QUALITY_AND_RELEASE.md` pass on Linux and on Windows.

## 9. SQLite rules

- **One writer** (the writer task above); readers use separate connections.
- STRICT tables; foreign keys on; explicit indexes.
- The database carries an application identifier and a schema version (`PRAGMA user_version`). Its tables exist only as numbered migrations (`SCHEMA_GOVERNANCE.md` section 7).
- Untrusted databases are opened defensively (`SECURITY_FILE_FORMAT.md` section 5).
- Payload columns hold JSON text validated by the owning component's response schema before insertion; the column also carries a JSON-validity check.

## 10. Time source

All timing (step opening, elapsed time, close and grace deadlines, rate limits) uses the core's monotonic clock. Phone clocks are never trusted. Timestamps stored in files use UTC.

**Sleep and suspend.** While Live, the app asks the operating system not to sleep or blank the display (assumed possible on both platforms; ledger A-044). On some systems the monotonic clock does not advance while the computer is suspended, so the core also compares it with the wall clock: a large disagreement is treated as a **suspend/resume or clock jump**. Timers are paused, the Facilitator is alerted, the event log records an interruption, and presenting continues only when the Facilitator resumes. Elapsed times measured across such an event are marked unreliable and excluded from speed bonuses.

## 11. Errors, logging and diagnostics

- **Layered errors.** Every user-visible error has a short friendly message that says what happened and the next safe action. A *Details* view shows the technical cause. Codes come from the error-code catalogue (`reference/error-codes.md`); each has a message key in the language resource files.
- **Logs** are local, rotated, and written through a redaction layer. They never contain tokens, PINs, passwords, display names or response content, even at debug level. Access logs omit query strings.
- **Diagnostic report.** A user-initiated, local export containing application version, operating system, web view version, interface summary (private-range flag and masked addresses), listener state, and recent error codes. By default it excludes participant names, responses, tokens, PINs and file paths beyond file names.
- **No telemetry, no analytics, no external requests** at runtime. Update checks follow `NETWORKING_AND_DEPLOYMENT.md` section 11.

## 12. Interface text and fonts

- All interface text is stored in language resource files from day one (English only in version 1).
- User-entered text is displayed with bidirectional-safe rendering.
- Fonts are bundled with the application; no remote fonts. Which fonts to bundle for non-Latin scripts is an open decision, subject to a licence check.

## 13. Undo and redo; multiple Activities

A command history for authoring edits is part of the authoring model from the start. It never records live data. Each open Activity has its own history, working directory, lock and runtime state. Pasting a slide between Activities deep-copies it.

## 14. Application data directory and test isolation

- The application data directory (settings, recent files, logs, working directories, application-level backups, and nothing else) is resolved by **one named function**.
- No automated test, script or tool may read or write the real application data directory or any real Activity file. Tests redirect the resolver to a temporary directory. In test mode, starting without an explicit override **fails** (`APP_TEST_MODE_NEEDS_DATA_DIR`) instead of falling back to the real directory. A test asserts this.

## 15. Performance expectations (not claims)

- Responses are written in grouped transactions. A burst of responses when a step opens is expected to be manageable on one laptop; this is to be measured in the spikes.
- The practical limit is more likely to be the Wi-Fi access point than the laptop.
- No figure is published until measured under the protocol in `QUALITY_AND_RELEASE.md` section 6.

## 16. Testing summary

Unit, integration, crash and interruption, network and real-device tests are specified in `QUALITY_AND_RELEASE.md`; user-visible behaviour is specified as scenarios in `ACCEPTANCE_TESTS.md`. Windows CI runs from Stage 1.
