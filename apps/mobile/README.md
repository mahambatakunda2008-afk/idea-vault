# Idea Vault Mobile

Native Android and iOS client built with Expo SDK 58 and React Native 0.88.

## Current foundation

- Native React Native interface, not a WebView wrapper.
- SQLite database persisted on the device.
- Quick capture and idea list work without a network connection.
- Local records are explicitly marked as local until account sync is implemented.
- Android and iOS application identifiers are reserved as `com.shadecode.ideavault`.

## Development

```sh
cd apps/mobile
npm install
npx expo start
```

Create a development build for device testing:

```sh
npx eas build --profile development --platform android
npx eas build --profile development --platform ios
```

## Architecture rules

1. SQLite is the local source of truth for offline capture.
2. Sync must use stable UUIDs and an outbox, never timestamp-only conflict resolution.
3. Every mutation must be idempotent and safe to retry.
4. Pending local changes must remain visible until the server acknowledges them.
5. Authentication and all cloud access use the dedicated Idea Vault Supabase project, never Shadecode Student.
6. Keep native screens and interactions native. Do not embed the web application in a WebView.

## Next implementation gates

- Add shared domain types and validation with the web application.
- Add Supabase Auth with secure native session persistence and deep-link callbacks.
- Implement an outbox and two-way sync with explicit conflict handling.
- Add native idea detail, evaluation, connections and project screens.
- Add attachment capture, sharing extension support and biometric app lock.
- Add Android/iOS CI builds and device-level tests.

The first mobile scaffold intentionally does not pretend local-only records are synced to an account.
