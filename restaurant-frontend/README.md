# Run Out restaurant portal

React/Vite partner portal at `http://localhost:5174`. It uses the same visual language as the staff backoffice while exposing only the restaurant linked to the authenticated `RESTAURANT` account.

## Start locally

### Instant demo with sample data

From the repository root, run:

```bash
./start-restaurant-demo.sh
```

Then open `http://127.0.0.1:5174` and use:

- Email: `demo@runout.local`
- Password: `RunOutDemo2026!`

After login, **Fill everything automatically** fills the sample restaurant profile, parking instructions, categories, AED 150 budget and all five menus (AED 200 before / 150 after per guest). It replaces the editable draft and opens Menus with a complete checklist, without submitting. Pending submissions must first be cancelled. This button is visible only with demo environment credentials.

The demo uses an in-memory API on port `8090`, starts with empty menus and supports submission. Management approval requires the full backend/backoffice. Changes reset when stopped.

### Full application

From the repository root:

```bash
./start-restaurant-frontend.sh
```

Or directly:

```bash
cd restaurant-frontend
npm install
npm run dev
```

The Spring API, PostgreSQL, and Keycloak must be running. A super admin creates portal access from **Backoffice → Restaurants → Edit restaurant → Create restaurant portal access**.

If Keycloak already has an older persisted `runout` realm, add the `RESTAURANT` realm role manually or intentionally recreate the local Keycloak volume so the updated realm JSON is imported. Recreating the volume deletes local Keycloak data.

## Implemented contract

- One portal account maps to one restaurant through a unique database constraint.
- The API derives ownership from the authenticated user; the browser never supplies a restaurant ID.
- A restaurant chooses exactly one price range and one or more categories.
- Restaurant details include required parking instructions (where to park, entrance, valet, costs and validation).
- Drinks are explicitly specified per person. Menu pricing and savings share one compact row on desktop, wrapping on smaller screens.
- Menu price inputs represent the estimated bill for the entire selected table before/after discount. Per-person equivalents, table savings and comparison with the selected restaurant budget are calculated automatically; the API stores the per-person prices.
- The restaurant publishes exactly five menus, one each for 2–6 guests.
- Every menu stores before/after prices per person and derives its discount percentage. The portal shows total table prices and total savings. Its four sections are `STARTERS`, `MAINS`, `DESSERTS`, and `DRINKS`.
- Every menu section must contain at least one named item.
- Price selection lives in Menus. New menus start with empty courses.
- Submission requires saved contact, address, hours, area, parking and categories plus five complete menus and valid prices.
- A live checklist lists each saved profile field, the price selection, both prices and all four sections for every table size. Its checks and the submit button use the same validation; whitespace-only names and invalid prices remain incomplete.
- States: DRAFT → PENDING_APPROVAL → APPROVED / REJECTED. Management reviews all five menus together in the backoffice; rejected menus can be resubmitted.
- Pending menus are stored separately; only approved menus are published.
- While PENDING_APPROVAL, all partner profile and menu controls are read-only and the API rejects partner edits. Approval or rejection unlocks editing.
- The partner can also choose Cancel submission & edit while pending: this returns to DRAFT, keeps all submitted menus, unlocks editing and removes the request from the approval queue. Resubmission requires the full checklist again.
- The staff backoffice reads the same restaurant/menu data.
- The customer app reveals only the menu matching the reservation party size.
- The old menu `entries` format is not supported.

## Price ranges

| Tier | Displayed range |
| --- | --- |
| 1 | AED 50 per guest |
| 2 | AED 100 per guest |
| 3 | AED 150 per guest |
| 4 | AED 200 per guest |
| 5 | AED 250 per guest |
| 6 | AED 300 per guest |
| 7 | AED 350 per guest |
| 8 | AED 400 per guest |

These ranges are product constants in the portal. If they change, update the portal labels and any matching/business rules together.

## Verify

```bash
npm run build
```
