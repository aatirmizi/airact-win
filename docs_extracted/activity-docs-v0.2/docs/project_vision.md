# Project Vision

**Status:** design, version 0.2. Nothing described here is implemented or tested unless `VERIFIED_VS_ASSUMED.md` says so. Reading order and document precedence are in `README.md` and `SCHEMA_GOVERNANCE.md` section 4.

## 1. Purpose

A desktop application for running interactive training and teaching activities: polls, quizzes, open questions, word clouds and Q&A, shown on a projector and answered by participants on their own phones over a local network. It works without internet access while an Activity is being presented.

The application is intended to behave like a document-based desktop program: an Activity is a single file that you open, edit, save and share.

## 2. Target scale, platforms and status

- **Participants per Activity:** designed for 30 to 200. This has **not been load-tested**. No capacity figure may be published until the tests in `QUALITY_AND_RELEASE.md` section 6 have produced one, and then only for the conditions tested.
- **Participant devices:** phones, tablets and laptops with browsers from roughly the last four to five years.
- **Facilitator computer:** Windows 10 and 11, and current Fedora and Ubuntu releases.
  - Linux is developed and tested first.
  - **Windows has not yet been verified on a Windows machine.** Until it is, Windows is a target that builds and runs automated tests in CI, not a verified platform (see `ROADMAP.md`, Windows verification plan).
  - macOS is **not supported in version 1** and is planned for a later version.
- **Language:** English-only interface for the first version. Interface text is kept in language resource files from the start. Content (questions, answers, names) must be Unicode-safe and bidirectional-text-safe so participants can use other scripts. A right-to-left or translated interface is a later version.
- **Business model:** intended to be freemium. A free tier is expected to limit participants per Presentation. The limit and any enforcement mechanism are **not decided**; version 1 has a Facilitator-set participant limit and no licence enforcement.
- **Name:** no product name is selected. A neutral internal name and a single display-name constant are used in code (see `QUALITY_AND_RELEASE.md` section 9).

## 3. Principles

1. **Honest communication.** Nothing in the app, the docs, the manual or any promotional text may claim more than is true or tested. No boasting, no vague superlatives, no security words that are not earned. Limitations are stated plainly (section 5). Education must not rest on even small dishonesty.
2. **Local-first, document-centric.** Activities are saved as single desktop files (`.actvty`). Sharing an Activity means sharing a file. Data stays on the Facilitator's computer unless the Facilitator moves it. No telemetry, no analytics, no external runtime assets, no cloud dependency.
3. **No user accounts.** There are no online logins, cloud accounts or Facilitator identity systems. The Facilitator Workspace is controlled by the desktop application itself (in-process IPC), not by a network login.
4. **Strict network separation.** Facilitator control never travels over the network. The Projector view is served on the local machine only (`127.0.0.1`). The participant server listens on the chosen local-network interface *only while an Activity is Live*.
5. **Educational integrity.** Once a slide has stored responses, its content cannot be edited, because even a changed word can change what the results mean. Anonymity labels describe exactly what is and is not stored. Scoring defaults are fair. Reports say what the numbers are based on (section 3a).
6. **Simple data rules.** One cumulative dataset per Activity. Preview never stores data; Presenting does; Reset is the only way to clear it, and a safety copy is made first.
7. **A response is acknowledged only after it is stored.** A participant who sees "answer received" can rely on it. Retries never create duplicates.
8. **Slides built from self-contained components.** Each Slide Type is one component with its own authoring fields, steps, participant logic and views. See `COMPONENT_SPEC.md`.
9. **Untrusted input stays untrusted.** Participant input, imported rosters and Activity files received from others are validated; nothing in them is executed.
10. **One definition per fact.** Every structure, limit, code and rule has a single canonical, machine-readable home; documents point to it instead of repeating it (`SCHEMA_GOVERNANCE.md`).
11. **Files outlive the software.** The file format is versioned independently of the application, strictly validated, upgradable, and (from the second format) writable in older formats.

## 3a. Provenance of results

Because data accumulates across Presentations until Reset, a report must never imply more than it knows. Every report states: when the data was collected (first and last response), how many Presentations contributed, when the last Reset happened, which join mode and response mode applied, the participant limit, and which results are labelled incomplete. Percentages state their denominator. See `PRODUCT_SPEC.md` section 17.

## 4. Presentation model

- The Facilitator builds an Activity from slides. Slides that collect responses are interactive; Content slides (fixed layouts first, free-form later) carry information; video follows later.
- The Facilitator may choose, per slide and live, whether a slide appears on participant devices. Content slides are hidden from phones by default.
- Several Activities can be open at once, each in its own tab with its own editing history. Only one is Live at a time. Slides can be copied between Activities (see the product spec).
- PowerPoint import is a later goal; importing exported slide images as Content slides comes first.

## 5. What we do not claim

- No capacity or speed figure until measured.
- No claim that the local network, or the PIN login, is secure against a determined attacker on the same network. Answers travel unencrypted over plain HTTP.
- No claim that Anonymous slides are untraceable. They are not shown or exported with names; technical users with the file may be able to link them.
- No claim that file protection is strong against weak passwords. A lost password cannot be recovered.
- No claim that Activity files are private on a shared computer: they are created with default permissions and may be readable by other local users.
- No claim that locking prevents all conflicting edits. It is cooperative protection on local disks only.
- No claim of support for macOS, or of verified support for Windows, until tested.
- No claim that offline operation works on venue networks that block device-to-device traffic. Some do.
- No claim of accessibility conformance until an audit has been done. WCAG 2.2 AA is a target.
- No claim that recovery restores answers that were not stored. It restores what was committed.
- No claim of compliance with any privacy or data-protection regulation. Participant data can exist in several places (`SECURITY_FILE_FORMAT.md` section 15); the Facilitator is responsible for lawful use and deletion.
- No claim that the draft artefacts and prototype validator in this repository are product code or evidence that the product works.

## 6. Future versions (not promised)

- Runs (separate datasets in one file) and cohort comparison, including pre/post comparison.
- Content slides with free-form layout; local-file video; PowerPoint import as images, then true import.
- More Slide Types: scales, ranking, true/false, multi-correct, confidence rating, Q&A upvoting.
- Audited invalidation of individual responses (original kept, reason and time recorded).
- Facilitator switches beyond version 1: team mode, per-learner extra time, prediction-before-reveal, think-pair-share timers.
- Projector view on another computer on the local network; slide-clicker support.
- macOS; right-to-left and translated interface.
- Local HTTPS on the participant listener, if testing shows a need.
- Automatic scheduled backups to a Facilitator-chosen folder.
- A new container (for example `.actvtyx`) only if the format ever needs to change in a way older readers cannot handle.
