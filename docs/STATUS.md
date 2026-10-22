# Yazing — Status Report

_Last synced: 2026-10-22 · Code at `main` 6fce943 (2026-04-07) · Backup: `logitap_backup_2026-10-22.json`_

## 0. Redesign preview (branch `redesign`, 2026-10-22)

Live preview: https://raftach.github.io/yazing/next/ — deploy with `npm run deploy:next` (adds `next/` to gh-pages without touching the root app).
`main` and the live app at `/yazing/` are unchanged. Sections 1–6 below describe `main`.

What the branch does (addresses §6 items 1–7 and 9):
- New UI (4 tabs: Σήμερα, Παραγγελίες, Πελάτες + Blacklist, Δεδομένα), light/dark following iOS, bundled fonts.
- "Paid" status per order (`paid`, `paidAt`), bulk "mark paid until date", reorder reminders per client (latest order only).
- Calendar-correct date math (`src/lib/dates.js`); import recomputes the 40 buggy derived deadlines.
- Backup v2 (includes dismissed reminders, version field), shared via the iOS share sheet; imports v1 files; confirmation with a summary before replacing data; "last backup" reminder; `storage.persist()`.
- Confirmations for destructive actions, undo toasts, blacklist warnings on similar client names, product-name suggestions and a merge tool for spelling variants, ΑΦΜ editable again.
- Service worker + linked manifest + icons: verified to cold-start with the network off (headless Edge).
- Storage keys `yz2_*` (separate from the original `erp_*`). The Data tab offers a one-tap transfer if `erp_*` data exists on the same device.
- Lint clean. Removed: template leftovers, `seed.js`, unused `react-router-dom`.
- Notifications/push were explicitly descoped.

Known gaps: `public/user-guide.html` still describes the old UI; `npm run deploy` from `main` (no `--add`) would remove `next/` from gh-pages.

## 1. Project summary

- **What it is:** Single-user, Greek-language order / client tracker (pallet orders, payment deadlines, reorder reminders, blacklist). Used on one iPhone as a home-screen web app.
- **Stack:** React 19.2 + Vite 8, plain JS (no TypeScript), `lucide-react` icons. No router in use (`react-router-dom` is installed but unused — tabs are local state in `App.jsx`).
- **State:** One React context (`src/AppContext.jsx`) holding `clients`, `orders`, `blacklist`, `deletedNotifications`; each is mirrored to `localStorage` (`erp_*` keys) on every change.
- **Backend:** none. No network calls except Google Fonts (Inter).
- **Hosting:** GitHub Pages, `https://raftach.github.io/yazing`, served from the `gh-pages` branch.

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` → `dist/` |
| Deploy | `npm run deploy` (builds, then pushes `dist/` to `gh-pages` via the `gh-pages` package) |
| Lint | `npm run lint` — **currently 8 errors** (see §5) |
| Tests | none |

### Git / release process (as found)
- `main` holds source; 14 commits, 2026-03-18 → 2026-04-07. Remote: `github.com/raftach/yazing`.
- `gh-pages` holds only built files; every deploy commit is named "Updates".
- A fresh build of `main` produces byte-identical asset hashes to what is on `gh-pages`, so **the live app equals `main` HEAD**.
- No tags, no version numbers (`package.json` is `0.0.0`), no CI.

## 2. Folder map

```
src/
  main.jsx            entry: StrictMode > ErrorBoundary > AppProvider > App
  App.jsx             tab shell + bottom nav + notification badge count
  AppContext.jsx      all state, CRUD, localStorage persistence
  ErrorBoundary.jsx   crash screen with reload button
  components/Combobox.jsx   searchable client picker
  pages/              Dashboard, Orders, Clients, Blacklist, Notifications
  seed.js             dev-only console seed script (old schema: products, status, totalPrice)
  App.css, assets/    Vite template leftovers, not imported
  index.css           all real styles (dark theme tokens + components)
public/
  manifest.json       PWA manifest (not linked from index.html, icons missing)
  user-guide.html     Greek user guide with screenshots in public/images/
dist/                 last build (gitignored)
```

**Warning:** this folder is also a Claude Code config directory (`.credentials.json`, `.claude.json`, `sessions/`, `projects/`, `backups/`, `cache/`, `plugins/`, `skills/`, `shell-snapshots/`, …). None of these are gitignored. A `git add .` would commit the credentials file to a public repo.

## 3. Feature inventory

| Feature | Status | Key files | Notes |
|---|---|---|---|
| Clients CRUD | Done | `pages/ClientsPage.jsx` | Delete has **no confirmation** and leaves orphan orders. 10-digit phone validation. |
| Client detail: history, latest dates, price history | Done | `ClientsPage.jsx` | Price history groups by exact product string, so name variants split it. |
| Orders CRUD + archive / restore / permanent delete | Done | `pages/OrdersPage.jsx` | Permanent delete has no confirmation. Nobody uses archive (0 of 189 archived). |
| Price auto-fill from client's last same-product order | Done | `OrdersPage.jsx:50-64` | Exact-match only. |
| Payment deadline auto-calculation | Partial / buggy | `OrdersPage.jsx:67-76` | DST and month-end errors (§5). |
| Reorder date (+1 month) | Partial / buggy | `OrdersPage.jsx:97-104, 321-330` | Same date bugs. |
| Add to calendar (.ics) | Partial | `OrdersPage.jsx:430-474` | `DTEND` = `DTSTART` (should be +1 day for all-day events); blob download is unreliable in iOS standalone mode. |
| Notifications (payments ≤7 days, reorders ≤1 day) | Partial | `pages/NotificationsPage.jsx`, `App.jsx:37-71` | No "paid" state, one alert per order rather than per client; see §4. Logic is duplicated in two files. |
| Snooze reorder +30 days | Done | `NotificationsPage.jsx:559-568` | Rewrites the order's own reorder date. |
| Blacklist CRUD | Done | `pages/BlacklistPage.jsx` | Not cross-checked when creating a client or order. |
| Dashboard pallet totals (all / per month or year) | Done | `pages/DashboardPage.jsx` | |
| Backup export / import | Partial | `DashboardPage.jsx:132-185` | Doesn't include `deletedNotifications`; import overwrites with no confirmation and no validation of the inner JSON; no reminder to back up. |
| Offline use | **Missing** | — | Data lives on the device, but the **app itself** has no service worker, so it is fetched from GitHub Pages at launch. See §5. |
| PWA install metadata | Broken | `index.html`, `public/manifest.json` | Manifest not linked; `icon-192/512.png` don't exist; no `apple-touch-icon`. |
| Password / lock | Stub | `AppContext.jsx:5` | `DEFAULT_PASSWORD` constant is defined but never used, and it sits in a public repo. |
| Products catalogue | Missing (by design?) | `seed.js` only | Products are free text. |

## 4. Backup vs. code

Backup format: `{ clients, blacklist, orders }`, where **each value is a JSON-encoded string** (raw copies of `localStorage`). Size ~84 KB.

| Collection | Count | Schema vs. code |
|---|---|---|
| clients | 84 | Matches. Extra `afm` (tax ID) on 56 records, but the current form neither shows nor edits it, so this data is invisible. `defaultPaymentOption` only on 31 (newer field; code defaults correctly). 80 of 84 have no phone. 19 have no orders. |
| orders | 189 | Matches the current form exactly. `orderDate` range 2026-03-02 → 2026-10-21. 1 order references a deleted client. 2 have price 0. Payment terms: 135 three-month, 25 custom, 19 two-month, 10 one-month. |
| blacklist | 1 | Matches. |
| deletedNotifications | — | **Not in the backup.** Restoring brings back every dismissed alert. |

Data-driven findings (as of 2026-10-22):
- **140 active orders show as "overdue payment"** and **177 as "reorder due"**. With no way to mark an order paid, the notifications tab is likely noise and the badge number is meaningless.
- If reorder alerts used only each client's **latest** order, 177 would become 55.
- **24 product groups** have spelling variants that differ only by spaces, dots or dashes. This breaks price auto-fill and price history.
- **35 of 164** auto-calculated payment deadlines are off compared with plain calendar math (DST and month-end bugs).
- Median gap between a client's orders is 23 days (25th–75th percentile: 7–45 days). The fixed +1 month reorder guess is rough.
- The backup is newer than the code: data runs to 2026-10-21, while the last code change was 2026-04-07. The schema has stayed stable.

## 5. Known issues and tech debt

**Data safety (highest risk)**
1. All data lives only in iOS web-app `localStorage` on one phone. It disappears if the home-screen icon is removed, the phone is lost or reset, or iOS clears storage. Backups are manual, and the app never asks for one.
2. `navigator.storage.persist()` is never requested.
3. Import overwrites everything with no "are you sure" and no checks on the data shape.
4. Deleting a client and permanently deleting an order both happen immediately, with no confirmation.

**Offline / PWA**
5. There is no service worker. A cold launch with no signal may fail to load the app (iOS cache behaviour is unreliable). Fix: add a small hand-written service worker or `vite-plugin-pwa`.
6. The manifest is not linked, the icons are missing, and there is no apple-touch-icon, so the home-screen icon is a page screenshot.
7. Google Fonts loads from the network, so offline the app falls back to the system font.

**Correctness**
8. Date math uses `new Date('YYYY-MM-DD')` + `setMonth` + `toISOString()`. This gives off-by-one results across the spring DST change and overflows at month end (Jan 31 + 1 month = Mar 3). `openAdd` also uses the UTC "today", so an order created between 00:00 and 03:00 Athens time is dated yesterday.
9. ICS `DTEND` equals `DTSTART`, and UIDs are random, so importing twice creates duplicates.
10. The product input strips characters (`OrdersPage.jsx:307`), which removes `/`, `,`, `+` and similar, but it doesn't normalize spaces, so near-duplicates are still created.
11. `ClientsPage` search calls `.toLowerCase()` on `contactPerson` and would crash on a record without it (fine with today's data, fragile after imports).

**Code quality**
12. `npm run lint`: 8 errors (`set-state-in-effect` ×2, `no-useless-escape`, unused vars, etc.).
13. Heavy inline styles. `TabBtn` and `formatDate` are duplicated across pages, and the notification logic is duplicated in `App.jsx` and `NotificationsPage.jsx`.
14. Template leftovers: `README.md` (Vite boilerplate), `App.css`, `src/assets/*`, unused `react-router-dom`. `seed.js` uses an outdated schema.
15. No tests.

## 6. Suggested next steps (priority order)

1. **Protect the repo:** add the Claude config files and folders and `logitap_backup_*.json` to `.gitignore` (or move the project out of the Claude config folder). Remove the unused password constant.
2. **Protect the data:** confirm before import and destructive deletes; include `deletedNotifications` in the backup; show "last backup: N days ago" with a nudge; call `storage.persist()`; use the iOS share sheet (`navigator.share` with a file) for export.
3. **Add a "Paid" status** per order, and make reorder alerts per client (latest order only). This makes notifications meaningful again.
4. **Fix the date math** with local-date helpers. Optionally offer a one-time fix-up of the 35 affected deadlines.
5. **Real offline:** service worker, linked manifest, icons, self-hosted font.
6. **Product normalization:** suggest existing product names while typing, and collapse spacing variants.
7. **UI redesign** (see the proposal shared in chat).
8. Show and edit the `afm` field on clients, and warn when a new client matches a blacklist entry.
9. Clean up lint, leftovers and README; tag releases.
