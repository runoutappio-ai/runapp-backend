# Run Out — Claude + Figma product design brief

Use this prompt from the repository root with Claude Code connected to the official remote Figma MCP server.

## Product decision for the proposed experience

Design the proposed production reveal as two distinct moments:

```text
Payment captured
  → sealed planning state
  → two hours before the reservation: reveal restaurant and address
  → 45 minutes before the reservation: travel reminder
  → at the confirmed reservation time: reveal menu
  → attendance
  → completion
  → feedback
```

The current backend does not yet expose separate restaurant and menu availability. Mark this timeline as **Proposed** and keep the current implemented behavior documented as **As Is**.

The development demo remains sequential:

```text
Skip the wait · demo
  → reveal restaurant
  → keep menu sealed
  → Skip the menu wait · demo
  → reveal menu
```

---

## Prompt for Claude Code

You are a principal product designer using Claude Code and the official Figma MCP server with write-to-canvas access.

Repository:

`/Users/jlopez/Dev/runout`

Your goal is to create a native, editable Figma Design file named **Run Out — Product Flows v1**. It must document the current customer and operations products, create a reusable design foundation, and eventually contain the complete high-fidelity experience and clickable prototypes.

Do not modify application code.

### Capability check

Before beginning:

1. Confirm that the Figma MCP server is connected.
2. Confirm that native canvas write tools are available.
3. Create a new Figma Design file in Drafts if no destination file URL was supplied.
4. Use native Figma frames, sections, variables, styles, components, variants and Auto Layout.
5. Do not create flattened screenshots as the final design.
6. If write access is unavailable, stop and report the missing capability. Never claim that a Figma file was created when it was not.

### Source-of-truth order

Inspect these sources before designing:

1. `mobile/src/app/**`
2. `mobile/src/features/**`
3. `mobile/src/theme/tokens.ts`
4. `mobile/src/types/api.ts`
5. `src/main/java/com/runout/bookings/**`
6. `src/main/java/com/runout/administration/**`
7. `src/main/java/com/runout/restaurants/**`
8. `frontend/src/App.tsx`
9. `mobile/FLOWS.md`
10. `Claude outputs/run-out-index.html` and `public-frontend/index.html` only as visual references

When documentation and code conflict, current mobile and backend code define **As Is** behavior. New product ideas must be marked **Proposed**.

## Phase 1 — execute now

Create only the following pages in this first pass:

1. `00 — Cover & Index`
2. `01 — Foundations`
3. `02 — Components / Starter Set`
4. `03 — Customer & Operations Flow Map`
5. `99 — Decisions & Open Questions`

Do not create the full set of high-fidelity screens yet. Stop after Phase 1 so the product structure can be reviewed.

### 00 — Cover & Index

Include:

- Product name and positioning.
- Version and creation date.
- Links or navigation to every page.
- Legend for **As Is**, **Proposed**, **Edge case**, **Blocked**, and **Demo only**.
- Separate customer-mobile and operations-admin areas.

### 01 — Foundations

Create Figma variables and styles from the existing mobile tokens:

- Background: `#0A0908`
- Secondary background: `#160F0E`
- Surface: `#171312`
- Primary text: `#F6F1EE`
- Muted text: `#A8A19D`
- Primary red: `#E6362C`
- Gold accent: `#FF9D42`
- Success: `#3DDC84`

Also define:

- Semantic colors for error, warning, borders, disabled and overlays.
- A spacing scale.
- Radius tokens.
- Typography styles.
- Elevation and shadow styles.
- Motion principles for the envelope.
- Reduced-motion behavior.
- Mobile grid for 402 × 874 frames with a 360 px width stress test.
- Desktop admin grid for 1440 × 1024 frames.

The brand should feel like a premium and playful Dubai night: intimate, mysterious and confident. Avoid gothic, casino, nightclub and generic food-delivery aesthetics.

### 02 — Components / Starter Set

Create low-to-medium-fidelity starter components with Auto Layout and variants:

- Primary, secondary, ghost and danger buttons.
- Input, password input and text area.
- Date card.
- Choice chip.
- Segmented control.
- Slider anatomy for budget, time and kilometres.
- Party-size control.
- Card.
- Status badge.
- Bottom tab bar.
- Mobile top navigation.
- Empty, loading, offline and error blocks.
- Confirmation dialog.
- Admin sidebar item.
- Admin filter chip.
- Admin table row.
- Envelope component with these named variants:
  - `Sealed`
  - `Opening / Restaurant`
  - `Restaurant Revealed / Menu Sealed`
  - `Opening / Menu`
  - `Menu Revealed`

The components do not need final visual polish in Phase 1, but their structure, naming and variant model must be production-ready.

### 03 — Customer & Operations Flow Map

Create a FigJam-style flow map using Figma sections and connectors. Every node must include:

- Screen or system state.
- User action or trigger.
- Backend status when relevant.
- Next state.
- Classification: As Is, Proposed, Demo only or Edge case.

#### Customer authentication

Map:

- Launch and secure session restoration.
- Loading session.
- Authenticated → Home.
- Unauthenticated → Welcome.
- Google login and local user provisioning.
- Email registration followed by automatic login.
- Email login.
- Validation and API failures.
- Access-token refresh with a single retry.
- Refresh failure → clear session → Welcome.
- Logout, including backend logout failure with local session still cleared.
- Apple login shown as blocked/not configured.

#### Customer home and local draft

Map:

- Home greeting.
- Start reservation.
- Continue persisted draft.
- Upcoming reservation.
- Previous nights.
- Reservations shortcut.
- Pull-to-refresh, empty and recoverable error states.

#### Booking wizard

Map these four implemented steps:

1. Party size, future date and one-hour time window.
2. Total AED budget, vibe, excluded cuisines, dietary preferences and allergy notes.
3. Dubai area or current location and 1–25 km radius.
4. Mock payment review and payment method selection.

Add branches for:

- Past date/time.
- Budget below AED 50 per guest.
- More than three cuisine exclusions.
- Location permission allowed.
- Location permission denied → manual area fallback.
- Reverse-geocode failure → manual area fallback.
- Missing payment method.
- Draft closed and later resumed.

#### Reservation and payment lifecycle

Use this state machine:

```text
PAYMENT_PENDING
  ├── PAID → ASSIGNED → IN_PROGRESS → CONFIRMED → COMPLETED
  │                       └── REJECTED → IN_PROGRESS
  ├── PAYMENT_FAILED
  └── CANCELLED
```

Annotate:

- Cancellation is available only for `PAYMENT_PENDING` and `PAID`.
- Feedback is available only for `COMPLETED` without prior feedback.
- Restaurant information must never appear before the reveal endpoint authorizes it.

#### Current reveal behavior — As Is

Map:

- Payment success → sealed waiting state.
- Normal backend reveal currently unlocks restaurant and menu together at `confirmedReservationAt` for `CONFIRMED` or `COMPLETED` reservations.
- Restaurant name, address, coordinates, menu and map stay hidden before authorization.
- Menu-unavailable fallback.
- Google Maps native-app and browser fallback.

#### Development reveal — Demo only

Map:

```text
Sealed reservation
  → Skip the wait · demo
  → envelope opens
  → restaurant, cuisine, address and map action appear
  → menu remains sealed
  → Skip the menu wait · demo
  → envelope animation repeats
  → menu appears
```

#### Proposed production reveal

Keep this visually separate from As Is:

```text
Payment captured
  → sealed planning state
  → T−2 hours: restaurant and address reveal
  → T−45 minutes: travel reminder
  → confirmed time: menu reveal
  → attendance
  → completion
  → feedback
```

Annotate the backend requirement for separate `restaurantAvailable` and `menuAvailable` authorization or equivalent timestamps.

#### Reservations, feedback and profile

Map:

- Upcoming/active list.
- Previous list.
- Detail for all nine reservation statuses.
- Cancellation confirmation and result.
- Completed reservation feedback.
- Duplicate-feedback error.
- Profile load and edit.
- Phone, birth date, diet, allergies, address and notification preferences.
- Save success/failure.
- Logout.
- Local notification deep link into reservation detail.

#### Operations roles

Create swimlanes for:

- Customer
- System/backend
- Super Admin
- Manager
- Worker
- Restaurant catalogue

Map:

- Admin login and authorization failure.
- Super Admin dashboard.
- User search/filter.
- Create staff member.
- Change role.
- Reservation queue and status filters.
- Worker visibility of unassigned PAID reservations and assigned work.
- Assignment/reassignment.
- Start preparation.
- Nearby restaurant search within radius.
- Select restaurant.
- Confirm restaurant and final time.
- Reject → restart.
- Complete reservation.
- Customer reveal.
- Customer feedback.
- City creation.
- Google Places search/import.
- Manual restaurant creation.
- Restaurant editing.
- Activation/deactivation.
- Menu management.

### 99 — Decisions & Open Questions

Create decision cards for:

1. Approve or change the proposed T−2h restaurant reveal.
2. Confirm whether the menu unlocks exactly at reservation time or on restaurant check-in.
3. Decide what a real payment purchases: full budget, deposit or service fee.
4. Define cancellation deadline and refund behavior.
5. Define remediation for rejected reservations.
6. Define allergy acknowledgement and restaurant responsibility.
7. Decide whether customer and admin share typography or only colors/tokens.
8. Confirm English-only MVP versus Arabic/RTL launch scope.

Also list these known future flows without designing them yet:

- Forgot/reset password and email verification.
- Sign in with Apple.
- Account deletion and data export.
- Real payment, 3DS, pending payment and recovery.
- Refunds.
- Reservation modifications.
- Server push and notification centre.
- Support and allergy incident path.
- Saved addresses and payment methods.
- Calendar and spoiler-safe sharing.
- Referrals, gift cards and Run Out Again.

### Phase 1 quality checks

Before reporting completion:

- Verify all layers and sections have meaningful names.
- Verify Auto Layout on every component.
- Verify variables are bound rather than duplicated manually.
- Verify connectors do not overlap labels.
- Verify the As Is and Proposed legends are used consistently.
- Verify no restaurant data is shown in pre-reveal customer states.
- Take screenshots of every completed page and visually inspect them.

### Phase 1 completion report

Return:

1. Figma file URL.
2. Direct links to every created page or main section.
3. Page, section and component counts.
4. Product conflicts found between code and documentation.
5. Open questions that block Phase 2.
6. A recommended Phase 2 screen-production order.

Stop after Phase 1. Do not begin high-fidelity screen production until the product owner reviews the flow map and decisions.

---

## Planned later phases

Do not execute these until Phase 1 is approved.

### Phase 2

- High-fidelity mobile happy path.
- Authentication, Home, booking steps, payment, waiting, restaurant reveal and menu reveal.
- Clickable primary customer prototype.

### Phase 3

- Reservation status variants, error/offline/loading states, feedback and profile.
- Accessibility and reduced-motion variants.

### Phase 4

- Admin dashboard, users, reservation operations and restaurant management.
- Clickable operations prototype.

### Phase 5

- Proposed launch-blocker flows.
- Handoff annotations and implementation-ready component specifications.
