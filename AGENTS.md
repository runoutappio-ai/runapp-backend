# Run Out repository context for coding agents

This file applies to the entire repository. It is the compact, agent-oriented context that should be read before making changes. The human-facing, exhaustive guide is `README.md`. When working inside `mobile/`, also read `mobile/AGENTS.md` completely because it contains additional Expo-specific rules.

## Required reading order

1. Read this file.
2. Read the relevant sections of `README.md`.
3. For customer-app work, read `mobile/AGENTS.md`, `mobile/README.md`, and the relevant part of `mobile/FLOWS.md`.
4. Read the executable code and tests for the area being changed. Documentation and strategy may be stale; code is the implementation truth.
5. Check `git status` before editing. Existing modifications belong to the user unless clearly created by the current task.

## What Run Out is

Run Out is a Dubai-first mystery restaurant reservation product. The guest does not browse or choose a restaurant. They provide constraints, pay, and receive a sealed reservation. Run Out operations chooses and confirms the restaurant. The backend controls when the identity and menu are revealed.

The core value proposition is:

- give restaurants incremental customers they might not otherwise receive;
- reduce restaurant customer-acquisition/marketing cost;
- help customers discover places while receiving better value;
- let Run Out earn a reservation/commission fee for coordinating that value.

The business-model intent is not identical to the current code. Keep these two categories explicit in plans, documentation, and UI copy.

### Product/business intent (roadmap unless code proves otherwise)

- Mobile app is the primary customer product.
- A customer books for up to six people by setting party size, where, when, budget, and preferences; they do not browse restaurants.
- The intended service promise discussed in strategy is to send an assigned invitation/set menu within roughly two hours.
- The restaurant signs with Run Out, defines menu/category/price/savings, receives routed reservations, serves the guest, and is paid for the meal on the day.
- Run Out intends to earn the reservation/commission fee and does not currently intend to pay restaurants a separate compensation amount.
- Restaurant acquisition starts with personal outreach and in-person visits, discovery interviews, a restaurant deck/onboarding funnel, follow-up, test bookings, and an initial target of 50 Dubai restaurants.
- Future restaurant ideas beyond the implemented portal include directions, parking, map pin, photos, accepting customers on/off, smart discounts, shisha/alcohol attributes, and free-dinner/priority-routing promotions.
- Strategy content also covers influencer/referral growth, expansion to new countries without equity, and a food/travel/restaurant-expert social persona interviewing owners and reviewing dishes.

Do not present any roadmap item above as implemented unless the code, schema, API, and client flow all support it.

## Current implementation snapshot

The repository currently contains:

- Java 25 / Spring Boot 4.1.1 modular-monolith API;
- PostgreSQL 18 schema managed by Liquibase;
- Keycloak 26.7.3 realm/import for identity and roles;
- React 19 / Vite 7 staff backoffice;
- React 19 / Vite 7 restaurant partner portal;
- Expo SDK 57 / React Native customer app for iOS, Android, and web;
- a self-contained demo hub with Presentation and Strategy Hub;
- Postman, JUnit, Jest, and Maestro test assets.

Default local ports:

| Component | Port |
| --- | --- |
| PostgreSQL | `5432` |
| Spring API | `8080` |
| Keycloak | `8081` |
| Expo iOS Metro script | `8082` |
| Staff backoffice | `5173` |
| Restaurant portal | `5174` |
| Integrated static demo/hub | `8000` |

## Source-of-truth hierarchy

When facts conflict, use this order:

1. Current executable code and security annotations.
2. Liquibase schema and automated tests.
3. Current client request/response types and runtime configuration.
4. Root `README.md`.
5. Component documentation such as `mobile/FLOWS.md`.
6. Strategy hub, prompts, presentations, and historical HTML artifacts.

Never silently merge strategy and implementation. State the difference and decide whether the task is documentation, implementation, or both.

## Component and edit map

| Area | Primary source |
| --- | --- |
| Backend | `src/main/java/com/runout/` |
| Backend config | `src/main/resources/application.yml` |
| Database schema | `src/main/resources/db/changelog/` |
| Backend tests | `src/test/` |
| Keycloak | `keycloak/realm/runout-realm.json`, `compose.yml` |
| Staff backoffice | `frontend/src/` |
| Restaurant portal | `restaurant-frontend/src/` |
| Vite strategy copy | `frontend/public/strategy-hub/index.html` |
| Expo app | `mobile/src/` and `mobile/app.config.ts` |
| Mobile demo API | `mobile/src/demo/server.ts` |
| Demo hub source | `mobile/web-demo/` |
| Committed demo snapshot | `mobile/runout-web-demo/` |
| API collection | `postman/` |

Prefer editing source rather than generated output. `mobile/scripts/build-web-demo.mjs` exports the Expo web app into `mobile/dist/app`, copies `mobile/web-demo` around it, scans for test-login secrets, and creates a zip. If a task explicitly requires the committed `mobile/runout-web-demo/` snapshot to work immediately, keep its relevant static files synchronized with `mobile/web-demo/` without overwriting unrelated user changes.

There are multiple strategy-hub copies. The two mobile copies currently match each other; the Vite copy is different. Confirm which surface the user named before changing one or synchronizing them.

## Backend module boundaries

Direct packages under `com.runout` are Spring Modulith modules:

- `authentication`: backend login/refresh against Keycloak;
- `users`: local identities, profiles, registration, staff roles;
- `bookings`: reservation aggregate, lifecycle, reveal, cancellation, feedback;
- `restaurants`: cities, catalogue, menus, Google Places import;
- `administration`: operations queue, assignment, nearby restaurants, confirmation;
- `payments`: payment contracts, mock gateway and Stripe sandbox Checkout adapter;
- `notifications`: integration listeners that currently log only;
- `locations`: Google Places/geocoding integration;
- `experiences`: dormant domain/persistence module with no current HTTP journey;
- `shared`: security, configuration, HTTP helpers, and exception mapping.

Cross-module imports must use exposed `api` packages. `ModularityTests` verifies boundaries. Do not import another module's `internal` code.

## Implemented customer and operations flow

### Authentication

- Email registration: backend creates Keycloak identity, then local `app_user`; it attempts Keycloak rollback if local persistence fails.
- Email login/refresh: backend uses confidential Keycloak service clients.
- Google login: Expo Authorization Code + PKCE through public `runout-mobile`, followed by `/api/v1/users/me/provision`.
- Mobile tokens live in SecureStore and refresh is single-flight with one retry.
- Backend logout does not revoke Keycloak tokens; clients only clear local state.

### Booking

The current Expo flow has three screens:

1. table/date/time/location/radius;
2. per-person budget, mood, exclusions, dietary/allergy needs, alcohol/shisha UI preferences;
3. demo payment method and confirmation.

The UI uses 2–6 guests and AED 50–400 per person. The backend accepts 1–6 guests. Drafts live in AsyncStorage until successful payment.

Budget & mood calls the guest-accessible `POST /api/v1/restaurants/match-count` after a short debounce. Only the count is returned. New drafts require a positive count to continue. Matching uses active restaurants, radius or Dubai scope, published menu price and party size, cuisine exclusions, and restaurant tags for vibe, dietary preferences, `Licensed venue` and `Shisha`. `Casual` includes restaurants without a vibe tag. Availability and free-text allergy notes require human confirmation.

### State machine

```text
PAYMENT_PENDING → PAID → ASSIGNED → IN_PROGRESS → CONFIRMED → COMPLETED
```

Alternatives are `PAYMENT_FAILED`, `CANCELLED`, and `REJECTED`. `REJECTED` may transition back to `IN_PROGRESS` when started again.

- Creation is idempotent by `(user_id, Idempotency-Key)`.
- Payment requires a separate key and creates a deterministic mock reference, but successful replay is not implemented; a second pay call after `PAID` fails the state rule.
- Mock tokens beginning `pm_fail` fail; other tokens capture immediately.
- Checkout and the payment command use a reservation fee of 10% of the saved table budget, rounded to the currency’s minor unit. The meal is paid at the restaurant.
- `PAYMENT_PROVIDER=stripe` opts into hosted test Checkout. Stripe uses the sandbox’s payment method settings for cards, Apple Pay, and Google Pay, and shows wallets on compatible devices and browsers. Only a signed paid Session with the linked ID and expected AED amount can mark a reservation paid. The mock path and legacy demo wallet buttons are separate from the sandbox flow.
- `./start-all.sh` defaults to Stripe when the ignored local test key exists at `.run/stripe/backend.key` and starts a sandbox webhook listener. An explicit `PAYMENT_PROVIDER=mock` overrides that default.
- An iOS development build with the Stripe publishable test key uses a linked PaymentIntent for its card and Apple Pay controls. The card screen embeds Stripe’s native fields and Stripe handles bank authentication. Apple Pay additionally requires an Apple Merchant ID, matching certificate and app entitlement, and an eligible device. Switching between hosted and native payment closes the other active Stripe attempt before opening a new one.
- The booking flow depends on the payments module’s `CheckoutGateway` contract for online payment. Each reservation keeps its provider and hosted or native attempt IDs. Stripe SDK calls and signature checks live in the Stripe adapter. New mobile builds use provider-neutral endpoints and a configured client strategy. The existing Stripe routes remain for older builds.

### Operations

- Super admin/manager lists captured-payment reservations and assigns workers.
- Workers see their own reservations plus unassigned `PAID` work and may self-claim.
- Super admin/worker starts or rejects; manager cannot start/reject.
- Super admin/manager/owning worker confirms an active restaurant, external reference, and time.
- Only super admin completes.
- Nearby restaurant candidates enforce active status and radius only. Every other suitability rule is manual.

### Reveal/privacy invariant

Customer-visible code must never show or infer restaurant identity before `GET /api/v1/reservations/{id}/reveal` returns `available: true`.

Real reveal requires:

- status `CONFIRMED` or `COMPLETED`;
- restaurant and confirmed time present;
- current time at or after confirmed time.

The implementation reveals at the confirmed time. The property-gated demo route previews the envelope after captured payment without persisting an assignment. With Stripe sandbox it returns a sample restaurant and menu and leaves the actual assignment sealed. `start-all.sh` enables the preview by default.

### Cancellation and feedback

- Customer cancellation is allowed only for `PAYMENT_PENDING` or `PAID`.
- The promised two-hour cancellation cutoff, refunds, credits, no-show sharing, and next-fee compensation are not implemented.
- Feedback is one submission after `COMPLETED`: rating 1–5, optional 1,000-character comment, and return intent.

## Restaurant facts

While pending, partners can POST /api/restaurant-portal/me/menus/cancel-submission to return to DRAFT, preserve submitted menus and unlock edits for later resubmission. Management cannot approve a cancelled draft.

Partner profile/menu edits are locked while PENDING_APPROVAL, enforced by entity guards and disabled portal controls; approval/rejection unlocks editing.

Menu review (migration 010): pending_menus stores submissions with DRAFT/PENDING_APPROVAL/APPROVED/REJECTED states. SUPER_ADMIN/MANAGER review via POST /api/admin/restaurants/{id}/menu-review. Customers receive only published menus. Price selection is in Menus; all five menus and every course plus saved contact/address/hours/parking/categories are required to submit.

The partner profile includes required parking instructions, persisted in `restaurant.parking_instructions` by migration 009. Directions and photos remain future work.

Restaurant price tiers 1–8 correspond to AED 50/100/150/200/250/300/350/400 per guest, with one selection. Partner menus store `priceBeforePerPerson` and `priceAfterPerPerson`; discount percentage is derived and table savings equal their difference times party size.

Implemented restaurant fields include active state, city/area, name/contact, cuisine, price tier, description, opening hours, tags, Google Place metadata, coordinates, rating/count, URLs/types, and JSONB menus.

Google Places search/import happens server-side. The browser must never receive `GOOGLE_MAPS_API_KEY`.

The authenticated restaurant portal lets one uniquely linked `RESTAURANT` account edit its profile, select one price range and multiple categories, and replace exactly five structured menus for 2–6 guests. Every menu has a discount and `STARTERS`, `MAINS`, `DESSERTS`, and `DRINKS`; the old `entries` format is intentionally unsupported. Saved menus appear in the staff backoffice and the customer app filters the revealed menu by party size.

Public signup/review, restaurant-controlled availability, directions/parking/photos, automated capacity matching, multi-user teams, password recovery, and restaurant payment flows are not implemented.

The Expo app sends `licensedVenue` and `shishaVenue`, but the Java DTO/schema has no such fields. They are ignored and cannot affect matching.

## Roles and security

Realm roles: `USER`, `RESTAURANT`, `WORKER`, `MANAGER`, `SUPER_ADMIN`.

- `SUPER_ADMIN`: all backoffice sections, users/roles, restaurant management, all operations, completion, city creation.
- `MANAGER`: all operations list/assignment/confirmation and restaurant editing/activation; cannot start, reject, complete, or manage users.
- `WORKER`: own/claimable work, self-assignment, start/reject/confirm own work, and restaurant list/create/import; cannot edit/activate restaurants.
- `RESTAURANT`: only the restaurant linked to its authenticated user; profile/category/price/menu access, no staff operations.
- `USER`: customer endpoints only.

Health, Swagger/OpenAPI, registration, login, refresh and the guest restaurant match count are public. `GET /api/v1/restaurants` and restaurant details require JWT authentication.

The backend validates issuer and `runout-api` audience. `AuthenticatedUserHeaderFilter` strips spoofed identity headers and injects trusted subject/email/username/display-name values from the JWT.

Local CORS is limited to localhost/127.0.0.1 ports 5173 and 5174. Do not assume production origins work.

Never expose or commit `.env`, Keycloak client secrets, Google OAuth JSON, Maps keys, tokens, signing files, or payment credentials. `EXPO_PUBLIC_*` values are public bundle content and may not contain secrets.

## Keycloak facts

Realm: `runout`.

Clients:

- `runout-api`: expected API audience;
- `runout-mobile`: public PKCE client using `runout://oauth/callback`;
- `runout-admin`: declared public client but not used by the current React login flow;
- `runout-registration-service`: confidential user-registration service;
- `runout-auth-service`: confidential direct-grant login/refresh service.

The realm declares Google, but working login still requires valid Google credentials and callback configuration. Realm JSON is imported only when Keycloak initializes a new data volume; changing JSON does not update an existing realm automatically.

Development staff credentials are documented in `README.md` and must never be copied to a real environment.

## Local commands

From repository root:

```bash
docker compose up -d
mvn spring-boot:run
./start-frontend.sh
./start-restaurant-frontend.sh
python3 -m http.server 8000 --directory mobile/runout-web-demo
```

Mobile:

```bash
cd mobile
cp .env.example .env.local
npm install
npm run ios
npm run android
npm run web
npm run build:web-demo
```

## Verification expectations

Run checks proportional to the files changed:

- backend: `mvn test`;
- staff UI: `cd frontend && npm run build`;
- restaurant portal: `cd restaurant-frontend && npm run build`;
- mobile: `cd mobile && npm run lint && npm run typecheck && npm test -- --runInBand`;
- static HTML: serve the exact target directory and inspect the affected route/viewport;
- cross-component contract: verify both Java DTO/controller and TypeScript client types.

Known baseline on 4 November 2026:

- backend tests pass (15 tests);
- staff production build passes;
- restaurant portal production build passes;
- mobile TypeScript passes;
- mobile lint has two React hooks errors and one warning;
- six mobile Jest suites run with 15 passing tests; the UI suite is blocked by Jest not transforming `lucide-react-native` ESM.

Do not attribute these pre-existing failures to a documentation-only change, and do not claim all checks pass.

## High-priority implementation gaps

Before public launch the project still needs, at minimum:

- Stripe live rollout, wallet testing, refunds and reconciliation;
- production-grade payment idempotency;
- server-side storage/use of alcohol and shisha preferences;
- matching eligibility beyond radius;
- a decided reveal and cancellation/refund policy reflected in code and copy;
- restaurant portal phase 2: onboarding review, availability, photos/directions, password recovery, multi-user teams, and audit history;
- push token registration and server notifications;
- Keycloak token revocation/logout, Apple sign-in if required, account deletion, and complete reset/verification UX;
- production backoffice authentication, configurable origins, refresh, staff MFA, and audit logs;
- legal URLs/consent, production infrastructure, secret management, observability, backups, CI/CD, and app-store setup;
- fixes for current mobile lint/Jest failures plus native E2E coverage.

## Rules for future changes

- Preserve the mystery/reveal privacy invariant across API and clients.
- Do not call a demo payment method “working Apple Pay/Google Pay/Stripe.”
- Do not call alcohol/shisha filters implemented until persisted and matched server-side.
- The authenticated restaurant profile/menu portal exists; do not describe public signup, review/onboarding, availability, or other phase-2 restaurant flows as implemented.
- Do not rename `/api/v1/reservations` back to the obsolete `/api/v1/bookings` paths found in old docs.
- Add a Liquibase migration for schema changes; do not rely on Hibernate schema creation.
- Respect module boundaries and add/update tests with domain changes.
- Keep root `README.md`, this context file, client types, and component docs synchronized after material architecture or flow changes.
- Preserve unrelated user edits and inspect duplicate/generated HTML surfaces before applying bulk replacements.
