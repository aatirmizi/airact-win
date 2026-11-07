# AGENTS.md: Working Rules for AI Coding Assistants and Human Contributors

**Applies once a code repository exists.** These documents describe a design; no product code has been written yet. Read this file first whenever you start work.

## 1. Read order

1. `README.md` (index and precedence)
2. `DECISIONS.md` (what is confirmed, proposed, open, superseded)
3. `GLOSSARY.md`
4. `SCHEMA_GOVERNANCE.md` and the canonical artefacts in `schema/` (and `reference/` for readable tables)
5. The documents for the area you are changing: `PRODUCT_SPEC.md`, `COMPONENT_SPEC.md`, `PROTOCOL_SPEC.md`, `SCREEN_SPEC.md`, `ARCHITECTURE.md`, `SECURITY_FILE_FORMAT.md`, `NETWORKING_AND_DEPLOYMENT.md`
6. `ACCEPTANCE_TESTS.md` (the scenarios you must make pass), `QUALITY_AND_RELEASE.md` (tests you must add) and `VERIFIED_VS_ASSUMED.md` (what is not yet checked)
7. `ROADMAP.md` (which stage you are in) and `READINESS_AUDIT.md` (known gaps)

If a task conflicts with a **Confirmed** decision, stop and ask. If it relies on a **Proposed** default, say so in your report. Never treat your own recommendation as a decision.

## 2. Working method

- Build the **smallest vertical slice** that proves the next requirement end to end, then widen.
- **Start from the scenario.** Find or add the `AT-...` scenario in `ACCEPTANCE_TESTS.md`; write the failing test first, with the scenario ID in its name; then implement.
- Report **exactly** what you ran and its result: passed, failed, skipped, not run, and why. Do not claim a result you did not obtain.
- Update the documents **in the same change** as the behaviour they describe. If code and docs disagree, one of them is a bug; say which.
- Keep changes small and reviewable. One concern per change.
- When something is unclear, ask one precise question rather than guessing, and list what you assumed if you cannot wait.

## 3. Hard rules (do not)

- Do **not** define a field, limit, code or rule in prose or code when it has a canonical home. Change the **canonical artefact** (schema, migration, registry) through the change proposal in `SCHEMA_GOVERNANCE.md` section 8, regenerate `reference/` with `tools/gen_reference.py`, and run `tools/validate_artefacts.py` and `tools/check_docs.py`. Never hand-edit files in `reference/`.
- Do **not** change the file format, a migration, a version number, the lock protocol, the login protocol, listener binding, the acknowledgement path or the protocol contract without explicit review (stop and ask).
- Do **not** add HTTP endpoints for Facilitator control. Control is IPC only, and the Tauri capability list is generated from `PROTOCOL_SPEC.md` section 11.
- Do **not** bind the participant listener to anything but the chosen interface, and never when not Live. Do not add a fallback to a wider binding.
- Do **not** acknowledge a submission before it is durably committed, and do not reorder the checks in `PROTOCOL_SPEC.md` section 5.
- Do **not** trust anything from a participant browser, an imported roster, or an `.actvty` file. Validate on the server, on every request, with the rules in the catalogues.
- Do **not** send correct answers, held reveals or unapproved content to participant devices.
- Do **not** put secrets (tokens, PINs, passwords, verifiers, salts) in URLs, logs, error text, exports, diagnostic reports or the projector.
- Do **not** derive the join address or QR content from a page's own location.
- Do **not** use browser features that exist only on secure origins in the participant page, and do not load any external resource (scripts, fonts, images, analytics, QR services).
- Do **not** add telemetry, accounts, or online dependencies.
- Do **not** silently discard, reopen, edit, truncate or overwrite data. Reset needs confirmation and a safety copy. A failed save must leave the last good file intact.
- Do **not** delete, overwrite or "clean up" a lock file, working directory or user file automatically.
- Do **not** make tests touch the real application data directory or any real Activity file.
- Do **not** add a dependency without a licence check and a maintenance check, and without recording it in the licence inventory.
- Do **not** hard-code interface text; use the language resource files and message keys from the catalogue.
- Do **not** claim capacity, security, accessibility, platform support or durability that `VERIFIED_VS_ASSUMED.md` does not back. If you must describe something unverified, say it is assumed.
- Do **not** copy assets, layouts or text from other products, and do **not** use any candidate product name in code identifiers, file formats, cookies or protocols.
- Do **not** treat the files in `tools/` (the prototype validator, the golden-file builder) as product code. The product re-implements the rules; the prototype only proves they are implementable.
- Do **not** mix in material from other projects' documents; propose it as a change to the decision register instead.

## 4. Definition of done

A change is done when:
- behaviour matches the documents (or the documents were updated and the change is flagged);
- the relevant `AT-...` scenarios pass, and unit and integration tests exist for success **and** failure paths, passing on Linux and Windows CI;
- security-relevant behaviour has the tests listed in `QUALITY_AND_RELEASE.md` section 4;
- user-visible text is in language resource files and escapes user content;
- errors use catalogue codes with a friendly message, a details view and a message key;
- logs contain no secrets (checked);
- the artefact and document checks pass (`QUALITY_AND_RELEASE.md` section 4.11);
- the ledger and decision register are updated if a fact or decision changed;
- the report to the owner states what was verified and what was not.

## 5. Stop and ask when

- a requirement conflicts with a Confirmed decision or another document;
- a change touches the items listed in section 3 as needing review;
- a library is missing a capability the design assumes (record in the ledger and ask before working around it);
- you would have to claim something unverified;
- the stage's exit criteria cannot be met.

## 6. Report format

```
Summary: what changed and why (one paragraph)
Requirements: document sections and scenario IDs implemented
Tests: added / run / results (pass, fail, skipped, not run + reason)
Artefacts: schemas, migrations, registries changed (with the change proposal)
Docs: files updated
Ledger / decisions: items changed or newly assumed
Risks and open questions: anything the owner must decide
Not done: anything deliberately left out
```

## 7. First prompt to use when starting a piece of work

> Read `AGENTS.md`, `README.md`, `DECISIONS.md` and `GLOSSARY.md`, then the documents for <area>. We are in Stage <n> (`ROADMAP.md`). Task: <one specific task>. Follow the working method and hard rules. Start by listing which Confirmed decisions, which Proposed defaults and which `AT-...` scenarios apply, then write the failing tests, then implement the smallest slice, then report using the report format. Do not change any Confirmed decision. Ask if anything is unclear.

## 8. Repository conventions to create in Stage 1

- A neutral internal project name; one display-name constant for the product name.
- Language resource files for all interface text.
- One resolver for the application data directory; tests override it.
- `schema/` (canonical artefacts, moved here from this document set), `reference/` (generated), `tools/` (generator, checks, prototype validator), `fixtures/golden/`.
- A `measurements/` folder for capacity and performance evidence, linked from the ledger.
- `THIRD_PARTY_LICENSES` generated from the licence inventory.
