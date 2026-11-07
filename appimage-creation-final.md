# AppImage Creation — Final (AirAct / Clik8)

## Decisions
- Server model: **in-process** Express/WS in Electron main (not child process). Native modules rebuilt via electron-rebuild.
- IP/port selection dialog: **implement now** (list LAN IPv4, persist, use in QR codes).
- Compiled-mode PIN bypass: **skip** — `/host` always requires facilitator PIN.
- Menus: suppress Electron default; keep app menus; add Quit (warns on unsaved).
- Projector: not auto-open on launch; opens on Present/Live Session or Display menu; framed, closable, resizable; auto-close when presenting ends (TODO).
- Data/backups/host-security paths: writable user-data dir via env vars.

## Files to review before conversion
package.json, server.ts, server/routes.ts, server/hostSecurity.ts, server/engine.ts, server/db.ts, server/fileManager.ts, src/App.tsx, src/main.tsx, vite.config.ts, index.html, HostAuthScreen.tsx, HostSecurityModal.tsx, StartPresentingDialog.tsx, EndPresentingDialog.tsx, ProjectorView.tsx, utils/pin.ts, FacilitatorHub.tsx.

## Build steps (Fedora)
1. npm i -D electron electron-builder --legacy-peer-deps
2. npm run build
3. npx electron-rebuild -f -w better-sqlite3
4. npm run electron:build:linux (AppImage)
5. Run AppImage.

## Packaging config
- main: electron/main.cjs
- build.files: dist/**, server/**, server.js, electron/**, package.json
- linux.target: AppImage (plus deb/rpm if libcrypt-compat installed)
- author + description set in package.json.

## Open items
- IP/port selection dialog implementation.
- Projector auto-close on end presenting.
- Network /projector PIN gate.
- Electron main menu suppression already done.
