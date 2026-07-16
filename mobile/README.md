# DeadlineIQ Mobile (iOS + Android)

Native mobile apps built with [Capacitor](https://capacitorjs.com) — a native WebView shell around the deployed DeadlineIQ web app, ready for the App Store and Play Store. Auth, billing, and data stay server-side.

## Prerequisites

- **iOS:** a Mac with Xcode 15+ and CocoaPods
- **Android:** Android Studio with an SDK installed

## Setup (one time)

```bash
cd mobile
npm install
npx cap add ios          # generates the ios/ Xcode project
npx cap add android      # generates the android/ Gradle project
npm run assets           # generates all icon + splash sizes from resources/
npx cap sync
```

The generated `ios/` and `android/` directories are intentionally gitignored — they're reproducible from the commands above. Remove them from `.gitignore` once you start customizing native code.

## Run on a device / simulator

```bash
npm run open:ios         # opens Xcode — run from there
npm run open:android     # opens Android Studio — run from there
```

To point the app at staging or local dev instead of production:

```bash
DEADLINEIQ_URL=https://staging.deadlineiq.com npx cap sync
```

## Release builds

- **iOS:** Xcode → Product → Archive → distribute via App Store Connect (requires an Apple Developer account and signing certificates).
- **Android:** Android Studio → Build → Generate Signed App Bundle (`.aab`) → upload to the Play Console (requires a signing keystore).

## App store review notes

Pure WebView wrappers are sometimes flagged in Apple's review (guideline 4.2 — minimum functionality). If that happens, the usual fix is adding a native capability the web app doesn't have — push notifications for urgent policy alerts (`@capacitor/push-notifications`) is the natural fit for DeadlineIQ and significantly strengthens the product anyway. Google Play generally accepts WebView apps as-is.
