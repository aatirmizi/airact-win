# Schema and Contract Governance

**Status:** design, with draft Stage 1 artefacts in `schema/` that pass the checks in section 9 (a script, not product code). Terms: `GLOSSARY.md`.

## 1. Principle

Every data structure has **one canonical, machine-readable definition**. Prose documents state requirements, rules and reasons and **point to** the definition. They never repeat field lists, limits or error codes by hand. Anything derived (code types, reference tables, sample files) is generated from, or validated against, the canonical artefact, so descriptions cannot compete.

## 2. The canonical artefacts

| Artefact | Defines | Location |
|---|---|---|
| JSON Schemas | Every JSON structure in the file: manifest, theme, settings, roster (Stage 5), slide envelope, component content and response schemas, and (from Stage 2) participant and projector messages | `schema/*.schema.json` |
| SQL migrations | The database inside the file, as numbered forward-only scripts | `schema/migrations/NNNN_*.sql` |
| Limits registry | Every numeric limit, with an ID and status | `schema/limits.json` |
| Error-code catalogue | Every error and refusal code with category, retry behaviour, message key and acceptance scenarios | `schema/error-codes.json` |
| Validation-rule catalogue | Rules a schema cannot express, with the error code each raises | `schema/validation-rules.json` |
| Component manifests | Per Slide Type: authoring fields, steps, response rule, limits, participant view model, report representation, migrations (written just before the type's stage) | `schema/components/<type_id>/` |

Registries are themselves checked against meta-schemas (`limits.schema.json`, `error-codes.schema.json`, `validation-rules.schema.json`).

**Generated reference tables** (never edited by hand) are in `reference/`: `limits.md`, `error-codes.md`, `validation-rules.md`, `file-format.md`, produced by `tools/gen_reference.py`. A CI check fails if they are stale.

## 3. Where each kind of fact lives

| Kind of fact | Canonical home | Prose documents say |
|---|---|---|
| Field names, types, required or optional, defaults, patterns | JSON Schema | Why the field exists and what rules apply |
| Numeric limits | Limits registry (`LIM-...`) | The reason; quote the ID, not the number |
| Error and refusal codes | Error-code catalogue | When the code is raised and what the user sees |
| Rules that span files or need code | Validation-rule catalogue (`VAL-...`) | Why the rule exists |
| Database tables and constraints | SQL migrations | What the data means |
| Message shapes (Stage 2 on) | JSON Schemas for messages | The sequence and the state machines in `PROTOCOL_SPEC.md` |
| Behaviour a user sees | `ACCEPTANCE_TESTS.md` (Given/When/Then) | Cite the scenario ID |

A prose document may **illustrate** with an example, labelled non-normative. It may not **define** a field, limit or code that has a canonical home.

## 4. Document precedence

If two statements conflict, the earlier item wins and the conflict is a defect to fix:

1. `DECISIONS.md` (Confirmed decisions)
2. Canonical artefacts (schemas, migrations, registries)
3. `PROTOCOL_SPEC.md`, `SCREEN_SPEC.md`, `ACCEPTANCE_TESTS.md`
4. `PRODUCT_SPEC.md`, `COMPONENT_SPEC.md`, `ARCHITECTURE.md`, `SECURITY_FILE_FORMAT.md`, `NETWORKING_AND_DEPLOYMENT.md`
5. `project_vision.md`, `QUALITY_AND_RELEASE.md`, `ROADMAP.md`
6. Sketches and examples

## 5. Files inside an Activity

| Entry | Content | Canonical definition |
|---|---|---|
| `manifest.json` | Identity, versions, slide order, `requires`, media index | `manifest.schema.json` |
| `theme.json` | Palette and fonts | `theme.schema.json` |
| `settings.json` | Activity-wide settings (Stage 1: content language) | `settings.schema.json` |
| `roster.json` | Optional roster (Stage 5) | written before Stage 5 |
| `slides/<id>.json` | One file per slide | `slide.schema.json` plus the type's content schema |
| `media/<id>.<ext>` | Images | manifest media index |
| `data.db` | SQLite snapshot of runtime data, always present | migrations |

Authored content is JSON (readable, diff-able, validated before use, copied between Activities as plain files). Runtime data is SQLite (atomic commits, uniqueness rules, crash recovery, aggregation). Putting responses in JSON would mean re-building a database by hand; putting authored content in SQL would hide it from inspection and make validation harder.

## 6. Versioning

Three integers, each with its own meaning:

| Number | Where | Changes when |
|---|---|---|
| `format_version` | `manifest.json` | The file scheme changes (any field added, removed or reinterpreted in any canonical JSON structure, any new entry kind, any migration after the first release), or a substantial new capability needs it. **Not** with every application release. |
| `data_schema_version` | manifest and database `user_version` | A new migration is applied. Every migration after the first release also bumps `format_version`. |
| `type_version` | each slide | That Slide Type's content or response schema changes |

Rules:
- **Strict readers.** Unknown fields are rejected. Therefore every added field is a scheme change that bumps `format_version`, and an older application refuses a newer file with "created by a newer version".
- **New Slide Types do not bump `format_version`.** A slide is a generic envelope; its content is validated by the type's own schema; responses are stored as JSON validated by the type's response schema. A file using a type this application does not know opens **read-only**, cannot be saved over, and may be saved as a copy.
- **The format version has no relationship to the application version number.** A mapping from format versions to the application versions that read and write them is kept in this document (section 10) and is what the Save As list shows.
- **A future incompatible container** (a different packaging, not just a new version) would use a new extension such as `.actvtyx`; the application recognises files by content, not by name.

## 7. Migrations and saving for older versions

**Upgrading (older file, newer application)**
- Runs on the working copy; the saved file changes only on Save; the first upgrading save keeps the original as the `.bak`.
- Database migrations are forward-only numbered SQL files run in **one transaction**. A table rebuild preserves every column, index, constraint and foreign key and never invents data. Component migrations run in the same transaction.
- Every released format version contributes a **golden file**; every later version opens every golden file in tests.

**Saving for older versions (newer application)**
- One entry point: the **Save As** "Save as type" list shows the current format and up to **two** older ones, labelled by application version (for example "Activity, readable by versions 1.2 to 1.4"). Version 1 has none.
- A **compatibility check** runs first and lists what will be dropped or simplified (slide types the older version lacks, newer fields). The user chooses *Save copy* or *Cancel*. The original is never modified; the result is a new, independent Activity (new Activity ID).
- Each format change ships **one converter to the previous format** (or an explicit "not convertible, because ..."). Converting two versions back chains two converters. Each converter has tests, and its output is validated against the old version's schemas, which are kept in the repository (`schema/released/<format_version>/`).

## 8. Changing a canonical artefact

**Before the first release:** changes are free. Migrations may be rewritten or squashed; golden files regenerated. A change still follows the proposal below so documents and tests stay aligned.

**After the first release:** a change must bump the right version number, ship the upgrade migration (and the downgrade converter when two or fewer older versions exist), add or update golden files, update `ACCEPTANCE_TESTS.md`, and regenerate `reference/`.

**Change proposal** (a short note in the change description):

1. What changes (artefact and fields).
2. Why (requirement or decision).
3. Which version numbers change, and why.
4. Migration and converter, if any.
5. Limits and error codes added or changed.
6. Golden and example files added.
7. Documents and scenarios affected.
8. Whether any Confirmed decision is affected (then stop and ask).

## 9. Checks (CI, and today as scripts)

`tools/validate_artefacts.py` currently verifies, and CI must keep verifying:
- every schema is a valid JSON Schema (2020-12);
- registries validate against their meta-schemas; IDs and codes are unique; every rule's error code exists; every limit named in a rule exists;
- every `x-limit` annotation in a schema equals the registry value;
- every `examples/valid` file validates and every `examples/invalid` file fails;
- migration `0001` applies, sets the application identifier and `user_version`, creates only the expected STRICT table and no triggers or views;
- the golden file passes every file rule, and a crafted bad file triggers each rule it is meant to trigger (a prototype validator, `tools/reference_validator.py`, is used for this and is **not** product code).

`tools/gen_reference.py --check` fails if `reference/` is stale. `tools/check_docs.py` checks cross-references, identifiers, terms and scenario coverage.

## 10. Format version registry

| Format version | Application versions | Notes |
|---|---|---|
| 1 | first release onward | Initial format. No older format exists, so no downgrade is offered |

## 11. Stage plan for artefacts

| Stage | Artefacts written (just before the stage) |
|---|---|
| 1 | Container, manifest, theme, settings, slide envelope, media index, file-validation limits and rules, file error codes, migration 0001 (**done in draft**) |
| 2 | Poll component schemas, participant and projector message schemas, migration 0002 (participants, responses, duplicate keys, slide runtime), network limits and protocol codes |
| 3 | Event log table, Content slide, close-policy fields, edit-lock rules |
| 4 | Quiz and Leaderboard schemas, quiz settings |
| 5 | `roster.json`, login messages |
| 6 | Open Question, Word Cloud, Q&A |
| 7 | Protection rules, report formats |
