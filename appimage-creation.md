# AppImage Creation Requirements — AirAct (pulsevote)

## Context
- Web app: React/Vite frontend + Express/WS server (`server.ts`, `server/*`).
- Routes: `/host` (facilitator), `/projector` (big screen), `/` and `/j/` (participants).
- Goal: package as Linux AppImage via Electron, matching previous conversion, for this new version.

## 1. Review of necessary files (before conversion)
- `package.json`, `server.ts`, `server/routes.ts`, `server/hostSecurity.ts`, `server/engine.ts`
- `src/App.tsx`, `src/main.tsx`, `vite.config.ts`, `index.html`
- `src/components/facilitator/Modals/HostAuthScreen.tsx`, `HostSecurityModal.tsx`, `StartPresentingDialog.tsx`, `EndPresentingDialog.tsx`
- `src/components/projector/ProjectorView.tsx`
- `src/utils/pin.ts`
- `src/components/facilitator/FacilitatorHub.tsx` (Present/Display menus)
- Any QR/connectivity display components.

## 2. Route behavior in compiled app
- `/host` is the main app screen. In compiled (Electron) mode, opening the app directs the user to `/host` with NO PIN verification.
- Network access to `http://x.x.x.x:3000/host` must still present `/host` and require the facilitator PIN.
- Compiled mode detected via env flag `ELECTRON_APP=1` injected by main process into the server process.

## 3. Projector interface
- `/projector` must NOT open on app launch.
- Opens only via:
  a. Facilitator selects "Present / Live Session" from Present menu → projector window auto-closes when presenting ends.
  b. Facilitator selects "Projector Screen" from Display menu.
  c. Network access to `/projector` → show a dedicated PIN gate (same facilitator PIN) before granting access; renders as web interface.
- For (a) and (b): projector opens in a normal OS window with maximize/minimize buttons, maximized/fullscreen-preferred on an extended/second monitor if detected, otherwise maximized on primary display.

## 4. Menus
- Suppress Electron's default application menu; use the app's own menus.
- Add a "Quit" item to the File menu that terminates the server process, closes all main and projector windows, and exits the app.

## 5. Server binding and connectivity
- Server binds to `0.0.0.0` on selected port (default 3000, user-selectable).
- Before launch, show an IP/port selection dialog listing only ethernet/wifi IPv4 addresses; persist selection.
- All QR codes and connectivity messages use the selected IP (and port).

## 6. Electron architecture decisions
- Scaffold Electron from scratch: `electron/main.ts`, `electron/preload.ts`, `electron-builder` config targeting AppImage.
- Server runs as a child process (`tsx server.ts`) spawned by main process; killed on quit.
- Projector windows created/tracked by main process (IPC from renderer) for placement and auto-close.
- IP/port selection dialog shown before starting server and opening `/host`.

## 7. Open questions / decisions
- Confirm exact Present/Display menu hook names in `FacilitatorHub.tsx`.
- Confirm how projector-open intent is signaled from renderer to main (IPC channel names).
- Confirm persistence location for IP/port selection (`data/` vs user data dir).
- Confirm whether to auto-maximize or true fullscreen for projector on second monitor.
