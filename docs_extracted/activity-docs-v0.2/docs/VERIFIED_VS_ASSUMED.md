# Verified versus Assumed

**Purpose:** the honesty ledger. Every factual statement the design depends on, and whether it has been checked. **A claim in the app, the manual or release notes may rest only on an item marked Verified.** Everything else must be worded as an assumption or left out.

**Status values**
- **Verified:** checked by a test, measurement or calculation recorded here, with the date and where the evidence is kept.
- **Reported:** stated by outside sources that were read, but **not tested by us**.
- **Assumed:** believed, not checked.
- **Refuted:** checked and found false; the design must change (link the decision).

As of 2026-10-30 **no product code exists**. The only verified items are about the *draft artefacts* (schemas, registries, migration, sample file, prototype validator) and one calculation. They say the drafts are consistent and the rules implementable; they say **nothing** about whether the product works.

## 1. Verified

| ID | Statement | Evidence | Date |
|---|---|---|---|
| V-001 | The planned PIN space is 16 consonants × 5 vowels × 16 consonants × 5 vowels = 6,400 words, times 8⁴ = 4,096 digit groups (digits 2 to 9) = 26,214,400 combinations, about **24.6 bits** | Arithmetic, recomputed when drafting | 2026-10-29 |
| V-002 | The seven Stage 1 JSON Schemas (manifest, theme, settings, slide, and the three registry meta-schemas) are valid JSON Schema draft 2020-12 | `python3 tools/validate_artefacts.py`, `jsonschema` 4.26.0 | 2026-10-30 |
| V-003 | The limits registry (66 entries), error-code catalogue (47 codes) and validation-rule catalogue (32 rules) validate against their meta-schemas, have unique IDs, and are mutually consistent (every rule's error code exists; every limit named in a rule exists; every `x-limit` annotation equals the registry value) | Same script (56 checks, all passing) | 2026-10-30 |
| V-004 | Migration `0001_initial.sql` applies on SQLite 3.45.1 (the Python build in the drafting environment), sets the application identifier and `user_version`, and creates only one STRICT table with no trigger or view. **This is not the SQLite build the product will bundle** | Same script | 2026-10-30 |
| V-005 | The golden sample file `fixtures/golden/v1-minimal.actvty` passes every file rule the prototype implements, and each of 29 crafted bad files triggers the rule it targets. Rules **not** exercised by the prototype: `VAL-D-005` (integrity failure on a database that still opens), `VAL-S-001` (save-time re-validation), `VAL-P-001` (protection) | Same script, `tools/reference_validator.py` (a prototype, not product code) | 2026-10-30 |
| V-006 | `reference/*.md` is generated from the canonical files and is current | `python3 tools/gen_reference.py --check` | 2026-10-30 |

## 2. Reported (read, not tested)

| ID | Statement | Source and caveat | Needed by |
|---|---|---|---|
| RP-001 | Chrome's October 2026 move to HTTPS-by-default for browsing is reported to **leave private and local addresses usable over HTTP without a warning** | Security-press coverage and Google's security blog posts read on 2026-10-29. Policies change; not tested on a device | Stage 2 spike S0-4 |

## 3. Assumed: platform, browser and network behaviour

| ID | Assumption | How to verify | Needed by |
|---|---|---|---|
| A-001 | A built-in Windows hotspot allows only a small number of clients (about 8) | Test on a Windows machine, or find the vendor limit | Stage 8 |
| A-002 | Many venue and guest Wi-Fi networks isolate clients from each other | Test in the venues we use | Stage 8 trials |
| A-003 | `.local` (mDNS) names are unreliable on phones, so they are not used | Test on target phones (optional, since the design does not use them) | Optional |
| A-004 | `crypto.getRandomValues` is available to pages served over plain HTTP on private addresses | Real Android and iOS browsers | Spike S0-4 |
| A-005 | `crypto.randomUUID`, `crypto.subtle`, the clipboard API, service workers and the screen wake lock are **not** available on plain HTTP | Same devices | S0-4 |
| A-006 | An `HttpOnly` `SameSite=Lax` cookie set by the participant listener is stored and sent on the WebSocket handshake on target phones | Same devices | S0-4 |
| A-007 | Cookies are shared across ports on the same host, so cookie names must include the Activity identifier | Test two ports on one address | S0-4 |
| A-008 | The `sessionStorage` fallback and a token in the WebSocket subprotocol work on target browsers | Same devices | S0-4 |
| A-009 | A locked phone drops its WebSocket and recovers on unlock via the page-visible event | Same devices, Android and iOS | S0-4 |
| A-010 | Safari on iOS keeps a server-set cookie on a private-IP origin for several days | Real iPhone test | S0-4 |
| A-011 | A browser window can be made full screen on a second display (F11) on Fedora and Ubuntu under both Wayland and X11 | Spike | S0-3 |
| A-012 | Wayland prevents applications from positioning windows themselves, which is why the Projector view is a browser window | Check documentation and test | S0-3 |
| A-013 | WebKitGTK behaviour is less consistent than WebView2, and the Tauri features we need work on the target distributions | Spike | S0-6 |
| A-014 | Stock Fedora web engines may not play H.264/AAC video; WebM is safer (video is a later feature) | Test when video is planned | Later |
| A-015 | The Fedora and Ubuntu firewall command examples work as written | Spike | S0-5 |
| A-016 | The Windows firewall prompt appears on first bind, and choosing private networks only is possible | Hands-on Windows test | Stage 2 end |
| A-017 | Browsers answer WebSocket ping frames automatically, so ping and pong measure liveness without application code | Test on target browsers | Stage 2 |
| A-018 | The `visibilitychange` event fires reliably when a phone is unlocked, and a fetch at that moment detects a dead socket | Same devices | S0-4 |
| A-019 | A cookie set on a redirect response from the loopback listener (`SameSite=Strict`) is stored and sent by the default browsers we target | Spike | S0-3 |

## 4. Assumed: libraries and files

| ID | Assumption | How to verify | Needed by |
|---|---|---|---|
| A-020 | The pinned `zip` crate supports **writing** AES-256 entries and detects a wrong password | Spike and unit tests | S0-2 |
| A-021 | SQLite's backup mechanism produces a consistent single-file snapshot from a database in write-ahead mode | Spike and test | S0-2 |
| A-022 | The bundled SQLite version supports STRICT tables and the defensive options we plan | Check at dependency pin | Stage 1 |
| A-023 | `synchronous=FULL` with grouped commits gives acceptable throughput for our bursts | Measure | Stage 2 |
| A-024 | Atomic replacement on Windows works reliably despite antivirus and indexing | Windows test | Stage 2 end |
| A-025 | Windows user-profile temporary directories are owner-only by default | Check ACLs | Stage 1 CI/hands-on |
| A-026 | `calamine` reads the Excel files we expect; our XLSX writer can write text strictly as strings | Tests | Stage 5 and 7 |
| A-027 | Tauri v2 can restrict commands to the main window, block remote content, and handle single instance and file association as planned | Spike | S0-6 |
| A-028 | A local QR generator and the bundled hash/HMAC library fit within the participant bundle budget | Build and measure | Stage 2 |
| A-029 | The database application identifier `1094931542` does not collide with another well-known format | Check public registries | Before release |

## 5. Assumed: capacity and performance

| ID | Assumption | How to verify | Needed by |
|---|---|---|---|
| A-030 | One laptop can serve 100 to 200 participants for the planned activity types | `QUALITY_AND_RELEASE.md` section 6 | Stage 8 (first look at Stage 2) |
| A-031 | The access point, not the laptop, is the likely limit | Same protocol | Stage 8 |
| A-032 | Grouped commits at the registry window and size are a suitable starting point | Measure | Stage 2 |
| A-033 | A reconnect storm of all phones recovers within seconds with jitter and a view-build cap | Measure | Stage 2 |
| A-034 | Participant views stay within their size budget for every component | Measure each component | Stage 2 onward |

## 6. Assumed: schemas, protocol and tooling

| ID | Assumption | How to verify | Needed by |
|---|---|---|---|
| A-035 | A Rust JSON Schema validator rejects unknown fields and enforces our patterns and limits the way the Python validator does | Run both on the examples and golden file | S0-7 |
| A-036 | Rust and TypeScript types can be generated from the schemas, or hand-written types can be proven equal | S0-7 | Before Stage 1 |
| A-037 | The order-of-checks table and the duplicate matrix in `PROTOCOL_SPEC.md` are complete and mutually consistent | Tests derived from each row | Stage 2 |
| A-038 | The draft message tables in `PROTOCOL_SPEC.md` convert cleanly to JSON Schemas | Write the schemas | Stage 2 start |

## 7. Assumed: product design

| ID | Assumption | How to verify | Needed by |
|---|---|---|---|
| A-040 | Phones from roughly the last four to five years support everything the participant page uses | Device and browser matrix | Stage 8 |
| A-041 | Facilitators will use the Network Check and a real-device test before events | Observe real use | Stage 8 |
| A-042 | Social visibility of the joined list discourages impersonation in a room | Observe real use | Stage 8 |
| A-043 | Learning-mode defaults (speed bonus off, leaderboard off) suit most training use | Facilitator feedback | Stage 8 |
| A-044 | The application can ask Windows and the target Linux desktops to stay awake while Live, and can detect suspend or clock jumps | Spike and tests | Stage 2 |
| A-045 | The default participant limit is a safe starting point on typical hardware | Measure | Stage 2 |
| A-046 | The sketched layouts are usable for a Facilitator running a real session | Pilot, usability check | Stage 2 |
| A-047 | The default keymap does not clash with the desktop environments and browsers in use | Stage 2 usability checks | Stage 2 |

## 8. How to update this file

1. Run the check named in "How to verify".
2. Store the evidence (test name, raw measurements, screenshots, source link) with the commit that produced it.
3. Change the status, add the date, and link the evidence.
4. If refuted, create a decision in `DECISIONS.md` and fix every document that relied on the statement.
5. Never promote an item to Verified from memory or from a similar product.
