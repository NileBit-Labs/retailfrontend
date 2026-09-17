# Contributing to retailfrontend

Vue 3 + Vite + TypeScript app for NileBit Retail POS.

## Setup

```bash
git clone https://github.com/NileBit-Labs/retailfrontend.git
cd retailfrontend
npm install
npm run dev
```

App is now at `http://localhost:5173`. It expects the backend (`retailbackend`) running at `http://localhost:8000` — API wiring (base client, auth token handling) is part of the Foundation track below and isn't built yet.

Run `npm run build` before opening a PR — it must pass (type-check + build).

## Module ownership

| Person | Track |
| --- | --- |
| Elioda Muhangi (CTO) | Foundation (login/auth, API client), POS/Sales screens, offline sync UX — also reviews/merges every PR |
| Collins Shema (COO) | Products, Inventory, Suppliers, Purchases, Expenses screens |
| Douglas Bagambe (CEO) | Customers/Credit, Users/Staff, Settings, Dashboard, Reports screens |

Stick to your own module's views/components/stores unless coordinating a shared change (e.g. the Pinia `auth`/`shop` stores, shared layout/nav) — flag those in a PR description or ask before touching another track's files.

## Branching & PRs

- Branch off `main`: `feature/<your-module>-<short-description>` (e.g. `feature/pos-cart-discounts`)
- No direct pushes to `main` — open a PR, get at least one review before merging
- Keep PRs scoped to one module/feature at a time
