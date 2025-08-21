# Cloud Sync with Appwrite

This document specifies the cloud sync design between the extension's local storage and Appwrite for cross-device continuity and backup.

## Collections and Schema

- Collection: usage_data (see `lib/appwrite/config.ts`)
  - userId: string (required, index)
  - encryptedData: string (JSON encrypted payload holding multi-day usage blocks)
  - dataHash: string (hash of decrypted canonical payload for change detection)
  - deviceId: string (stable per-install identifier)
  - lastUpdated: number (epoch ms)
  - version: number (payload version)

- Collection: user_prefs (optional, for exclusions and settings)
  - userId: string (index)
  - exclusions: string[] (domains)
  - lastUpdated: number

- Collection: user_subscriptions (for Stripe-sync, see subscription doc)
  - userId: string (index)
  - status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due' | 'unpaid' | 'none'
  - productId/priceId: string
  - currentPeriodEnd: number
  - updatedAt: number

Security rules: per-user ACL as in `config.ts` (read/write only own docs). Indexes on userId, lastUpdated for efficient queries.

## Device Identity

- deviceId = stable UUID stored in local storage (generated once).
- Allows deduplication and debugging of multi-device updates.

## Payload Strategy

- Local storage keeps daily docs: `usage:YYYY-MM-DD`.
- Sync groups contiguous day ranges into batches (e.g., 7-day block) to reduce document churn.
- encryptedData contains:
  ```json
  {
    "days": [
      {"date":"2025-01-07","domains":{"example.com":{"totalMs":1234,"visitCount":3,"lastVisited":170463...}}},
      ...
    ],
    "from":"2025-01-01",
    "to":"2025-01-07",
    "retentionDays":180
  }
  ```
- Encryption: symmetric key per user (derived from Appwrite session or a server-generated key stored server-side; if client-only, use WebCrypto with key escrow via Appwrite Functions). For initial MVP, store plaintext but wrap with server-side Appwrite permission; then evolve to encryption.

## Sync Triggers

- On sign-in and periodically (e.g., every 10 minutes while the analytics tab is open; and on extension idle alarm).
- On significant local change (flush interval) with rate limiting/debounce.

## Sync Algorithm (Incremental, LWW + merge)

1. Read last cloud doc for user (latest by `lastUpdated`).
2. Build local snapshot hash H_local from days within retention window.
3. If H_local === dataHash, skip upload.
4. Else, decrypt cloud (if any), merge:
   - For each day in union(local, cloud):
     - If only one side has the day -> take it.
     - If both, for each domain: sum totals and visitCount; lastVisited = max; category is recomputed client-side.
   - This yields mergedDays.
5. Write new document with mergedDays (possibly re-batched) with:
   - dataHash = hash(mergedDays)
   - lastUpdated = now
   - deviceId = current
   - Keep only last N documents to avoid bloat (e.g., 4 weekly docs). Optionally overwrite latest doc instead of creating new.

Conflict policy: LWW at day-domain granularity using `lastVisited` max. Time totals are additive to avoid loss.

## Download Path

- On sign-in or refresh, if cloud exists and is more recent than local snapshot:
  - Merge cloud -> local following the same algorithm, then write back to local storage per-day keys.

## Offline and Errors

- Queue sync attempts with exponential backoff.
- Never block local writes.
- Cap cloud doc size; if exceeded, split by date ranges.

## Preferences Sync (exclusions)

- Map `settings:exclusions` to `user_prefs.exclusions`.
- Same merge: union of sets, with deletions handled via tombstones if needed. MVP: cloud is the source of truth when newer.

## API Surfaces

- Hook `useCloudSync()` or utility in `lib/appwrite/sync.ts`:
  - `pull()` -> merges cloud to local
  - `push()` -> merges local to cloud
  - `sync()` -> pull then push with debouncing

## Testing

- Unit: merge of overlapping day/domain sets.
- Integration: simulated two devices changing overlapping days.
- E2E: sign-in -> push -> sign-in on second profile -> pull -> verify parity.
