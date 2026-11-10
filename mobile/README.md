# Run Out mobile

Native iOS and Android customer app built with Expo SDK 57, React Native, TypeScript, and Expo Router. The administration app in `../frontend` is separate and unchanged.

See [FLOWS.md](./FLOWS.md) for the complete implemented customer journey, operations handoffs, QA matrix, and prioritized future roadmap.

## Local setup

Requirements: Node 22.13 or newer, the Spring Boot API, Keycloak realm `runout`, and either Xcode or Android Studio for local native builds. OAuth needs a custom development build; Expo Go is not supported.

```bash
cd mobile
cp .env.example .env.local
npm install
npm run ios
npm run android
npm start
```

For a physical phone, replace `localhost` in `.env.local` with the computer's LAN IP, for example `http://192.168.1.20:8080` and `http://192.168.1.20:8081`. The phone and development machine must share a network. Preview and production must use reachable HTTPS API and Keycloak URLs.

Cloud builds:

```bash
npx eas-cli@latest build --profile development --platform ios
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development-simulator --platform ios
npx eas-cli@latest build --profile preview --platform all
npx eas-cli@latest build --profile production --platform all
```

The temporary identifiers are `com.runout.mobile` on both platforms. Replace them before store registration if the final identifiers differ.

## Environment

Only `EXPO_PUBLIC_*` values are embedded in the client. They must never contain secrets.

- `EXPO_PUBLIC_API_URL`: Spring API origin, without a trailing slash.
- `EXPO_PUBLIC_KEYCLOAK_URL`: Keycloak origin, without a trailing slash.
- `EXPO_PUBLIC_PRIVACY_URL`: published privacy policy.
- `EXPO_PUBLIC_TERMS_URL`: published terms.
- `EXPO_PUBLIC_ENABLE_DEMO_SKIP_WAIT`: development-build-only UI flag for the two-stage demo reveal. **Skip the wait · demo** opens the envelope with a restaurant, then **Skip the menu wait · demo** reveals the menu. The local startup script enables the backend preview for mock payments and Stripe sandbox. Set `RUNOUT_DEMO_SKIP_WAIT_ENABLED=false` on the backend to disable it.

## Keycloak and identity providers

The app uses realm `runout`, public client `runout-mobile`, Authorization Code + PKCE S256, and `openid email profile`. No client secret belongs in the app.

Register `runout://oauth/callback` as the native redirect URI for development, preview, and production builds. Configure Google credentials in Keycloak and allow Keycloak's broker callback URL in the Google OAuth console.

Apple identity provider setup is a release blocker: add Apple in Keycloak, implement the provider through the existing auth boundary, validate nonce/state handling, and enable the button before App Store review if Apple's current login-services rule requires it. The UI deliberately does not fake working Apple sign-in.

## API and payment behavior

Tokens live only in SecureStore. Refresh is single-flight, rotated token pairs are replaced, and failed refresh clears the session. Reservation creation and mock payment keep stable UUID idempotency keys across retries. Restaurant fields render only from `GET /api/v1/reservations/{id}/reveal` when `available` is `true`; at the confirmed reservation time, the sealed envelope animates open to reveal the restaurant and menu.

For local animation testing, set `EXPO_PUBLIC_ENABLE_DEMO_SKIP_WAIT=true` in `.env.local`. The authenticated demo route requires a paid reservation owned by the user. With Stripe sandbox it always returns a sample restaurant and menu, keeping the actual assignment sealed. For manual Stripe sandbox startup, set `RUNOUT_DEMO_SKIP_WAIT_ENABLED=true` on the backend.

The default payment flow uses the mock token. Set `EXPO_PUBLIC_PAYMENT_PROVIDER=stripe` to open hosted Stripe Checkout in the browser against the sandbox-enabled backend. Pay by card or use Apple Pay or Google Pay when the browser and Stripe sandbox support the wallet. After Checkout, return to the app and tap **Check payment**. See the [sandbox setup](../README.md#stripe-sandbox-checkout).

In an iOS development build, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` enables Run Out’s in-app card screen with Stripe’s native fields and bank authentication. To also display the Apple Pay button, configure `EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID` with the Merchant ID linked to the Stripe iOS certificate, rebuild iOS, and use an eligible iPhone. See [native iPhone checkout](../README.md#native-iphone-checkout).

The booking screen uses the configured strategy in `src/features/booking/checkoutStrategy.ts`. Hosted checkout and payment status use provider-neutral endpoints. The Stripe strategy owns its trusted URL and native SDK controls.

## Verification

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run doctor
maestro test e2e/01-create-sealed.yaml
maestro test e2e/02-unrevealed.yaml
maestro test e2e/03-feedback.yaml
maestro test e2e/04-profile-signout.yaml
```

Maestro expects an installed build, a running backend with suitable fixtures, and `TEST_EMAIL` / `TEST_PASSWORD`. The create flow leaves date/payment fixture selection to the environment because the backend requires a truly future Dubai time.

## Release blockers

- Sign in with Apple / Keycloak Apple IdP if required for App Store submission.
- Authenticated backend account-deletion endpoint and corresponding app UI.
- Published privacy policy and terms URLs.
- Real payment provider, merchant credentials, and webhook verification.
- Server push registration/storage and APNs/FCM credentials; reminders are currently local and replaceable.
- Final HTTPS origins, store identifiers, EAS project ownership, signing certificates, and store accounts.
- Production Google OAuth credentials and redirect review.

The app icon was generated with the built-in image tool from a prompt for a premium sealed red dinner invitation, gold seal, and sparkle on near-black using the Run Out palette. It is saved at `assets/images/runout-icon.png` and reused for the splash artwork.
