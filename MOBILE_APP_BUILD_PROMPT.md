# Run Out Mobile App Build Prompt

Use this prompt with ChatGPT Codex, Claude Code, or another coding agent that has access to this repository.

---

You are a senior React Native engineer working directly in the existing **Run Out** repository. Build the complete customer mobile application for **iOS and Android from one shared codebase**.

Do not build, replace, redesign, or port the administration panel. The existing React administration panel under `frontend/` remains a separate web application and must continue working unchanged.

## Product source of truth

Before changing anything, inspect these files:

1. `Claude outputs/run-out-index.html`: primary visual and interaction reference for the customer app.
2. `public-frontend/index.html`: reference for API integration, authentication, recent customer flows, Dubai areas, delayed reveal, and completed-reservation feedback.
3. `src/main/java/com/runout/**`: authoritative backend behavior and REST contracts.
4. `src/main/resources/application.yml`: local service configuration.
5. `keycloak/realm/runout-realm.json`: Keycloak client, roles, redirect URIs, PKCE, and Google identity provider.
6. `postman/Runout-Simplified.postman_collection.json` and `/v3/api-docs`: request and response verification.

Do not guess an endpoint or response shape when it can be read from the code or OpenAPI document. If the prototype and backend disagree, preserve the intended customer experience but use the backend as the source of truth for persisted data and business rules.

## Technical direction

Create the app in a new top-level `mobile/` directory using:

- Expo with React Native and TypeScript.
- Expo Router with protected route groups and a native bottom tab navigator.
- A custom Expo development build, not Expo Go, because OAuth/OIDC deep links require a custom scheme.
- TanStack Query for server state, caching, mutation invalidation, refetch on app focus, and network recovery.
- React Hook Form and Zod for forms and client-side validation.
- `expo-auth-session` and `expo-web-browser` for Keycloak Authorization Code with PKCE.
- `expo-secure-store` for access and refresh tokens. Never store tokens in AsyncStorage.
- `expo-location` for device location permissions and coordinates.
- `expo-notifications` for local reservation/reveal reminders, while keeping the notification layer replaceable by server push later.
- `react-native-reanimated` for the sealed-envelope and reveal animations.
- `lucide-react-native` for interface icons.
- React Native Testing Library and the Expo-supported Jest setup for component tests.
- Maestro flows, or an equivalent native E2E solution, for the critical user journeys.
- EAS Build profiles for development, preview, and production on both platforms.

Use the current stable versions that are mutually compatible with the selected Expo SDK. Lock dependency versions. Do not add libraries that duplicate an existing responsibility.

## Repository boundaries

- Build only the customer mobile app in `mobile/`.
- Do not modify `frontend/` except to fix a confirmed shared backend contract issue, and only when strictly necessary.
- Do not convert the admin panel into React Native.
- Do not use a WebView or wrap `run-out-index.html` in a native shell.
- Recreate the customer experience with native React Native components.
- Keep the Spring Boot modular-monolith architecture intact.
- Make backend changes only when a required customer capability is genuinely missing.
- Preserve existing uncommitted work and do not revert unrelated changes.

## Brand and native design

Translate the visual language from `run-out-index.html` into a polished native app rather than copying HTML and CSS literally.

Core palette:

- Background: `#0A0908`
- Secondary background: `#160F0E`
- Surface: `#171312`
- Primary text: `#F6F1EE`
- Muted text: `#A8A19D`
- Primary red: `#E6362C`
- Gold accent: `#FF9D42`
- Success: `#3DDC84`

Use safe areas, keyboard avoidance, native scrolling, haptics where appropriate, accessible touch targets, Dynamic Type-safe layouts, screen-reader labels, reduced-motion support, loading skeletons, empty states, retry states, and offline messaging. The result should feel like an iOS and Android app, not a responsive website.

The main authenticated navigation has exactly three customer tabs:

- Home
- Reservations
- Profile

Do not add administration screens or role-based staff tools.

## Authentication

Implement these customer authentication paths:

### Email registration and login

- Register through `POST /api/v1/users/registrations` with `displayName`, `email`, and a password of at least 12 characters.
- Login through `POST /api/v1/auth/login`.
- Refresh through `POST /api/v1/auth/refresh`.
- Refresh tokens are rotated. Replace both stored tokens after every successful refresh.
- Call `POST /api/v1/users/me/provision` after successful OIDC login.
- Call `POST /api/v1/auth/logout` when signing out, then clear local secure credentials even if the network request fails.

### Google login through Keycloak

- Use Keycloak realm `runout`, public client `runout-mobile`, OIDC discovery, Authorization Code with PKCE, and scopes `openid email profile`.
- Use the existing native redirect `runout://oauth/callback`.
- Do not put a client secret in the app.
- Store tokens only in SecureStore.
- Implement a single refresh mutex so simultaneous `401` responses do not trigger multiple refresh requests.
- Retry an original request once after successful refresh. If refresh fails, clear the session and return to sign-in.

### iOS release requirement

The backend currently configures Google and email/password but not Apple. Prepare the auth UI and provider abstraction for Sign in with Apple, but do not fake a working Apple login. Document Keycloak Apple IdP setup as a production release blocker. Before App Store submission, implement Sign in with Apple if required by the current App Store login-services rules.

Also document that the backend needs an authenticated account-deletion endpoint before store submission. Do not present a nonfunctional delete-account button.

## Customer app screens

### 1. Authentication

- Welcome screen using Run Out branding.
- Continue with Google.
- Create account with email.
- Sign in with email.
- Password visibility, validation, loading, API error, and retry states.
- Privacy Policy and Terms placeholders configured through environment URLs, not hard-coded fake documents.

### 2. Home

Recreate the current app-style Home from `run-out-index.html`:

- Native top bar with time-aware greeting and the user's first name.
- Reservation shortcut.
- Compact mystery-dinner action surface with the animated sealed envelope.
- `Start reservation` or `Continue reservation` according to local draft state.
- `Up next` section that never exposes the restaurant before the reveal rules allow it.
- `Previous nights` preview linked to reservation history.
- Home must always open the dashboard. It must never reopen a revealed restaurant merely because the booking flow was left on that screen.

### 3. Reservation creation wizard

Persist an unfinished draft locally, but never treat it as a server reservation until creation succeeds.

Steps:

1. Party size from 2 to 6 and a future date/time window.
2. Total budget in AED, minimum AED 50 per person and maximum AED 1,000.
3. Outing vibe: Casual, Date Night, Extreme, Birthday, or Dress to Impress.
4. Optional cuisine exclusions, maximum three because the backend enforces that limit.
5. Dietary preferences and allergy notes.
6. Location and travel radius.
7. Payment confirmation.
8. Sealed waiting state.
9. Restaurant reveal and menu.

Use the API's date requirements and Dubai timezone carefully. Display local Dubai time to the user and send correct ISO-8601 values with offsets.

### 4. Location

- Show the existing 15 Dubai areas used by the current product:
  Downtown Dubai, Business Bay, DIFC, Dubai Marina, JBR, Palm Jumeirah, Jumeirah, Dubai Hills, JVC, Al Barsha, Deira, Bur Dubai, Dubai Creek, City Walk, and Bluewaters Island.
- Alternatively allow device location through `expo-location`.
- Reverse geocode device coordinates using `POST /api/v1/locations/reverse-geocode` and show the full street address, not raw coordinates.
- Use `GET /api/v1/locations/search?query=...` to refine a selected Dubai area when appropriate.
- Distances must be displayed in kilometres only.
- Convert kilometres to `radiusMeters` when sending the reservation.
- The backend accepts radii from 500 to 50,000 metres.
- If location permission is denied, keep the area selector fully usable.

### 5. Reservation creation and payment

Creation is a two-request flow:

1. `POST /api/v1/reservations` with a fresh UUID in the `Idempotency-Key` header.
2. `POST /api/v1/reservations/{id}/payments` with another stable idempotency key and `{ "paymentMethodToken": "..." }`.

Required reservation payload fields include:

- `reservationAt`
- `timeWindowStartAt`
- `timeWindowEndAt`
- `excludedCuisineTypes`
- `vibe`
- `dietaryPreferences`
- `allergyNotes`
- `locationLabel`
- `partySize`
- `budgetPerPerson: { amount, currency: "AED" }`
- `totalBudget: { amount, currency: "AED" }`
- `searchArea: { latitude, longitude, radiusMeters }`

The current provider is mocked. Keep payment behind a `PaymentProvider` interface. In local development use the backend's mock tokens and clearly label the UI as a demo payment. Do not implement fake PCI card storage. Prepare the boundary for a future real provider without inventing provider credentials.

A reservation must not advance unless payment status is `CAPTURED`. Never show a restaurant for failed or pending payment.

### 6. Reservation lifecycle

Support these backend statuses exactly:

- `PAYMENT_PENDING`
- `PAID`
- `PAYMENT_FAILED`
- `CANCELLED`
- `ASSIGNED`
- `IN_PROGRESS`
- `CONFIRMED`
- `REJECTED`
- `COMPLETED`

Use customer-friendly labels. Do not expose staff workflow controls.

After payment, the customer sees a sealed reservation and waiting state. Poll or refetch intelligently; do not use aggressive foreground intervals. Refresh on screen focus, app foreground, pull-to-refresh, and a conservative timer near reveal time.

Call `GET /api/v1/reservations/{id}/reveal`. The restaurant and menu may only be rendered when `available` is true. The backend reveals a confirmed reservation two hours before `confirmedReservationAt` and also permits completed reservations. Never derive or expose the restaurant from `/api/v1/restaurants` before this endpoint authorizes reveal.

The existing prototype's `Skip wait` behavior is demo-only. Hide it from production builds behind an explicit development feature flag. Do not attempt to bypass the backend reveal policy.

When revealed, show:

- Restaurant name and cuisine.
- Full address.
- Reservation time and party size.
- Google Maps deep link with an installed-app fallback to the browser.
- Menu sections and dietary compatibility information.
- Clear handling for unavailable menu data.

### 7. Reservations

- Load `GET /api/v1/reservations`.
- Separate upcoming/active and previous reservations.
- Show meaningful status, date/time, party size, and budget.
- Support pull-to-refresh and empty states.
- Allow cancellation only where the backend accepts it through `POST /api/v1/reservations/{id}/cancellation`.
- A reservation detail screen must preserve the delayed-reveal privacy rule.

### 8. Completed-reservation feedback

Only `COMPLETED` reservations without existing feedback show `Leave feedback`.

Submit through `POST /api/v1/reservations/{id}/feedback`:

```json
{
  "rating": 5,
  "comment": "Great surprise.",
  "wouldReturnForSurpriseMenu": true
}
```

Requirements:

- Rating from 1 to 5 is required.
- Comment is optional and limited to 1,000 characters.
- Include the checkbox: `Would you come back to this restaurant for another surprise menu and keep exploring what it has to offer?`
- Rotate the ten English trust-focused feedback prompts already defined in `public-frontend/index.html`.
- After submission, replace the action with the saved rating, optional comment, and return intent.
- Feedback can only be submitted once; show the backend business-rule error cleanly if a duplicate is attempted.

### 9. Profile

- Load the authenticated user and `GET /api/v1/users/me/profile`.
- Edit profile through `PATCH /api/v1/users/me/profile`.
- Support phone, birth date, dietary preferences, allergy notes, marketing notifications, reservation notifications, and saved address.
- Include sign-out.
- Keep future account deletion visible only after a real backend endpoint exists.

## API client quality

- Configure `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_KEYCLOAK_URL` per environment.
- Remember that `localhost` on a physical device is the device itself. Document LAN URLs for local development and HTTPS URLs for preview/production.
- Add `Authorization: Bearer <token>` automatically.
- Add `Accept: application/json` and content type only when needed.
- Preserve idempotency keys across retries of the same logical operation.
- Parse Spring Problem Details responses and show `detail` as the primary user-facing message.
- Model all API contracts in TypeScript. Prefer generated OpenAPI types if the generated output remains understandable and reproducible.
- Never log access tokens, refresh tokens, passwords, payment tokens, or exact user coordinates in production.

## Project structure

Use a feature-oriented structure similar to:

```text
mobile/
  app/
    (auth)/
    (tabs)/
    reservation/
    _layout.tsx
  src/
    api/
    auth/
    components/
    features/
      home/
      reservations/
      booking/
      feedback/
      profile/
    hooks/
    theme/
    types/
    utils/
  assets/
  app.config.ts
  eas.json
  package.json
  README.md
```

Keep components focused. Put server state in TanStack Query, authenticated session state in one auth provider, and transient wizard state in a reducer or small dedicated store. Do not create a global store for everything.

## Testing requirements

Add automated coverage for at least:

- Email registration validation.
- Email login and failed login.
- PKCE callback and session restoration.
- Single-flight token refresh.
- Reservation payload mapping, AED amounts, Dubai dates, and kilometres-to-metres conversion.
- Payment success and failure.
- Restaurant hidden before reveal and visible only after `available: true`.
- Cancellation rules in the UI.
- Completed feedback submission and already-submitted state.
- Location permission denied with Dubai-area fallback.
- Reverse geocoding displays a street address.

Create E2E flows for:

1. Register or sign in, create and pay for a reservation, then reach the sealed state.
2. Open reservations and verify unrevealed details remain hidden.
3. Open a completed reservation and submit feedback.
4. Edit profile and sign out.

Mock the API in component tests. Use the real local Spring Boot backend for integration and E2E verification where possible.

## Build and delivery

- Configure the scheme `runout` and native callback `runout://oauth/callback`.
- Choose development identifiers only if production bundle/package identifiers have not been supplied; document them clearly for replacement.
- Add EAS `development`, `preview`, and `production` profiles.
- Produce commands for iOS and Android development builds.
- Configure icons, splash assets, permissions text, and environment handling.
- Do not commit secrets, signing credentials, Google keys, or production URLs.
- Document Keycloak redirect URIs required for development, preview, and production.
- Document Google OAuth configuration and the pending Apple identity-provider work.
- Run linting, TypeScript checks, unit tests, and available E2E smoke tests before finishing.

## Required execution behavior

Do not stop after scaffolding or provide only a plan. Work through the implementation feature by feature until the app is runnable. Keep a short progress checklist, but prioritize working code.

At completion, report:

1. What was implemented.
2. Any backend changes and why they were necessary.
3. Commands to run the app on iOS and Android.
4. Commands to execute tests and builds.
5. Remaining external configuration such as production URLs, Apple/Google credentials, store identifiers, and signing accounts.
6. Known release blockers, especially Sign in with Apple, account deletion, privacy documents, real payment integration, and production push notifications.

The definition of done is a genuine native customer app running from one React Native codebase on both iOS and Android, integrated with the existing Spring Boot API, while the current administration web panel remains untouched.

