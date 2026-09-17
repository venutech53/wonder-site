# Wonder site ↔ Venu booking integration

The `/book` flow creates real bookings in Venu (shared Supabase project `cxwvtfbkltrpkhkcregy`, venue
**Wonder Park Road** `8071a4c8-6e54-4ec0-9f2a-12ab8ffaa3f0`) through **venu-api**, using the `wonder_web_prod`
integration (scopes `bookings:read`, `bookings:write`). The UI and its steps are unchanged; the prototype confirmation is now real.

## How it fits together

```
BookingForm (client)
  ├─ GET  /api/availability?date=     → lib/venu.ts → venu-api GET  spaces-availability
  └─ POST /api/bookings (+Idempotency-Key) → lib/venu.ts → venu-api POST bookings-batch-create
                                                               └─ rpc_create_bookings_batch (one transaction)
                                                                    └─ rpc_create_booking per seat/room → bookings row
                                                                         └─ DB triggers → send-booking-notification → customer + venue owner emails
```

- `lib/venu.ts` (server-only): caches the 1-hour venu-api token (auth-token is rate limited to 5/min), retries once on 401.
- `lib/booking-rules.ts` (shared, import-free): site option → Venu space mapping, availability math, date/customer validation.
  Check: `node scripts/booking-rules-check.mjs`.
- Env (server-only, see `.env.example`): `VENU_API_URL`, `VENU_CLIENT_ID`, `VENU_CLIENT_SECRET`.

## Step → endpoint mapping

| UI step | Sent to Venu |
|---|---|
| Space + seat type | Venu space by exact name (below) |
| Seats | `seats`: the RPC allocates that many free child seats of the table |
| All seats of a 6- or 4-seater table | one booking on the table itself: `seats: 1, whole_space: true` (priced from the table's own packages / hourly rate) |
| Package: Cycle Morning / Cycle Evening / Sojourn | `package_name: "Cycle Morning"` / `"Cycle Evening"` / `"Sojourn"`, matched on each unit |
| Package: Moment | `start_time` / `end_time` (hourly, needs `offers_hourly` + `price_per_hour`) |
| Your details | `customer.name`, `customer.email`, `customer.contact` |
| Add Another Booking | one entry in `items[]` |
| Book Now | the whole cart in one atomic call, `expected_total` = site price, `payment_method: "cash"` |

| Site option | Venu space name (top-level) |
|---|---|
| Hot Desks → 6-Seater Table | `Six Seater` |
| Hot Desks → 4-Seater Table | `Four Seater` |
| Hot Desks → Individual Desk | `Window Seats` |
| Solo Pods | `Solo Pods` |
| Board Room | `Board Room` |
| Conversation Room | `Conversation Room` |

Rename a space in venu-admin → update `VENU_SPACE_NAMES` in `lib/booking-rules.ts`.

## Payment: integration pending

The client has not chosen a payment provider yet. Until then bookings are **pay at venue**:
`payment_method: "cash"` → `status=confirmed`, `payment_status=pending`. This fires the confirmation emails, holds the slot,
is not auto-cancelled, and shows as unpaid in venu-admin. The confirmation panel says payment is settled on arrival.

When the gateway lands:
1. Send `payment_method: "online"` (bookings start `pending`; the auto-cancel cron releases unpaid ones after 15 min).
2. Redirect to the gateway after `bookings-batch-create` succeeds.
3. From the gateway webhook, call `payments-confirm/{id}` per booking (grant the integration the `payments:confirm` scope).
   Confirmation emails fire on pending → confirmed.

## Backend changes (venu-api, applied to production 2026-09-16)

- Migration `20260916120000_batch_booking_and_rpc_lockdown.sql`
  - `rpc_create_bookings_batch`: whole cart in one transaction. Advisory lock per (top-level space, date) serializes concurrent carts. Seat allocation. A unit counts as taken when an overlapping non-cancelled booking exists on it, its parent or its children. Guards against hourly bookings without a rate (which would otherwise auto-confirm as free). `expected_total` price check. Errors use SQLSTATE `VN409` (taken, HINT = units free) or `VN422` (not bookable), with DETAIL = item index.
  - `rpc_create_booking`: now stores `bookings.venue_timezone`. Nothing else changed.
  - **Security fix:** revoked `EXECUTE` from `anon`/`authenticated` on all API RPCs. They are `SECURITY DEFINER`, so anyone holding the public anon key could create, cancel or mark bookings paid, bypassing venu-api.
- Migration `20260916140000_batch_booking_whole_space.sql`: item `whole_space: true` books a parent space itself as one booking (needs every child free; then blocks all children).
- Migration `20260916130000_batch_booking_respect_space_flags.sql`: package items require `spaces.offers_packages`, hourly items require `offers_hourly`. Opening hours come from the seat's own `space_schedules` row, falling back to the parent's.
- Edge functions `spaces-availability` (GET, `bookings:read`) and `bookings-batch-create` (POST, `bookings:write`, `Idempotency-Key`), documented in `openapi.v1.yaml` and `PARTNER_ONBOARDING.md` §6.8–6.9.

## Venu data setup

Applied 2026-09-16 with [`venu-wonder-setup.sql`](venu-wonder-setup.sql) (idempotent; re-run after changing prices or times there).
The site is the source of truth: labels in `lib/content.ts` (`packageTiers`, `SPACE_PRICING`) must match what's in Venu,
otherwise bookings fail with "Prices have changed" / "isn't available".

| Venu space | Units (bookable) | Mode (parent / unit) |
|---|---|---|
| `Six Seater` | Seat #1–#6 | inherit / adaptive |
| `Four Seater` | Seat #1–#4 | inherit / adaptive |
| `Window Seats` (site: Individual Desk) | Seat #1–#10 | inherit / adaptive |
| `Solo Pods` | Pod #1, Pod #2 | inherit / adaptive |
| `Board Room` | the room | independent |
| `Conversation Room` (Wonder's meeting room) | the room | independent |

Every space is open **Mon–Sat 09:00–19:00, Sunday closed** (all `space_schedules` rows; the site's `CLOSING_HOUR`,
hourly start times 9 AM–6 PM and Find Us hours match). Every unit gets:

| Unit | Moment / hour | Cycle Morning 09:00–14:00 | Cycle Evening 14:00–19:00 | Sojourn 09:00–19:00 |
|---|---|---|---|---|
| Hot-desk seat | 500 | 2000 | 2000 | 3500 |
| Whole 6-seater table (= 6 seats) | 3000 | 12000 | 12000 | 21000 |
| Whole 4-seater table (= 4 seats) | 2000 | 8000 | 8000 | 14000 |
| Solo pod | 700 | 2800 | 2800 | 4800 |
| Board Room | 1500 | 6000 | 6000 | 10000 |
| Conversation Room | 1200 | 4800 | 4800 | 8000 |

Whole-table prices must stay equal to seat price × seats, because the site prices a full table that way (`expected_total`).
Pod and room prices are placeholders; Wonder will update them manually. Update `SPACE_PRICING` in `lib/content.ts`
and `wonder_prices` in the SQL together, then re-run the SQL.

Superseded packages (`Half Day`, `Half Day Morning`, `Half Day Afternoon`, `Full Day` on tables and seats, and the earlier
placeholder `Cycle`) were **deactivated, not deleted**. No future bookings used them. Restore with
`update space_packages set is_active = true where id in (...)`.

Decisions confirmed by Wonder (2026-09-16): hours 9am–7pm; 10 individual desks (final); meeting room = `Conversation Room`;
a whole 6-seater is bookable as one booking (also enabled for the 4-seater, see `wholeTable` in `hotDeskSeatTypes`);
photos come later; pay-at-venue for now.

Still open:

- [ ] **Real prices** for Solo Pods, Board Room and Conversation Room (Wonder to set manually).
- [ ] **Photos / amenities** for the new spaces in venu-admin.
- [ ] **Payment provider** (see above).
- [ ] Optional: `booking_mode = 'independent'` for seats and pods. With `adaptive`, venu-admin's manual-booking availability checker treats sibling seats as conflicting. The API and this site don't.

## Error handling

| Case | User sees |
|---|---|
| Seats/slot taken, including a race lost to another customer (409) | "{item} is no longer available — only N seats left. Nothing was booked…". The form re-fetches availability. |
| Package/hourly not offered, closed, space not in Venu yet (422) | "{item} isn't available for that package or time. Nothing was booked." |
| Site and venu-admin prices differ (422) | "Prices have changed… Nothing was booked." The mismatch is logged server-side. |
| Invalid name / email / phone / date / cart (400) | Field-specific message. The cart is kept. |
| Token expired (401) | Transparent: re-authenticates once. |
| venu-api auth rate limit (429) | "Too many booking attempts — please try again in a minute." |
| venu-api down or bad credentials | "We couldn't reach the booking system. Nothing was booked — please try again." |
| Double click or retry | Same Idempotency-Key for the same cart and details, so it replays the original result with no duplicates. |

Before submit, the form greys out sold-out packages, shows free seats, caps the seat stepper at the free count, blocks Sundays,
and caps Moment so the booking ends by 8 PM.

## E2E verification (2026-09-16, date 2026-10-26, test customer dev@venu.lk)

| Check | Result |
|---|---|
| Happy path (UI): 6-Seater 2 seats Cycle + 4-Seater 1 seat Moment 10–12 | Confirmation panel with 3 refs, LKR 5,000. 3 rows `confirmed/pending/cash`, `integration_id` + `venue_timezone` set, distinct seats, one transaction. |
| Emails | 3 `booking-confirmation` to the customer and 3 `new-booking-admin` to the venue owner (Resend IDs in function logs). Race winner: 8 more, 0 failures. The auto-cancel cron ran and cancelled 0. |
| Slot lock: race | Two parallel carts for the last 4 seats: exactly one 201, one 409. |
| Slot lock: second user (UI) | Cycle and Sojourn shown "— Fully booked" (disabled); Moment 10 AM shows "Not available at this time"; Book Now disabled. |
| Hourly overlap | 409 "only 3 seats left". |
| Atomic cart | Valid item + taken item → 409 on item 1, nothing booked. |
| Idempotency | Replay with the same key returns the same refs, no new rows. |
| Admin visibility | venu-admin `useBookings` query shape returns all rows; venu-api `bookings-list` returns them. |
| Validation | Bad email, missing name, invalid phone (UI), Sunday, past date, Moment past closing, too many seats, unconfigured space, malformed body: all clear 400/422 messages. |
| Server guards | Price mismatch 422, hourly outside schedule 422, invalid token 401, Saturday package over capacity 409. |
| Full catalog (2026-09-16, rolled-back transaction, no emails) | All 6 site options resolve (6/4/8 seats, 2 pods, 2 rooms). One Saturday cart: Pod #1 morning + Pod #1 evening back-to-back, Pod #2 Sojourn, Board Room evening, Conversation Room 10–12, 6 seats morning = LKR 30,800 matching site prices. Board Sojourn over an evening booking → 409; 3rd pod evening → 409; seats free again for evening after a full morning; Sunday → 422. UI shows the Morning / Evening options and "Cycle · Evening" at LKR 2,800 for a pod. |
| Hours, desks, whole table (2026-09-16) | All 28 Wonder spaces are open 09:00–19:00 Mon–Sat, Sunday closed; 10 window seats. Rolled-back RPC tests: whole 6-seater = 1 booking on `Six Seater` at 12,000; a seat under it → 409; the whole table over a booked seat → 409; whole 4-seater hourly; 18:00–20:00 and 08:00–09:00 → closed; 10 window seats. **Real booking through the site:** 6 seats → 1 booking (confirmed/unpaid, customer + owner email), then 1 seat in the same slot → 409, cancelled afterwards. The site rejects an 8 AM start, 6 PM + 2h, and 11 desks. UI: the seat stepper stops at 6 with the whole-table hint; hourly starts 9 AM–6 PM. |
| RPC lockdown | `anon`/`authenticated` cannot execute any API RPC; `service_role` can. |
| Cleanup | All 7 test bookings cancelled via `bookings-cancel`; availability back to 0 busy. |

## Known limits / follow-ups

- **Emails per row:** one confirmation plus one owner email per booking row, so a 4-seat cart sends 4 + 4 emails. Grouping needs `booking_transactions` and template work.
- **Lock coverage:** venu-admin's own inserts don't take the advisory lock. The same-space trigger still catches overlaps, but a parent-table vs seat overlap from venu-admin is not blocked.
- **Venu email issues (pre-existing):**
  - `send-email` fails to write `email_logs` (`23502` NOT NULL), so the email audit log stays empty.
  - Templates default the currency to USD.
  - The "view booking" link points to venu.lk/my-bookings, which guest customers can't use.
- **Service-role key:** a service-role JWT is hardcoded in DB trigger functions and committed venu-admin migrations and should be rotated.
- **Client secret:** the `wonder_web_prod` secret was shared in chat during setup. Rotate it before go-live.
