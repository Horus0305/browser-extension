# Subscription Model (Stripe + Appwrite)

This document outlines how we verify Pro users, gate features, and sync status across devices using Stripe and Appwrite.

## Goals

- Free users see Pricing in Settings; Pro users access full Settings and Pro features (cloud sync, advanced reports).
- Cross-device: subscription status follows the user account.
- Robust lifecycle handling via Stripe webhooks.

## Data Model

- Collection: user_subscriptions
  - userId: string (index)
  - status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due' | 'unpaid' | 'none'
  - productId: string
  - priceId: string
  - currentPeriodEnd: number
  - stripeCustomerId: string
  - updatedAt: number

Security: user can read own doc; write via Appwrite Functions only (server trust boundary).

## Stripe Integration

- Checkout
  - Start checkout from extension (opens new tab to hosted checkout page).
  - Pass Appwrite userId and email in Stripe `client_reference_id` and `customer_email`.
- Webhooks (server-side via Appwrite Function)
  - `checkout.session.completed`: create/update user_subscriptions with status `active` (or `trialing`).
  - `customer.subscription.updated` and `.deleted`: update status and `currentPeriodEnd`.
  - Map Stripe customer to Appwrite user via `client_reference_id` or lookup by email.

- Customer Portal (manage/cancel)
  - Link from Account -> opens Stripe portal session; on return, status is refreshed via webhook.

## Client Flow (Extension)

- On auth init and periodically:
  1. Query Appwrite `user_subscriptions` doc by `userId`.
  2. Cache `isPro` locally with TTL (e.g., 15 minutes) in `chrome.storage.local` under `sub:isPro` and `sub:updatedAt`.
  3. UI gating uses cached `isPro` immediately; background refresh updates it silently.

- Gating Logic
  - In `analytics/App.tsx`, if `activeTab === 'settings'` and `!isPro`, render `<Pricing />`.
  - Sidebar badge shows `Free Account` or `Pro Account` accordingly.
  - `AccountSettings` renders different subscription cards for Free vs Pro.

## Appwrite Function Endpoints (example)

- `POST /stripe/webhook` (Appwrite Function, Node)
  - Verifies Stripe signature.
  - Upserts `user_subscriptions` by `userId`.

- `POST /stripe/create-checkout` (optional)
  - Creates a Checkout Session with `client_reference_id = userId` and returns URL.
  - Alternatively, use Stripe Checkout direct if you host a minimal page.

- `POST /stripe/create-portal`
  - Creates a Billing Portal session for the current user.

## Edge Cases

- Email mismatch: prefer `client_reference_id` to map users.
- Canceled but period not ended: `status = active` until `currentPeriodEnd` in `canceled` state; logic: treat `status in ['active','trialing']` as Pro.
- Chargebacks and unpaid: degrade to Free on webhook.

## Testing

- Simulate webhook events using Stripe CLI to verify function behavior.
- Client polling and cache invalidation logic.
- Upgrade/downgrade flows and UI gating.
