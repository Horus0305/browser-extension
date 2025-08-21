# Implementation Sequence

Follow this order to minimize integration issues and ensure a smooth rollout.

## Phase 1: Auth and Local Analytics (existing)

- Appwrite auth with Google/email.
- Background usage capture with retention and messaging API.
- Analytics UI for dashboard/reports.

## Phase 2: Pricing Gate and UI Wiring (this PR)

- Add Pricing component and gate Settings behind Pricing for Free users.
- Read URL param `?tab=settings` to deep-link from popup.
- Sidebar badge shows Free/Pro dynamically (temporary `isPro` flag until backend wiring).
- AccountSettings shows Free/Pro content based on `isPro`.

## Phase 3: Subscription Backend

- Create Appwrite collection `user_subscriptions` and indexes.
- Implement Appwrite Function for Stripe webhooks (checkout completed, subscription updated/deleted).
- Add endpoints for checkout and portal session creation (optional) or host minimal page.

## Phase 4: Client Subscription Wiring

- Add `lib/appwrite/subscriptions.ts`:
  - `getSubscriptionStatus(userId)` -> returns cached `isPro` and refreshes from Appwrite.
  - Cache status in `chrome.storage.local` with TTL.
- Replace temporary `isPro` state in `analytics/App.tsx` with value from above utility.
- Update Pricing button to start checkout (open URL returned by function).

## Phase 5: Cloud Sync Engine

- Add `lib/appwrite/sync.ts` with `pull/push/sync` implementing the merge algorithm.
- Add background or analytics-side timers to trigger periodic sync when authenticated.
- Add preference sync for exclusions.

## Phase 6: Testing & Hardening

- Unit tests for merge and subscription caching utilities.
- E2E manual tests: login -> pricing -> subscribe (Stripe test mode) -> analytics shows Pro -> settings available -> sync across second device.
- Error handling, retries, and telemetry hooks.

## Phase 7: Polishing

- Customer Portal links in AccountSettings for Pro users.
- Better empty/error states in Pricing and Settings views.
- Documentation updates and screenshots.
