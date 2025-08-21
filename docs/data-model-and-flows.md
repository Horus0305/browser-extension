# Data Collection, Transformation, and Storage

This document describes what data is collected, the time frames, how it is transformed, and how/where it is stored for all graphs, tables, charts, and stats in the extension.

## Collected Data

- __Active tab usage per domain__
  - Tracked only when a normal window is focused and the tab is active.
  - Excludes special schemes and internal pages: `chrome://`, `edge://`, `about:`, `chrome-extension://`, `moz-extension://`, `file://`.
  - Incognito tabs are ignored.
  - Domain is normalized by stripping `www.` and lowercasing.

- __Per-day aggregates__
  - For each date, we track per-domain totals and visit counts.
  - Stored in local extension storage under keys like `usage:YYYY-MM-DD`.

## Data Shapes (from `entrypoints/background.ts`)

- __DomainStats__
  - `totalMs: number` total focused time in ms for the day
  - `visitCount: number` number of times the domain was visited (navigations/activations)
  - `lastVisited: number` epoch ms of last visit in the day

- __UsageDay__
  - `domains: Record<string, DomainStats>` per-domain stats
  - `totals?: { totalMsAll: number }` sum of all domain times for the day

- __Storage Keys__
  - Daily usage: `usage:YYYY-MM-DD`
  - Exclusions list: `settings:exclusions`

- __Retention__
  - `RETENTION_DAYS = 180` days; cleanup job removes `usage:*` older than cutoff.

## When Data Is Recorded

- __Tab activation__: Starts a session for the current domain and increments visit count.
- __Navigation committed/history updates__: Flushes previous domain, starts new domain, increments visit.
- __Window focus change__: On blur/minimize, time is flushed and session cleared; on refocus, new session may start if tab is active.
- __Periodic flush__: Alarm `usage-flush` every 1 min flushes active time to current day.
- __Retention cleanup__: Alarm `usage-cleanup` every 12 hours deletes keys older than 180 days.

## Messaging API (for UI consumption)

- __GET_TODAY_USAGE__
  - Flushes active session, reads `usage:today`, returns:
    - `date: string`
    - `totalMs: number`
    - `websites: Array<{ domain, timeSpent, lastVisited, visitCount, category? }>`; `category` from `categorizeDomain(domain)` in `lib/categories.ts`.

- __GET_RANGE_USAGE__
  - Inputs: `startDate`, `endDate` (ISO); normalized to local day boundaries.
  - Returns:
    - `totalMs: number`
    - `daily: Array<{ date: string; totalMs: number }>`
    - `domains: Array<{ domain, timeSpent, lastVisited, visitCount, category? }>` aggregated across the range.

- __GET_EXCLUSIONS / ADD_EXCLUSION / REMOVE_EXCLUSION__
  - Manages `settings:exclusions` and in-memory set for domain exclusion.

- __GET_STORAGE_USAGE__
  - Returns byte usage (total/usage/settings/cache) and `QUOTA_BYTES` if available.

- __EXPORT_DATA__
  - Returns an object `{ exportVersion, exportedAt, days }` with all `usage:*` keys.

- __RESET_DATA__
  - Deletes all `usage:*` keys.

## Transformations for UI

- __Categorization__: `categorizeDomain(domain)` maps host to categories (social, video, etc.) via `lib/categories.ts`.
- __Sorting__: Most tables/charts sort domains by `timeSpent` descending.
- __Aggregations__:
  - Today: sum `day.totals.totalMsAll` or recompute from per-domain when missing.
  - Range: aggregate `DomainStats` across days; compute total from `daily` entries.
  - Visits: sum `visitCount` across domains; average session time = `totalTime / totalVisits`.
  - Most active day: max by `daily.totalMs` then format weekday.

## Visualizations and Stats (examples)

- __Dashboard Top Websites__: Sorted by `timeSpent` for the requested range.
- __Activity/Hourly Charts__: Derived from `daily` or per-hour (future extension) buckets.
- __Stats Cards__: Total time today, total visits, average session length, most active day.

## Notes

- `lastVisited` is stored as epoch ms in storage and converted to `Date` in UI.
- All writes/reads use `chrome.storage.local` (or `browser.storage.local`) with a fallback size estimation for bytes when exact query is not available.
