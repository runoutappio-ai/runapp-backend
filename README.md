# Run Out

Run Out is a Dubai-first mystery restaurant reservation product. Guests set their party size, date and time, location, budget, mood, and food preferences. They see how many restaurants match, then pay a 10% reservation fee to seal the request. Run Out operations assigns and confirms a restaurant. Guests discover the restaurant and set menu at the backend-authorized reveal and pay for the meal at the venue.

This repository contains the Spring Boot API, PostgreSQL schema, Keycloak realm, Expo customer app, staff backoffice, restaurant partner portal, interactive Presentation and Strategy Hub, and API and end-to-end test assets.

> **Development status.** Spring defaults to mock payments. With local test credentials, Run Out supports Stripe-hosted checkout and a custom in-app iPhone card screen. The native Apple Pay button requires merchant configuration. Operations still assigns restaurants manually. See [Known gaps and production blockers](#known-gaps-and-production-blockers).

## Contents

- [System at a glance](#system-at-a-glance)
- [Repository map](#repository-map)
- [Run everything locally](#run-everything-locally)
- [Core product lifecycle](#core-product-lifecycle)
- [Stripe sandbox checkout](#stripe-sandbox-checkout)
- [Adding a payment provider](#adding-a-payment-provider)
- [Identity, Keycloak, and authorization](#identity-keycloak-and-authorization)
- [Backend architecture](#backend-architecture)
- [API reference](#api-reference)
- [Customer app](#customer-app)
- [Staff backoffice](#staff-backoffice)
- [Browser prototypes and demo hub](#browser-prototypes-and-demo-hub)
- [Database and persistence](#database-and-persistence)
- [Configuration](#configuration)
- [Testing and verification](#testing-and-verification)
- [Known gaps and production blockers](#known-gaps-and-production-blockers)
- [Troubleshooting](#troubleshooting)

## System at a glance

```text
Customer
  └─ Expo app (iOS / Android / web)
          │
          │ HTTPS + Bearer JWT
          ▼
Spring Boot modular monolith ───────────────► Google Places / Geocoding
  ├─ authentication                          (server-side API key only)
  ├─ users
  ├─ bookings/reservations
  ├─ restaurants
  ├─ administration
  ├─ payments (mock or provider adapter for hosted and native checkout)
  ├─ notifications (log-only integration listener)
  ├─ locations
  └─ experiences (domain module, no current HTTP flow)
          │                         │
          ▼                         ▼
     PostgreSQL                 Keycloak
  data + Liquibase        identity, JWTs, roles,
  + Modulith events       Google identity broker

Staff backoffice ──► API ──► manual assignment / restaurant confirmation
Restaurant portal ──► API ──► partner details and menu submissions
```

### Default local services

| Service | URL / port | Purpose |
| --- | --- | --- |
| Spring Boot API | `http://localhost:8080` | Customer and administration API |
| Swagger UI | `http://localhost:8080/swagger-ui.html` | Live OpenAPI explorer |
| Health | `http://localhost:8080/actuator/health` | Backend health check |
| Keycloak | `http://localhost:8081` | Realm, login, tokens, and role management |
| PostgreSQL | `localhost:5432` | Application database |
| React backoffice | `http://localhost:5173` | Staff operations and restaurant management |
| Restaurant portal | `http://localhost:5174` | Partner profile, categories, price range, and menus |
| Integrated demo hub | `http://localhost:8000` | Presentation and Strategy Hub |
| Expo iOS Metro | `http://localhost:8082` | Bundle server for the customer development app |

PostgreSQL and Keycloak run in Docker. The local launcher starts the Spring API, both Vite applications, and the static hub. Start Expo separately when working on the customer app.

## Repository map

```text
.
├── src/main/java/com/runout/       Spring Boot modular monolith
├── src/main/resources/
│   ├── application.yml             backend defaults and environment bindings
│   └── db/changelog/               Liquibase migrations
├── src/test/                       backend domain, security, and module tests
├── frontend/                       React/Vite staff backoffice
│   └── public/strategy-hub/        strategy hub also exposed by Vite
├── restaurant-frontend/            React/Vite restaurant partner portal
├── mobile/                         Expo customer application
│   ├── src/app/                    Expo Router screens
│   ├── src/features/               booking, reservation, profile, feedback UI
│   ├── src/demo/server.ts          in-browser API used only by the static demo
│   ├── src/demo/dubai-restaurants.json shared fictional restaurant catalogue
│   ├── e2e/                        Maestro journeys
│   ├── web-demo/                   source for the presentation and strategy hub
│   ├── runout-web-demo/            committed generated/static demo snapshot
│   ├── scripts/build-web-demo.mjs  builds and packages the hosted demo
│   ├── FLOWS.md                    detailed mobile product/QA roadmap
│   └── README.md                   mobile-specific setup and release notes
├── keycloak/realm/                 importable local `runout` realm
├── postman/                        executable local API collection and environment
├── scripts/                        local database seed for Dubai matching fixtures
├── compose.yml                     PostgreSQL + Keycloak development stack
├── start-frontend.sh               starts the React backoffice
└── start-all.sh                    starts the local stack
```

`Claude outputs/`, the root design prompts, and some standalone HTML files are historical/design artifacts. They are not runtime dependencies. Generated directories such as `target/`, `frontend/dist/`, and `mobile/dist/` are build output, not source of truth.

## Run everything locally

### Start everything with one command

From the repository root:

```bash
./start-all.sh
```

This starts PostgreSQL, Keycloak, the Spring API, staff backoffice, restaurant portal, and the demo hub on port 8000. Use [Stripe sandbox setup](#stripe-sandbox-checkout) if testing payments, or run `PAYMENT_PROVIDER=mock ./start-all.sh` to explicitly use mock payments. In the Expo app, select the same provider through `EXPO_PUBLIC_PAYMENT_PROVIDER`. Press `Ctrl+C` to stop the processes the script started. Docker infrastructure remains running for the next startup.

To include the populated restaurant login instead of connecting that portal to the real backend:

```bash
./start-all.sh --restaurant-demo
```

The demo credentials are `demo@runout.local` / `RunOutDemo2026!`. Run `./start-all.sh --help` for options including automatic Docker shutdown. Logs are written under the ignored `.run/logs/` directory.

To populate the local Docker database for mobile matching tests, wait for the API to apply the migrations, then run `node scripts/seed-demo-restaurants.mjs` from the repository root. This adds 40 fictional restaurants across 10 Dubai areas, with menus for 2–6 guests and varied prices and preference tags. Rerunning the seed keeps existing rows. The web demo source uses the same fixtures.

### Prerequisites

- Docker with Compose
- JDK 25
- Maven 3.6.3 or newer
- Node.js 22.13 or newer and npm
- Python 3 for `start-all.sh` and the static demo
- Xcode for an iOS native build, or Android Studio for Android
- Stripe CLI when using the sandbox webhook listener

Expo Go is not sufficient for the complete native authentication flow; use a development build.

### 1. Start PostgreSQL and Keycloak

From the repository root:

```bash
docker compose up -d
docker compose ps
```

The first Keycloak boot imports `keycloak/realm/runout-realm.json`. Realm imports are not automatically reapplied to an existing `keycloak-data` volume. Edit the realm in the admin console or intentionally recreate the development volume if a fresh import is required; deleting the volume also deletes local Keycloak state.

### 2. Start the API

```bash
mvn spring-boot:run
```

Verify it:

```bash
curl http://localhost:8080/actuator/health
```

Liquibase applies all schema migrations at startup. Hibernate uses `ddl-auto: validate`, so it checks the migrated schema rather than creating it.

### 3. Start the staff backoffice

In another terminal:

```bash
./start-frontend.sh
```

The script installs dependencies when `frontend/node_modules` is absent and starts Vite on `http://localhost:5173`.

### 4. Start the restaurant partner portal

```bash
./start-restaurant-frontend.sh
```

Open `http://localhost:5174`. A super admin must first edit a restaurant in the backoffice and create its portal account. One account is linked to one restaurant and cannot supply another restaurant ID to the API.

### 5. Start the Expo customer app

```bash
cd mobile
test -f .env.local || cp .env.example .env.local
npm install
npm run ios       # iOS development build
# or
npm run android   # Android development build
# or
npm run web       # browser development view
```

On a physical device, `localhost` refers to the phone. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_KEYCLOAK_URL` to the development computer's LAN address and keep both devices on the same network.

For an installed iOS development build, run `npm start -- --port 8082` from `mobile/`, then open the project in Run Out on the device. Restart Metro after changing Expo environment variables. A build with a newly added native module or capability must be rebuilt.

### 6. Open the demo hub on port 8000

To serve the committed snapshot:

```bash
python3 -m http.server 8000 --directory mobile/runout-web-demo
```

Open the [demo hub](http://localhost:8000/). The two landing-page choices are:

- **Presentation**, the interactive pitch and product walkthrough. [Open Presentation](http://localhost:8000/presentation/)
- **Strategy Hub**, the business model, financial projections, restaurant acquisition, operations, and growth plans. [Open Strategy Hub](http://localhost:8000/strategy-hub/)

To rebuild the self-contained static demo first:

```bash
cd mobile
npm run build:web-demo
python3 -m http.server 8000 --directory dist
```

The build enables `EXPO_PUBLIC_DEMO_MODE=true`, embeds an in-browser mock API, removes development test-login values, scans the output for those values, and creates `mobile/runout-web-demo.zip`. The static demo does not need Spring Boot, PostgreSQL, or Keycloak.

### Local staff accounts

The imported realm contains development-only staff accounts:

| Role | Email | Password | Backoffice access |
| --- | --- | --- | --- |
| `SUPER_ADMIN` | `admin@admin.com` | `Admin123456!` | Dashboard, users, reservations, restaurants |
| `MANAGER` | `manager@manager.com` | `Admin123456!` | Reservations and restaurants |
| `WORKER` | `personal@personal.com` | `Admin123456!` | Own/unassigned reservations and restaurant catalogue |

Never reuse these credentials outside local development.

## Core product lifecycle

```text
Guest draft (local only)
  → PAYMENT_PENDING
  → PAID
  → ASSIGNED
  → IN_PROGRESS
  → CONFIRMED
  → COMPLETED
```

Alternative terminal outcomes are `PAYMENT_FAILED`, `CANCELLED`, and `REJECTED`. A rejected reservation may be started again by operations.

### 1. Registration and sign-in

There are two implemented identity paths:

1. **Email/password** — the client calls the backend registration or login endpoint. The backend uses confidential Keycloak service clients to create the identity or perform the password grant. Passwords are stored only in Keycloak.
2. **Google** — the Expo app uses Authorization Code + PKCE against the public `runout-mobile` client. Keycloak brokers Google, returns tokens, and the app calls `POST /api/v1/users/me/provision` to create the local `app_user` if necessary.

The mobile app stores tokens in SecureStore. It coalesces concurrent `401` responses into one refresh request, replaces the rotated token pair, retries once, and clears the session when refresh fails.

### 2. Guest creates a request

The current Expo wizard has three screens:

1. **Table and place** — 2–6 guests in the UI, future Dubai date/time, area/device location, and 1/3/5/10/25 km radius.
2. **Budget and mood** — AED 50–400 per person, vibe, up to three cuisine exclusions, dietary needs, allergy notes, and optional licensed-venue/shisha preferences.
3. **Payment** — review the table budget and pay the 10% reservation fee using the configured checkout. Sign-in is required to create the server reservation and pay.

**Budget & mood** shows the match count below the allergy field. The app calls `POST /api/v1/restaurants/match-count` after a short debounce and requires at least one match before a new draft can proceed. The response contains only a count. See [Matching and assignment](#matching-and-assignment).

The draft is stored locally in AsyncStorage until payment succeeds. Creation sends a stable `Idempotency-Key`; a retry of the same draft therefore returns the same reservation instead of creating a duplicate.

The backend contract accepts a party size of 1–6 even though the app enforces 2–6. It stores the requested time and optional time window, budget, location, radius, exclusions, dietary preferences, and allergy notes.

### 3. Payment

Checkout charges a reservation fee equal to 10% of the saved table budget, rounded to the currency’s minor unit. For example, an AED 600 table budget shows AED 60 due at checkout. Guests pay for the meal at the restaurant.

The app creates the reservation first in `PAYMENT_PENDING`, then opens checkout. Online checkout reuses a pending attempt for the same reservation and channel. Switching between hosted and native checkout closes the other attempt before starting a new one. The reservation reaches `PAID` only after the backend verifies that the provider, attempt, currency, and captured amount match.

The default backend payment adapter is `MockPaymentGateway`.

- tokens beginning with `pm_fail` produce `402 Payment Required` and `PAYMENT_FAILED`;
- every other mock token is immediately `CAPTURED` and moves the reservation to `PAID`;
- no card number is collected or stored;
- the demo card and wallet controls generate mock tokens. The separate mock payment command takes a UUID idempotency key and derives a deterministic reference. A retry after capture is rejected by the reservation state machine.

### Adding a payment provider

The reservation module owns fee calculation, row locking, payment state, and capture checks. Online adapters own provider API calls and event verification. The mock provider uses the synchronous `PaymentGateway` contract.

1. Implement [`CheckoutGateway`](src/main/java/com/runout/payments/api/CheckoutGateway.java) in the payments module and register the adapter under its provider ID. The adapter starts, retrieves, and closes attempts for its supported channels and authenticates incoming events. [Stripe adapter](src/main/java/com/runout/payments/internal/infrastructure/gateway/StripeCheckoutGateway.java)
2. Register its mobile strategy in [`checkoutStrategy.ts`](mobile/src/features/booking/checkoutStrategy.ts). Set the trusted origin for hosted checkout and provide native controls if the integration uses an in-app SDK.
3. Select the same provider ID with `PAYMENT_PROVIDER` on the backend and `EXPO_PUBLIC_PAYMENT_PROVIDER` in Expo. Send signed events to `POST /api/v1/payments/{provider}/webhook`.

The app uses the same [checkout endpoints](#authenticated-customer-routes) across online providers. Once a reservation has an online attempt, it keeps that provider. Changing the default cannot start another provider’s charge for that reservation. Status checks and cancellation still require the adapter associated with an outstanding attempt. Migration 013 preserved existing Stripe references and set their provider to `stripe`.

### Stripe sandbox checkout

Stripe Payments collects the reservation fee on Run Out’s own account. Restaurants collect payment for the meal at the venue. This flow has no connected-account onboarding or payouts. The backend uses test credentials and computes the fee in AED from the saved table budget. Automatic tax is disabled in hosted sandbox Checkout.

Guests pay through Stripe-hosted Checkout on web and Android, or through Run Out’s card screen on a configured iPhone. Stripe wallet availability depends on the account, device, browser, and wallet setup. The webhook verifies Stripe’s signature and retrieves the linked Checkout Session or PaymentIntent from Stripe. An authenticated **Check payment** request can also reconcile the attempt server-side.

Enable Cards, Apple Pay, and Google Pay in the sandbox’s **Settings → Payment methods → Default**. Stripe Checkout shows available wallets based on the device, browser, and wallet setup. [Stripe payment settings](https://dashboard.stripe.com/test/settings/payment_methods) · [Stripe wallet testing](https://docs.stripe.com/testing/wallets)

#### Start Stripe with the local launcher

1. Run `stripe login` and select the Run Out sandbox. Store the sandbox secret or restricted test key in the Git-ignored file `.run/stripe/backend.key`. To enter it without displaying it, run the following from the repository root:

   ```bash
   umask 077
   mkdir -p .run/stripe
   read -rs runout_stripe_key && printf '%s\n' "$runout_stripe_key" > .run/stripe/backend.key
   unset runout_stripe_key
   ```

2. For a physical phone, set `STRIPE_CHECKOUT_RETURN_URL` or save the full HTTP(S) return URL in `.run/stripe/return-url`. Use the Mac’s LAN address and the path `/api/v1/stripe/return`.
3. Run `./start-all.sh`. With the test key configured, the launcher starts the sandbox listener, then the backend. Stop an existing mock API on port 8080 before starting Stripe mode.
4. Set `EXPO_PUBLIC_PAYMENT_PROVIDER=stripe` in `mobile/.env.local`, then restart Metro. On the payment step, use **Continue to Stripe** or **Pay by card** when native checkout is configured. A successful test card is `4242 4242 4242 4242` with a future expiry and any three-digit CVC. After hosted checkout, return to Run Out and tap **Check payment**. [Stripe test cards](https://docs.stripe.com/testing)

#### Start Stripe manually

1. Start PostgreSQL and Keycloak with `docker compose up -d`. In a separate terminal, authenticate Stripe CLI against the Run Out test sandbox and start the webhook listener.

   ```bash
   stripe login
   stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,payment_intent.succeeded --forward-to http://127.0.0.1:8080/api/v1/payments/stripe/webhook
   ```

2. Stop the existing backend before starting it in Stripe mode. In the backend terminal, paste your rotated Stripe test secret into the first hidden prompt and the listener’s signing secret into the second. Keep the listener running.

   ```bash
   export PAYMENT_PROVIDER=stripe
   read -rs STRIPE_SECRET_KEY
   export STRIPE_SECRET_KEY
   read -rs STRIPE_WEBHOOK_SECRET
   export STRIPE_WEBHOOK_SECRET
   mvn spring-boot:run
   ```

3. Configure Expo as in the launcher steps. The default return URL is `http://localhost:8080/api/v1/stripe/return`. For hosted wallet testing, open a fresh Checkout session in Safari on an iPhone with Apple Pay or Chrome on Android with Google Pay, with the wallet enabled in the Stripe sandbox. Hosted Checkout works without a publishable key in the app.

#### Native iPhone checkout

Set `EXPO_PUBLIC_PAYMENT_PROVIDER=stripe` and `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` to the publishable test key from the same sandbox in `mobile/.env.local`. In the iOS development build, **Pay by card** opens Run Out’s card screen with the reservation fee and Stripe’s native card fields. Stripe handles any bank authentication. Web, Android, and iOS builds missing the SDK or publishable test key use hosted Checkout.

To show the native **Apple Pay** button, create an Apple Merchant ID, enable Apple Pay for the Run Out app identifier, and use Stripe’s iOS certificate setup to associate an Apple Pay payment-processing certificate with that Merchant ID. Set `EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID` to the identifier and rebuild the iOS development app so Expo applies the entitlement. Test on an eligible iPhone with Apple Pay set up. [Stripe Apple Pay setup](https://docs.stripe.com/apple-pay?platform=react-native) · [Expo Stripe setup](https://docs.expo.dev/versions/v57.0.0/sdk/stripe/)

For a local development build, run `npx expo prebuild --platform ios` from `mobile` to apply the config plugin, then run `npm run ios -- --device`.

Both native buttons use the same server-calculated AED PaymentIntent. The custom card screen displays the fee and collects card details through Stripe’s native fields. A 3D Secure challenge returns to the app via `runout://safepay`. After confirmation, the app checks the backend and opens the reservation when the fee is captured. If verification is still pending, use **Check payment**.

### 4. Operations fulfils the request

Paid reservations appear in the staff queue. The current workflow is deliberately human-operated:

1. A super admin or manager assigns a worker; a worker may claim an unassigned paid reservation for themselves.
2. The worker starts it (`IN_PROGRESS`).
3. Staff views active restaurants within the requested radius. Distance is calculated with the Haversine formula.
4. Staff contacts/selects a restaurant and confirms it with an external reference and final reservation time (`CONFIRMED`).
5. A super admin marks the visit `COMPLETED` after service.

#### Matching and assignment

- The guest’s count includes active restaurants with a published menu for the exact party size and a discounted per-person price within budget. It applies the selected radius or Dubai-wide scope, cuisine exclusions, vibe, and tags for dietary preferences, licensed venues, and shisha.
- The count estimates catalogue fit. Availability for the requested date and time, seating capacity, and free-text allergy notes require staff confirmation.
- The staff nearby list filters active restaurants by radius and sorts by distance. Staff chooses the restaurant and records its booking reference and confirmed time.
- Licensed-venue and shisha preferences affect the live count. The reservation creation DTO does not persist those flags, so they are unavailable to the operations assignment flow. Other saved constraints include budget, location, party size, cuisine exclusions, dietary preferences, and allergy notes.

### 5. Sealed wait and reveal

The customer can see reservation metadata and status but must not receive restaurant or menu data before reveal.

`GET /api/v1/reservations/{id}/reveal` returns restaurant/menu fields only when all of these are true:

- the reservation is `CONFIRMED` or `COMPLETED`;
- a restaurant and confirmed reservation time exist;
- the current time is at or after the confirmed reservation time.

The mobile app polls conservatively, refreshes when foregrounded, and renders the restaurant only when `available` is true. The current implementation reveals at the confirmed reservation time—not two hours before it.

The property-gated demo endpoint previews the envelope animation after a captured payment. With mock payments it can use an active restaurant as a preview. With Stripe sandbox it returns a sample restaurant and menu, keeping the actual assignment sealed. The preview leaves the reservation unchanged.

### 6. Cancellation and feedback

- The customer can cancel a `PAYMENT_PENDING` reservation. If it has an online attempt, the backend closes that attempt first and rejects cancellation while the provider is confirming payment.
- A mock-paid reservation can also be cancelled before assignment. Stripe-paid cancellation requires contacting Run Out. The two-hour policy, automated refunds or credits, and no-show compensation remain roadmap items.
- After a super admin marks a reservation `COMPLETED`, the customer may submit one rating (1–5), an optional comment (maximum 1,000 characters), and whether they would return for another surprise menu.

### 7. Restaurant onboarding and catalogue

A super admin creates one Keycloak `RESTAURANT` account from the restaurant editor. The portal resolves the linked restaurant from the authenticated user. The database enforces one owner account per restaurant.

1. In **Restaurant details**, the partner saves contact information, address and area, opening hours, food categories, and explicit parking instructions. Parking can describe the entrance, valet, costs, and ticket validation.
2. In **Menus**, the partner selects exactly one price tier from AED 50 to AED 400 per guest in AED 50 increments. They fill five menus, one for each party size from 2 through 6. New sections start empty. Each menu needs starters, mains, desserts, and drinks specified per person.
3. The menu editor takes estimated table totals before and after the discount, displays total savings, and compares the discounted bill with the selected per-person tier. The API stores the corresponding per-person prices in the JSONB menu and derives the discount percentage.
4. The live checklist validates saved profile details and every menu. **Submit for approval** sends all five menus together. The partner’s profile and menu edits are locked while the submission is `PENDING_APPROVAL`.
5. A manager or super admin reviews the submission from the backoffice restaurant editor. Approval publishes the new menus and rejection unlocks editing. Partners can also use **Cancel submission & edit** to return to `DRAFT`, keep the submitted entries, and resubmit after edits.

The review states are `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, and `REJECTED`. The previous approved menus remain available to matching and reveal while a new submission is pending. The customer app displays the published menu for the reservation’s party size. Menus use the four structured sections in place of the historical `entries` field.

In the populated portal demo, **Fill everything automatically** replaces the draft with sample details and five menus. The demo uses an in-memory API and resets when its process stops.

Staff can also:

- create a restaurant manually;
- search Google Places server-side and import a candidate;
- edit contact, address, area, cuisine, price, description, opening hours, tags, coordinates, and menu data;
- activate/deactivate the restaurant;
- assign it to a confirmed reservation.

The Google Places key stays in the backend. See [production blockers](#known-gaps-and-production-blockers) for partner features still on the roadmap.

## Identity, Keycloak, and authorization

### Realm and clients

The imported realm is `runout`. Self-registration and password reset are enabled, duplicate emails are disabled, and Google is declared as an identity provider.

| Client | Type | Purpose |
| --- | --- | --- |
| `runout-api` | confidential/resource audience | Expected JWT audience for the Spring API |
| `runout-mobile` | public, Authorization Code + PKCE | Native/social customer login |
| `runout-admin` | public, Authorization Code | Reserved admin browser client; the current React UI logs in through the backend instead |
| `runout-registration-service` | confidential service client | Backend-created Keycloak users |
| `runout-auth-service` | confidential, direct grant | Backend email/password login and refresh |

Realm roles are `USER`, `RESTAURANT`, `WORKER`, `MANAGER`, and `SUPER_ADMIN`. Keycloak realm roles are converted to Spring authorities such as `ROLE_WORKER`.

### Backend security boundary

The API is stateless and validates JWT signature, issuer, audience, and timestamps. Public routes include health, Swagger/OpenAPI, email registration, login, refresh, the restaurant match count, and the hosted payment return page. Payment webhooks verify the provider signature. The restaurant catalogue and reservation routes require a bearer token.

After JWT validation, `AuthenticatedUserHeaderFilter` removes any client-supplied identity headers and injects trusted values from the token:

- `X-Authenticated-User-Id`
- `X-Authenticated-User-Email`
- `X-Authenticated-Username`
- `X-Authenticated-User-Name`

These are internal request conveniences, not a client authentication mechanism.

`POST /api/v1/auth/logout` currently logs the request but does not revoke the Keycloak session or refresh token. Clients still clear their local credentials.

### Role capability matrix

| Capability | Super admin | Manager | Worker | Customer |
| --- | :---: | :---: | :---: | :---: |
| List all paid operations reservations | Yes | Yes | No | No |
| See own + unassigned paid reservations | Yes | Yes | Yes | No |
| Assign/reassign a worker | Yes | Yes | Self only | No |
| Start or reject work | Yes | No | Own only | No |
| Confirm restaurant/time | Yes | Yes | Own only | No |
| Complete a reservation | Yes | No | No | No |
| List/create/import restaurants | Yes | Yes | Yes | No |
| Edit or activate/deactivate restaurants | Yes | Yes | No | No |
| Create cities | Yes | No | No | No |
| Manage users and staff roles | Yes | No | No | No |
| Manage own bookings/profile | No | No | No | Yes |

Workers receive `404`, rather than a revealing authorization error, for reservations that are neither theirs nor available to claim.

`RESTAURANT` accounts use only `/api/restaurant-portal/me` and can read/update the restaurant linked to their authenticated user ID. They do not receive staff backoffice access.

## Backend architecture

The backend is a modular monolith built with Java 25, Spring Boot 4.1.1, Spring Modulith 2.1.1, Spring Security, JPA, PostgreSQL, Liquibase, and springdoc-openapi.

Each direct package under `com.runout` is an application module. `package-info.java` declares allowed dependencies. Other modules may import only contracts exposed through an `api` package marked `@NamedInterface("api")`; implementations remain under `internal`.

| Module | Responsibility | Declared module dependencies |
| --- | --- | --- |
| `authentication` | Login, refresh, Keycloak token exchange | none |
| `users` | Local users, profiles, registration, staff roles, Keycloak admin integration | none |
| `bookings` | Reservation aggregate, lifecycle, payment handoff, reveal, feedback | users, restaurants, experiences, payments APIs |
| `restaurants` | Cities, catalogue, matching, partner profile and menu review, Google Places import | none |
| `administration` | Staff queue, assignment, confirmation, nearby search | experiences, bookings, restaurants, users APIs |
| `payments` | Synchronous capture contract, online checkout contract, mock and Stripe adapters | none |
| `notifications` | Event listeners for booking/payment notifications | bookings and payments APIs |
| `locations` | Google place search/geocoding adapters | none |
| `experiences` | Draft/publish experience domain | none; no current controller |
| `shared` | Security, error mapping, configuration, HTTP helpers | open technical module |

Spring Modulith verifies module boundaries in tests and stores event publications in PostgreSQL. The notification listener logs events. Reservations store capture status and linked online attempt IDs. The separate `payment` table and `PaymentCaptured` event are infrastructure, and Run Out still needs an operational payment ledger and reconciliation process.

## API reference

Use Swagger for request/response schemas and validation details. The table below is the implemented route inventory.

### Public and provider-authenticated routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/users/registrations` | Create Keycloak identity and local user |
| `POST` | `/api/v1/auth/login` | Email/password login through Keycloak |
| `POST` | `/api/v1/auth/refresh` | Rotate access and refresh tokens |
| `POST` | `/api/v1/restaurants/match-count` | Guest-accessible estimate for booking criteria. Returns only `{ "count": N }` |
| `POST` | `/api/v1/payments/{provider}/webhook` | Authenticate a payment event using that provider’s signature verification |
| `POST` | `/api/v1/stripe/webhook` | Compatibility route for existing Stripe webhook configuration |
| `GET` | `/api/v1/stripe/return` | Return page after Stripe-hosted checkout |

### Authenticated customer routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/logout` | Client logout hook; no server revocation yet |
| `GET` | `/api/v1/users/me` | Current local user |
| `POST` | `/api/v1/users/me/provision` | Create/sync local user from trusted JWT claims |
| `GET`, `PATCH` | `/api/v1/users/me/profile` | Read/update extended profile JSON |
| `GET` | `/api/v1/locations/search?query=...` | Google place/autocomplete-style location search |
| `POST` | `/api/v1/locations/reverse-geocode` | Resolve coordinates to an address |
| `GET` | `/api/v1/restaurants` | Active restaurant catalogue; authenticated |
| `GET` | `/api/v1/restaurants/{id}` | Active restaurant details |
| `GET` | `/api/v1/restaurants/{id}/menu` | Active restaurant menus |
| `GET`, `POST` | `/api/v1/reservations` | List own reservations / create idempotently |
| `GET` | `/api/v1/reservations/{id}` | Own reservation detail |
| `POST` | `/api/v1/reservations/{id}/payments` | Mock capture; key required, but successful replay is not implemented |
| `POST` | `/api/v1/reservations/{id}/cancellation` | Cancel pending or mock-paid reservations under the [cancellation rules](#6-cancellation-and-feedback) |
| `GET` | `/api/v1/reservations/{id}/reveal` | Privacy-safe reveal contract |
| `POST` | `/api/v1/reservations/{id}/feedback` | One completed-visit response |
| `POST` | `/api/v1/reservations/{id}/demo-reveal` | Property-gated development preview for the guest’s paid reservation |
| `POST` | `/api/v1/reservations/{id}/checkout` | Creates or reuses the configured provider’s hosted checkout |
| `POST` | `/api/v1/reservations/{id}/payment-session` | Creates or reuses a native payment attempt and returns its provider, client credential and amount in minor units |
| `POST` | `/api/v1/reservations/{id}/payment-session/status` | Checks the linked payment with its provider and returns the reservation |
| `POST` | `/api/v1/reservations/{id}/stripe-checkout`, `/api/v1/reservations/{id}/stripe-payment`, `/api/v1/reservations/{id}/stripe-payment/status` | Compatibility routes with their original response shapes for existing Stripe clients |

Reservation creation and mock capture each require a UUID `Idempotency-Key`. Online checkout creates or reuses an attempt under the reservation lock, and the provider adapter handles idempotency for its own create calls.

### Restaurant partner routes

All require `ROLE_RESTAURANT` and resolve ownership from the authenticated user.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/restaurant-portal/me` | Load the linked restaurant and its menus |
| `PATCH` | `/api/restaurant-portal/me` | Update partner-editable details, categories, and price range |
| `PUT` | `/api/restaurant-portal/me/menus` | Submit the complete five-menu set and selected price tier |
| `POST` | `/api/restaurant-portal/me/menus/cancel-submission` | Return a pending submission to draft and unlock editing |

### Administration routes

| Method | Route | Roles / purpose |
| --- | --- | --- |
| `GET` | `/api/admin/employees` | Super admin/manager: active workers |
| `GET` | `/api/admin/reservations` | Super admin/manager: all paid operations work |
| `GET` | `/api/admin/my-reservations` | Worker: own + claimable paid work |
| `GET` | `/api/admin/reservations/{id}` | Authorized operations detail |
| `GET` | `/api/admin/reservations/{id}/nearby-restaurants` | Active restaurants inside radius |
| `POST` | `/api/admin/reservations/{id}/assignment` | Assign or self-claim |
| `POST` | `/api/admin/reservations/{id}/start` | Super admin/owning worker |
| `POST` | `/api/admin/reservations/{id}/rejection` | Super admin/owning worker |
| `POST` | `/api/admin/reservations/{id}/confirmation` | Confirm restaurant/reference/time |
| `POST` | `/api/admin/reservations/{id}/completion` | Super admin only |
| `POST` | `/api/admin/restaurants/{id}/portal-access` | Super admin creates and links restaurant account |
| `POST` | `/api/admin/restaurants/{id}/menu-review` | Super admin or manager approves or rejects the pending menu set |
| `GET`, `POST` | `/api/admin/cities` | List cities / super admin creates city |
| `GET`, `POST` | `/api/admin/restaurants` | List/create restaurants |
| `GET`, `PATCH` | `/api/admin/restaurants/{id}` | Read/update restaurant |
| `GET` | `/api/admin/restaurants/{id}/menu` | Read menu |
| `GET` | `/api/admin/restaurants/google-places/search` | Server-side Places search |
| `POST` | `/api/admin/restaurants/google-places/import` | Import selected Google place |
| `POST` | `/api/admin/restaurants/{id}/activation` | Super admin/manager |
| `POST` | `/api/admin/restaurants/{id}/deactivation` | Super admin/manager |
| `GET`, `POST` | `/api/admin/users` | Super admin list/create staff |
| `PATCH` | `/api/admin/users/{id}/role` | Super admin role update |

Errors use Spring Problem Details where possible. Mobile clients prioritize the `detail` field.

## Customer app

`mobile/` is the primary customer client, built with Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router, TanStack Query, React Hook Form/Zod, SecureStore, Location, Notifications, and Reanimated.

Revealed menus are filtered by reservation party size. The supported menu contract contains a discount percentage and the four sections `STARTERS`, `MAINS`, `DESSERTS`, and `DRINKS`; there is no legacy menu fallback.

### Route map

| Route | Purpose |
| --- | --- |
| `/(auth)` | Welcome and guest entry |
| `/(auth)/sign-in` | Email/password login |
| `/(auth)/register` | Customer registration |
| `/(auth)/access` | Authentication gate before checkout |
| `/(tabs)` | Home, Explore, Reservations, Profile |
| `/booking` | Three-step draft, match count, and configured checkout |
| `/reservation/[id]` | Sealed status, reveal, cancellation, feedback |
| `/invite/[id]` | Prepare/share guest invitations |

Guests can explore and prepare a draft, but authentication is required to create/pay. Protected routes are guarded at the navigator level.

### State and privacy

- Access/refresh tokens: SecureStore only.
- Booking draft and theme: AsyncStorage.
- Server state: TanStack Query.
- Restaurant identity: rendered only from an available reveal response.
- Device location: foreground permission, with 15 built-in Dubai areas as fallback.
- Notifications: local scheduled reminders; there is no device-token backend.
- Web desktop view: wrapped in an iPhone-style frame; phones use the full viewport.

See [mobile setup](mobile/README.md) and the [mobile flows and QA matrix](mobile/FLOWS.md) for platform-specific instructions.

## Staff backoffice

`frontend/` is a React 19 + Vite 7 single-page application. It provides:

- quick local staff login;
- a super-admin dashboard;
- user/staff creation and role changes;
- reservation queue filters and detail;
- worker claiming/assignment, start, reject, confirm, and completion controls according to role;
- nearby restaurant lookup;
- restaurant creation, Google Places import, editing, menu fields, and activation;
- creation/linking of one restaurant portal account per restaurant;
- pending and published summaries for the five partner-managed menus, with approval and rejection controls for management;
- city creation for super admins.

The API origin is currently hardcoded as `http://localhost:8080`. The access token is stored in `localStorage` under `runout.admin.token`; there is no admin refresh-token workflow. A `401` clears the local session. This is acceptable for the current local tool but must change before exposing it publicly.

The Vite proxy also maps `/api` to port 8080, although the current application uses the absolute API URL. The strategy hub is available through the Vite public directory at `/strategy-hub/`.

## Browser prototypes and demo hub

### Integrated static demo

`mobile/web-demo/` is the editable source for the Presentation and Strategy Hub landing page. `npm run build:web-demo` exports the Expo app to `/app/` for the demo links inside Presentation, copies the static hub around it, and produces a deployable zip.

In demo mode, every app API call is answered by `mobile/src/demo/server.ts`. It creates demo users and seeded reservations in browser `localStorage`, simulates network latency, captures mock payment, and permits the reveal animation. Demo data is isolated from the real backend.

The committed `mobile/runout-web-demo/` snapshot and an Expo export are separate from the running backend. Use the source rebuild when you need the latest app and matching fixtures in the presentation. The backoffice also serves its own Strategy Hub copy under `/strategy-hub/`.

The Strategy Hub documents the business plan, including a first cohort of 50 Dubai restaurants, direct outreach and visits, onboarding and test bookings, and referral and social growth. Those plans, the financial projection, and the interactive pitch are strategy artifacts. They do not control catalogue matching, payments, restaurant assignment, or reveal timing.

## Database and persistence

PostgreSQL 18 is the local datastore. Liquibase migrations currently create and evolve:

- `app_user` with role, active flag, and JSONB profile;
- `city` and restaurant-to-city relation;
- `restaurant` with Google metadata and JSONB menus;
- restaurant owner-account linkage and partner categories;
- `reservation` with request, payment summary, assignment, restaurant confirmation, and feedback;
- reservation cuisine exclusions and dietary preferences;
- `experience` domain records;
- `payment` infrastructure records;
- Spring Modulith `event_publication` delivery registry.

Migration history:

1. initial application schema;
2. reservation assignee;
3. restaurant area;
4. city catalogue with Dubai seed;
5. removal of the obsolete `SENT_TO_USER` status;
6. rating/comment feedback;
7. return-for-surprise-menu intent.
8. restaurant portal owner linkage and categories.

The reservation has a unique `(user_id, idempotency_key)` constraint. Restaurant Google Place IDs are unique. Feedback rating has a database check constraint from 1 to 5.

## Configuration

### Backend environment

| Variable | Development default | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/runout` | JDBC URL |
| `DATABASE_USERNAME` | `runout` | Database user |
| `DATABASE_PASSWORD` | `runout` | Database password |
| `OIDC_ISSUER_URI` | `http://localhost:8081/realms/runout` | Trusted JWT issuer |
| `OIDC_AUDIENCE` | `runout-api` | Required access-token audience |
| `KEYCLOAK_BASE_URL` | `http://localhost:8081` | Backend Keycloak API origin |
| `KEYCLOAK_REALM` | `runout` | Realm name |
| `KEYCLOAK_REGISTRATION_CLIENT_ID` | `runout-registration-service` | Registration service client |
| `KEYCLOAK_REGISTRATION_CLIENT_SECRET` | insecure local placeholder | Registration service credential |
| `KEYCLOAK_AUTHENTICATION_CLIENT_ID` | `runout-auth-service` | Password/refresh service client |
| `KEYCLOAK_AUTHENTICATION_CLIENT_SECRET` | insecure local placeholder | Authentication service credential |
| `GOOGLE_MAPS_API_KEY` | empty | Places and Geocoding API key |
| `GOOGLE_MAPS_BASE_URL` | Google Places origin | Override for Places adapter/tests |
| `GOOGLE_MAPS_GEOCODING_BASE_URL` | Google Maps origin | Override for geocoding adapter/tests |
| `PAYMENT_PROVIDER` | `mock` | `mock` or `stripe` for sandbox Checkout |
| `STRIPE_SECRET_KEY` | empty | Stripe sandbox secret for the backend |
| `STRIPE_WEBHOOK_SECRET` | empty | Signing secret for the Stripe webhook endpoint |
| `STRIPE_CHECKOUT_RETURN_URL` | `http://localhost:8080/api/v1/stripe/return` | Browser landing page for Stripe Checkout |
| `RUNOUT_DEMO_SKIP_WAIT_ENABLED` | `auto` | Enables the preview by default for mock payments. `true` also enables it for Stripe sandbox. `start-all.sh` defaults to `true` |

Root `.env` is ignored by Git and is read automatically by Docker Compose. Spring Boot does not automatically load that file; export backend variables in the shell or configure them in the IDE/run environment.

### Compose/Keycloak environment

- `KEYCLOAK_ADMIN_USERNAME`, `KEYCLOAK_ADMIN_PASSWORD`
- `KEYCLOAK_REGISTRATION_CLIENT_SECRET`
- `KEYCLOAK_AUTHENTICATION_CLIENT_SECRET`
- `KEYCLOAK_GOOGLE_CLIENT_ID`, `KEYCLOAK_GOOGLE_CLIENT_SECRET`
- `KEYCLOAK_PUBLIC_URL` when running behind a public HTTPS proxy

Do not commit downloaded Google OAuth client-secret JSON or any `.env` file. The ignored `secrets/` directory is local-only.

### Mobile environment

Copy `mobile/.env.example` to `mobile/.env.local`:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Reachable Spring API origin |
| `EXPO_PUBLIC_KEYCLOAK_URL` | Reachable Keycloak origin |
| `EXPO_PUBLIC_PRIVACY_URL` | Published privacy policy |
| `EXPO_PUBLIC_TERMS_URL` | Published terms |
| `EXPO_PUBLIC_ENABLE_DEMO_SKIP_WAIT` | Development-only reveal control |
| `EXPO_PUBLIC_TEST_LOGIN_EMAIL` | Optional development quick login |
| `EXPO_PUBLIC_TEST_LOGIN_PASSWORD` | Optional development quick login |

Every `EXPO_PUBLIC_*` value is embedded in the client bundle and must be treated as public. Never place a client secret or private API key there.

### CORS and redirect URIs

The backend currently permits browser origins on localhost and 127.0.0.1 ports 5173 and 5174. Production origins require an explicit configuration change.

The native Keycloak redirect is `runout://oauth/callback`. Production HTTPS origins, reverse-proxy headers, and Google broker callback URLs must be configured consistently in Keycloak and the identity provider console.

## Testing and verification

### Backend

```bash
mvn test
```

The suite covers reservation state transitions, captured/failed payments, feedback rules, trusted-header replacement, Spring Modulith boundaries, and generated module documentation. Diagrams/canvases are written under `target/spring-modulith-docs`.

### Staff backoffice

```bash
cd frontend
npm run build
```

### Restaurant portal

```bash
cd restaurant-frontend
npm install
npm run build
```

For an instant populated demo without PostgreSQL, Keycloak, or the Spring backend:

```bash
./start-restaurant-demo.sh
```

Open `http://127.0.0.1:5174` and sign in with `demo@runout.local` / `RunOutDemo2026!`. Demo edits live in memory and reset when the process stops.

### Mobile

```bash
cd mobile
npm run lint
npm run typecheck
npm test -- --runInBand
npm run doctor
```

Native journey tests use Maestro:

```bash
maestro test e2e/01-create-sealed.yaml
maestro test e2e/02-unrevealed.yaml
maestro test e2e/03-feedback.yaml
maestro test e2e/04-profile-signout.yaml
```

They require an installed build, running dependencies/fixtures, and test credentials.

### Postman end-to-end collection

Import `postman/Runout-Simplified.postman_collection.json` and `postman/Local.postman_environment.json`. The collection checks health, creates a customer, promotes it to local super admin through Keycloak, creates/activates a restaurant, creates and pays a reservation, runs the staff lifecycle, and verifies reveal. See `postman/README.md` for the exact order and local-only warning.

### Audit baseline (4 November 2026)

- Backend: **15 tests passed**.
- Staff backoffice: **production build passed**.
- Restaurant portal: **production build passed**.
- Mobile TypeScript: **passed**.
- Mobile lint: **fails** with two React hooks errors (`booking/index.tsx`, `EnvelopeReveal.tsx`) and one unused-disable warning.
- Mobile Jest: **6 of 7 suites load and 15 tests pass**; `ui.test.tsx` is blocked because Jest does not transform the ESM build of `lucide-react-native`.

These are existing code/test-configuration issues, not README failures.

## Known gaps and production blockers

The distinction between UI intent and backend capability is important:

1. **Real payments:** Stripe Checkout and signed fulfillment are implemented for sandbox testing. Live rollout, wallet validation, refunds, reconciliation, and chargebacks still need work.
2. **Restaurant money flow:** the backend does not pay restaurants or track restaurant compensation. It also has no commission/reservation-fee ledger separate from the mock total capture.
3. **Matching:** operations selects manually; the server's candidate list enforces only active status and radius.
4. **Alcohol and shisha:** the Expo UI sends both preferences, but the backend silently ignores them because its DTO/schema has no fields.
5. **Reveal policy:** code reveals at the confirmed time, not two hours before. Product copy/policy must agree on one rule.
6. **Cancellation policy:** status-based cancellation exists, but no two-hour cutoff, refund/credit calculation, no-show rule, or “next reservation fee” compensation exists.
7. **Restaurant portal phase 2:** the authenticated profile/category/price/menu editor exists. Public signup/onboarding review, availability on/off, smart discounts, photos, parking/directions, test booking, password recovery, multiple users, and an audit/version history are still absent.
8. **Notifications:** the app schedules local reminders and the backend listener logs; there is no APNs/FCM token registry, delivery tracking, email, SMS, or WhatsApp integration.
9. **Authentication completeness:** server logout does not revoke tokens; Apple sign-in, account deletion, email-verification UX, and a complete reset-password UX are launch work.
10. **Backoffice security:** tokens are in localStorage, the API URL is hardcoded, refresh is absent, staff MFA/audit history is absent, and CORS is local-only.
11. **Restaurant privacy:** customer clients must use the reveal endpoint to determine when restaurant details become visible.
12. **Experiences module:** persistence/domain code exists but has no active controller or customer journey.
13. **Production infrastructure:** no production Compose/Kubernetes/cloud database setup, CI pipeline, secrets manager, observability stack, backups, rate limiting, or deployment runbook is included.
14. **Legal/release:** publish privacy/terms, configure final store identifiers/signing, complete store disclosures, and review Apple login requirements.
15. **Quality:** resolve the current mobile lint/Jest configuration failures and run native E2E on supported devices before release.

## Security notes

- Keep Keycloak confidential-client secrets, Google credentials, database passwords, signing material, and payment credentials out of Git.
- Replace all local placeholder secrets and development users in every non-local environment.
- Use HTTPS for the API, Keycloak, and browser applications.
- Do not log passwords, JWTs, refresh tokens, payment tokens, or exact customer coordinates.
- Keep Google Maps keys server-side and restrict them by API/project policy.
- Rate-limit public registration, login, refresh, location, and future payment endpoints at the edge.
- Preserve the reveal contract: never infer or cache restaurant identity in a customer-visible client before backend authorization.

## Troubleshooting

### Keycloak changes are not visible

The realm JSON is imported only into a new Keycloak data store. Update the existing realm in the admin console, or recreate the local Keycloak volume only if losing local realm data is acceptable.

### Login succeeds in Keycloak but `/users/me` fails

The Keycloak identity may not have a local `app_user`. Call `POST /api/v1/users/me/provision` with the bearer token. The Expo Google flow and React backoffice already handle provisioning paths.

### A physical phone cannot reach the API

Replace `localhost` in `mobile/.env.local` with the computer's LAN IP, restart Metro, verify firewall access to ports 8080/8081, and ensure the phone and computer share a network. OAuth redirects and Keycloak hostname settings must also match the reachable URL.

### Google location/restaurant search returns no results

Set `GOOGLE_MAPS_API_KEY` in the backend process, enable the required Places and Geocoding APIs, and check server logs. Do not add the key to Expo public variables.

### The envelope never opens

For the real flow, operations must confirm an active restaurant and a confirmed time, then that time must arrive. For local animation testing, use `./start-all.sh` or start the API with `RUNOUT_DEMO_SKIP_WAIT_ENABLED=true`. Set `EXPO_PUBLIC_ENABLE_DEMO_SKIP_WAIT=true` in the mobile development environment, then use **Skip the wait · demo** on a paid reservation.

### Port 8000 does not show Presentation and Strategy Hub

Serve the directory containing the hub `index.html`, not the repository root:

```bash
python3 -m http.server 8000 --directory mobile/runout-web-demo
```

Or rebuild and serve `mobile/dist` as shown above.

## Further documentation

- `AGENTS.md` — compact repository context and implementation guardrails for future coding-agent sessions.
- `mobile/README.md` — native setup, Keycloak/OAuth notes, EAS builds, and release blockers.
- `mobile/FLOWS.md` — detailed customer journeys, QA matrix, and future product roadmap.
- `postman/README.md` — automated local API lifecycle.
- `FIGMA_PRODUCT_DESIGN_PROMPT.md` and `MOBILE_APP_BUILD_PROMPT.md` — design/build briefs, not executable specifications.
- Swagger/OpenAPI — the live request/response contract at `http://localhost:8080/swagger-ui.html`.

When product strategy documents and executable code disagree, treat the API DTOs, state machine, security annotations, Liquibase migrations, and current clients as the implementation truth—and record the difference as roadmap work rather than describing it as already delivered.
