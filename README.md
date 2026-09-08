# Runout backend

Modular monolith built with Java 25, Spring Boot 4.1.1, Spring Modulith 2.1.1, PostgreSQL, Liquibase and Lombok.

## Module layout

Each direct child package of `com.runout` is an application module. Its `package-info.java` declares the only dependencies it may have. Code under `internal` is invisible to other modules; only the types under an `api` package marked with `@NamedInterface("api")` may be imported.

Modules expose Java contracts, commands, summaries and integration events through `api`. Their implementation is organized under `internal/domain` (entities and business rules), `internal/application` (services and event listeners), and `internal/infrastructure` (persistence and web adapters). These Java interfaces are in-process monolith contracts, not REST clients.

```text
com.runout
├── administration  REST endpoints and manual operations
├── bookings        manual restaurant reservations
├── experiences     events offered to customers
├── matching        manual/automatic group formation
├── notifications   notification reactions
├── payments        payment workflow
├── restaurants     restaurant catalogue
├── users           identities and profiles
└── shared          small technical/domain primitives
```

## Communication examples

Synchronous calls are used when an answer is required to finish the current transaction. `BookingManagement`, for example, calls the public `Experiences` and `Restaurants` interfaces before recording a booking. `MatchingManagement` similarly calls `Experiences` and `Users`.

Asynchronous events are used for consequences that do not need to hold up the originating transaction:

```text
Experiences -- ExperiencePublished --> Matching
Matching    -- GroupFormed ---------> Bookings + Notifications
Bookings    -- BookingConfirmed ----> Payments + Notifications
Payments    -- PaymentCaptured -----> Notifications
```

`@ApplicationModuleListener` executes each consumer asynchronously in its own transaction. The Spring Modulith event publication registry stores deliveries in PostgreSQL, allowing incomplete publications to be republished after restart.

## Run locally

Requirements: JDK 25, Maven 3.6.3+ and Docker.

```bash
docker compose up -d
mvn spring-boot:run
```

Docker Compose starts PostgreSQL and Keycloak. The local Keycloak console is available at `http://localhost:8081`; its development credentials default to `admin` / `admin` and can be overridden with `KEYCLOAK_ADMIN_USERNAME` and `KEYCLOAK_ADMIN_PASSWORD`.

The imported `runout` realm enables self-registration and defines public clients for the mobile app (`runout-mobile`) and admin panel (`runout-admin`). Both use Authorization Code with PKCE and request tokens for the `runout-api` audience. Access tokens last five minutes; refresh tokens are rotated and governed by the Keycloak session limits.

The API is an OAuth2 resource server. It validates the JWT signature, issuer, audience and timestamps on every protected request. Realm roles are mapped to Spring Security `ROLE_*` authorities, so JWTs used with `/api/admin/**` need the Keycloak `ADMIN` realm role. Production must use HTTPS, secure administrator credentials and a production Keycloak database/configuration.

Liquibase owns the database schema. The master changelog is `src/main/resources/db/changelog/db.changelog-master.yaml`; versioned schema and development-data changesets live under `db/changelog/changes`. Development seed data is guarded by the `dev,test` contexts.

Useful endpoints:

```text
GET  /actuator/health
GET  /actuator/modulith
GET  /swagger-ui.html
GET  /v3/api-docs
POST /api/v1/users/registrations
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/bookings
POST /api/admin/experiences
POST /api/admin/experiences/{id}/publication
POST /api/admin/groups
POST /api/admin/bookings
POST /api/admin/bookings/{id}/confirmation
```

Swagger UI and the OpenAPI JSON are public so that the documentation can load. Protected operations declare the `bearerAuth` security scheme; use Swagger's **Authorize** button to provide an access token issued by Keycloak.

Example request bodies:

```json
{"displayName":"Ana","email":"ana@example.com","password":"a-secure-password"}
```

`POST /api/v1/users/registrations` is public. It creates the identity in Keycloak through the confidential `runout-registration-service` client and then persists the Run Out profile linked to the Keycloak user identifier. Passwords must contain at least 12 characters and are sent only to Keycloak; Run Out never stores them. In production, set `KEYCLOAK_REGISTRATION_CLIENT_SECRET` to a strong secret and rate-limit this endpoint at the edge.

Login and token renewal are also public operations backed by Keycloak:

```json
{"email":"ana@example.com","password":"a-secure-password"}
```

`POST /api/v1/auth/login` returns `accessToken`, `expiresIn`, `refreshToken`, `refreshExpiresIn` and `tokenType`. Send the access token as `Authorization: Bearer <accessToken>` on protected requests. Renew the session through `POST /api/v1/auth/refresh`:

```json
{"refreshToken":"<refresh-token>"}
```

Refresh token rotation is enabled, so the client must replace both stored tokens with those returned by every refresh. In production, set `KEYCLOAK_AUTHENTICATION_CLIENT_SECRET` to a strong secret and do not expose that secret to mobile or browser clients.

Create an authenticated reservation request with a unique `Idempotency-Key` header:

```json
{
  "reservationAt": "2026-10-15T20:30:00+04:00",
  "excludedCuisineTypes": ["SEAFOOD", "ITALIAN"],
  "partySize": 4,
  "budgetPerPerson": {"amount": 150.00, "currency": "AED"},
  "searchArea": {
    "latitude": 25.204849,
    "longitude": 55.270783,
    "radiusMeters": 5000
  },
  "paymentMethodToken": "pm_mock_success"
}
```

`POST /api/v1/bookings` obtains the user from the JWT, calculates the total budget, captures the payment and persists the reservation as `PENDING`. The default `mock` payment provider accepts any token except values starting with `pm_fail`, which return `402 Payment Required`. Configure `PAYMENT_PROVIDER` when a real gateway adapter is available.

```json
{"title":"Friday dinner","startsAt":"2026-10-02T18:30:00Z","capacity":6}
```

```json
{"experienceId":"<uuid>","participantIds":["10000000-0000-0000-0000-000000000001","10000000-0000-0000-0000-000000000002"]}
```

```json
{"experienceId":"<uuid>","restaurantId":"20000000-0000-0000-0000-000000000001","groupId":"<uuid>","externalReference":"PHONE-1234","reservedAt":"2026-10-02T18:30:00Z"}
```

## Verify the architecture

```bash
mvn test
```

`ModularityTests` rejects cycles, imports from another module's internals, and undeclared dependencies. `DocumentationTests` generates module diagrams and canvases under `target/spring-modulith-docs`.
# runapp-backend
