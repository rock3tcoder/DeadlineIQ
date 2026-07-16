# DeadlineIQ Desktop

Native desktop app for Windows, macOS, and Linux — an Electron shell around the deployed DeadlineIQ web app. Auth, billing, and data stay server-side; the shell adds a real app window, dock/taskbar presence, and opens external links (official sources) in the system browser while keeping the app and Stripe checkout in-window.

## Run in development

```bash
cd desktop
npm install
npm start                              # loads https://deadlineiq.com
DEADLINEIQ_URL=http://localhost:3003 npm start   # point at local dev instead
```

## Build installers

Installers must be built on (or for) their target platform:

```bash
npm run dist          # installer for the current OS
npm run dist:mac      # .dmg   (build on macOS)
npm run dist:win      # .exe   (NSIS installer — build on Windows)
npm run dist:linux    # .AppImage
```

Output lands in `desktop/dist/`. `build/icon.png` is the single 1024px source icon; electron-builder derives all platform formats from it.

For store distribution or auto-update you'll additionally want code signing (`CSC_LINK`/`CSC_KEY_PASSWORD` for macOS/Windows) — see the [electron-builder docs](https://www.electron.build/code-signing).

## Automated builds (CI)

`.github/workflows/desktop-release.yml` builds all three installers on GitHub's macOS/Windows/Linux runners:

- **Push a tag** (`git tag v1.0.0 && git push origin v1.0.0`) → installers are attached to a draft GitHub Release for that tag; review and publish it.
- **Manual run** (Actions → Desktop installers → Run workflow) → installers are uploaded as downloadable workflow artifacts, no release created.
