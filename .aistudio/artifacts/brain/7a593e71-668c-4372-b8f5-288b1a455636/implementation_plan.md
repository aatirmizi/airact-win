# Facilitator Workspace Redesign: Welcome Hub, Editor Layout, & Dynamic Aspect Ratio

Transform the AirAct Facilitator experience into a modern, dual-state application: a welcoming, high-impact **Facilitator Hub / Home Dashboard** on initial launch, and a dedicated **Slide Editor View** with an integrated Context Bar, clickable theme inspector activation, persistent top navigation, and multi-format aspect ratio support (16:9, 16:10, 4:3).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Verdict on User Specification:**
> The proposed architecture is approved with enthusiastic recommendation. The separation of concerns between the **Facilitator Hub (Home Dashboard)** and the **Active Slide Editor** elevates AirAct to an enterprise-grade presentation suite (comparable to modern Figma or Keynote workflows).
>
> **Key Enhancements Included in this Plan:**
> 1. **Persistent Top Bar**: Stays visible across all modes (Home Hub, Editor, Rehearse/Preview, Settings).
> 2. **Two-Section Hub**: 
>    - **Left (60%)**: Engaging visual showcase of AirAct capabilities (real-time live polls, synchronized projector, zero-install participant phones, instant QR codes).
>    - **Right (40%)**: Quick-action cards with icons and soft drop shadows (New/Edit Activity, Projector Alignment Test, Network & Device Diagnostic, Start Live Session, Default Settings, and Recent Sessions).
> 3. **Top Banner Streamlining**: Remove the `Activity: ...` pill from the top banner to eliminate clutter.
> 4. **Editor Context Bar**: Positioned immediately above the workspace containing `Slides (n)`, `Undo/Redo`, `+ Add Slide`, the editable `Activity: [Name]` title, and the clickable `Theme: [Name]` pill.
> 5. **Aspect Ratio Toggle (16:9, 16:10, 4:3)**: Persisted in `activity.settings.aspect_ratio` and respected across Editor Canvas, Preview Rehearsal, and Projector screens.
> 6. **File -> Close Activity**: Returns the host to the Facilitator Hub safely, prompting if unsaved changes exist.

---

## 1. Overview & Core Concept

### What It Delivers
- **Dual-State Facilitator Experience**:
  1. **Home / Facilitator Hub**: The zero-state landing experience when no activity is currently being edited. Provides clear onboarding, system health diagnostics, projector alignment testing, and rapid jump-off points.
  2. **Active Slide Editor**: The authoring environment that opens when creating a new activity, selecting a template, or opening an existing deck.
- **Office-Style Navigation Persistence**: The top navigation bar remains accessible at all times, including during Rehearsal / Preview and in-canvas settings.
- **Hardware-Adaptive Aspect Ratio**: Seamlessly adapts to modern widescreen venue displays (16:9, 16:10) as well as legacy institutional projectors (4:3) with dynamic stage scaling.

---

## 2. User Experience & Visual Design

### A. The Facilitator Hub (Initial Landing Screen)
When the user accesses the Facilitator interface without an active deck (or clicks `File -> Close`):
- **Layout Split**: 
  - **Left Section (~60%)**: "AirAct Community Learning & Presentation Suite"
    - Visual capability hero: Real-time audience aggregation, live word clouds, interactive quizzes with countdowns and podiums, crowdsourced Q&A.
    - Live System Status banner: Local IP address, WebSocket gateway health, active port, and participant join link preview.
    - Subtle textured background with high-contrast text.
  - **Right Section (~40%)**: "Quick Facilitator Actions" (Grid of elevated cards with drop shadows and distinct icons):
    1. **Start Designing / New Activity**: Creates or opens slide authoring.
    2. **Template Gallery**: Browse curated workshops (Town Hall, Live Quiz, Sprint Retrospective).
    3. **Test / Adjust Projector Screen**: Opens a dedicated test alignment window (`/projector`) with alignment crosshairs, aspect grid, and color check.
    4. **Network & Device Setup Test**: Displays QR code test pattern, participant phone simulator link, and network latency probe.
    5. **Start Live Presentation**: Directly launches session presentation mode if an activity is ready.
    6. **Session & Security Defaults**: Jump directly to Host PIN, Attendees Roster, or Default Timer settings.

### B. The Active Editor View
Once an activity is opened:
- **Top Banner**: Logo + AirAct brand + File / Present / Display / Settings menus + Theme toggle + Host status. (`Activity: ...` is removed from this top banner).
- **Editor Context Bar** (Top sub-bar):
  ```
  [Slides (4)] [Undo] [Redo] [+ Add Slide]  ───  [Activity: Leadership Town Hall ✎]  ───  [Theme: Nordic Frost ▾]
  ```
  - Clicking on the `Theme: ...` pill immediately highlights and focuses the Theme selector in the right sidebar.
- **Center Canvas Header**:
  ```
  Slide Canvas · Poll Question                     [Undo] [Redo] · Aspect Ratio: [ 16:9 | 16:10 | 4:3 ]
  ```
- **Center Stage**:
  - Dynamically sized container adhering strictly to the selected aspect ratio:
    - `16:9`: `w-full max-w-4xl aspect-[16/9]`
    - `16:10`: `w-full max-w-4xl aspect-[16/10]`
    - `4:3`: `w-full max-w-3xl aspect-[4/3]`
  - Content within automatically scales and centers without clipping.
- **Top File Menu Updates**:
  - `Close Activity` is added to the File dropdown:
    - Enabled when an activity is open for editing.
    - Returns to the Facilitator Hub.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Aspect Ratio Storage Location**
  - *Chosen Approach*: Store `aspect_ratio: '16:9' | '16:10' | '4:3'` inside `activity.settings.aspect_ratio` (defaulting to `'16:9'`).
  - *Why*: Allows the setting to be saved in activity JSON files, synced over WebSockets to Projector screens, and preserved across sessions.
  - *Alternative Considered*: Client-only state. *Rejected* because projectors and facilitators would become desynchronized if set only in browser memory.

- **Decision 2: Top Banner Continuity During Preview / Rehearse**
  - *Chosen Approach*: Embed the Preview / Rehearsal pane directly below the persistent Navbar instead of a fixed modal overlay that covers the entire viewport.
  - *Why*: Facilitators can instantly close Preview, switch views, or adjust projector settings without losing their global navigation anchor.

- **Decision 3: Zero-Friction Transition Between Hub and Editor**
  - *Chosen Approach*: Keep the activity state in `PresenterContext`. When `isActivityOpen` is false (or `activeView === 'hub'`), render the Facilitator Hub. When the user clicks "Start Designing", "Open", or a template, `isActivityOpen` switches to true and loads the Editor.

---

## 4. Technical Architecture & Component Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Top Navbar (Always Visible)                          │
│  [Logo AirAct] [File ▾] [Present ▾] [Display ▾] [Settings ▾] [Theme/Host]│
└────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌──────────────────────────────────┐      ┌───────────────────────────────┐
│ Facilitator Hub (Welcome / Home) │      │ Active Slide Editor View      │
│  ├─ Left: Feature Showcase (60%) │      │  ├─ Editor Context Bar:       │
│  │   • Live interactivity hero   │      │  │   [Slides(n)] [Undo/Redo]  │
│  │   • Network & Server status   │      │  │   [+ Add] [Activity Name]  │
│  │   • Feature deep dive         │      │  │   [Theme Pill -> Inspector]│
│  └─ Right: Action Cards (40%)    │      │  ├─ Left: SlideSidebar        │
│      • [Start Designing / Edit]  │      │  ├─ Center: SlideCanvas       │
│      • [Template Gallery]        │      │  │   • [16:9|16:10|4:3 Toggle]│
│      • [Projector Alignment]     │      │  │   • Dynamic Aspect Stage   │
│      • [Network Setup Test]      │      │  ├─ Right: Inspector Panel    │
│      • [Start Presenting Live]   │      │  └─ Rehearsal Preview Pane    │
│      • [Session Settings]        │      └───────────────────────────────┘
└──────────────────────────────────┘
```

---

## 5. Execution Steps

1. **State & Types Extension (`src/types/activity.ts` & `src/context/PresenterContext.tsx`)**:
   - Add `aspect_ratio?: '16:9' | '16:10' | '4:3'` to `ActivitySettings`.
   - Add `isActivityOpen: boolean` and `closeActivity: () => void` to `PresenterContext`.
   - Add `setAspectRatio: (ratio: '16:9' | '16:10' | '4:3') => void` helper.
2. **Top Navigation Updates (`src/components/common/Navbar.tsx`)**:
   - Remove the `Activity: ...` box from the top banner.
   - Add `Close Presentation` to the `File` menu (active only when `isActivityOpen` is true).
   - Ensure `Navbar` remains visible during Preview / Rehearse.
3. **Facilitator Hub Component (`src/components/facilitator/FacilitatorHub.tsx`)**:
   - Build the 60/40 two-column responsive layout.
   - Design high-fidelity cards with Lucide icons, hover micro-interactions, and direct handlers.
   - Integrate network diagnostic and projector alignment testing tools.
4. **Editor Context Bar & Inspector Theme Activation**:
   - Create the contextual top strip in `Workspace.tsx` / `SlideCanvas.tsx` holding `Slides (n)`, `Undo/Redo`, `+ Add Slide`, `Activity: [Name]`, and `Theme: [Name]`.
   - Wire clicking the theme name to focus the Theme selector tab in `Inspector.tsx`.
5. **Aspect Ratio Toggle & Dynamic Stage**:
   - Add the `16:9` / `16:10` / `4:3` segmented control in `SlideCanvas.tsx`.
   - Implement dynamic CSS aspect ratio container scaling for the stage in `SlideCanvas.tsx`, `PreviewPane.tsx`, and `ProjectorView.tsx`.
6. **Compilation & Verification**:
   - Validate with `compile_applet` and `lint_applet` for 0 errors.
