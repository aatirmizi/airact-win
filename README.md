# AirAct Desktop (Windows)

## Prerequisites
- Node.js 22 LTS
- Git

## Build (Windows)
1. `npm install --legacy-peer-deps`
2. `npm run build`
3. `npx electron-rebuild -f -w better-sqlite3`
4. `npx electron-builder --win`

Output: `dist-electron\*.exe`

## GitHub Actions
Push a `v*` tag or run the workflow manually; download the `windows-installer` artifact.

## Notes
- Keep `electron/`, `dist/`, `server/*.js`, and `package.json` in sync with the source repo.
- Data is stored in `%APPDATA%\AirAct`.
