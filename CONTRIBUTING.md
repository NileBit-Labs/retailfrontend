# Contributing to retailfrontend

Vue 3 + Vite + TypeScript app for NileBit Retail POS.

## Setup

```bash
git clone https://github.com/NileBit-Labs/retailfrontend.git
cd retailfrontend
npm install
cp .env.example .env
npm run dev
```

App is now at `http://localhost:5173`. It expects the backend (`retailbackend`, see its own CONTRIBUTING.md) running at `http://localhost:8200` (a pinned non-default port — the backend's `SERVER_PORT` env var — so it doesn't collide with any other Laravel project's default 8000) — `.env`'s `VITE_API_URL` points at it. The app will refuse to start without `.env` present (fails loudly rather than silently calling the wrong URL).

If the login/register form suddenly shows "The route api/... could not be found" after previously working, check nothing else is running on port 8200 (`lsof -nP -iTCP -sTCP:LISTEN`) before assuming the code broke — that error means *some* server answered, just not this one.

Run `npm run build` before opening a PR — it must pass (type-check + build).

## Module ownership

| Person | Track |
| --- | --- |
| Elioda Muhangi (CTO) | Foundation (login/auth, API client), Sales/POS, offline sync, Customers & Credit, Expenses, Refunds & Shifts screens |
| Collins Shema (COO) | Products, Inventory, Suppliers, Purchases screens |
| Douglas Bagambe (CEO) | Users/Staff, Settings, Dashboard, Reports screens |

Stick to your own module's views/components/stores unless coordinating a shared change (e.g. the Pinia `auth`/`shop` stores, shared layout/nav) — flag those in a PR description or ask before touching another track's files.

## Patterns to follow

- **Talk to the API only through `apiFetch`** (`src/lib/api.ts`). It adds the token and `X-Shop-Id`, times out after 15s, and turns failures into `ApiError`; use `apiErrorMessage(e)` to show a readable message and `isNetworkFailure(e)` to tell "the server said no" from "couldn't reach the server".
- **Money is an integer number of UGX** everywhere; format it with `formatUgx`. Totals you show are for display — the server recomputes and is the authority.
- **Writes that matter must survive a bad connection.** Give the action one idempotency key for its whole life and reuse it on retry (see the cart's checkout). Sales already queue offline; if your module adds a write that shops will do without internet, route it through the same outbox/sync path rather than inventing another.
- **Follow the design tokens** in `src/assets/base.css` (`--color-*`, `--radius-*`, `.card`, `.btn`, `.field`) so light and dark mode both work. Don't hard-code colours; use `--color-on-primary` for text on primary backgrounds.
- **Add your screen to `src/router/nav.ts`** with `ready: true` and a real route in `src/router/index.ts`; use `managerOnly: true` for screens cashiers shouldn't see (the server still enforces it).
- **Test in a browser**, on a phone-sized viewport too. Type-checking and a build don't tell you the till is usable.

## Branching & PRs

- Branch off `main`: `feature/<your-module>-<short-description>` (e.g. `feature/pos-cart-discounts`)
- No direct pushes to `main` — open a PR, get at least one review before merging
- Keep PRs scoped to one module/feature at a time
