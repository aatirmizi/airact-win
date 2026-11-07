# Desktop Build Guide (Electron)

## 1. Folder layout (already created)
```
click8/
  electron/          # main process + preload (NEW)
  .github/workflows/ # Windows CI (NEW)
  src/ server/       # unchanged app
```
All new files stay inside `click8/`.

## 2. Install Electron tooling (Fedora)
```bash
npm i -D electron electron-builder
npm i -D @types/node
```

## 3. Package scripts (add to package.json)
```json
"electron:dev": "npm run build && electron electron/main.ts",
"electron:build:linux": "npm run build && electron-builder --linux",
"electron:build:win": "npm run build && electron-builder --win"
```

## 4. electron-builder config (add to package.json)
```json
"build": {
  "appId": "com.skillupgrade.clik8",
  "productName": "Clik8",
  "files": ["dist/**", "server/**", "electron/**", "package.json"],
  "directories": { "output": "dist-electron" },
  "linux": { "target": ["AppImage", "rpm", "deb"] },
  "win":   { "target": ["nsis"] }
}
```
Note: one `.rpm` does NOT work on Ubuntu. Use `AppImage` for universal Linux, `.deb` for Ubuntu/Debian, `.rpm` for Fedora/RHEL.

## 5. Linux build on Fedora
```bash
npm run build
npm run electron:build:linux
```
Outputs in `dist-electron/`. Install with `sudo dnf install dist-electron/*.rpm` or run the `.AppImage`.

## 6. Windows build via GitHub
Push a tag `v*` or run the workflow manually. Artifact `windows-installer` contains the `.exe`. For code signing, add secrets `WIN_CSC_LINK`/`WIN_CSC_KEY_PASSWORD` to the repo.

## 7. Native module rebuild
`better-sqlite3` must be rebuilt for Electron:
```bash
npx electron-rebuild -f -w better-sqlite3
```
Run after `npm install` and before packaging.

## 8. Firewall / intranet
Fedora: `sudo firewall-cmd --add-port=3000/tcp --permanent && sudo firewall-cmd --reload`. Participants connect to `http://<host-lan-ip>:3000`.

## 9. Future app updates (AI Studio re-clone)
Keep `electron/` and `.github/` outside the re-cloned app tree? They are inside `click8/`. On re-clone, preserve these two folders; re-run steps 2-7. No major rework expected unless native deps change.
