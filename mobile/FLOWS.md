# Run Out product flows

This document is the customer-flow source of truth for the native app. It separates flows that are implemented in `mobile/` from flows that should be added later. It can be used as a product map, acceptance checklist, and starting point for E2E coverage.

## End-to-end lifecycle

```text
Launch
  → restore session or authenticate
  → Home dashboard
  → create/continue local booking draft
  → create server reservation (PAYMENT_PENDING)
  → capture payment (PAID)
  → operations assigns and prepares it (ASSIGNED → IN_PROGRESS)
  → operations confirms restaurant and time (CONFIRMED)
  → details stay sealed until backend reveal is available
  → customer attends
  → operations completes it (COMPLETED)
  → customer leaves one feedback response
```

Alternative terminal paths are `PAYMENT_FAILED`, `CANCELLED`, and `REJECTED`. Restaurant identity must never be rendered unless the reveal endpoint returns `available: true`.

## Implemented customer flows

### 1. App launch and session restoration

- Show a native loading state while SecureStore is read.
- Restore access and refresh tokens from SecureStore.
- Load the authenticated user.
- If the access token is expired, rotate the token pair once and retry the request once.
- Coalesce simultaneous `401` responses behind one refresh request.
- Clear credentials and return to authentication if refresh fails.
- Protect authenticated and unauthenticated route groups at the navigator level.
- Open the dashboard after authentication; never reopen a previous reveal screen automatically.

### 2. Welcome and authentication

- Welcome screen with Run Out positioning and legal links from environment configuration.
- Continue with Google through Keycloak Authorization Code + PKCE.
- Provision the local user after a successful OIDC login.
- Register with name, email, and a password of at least 12 characters.
- Sign in with email/password.
- Password visibility, validation, progress, API error, and retry states.
- iOS Apple button is intentionally disabled until the Apple Keycloak IdP is configured.
- Sign out calls the backend, then clears local credentials even if the request fails.

### 3. Home dashboard

- Dubai-time greeting and the customer’s first name.
- Start or continue a locally persisted reservation draft.
- Upcoming reservation summary without restaurant leakage.
- Shortcut to Reservations.
- Previous-night previews.
- Pull-to-refresh, empty states, and recoverable errors.
- Animated sealed envelope with reduced-motion support.

### 4. Reservation draft

- A draft is stored locally and is not represented as a server reservation.
- Resume the draft from Home.
- Back/forward navigation keeps entered values.
- Closing the wizard returns to Home.
- The draft is cleared only after captured payment.

### 5. Reservation wizard

- Step 1 — Your table: party size from 2 to 6, future date, and a one-hour time window in Dubai time.
- Step 2 — Budget & mood: total AED budget, vibe, up to three cuisine exclusions, dietary preferences, and allergy notes.
- Step 3 — Location: Dubai area or device location plus travel radius in kilometres.
- Step 4 — Payment: choose card, Apple Pay, or Google Pay as a demo method, review the total, and seal the reservation.
- Budget uses AED 50 steps with AED 50 minimum per person and AED 1,000 total maximum.

### 6. Location

- Select any of the 15 supported Dubai areas.
- Refine an area with the backend location-search endpoint when available.
- Request foreground device location.
- Reverse-geocode coordinates through the backend and display the returned street address.
- Keep the manual area selector available when permission is denied or location fails.
- Convert kilometres to backend `radiusMeters` within the 500–50,000 metre contract.
- Avoid logging exact coordinates in production.

### 7. Reservation creation and payment

- Create a reservation with a stable UUID idempotency key.
- Preserve that key across retries of the same logical create operation.
- Pay with a separate stable idempotency key.
- Obtain the token through a replaceable `PaymentProvider` boundary.
- Clearly identify the current provider as a demo; collect and store no card data.
- Advance only when payment status is exactly `CAPTURED`.
- Keep failed or pending payments away from all restaurant data.
- Schedule replaceable local reveal and reservation reminders after success.

### 8. Sealed waiting state

- Show date, party size, budget, and customer-friendly status.
- Keep restaurant name, address, coordinates, menu, and map action hidden.
- Refresh on screen focus, app foreground, pull-to-refresh, and a timer that reaches the confirmed reservation time.
- Explain that the envelope opens exactly at the confirmed reservation time.
- Never infer restaurant information from the restaurant catalogue.

### 9. Reveal

- Read only `GET /api/v1/reservations/{id}/reveal`.
- Render restaurant data only when `available` is `true` and a restaurant is present.
- Animate the wax seal, flap, and menu letter when the backend authorizes the reveal; respect the device reduced-motion preference.
- Show restaurant name, cuisine, full address, confirmed time, party size, and menu.
- Show dietary preferences and an allergy reminder.
- Handle absent menu information.
- Open Google Maps in the installed app when possible, otherwise use the browser URL.
- In development builds only, optionally call the property-gated demo endpoint to skip the clock and exercise the opening animation. Ownership and confirmed restaurant requirements remain enforced.

### 10. Reservation history and detail

- Load all customer reservations.
- Separate active/upcoming and previous items.
- Display all backend statuses using customer-friendly labels.
- Support pull-to-refresh and empty/error states.
- Preserve reveal privacy on every list and detail route.
- Allow cancellation only for `PAYMENT_PENDING` and `PAID`, matching the backend rule.
- Confirm destructive cancellation before submission.

### 11. Completed-reservation feedback

- Offer feedback only for `COMPLETED` reservations without feedback.
- Require a 1–5 rating.
- Accept an optional comment up to 1,000 characters.
- Capture return-for-another-surprise-menu intent.
- Select from the ten established trust prompts.
- Replace the form with the stored response after submission.
- Surface the backend duplicate-feedback business error.

### 12. Profile

- Load the authenticated user and extended profile.
- Edit phone, birth date, dietary preferences, allergy notes, saved address, marketing preferences, and reservation notifications.
- Save through the profile patch endpoint.
- Sign out.
- Explain that account deletion is unavailable; do not show a nonfunctional delete action.

### 13. Reliability, privacy, and accessibility

- Parse Spring Problem Details and prioritize `detail` in customer-facing errors.
- Show a clear offline message and retry action for network failures.
- Retry server queries on focus/reconnect without aggressive polling.
- Use safe areas, keyboard-aware scrolling, accessible roles and labels, 44+ point controls, Dynamic Type-friendly layouts, haptics, and reduced-motion behavior.
- Never store tokens in AsyncStorage or log credentials, payment tokens, passwords, or exact coordinates.

## Operations handoff already supported by the backend

The mobile app intentionally does not expose these staff actions, but the customer experience depends on them:

- A paid reservation becomes visible to operations.
- Staff assigns an employee and progresses planning.
- Staff chooses a suitable active restaurant without violating exclusions, dietary needs, location radius, party size, or budget.
- Staff confirms the restaurant and final time.
- The backend—not the app—authorizes the reveal.
- Staff completes or rejects the reservation with an auditable reason/process.
- Customer feedback becomes available for quality review.

## Recommended flows

### P0 — required before public launch

1. **Sign in with Apple**
   - Configure Apple as a Keycloak IdP, implement nonce/state handling, enable the prepared provider, and test account linking.
   - Required if current App Store rules apply to the final login offering.

2. **Account deletion**
   - Add an authenticated deletion endpoint, confirmation/re-authentication, cancellation window if desired, token revocation, and deletion/anonymization audit.
   - Include handling for active reservations, retained financial records, and feedback anonymization.

3. **Forgot/reset password and email verification**
   - Keycloak-driven reset link, expired-link handling, resend verification, changed-email verification, and post-reset session behavior.

4. **Real payments**
   - Provider SDK/tokenization, Apple Pay/Google Pay where supported, 3-D Secure, pending/failed/abandoned flows, receipts, webhooks, reconciliation, refunds, and chargeback handling.

5. **Server push notifications**
   - Permission education, device-token registration, token rotation/removal, reservation-status notifications, reveal notification, cancellation/rejection alerts, deep links, and preference enforcement.

6. **Legal consent and privacy controls**
   - Published Terms and Privacy Policy, versioned acceptance records, consent changes, data-export request, precise marketing opt-in, and store privacy disclosures.

7. **Production support and incident path**
   - In-app contact/support, reservation reference sharing, emergency allergy/restaurant issue path, service outage/maintenance screen, and staff escalation SLA.

8. **Release safety**
   - Crash reporting, privacy-safe analytics, environment validation, certificate pinning decision, minimum-version/forced-upgrade handling, and production observability without sensitive logs.

### P1 — strongly recommended after launch foundation

1. **Cancellation policy and refunds**
   - Display deadline and refund amount before cancellation.
   - Show refund status and receipt after cancellation.
   - Support staff-initiated cancellation with a customer explanation and remediation.

2. **Payment recovery**
   - Replace payment method after decline.
   - Resume an abandoned payment safely.
   - Distinguish gateway pending, declined, timed out, and captured-after-timeout states.

3. **Reservation change request**
   - Request changes to time, party size, budget, area, or dietary details while business rules permit.
   - Re-price/re-authorize payment if the total changes.

4. **Confirmation and rejection remediation**
   - Provide clear next actions when Run Out cannot arrange the request: try another time/area/budget, accept credit, or request refund.
   - Notify customers if confirmation is approaching its SLA.

5. **Notification centre**
   - In-app history for payment, assignment, confirmation, reveal, changes, and support messages.
   - Read/unread state and deep links that remain safe under reveal rules.

6. **Saved payment and address management**
   - Provider-owned payment method references only.
   - Add/edit/delete addresses, name them, validate them, and choose a default.

7. **Dietary safety flow**
   - Severity and cross-contamination questions.
   - Explicit acknowledgement for serious allergies.
   - Restaurant confirmation and a customer-visible “acknowledged by restaurant” state.

8. **Calendar and sharing**
   - Add confirmed reservation to the device calendar without leaking restaurant details before reveal.
   - Share a spoiler-safe reservation card; unlock full sharing only after reveal.

9. **Onboarding and preference memory**
   - Lightweight first-run explanation of the reveal policy.
   - Remember default party size, budget band, radius, dietary preferences, and saved area while keeping each booking editable.

10. **Accessibility and localization completion**
    - VoiceOver/TalkBack regression suite, large-text screenshots, color-contrast audit, RTL layouts, Arabic copy, locale-aware AED and Dubai time formatting.

### P2 — growth and retention

1. Referral codes and friend invitations.
2. Gift cards, credits, and promotional codes with an auditable ledger.
3. Loyalty milestones that reward exploration without revealing the restaurant early.
4. Group invitation and guest dietary collection through a spoiler-safe link.
5. Split payment or shared contribution, if supported by the future payment provider.
6. “Run Out again” from a completed reservation, carrying preferences but not the previous restaurant.
7. Taste-learning controls: cuisines enjoyed, avoid-next-time, novelty level, and transparent reset/export.
8. Curated occasions such as anniversary, visitors in town, business dinner, and accessible venue.
9. Post-reveal transport actions such as ride-hailing deep links and travel-time guidance.
10. Waitlist/flexible-time offers when the requested slot cannot be fulfilled.

## Recommended operations and admin flows

These belong in the existing administration product or backend—not in the customer app:

- Work queue with SLA, ownership, escalation, and filters.
- Restaurant eligibility checks for radius, budget, cuisine exclusions, availability, party size, dress code, dietary/allergy needs, and duplicate-visit policy.
- Confirmation evidence, menu completeness, and reveal readiness checklist.
- Customer change-request negotiation and immutable audit history.
- Payment reconciliation, refund approval, webhook exception queue, and chargeback evidence.
- Notification delivery status and safe resend.
- Customer support timeline with reveal-safe permissions.
- Account-deletion/export request processing.
- Restaurant incident, suspension, and quality-review workflow.
- Feedback analytics with duplicate/abuse protection and restaurant follow-up.
- Role-based access, staff MFA, approval thresholds, and security audit logs.

## QA journey matrix

Every release should cover at least these paths:

| Journey | Expected result |
| --- | --- |
| New email account → booking → captured payment | Reaches sealed detail; no restaurant fields are present |
| Google PKCE login → provision → relaunch | Session restores and Home opens |
| Two simultaneous expired requests | Exactly one refresh occurs; both retry once |
| Location permission denied | All 15 Dubai areas remain usable |
| Reverse-geocode success | Full returned street address is shown and submitted |
| Create response lost → retry | Same create idempotency key, one reservation |
| Payment response lost → retry | Same payment idempotency key, no duplicate charge |
| Payment failed/pending | Does not advance and never reveals restaurant data |
| Confirmed but before reveal | Sealed state; map/menu/name/address hidden |
| Reveal returns available | Restaurant, address, menu, and map action appear |
| Cancel `PAYMENT_PENDING` or `PAID` | Confirmation shown, then reservation becomes cancelled |
| Cancel any later status | No cancellation action is offered |
| Completed without feedback | Feedback form is offered once |
| Completed with feedback | Saved result is shown; form is absent |
| Offline request | Clear offline message and retry action |
| Logout request fails | Secure credentials are still cleared |

## API work implied by recommended flows

The current backend will need explicit contracts for account deletion/export, password-management UX integration, device push tokens, real payment intents/webhooks/refunds, reservation change requests, cancellation/refund policy, support cases, notification history, saved payment references, consent records, and promotional/credit ledgers. These should be added as backend capabilities before their mobile controls are exposed.
