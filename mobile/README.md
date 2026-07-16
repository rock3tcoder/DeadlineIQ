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

## Push notifications

Push for urgent policy alerts is fully wired: the web app registers the device token (`src/components/dashboard/push-registration.tsx` — runs only inside this native shell), tokens are stored in Supabase (`device_tokens`, migration 006), and the scraper sends via Firebase Cloud Messaging when an urgent update is detected (`scraper/src/push.ts`).

To activate it:

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com).
2. **Android:** add an Android app with package name `com.deadlineiq.app`, download `google-services.json` into `android/app/`, and re-run `npx cap sync`.
3. **iOS:** add an iOS app with bundle ID `com.deadlineiq.app`; in Apple Developer create an APNs auth key and upload it to Firebase (Project settings → Cloud Messaging); enable the *Push Notifications* capability in Xcode; and follow the [Capacitor iOS push setup](https://capacitorjs.com/docs/apis/push-notifications#ios) to add the Firebase SDK so registration returns FCM tokens.
4. **Scraper:** generate a service account key (Project settings → Service accounts) and set it as `FIREBASE_SERVICE_ACCOUNT` in the scraper's environment (see `scraper/.env.example`).

Push is a progressive enhancement at every layer — with nothing configured, the apps and scraper behave exactly as before.

## App store review notes

Pure WebView wrappers are sometimes flagged in Apple's review (guideline 4.2 — minimum functionality). The built-in push notifications above are exactly the kind of native capability that addresses this. Google Play generally accepts WebView apps as-is.
