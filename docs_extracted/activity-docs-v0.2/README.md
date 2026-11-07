# Interactive Activity Application: Design Documents and Artefacts

**Status:** design, version 0.2 (2026-10-30). **No product code exists.** Nothing here is verified unless `docs/VERIFIED_VS_ASSUMED.md` says so. The only checks that have been run are on the draft artefacts (`tools/`).

A desktop application for running polls, quizzes, open questions, word clouds and Q&A with participants answering on their own phones over a local network, using single-file documents (`.actvty`).

## What is in this folder

| Folder | Contents |
|---|---|
| `docs/` | The documents (index below) |
| `schema/` | **Canonical artefacts:** JSON Schemas, SQL migrations, the limits registry, the error-code catalogue, the validation-rule catalogue, example files |
| `reference/` | **Generated** readable tables from `schema/`. Never edit by hand |
| `tools/` | `validate_artefacts.py`, `gen_reference.py`, `check_docs.py`, and the **prototype** `reference_validator.py` (not product code) |
| `fixtures/golden/` | `v1-minimal.actvty`, a sample Activity file used by the checks |
| `sketches/` | Four low-fidelity layout sketches (SVG): workspace, live panel, projector question, phone question |

## Document index and reading order

| Document | What it holds |
|---|---|
| `docs/project_vision.md` | Purpose, scale, platforms, principles, what we do not claim, future versions |
| `docs/GLOSSARY.md` | The one set of terms used everywhere |
| `docs/DECISIONS.md` | Confirmed, proposed, open and superseded decisions; revision log |
| `docs/SCHEMA_GOVERNANCE.md` | Canonical artefacts, precedence, versioning, migrations, saving for older formats, change process |
| `docs/PRODUCT_SPEC.md` | What the product does: surfaces, slides, data rules, identity, counters, reports, accessibility |
| `docs/SCREEN_SPEC.md` | Interaction rules and per-screen contract cards (Stage 1 and 2 written) |
| `docs/COMPONENT_SPEC.md` | The Slide Type (component) contract, versioning |
| `docs/PROTOCOL_SPEC.md` | Participant and projector protocol, state machines, checks and retries, reconnect, Facilitator commands (Stage 2 scope) |
| `docs/ARCHITECTURE.md` | Stack, listeners, data flow, storage, diagnostics |
| `docs/SECURITY_FILE_FORMAT.md` | File container, validation, protection, backups, roster login, locking |
| `docs/NETWORKING_AND_DEPLOYMENT.md` | Joining, interfaces, firewalls, venue readiness, packaging, updates |
| `docs/ACCEPTANCE_TESTS.md` | Numbered Given/When/Then scenarios (Stage 1 and 2 written) |
| `docs/QUALITY_AND_RELEASE.md` | Test plan, performance protocol, governance, release checklist |
| `docs/ROADMAP.md` | Spikes and eight stages with exit criteria |
| `docs/VERIFIED_VS_ASSUMED.md` | The honesty ledger |
| `docs/READINESS_AUDIT.md` | Self-audit: problems fixed, open findings, traceability |
| `docs/AGENTS.md` | Working rules for AI assistants and contributors |

## Precedence

If two statements conflict, the earlier wins and the conflict is a defect: (1) confirmed decisions; (2) canonical artefacts in `schema/`; (3) protocol, screen and acceptance documents; (4) product, component, architecture, security and networking documents; (5) vision, quality and roadmap; (6) sketches and examples. See `docs/SCHEMA_GOVERNANCE.md` section 4.

## Running the checks

```
python3 tools/validate_artefacts.py      # schemas, registries, migration, golden file, prototype validator
python3 tools/gen_reference.py           # regenerate reference/ (add --check to test for staleness)
python3 tools/check_docs.py              # cross-references, identifiers, terms, scenario coverage
```
They need Python 3 and the `jsonschema` package. They check the drafts only.

## Conventions

- Values marked *initial* in `reference/limits.md` are starting points to be measured and tuned.
- "Proposed" (`PR-nnn`) means a default chosen by the drafter, not yet accepted by the owner.
- The word *session* is not a product term; see the glossary.
- Material from other projects' documents is not copied into these files; accepted ideas appear as decisions in `docs/DECISIONS.md`.
