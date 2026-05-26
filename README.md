<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8092069b-3461-4b08-861f-8b790d207f73

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy [`.env.example`](.env.example) to `.env` and adjust:
   - `DATABASE_URL=file:./data/homaire.db` — SQLite database path
   - `JWT_SECRET` — signing key for auth tokens
   - `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — default admin (`admin@homaire.local` / `admin`)
   - `STORE_ADMIN_PASSWORD` — legacy admin header for `/api/store/catalog` PUT
3. Initialize database and import catalog: `npm run db:push && npm run migrate:sqlite`
4. (Optional) Set `GEMINI_API_KEY` in `.env.local` for Gemini features
5. Development: `npm run dev` — Vite + SQLite API on port 3000
6. Production: `npm run build && npm run start`

### Backend API

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| Catalog (public) | `GET /api/v1/catalog`, `/api/v1/products`, `/api/v1/categories` |
| Checkout | `POST /api/v1/orders` (JWT required) |
| User | `/api/v1/me/orders`, `/api/v1/me/addresses`, `/api/v1/me/wishlist`, `/api/v1/me/cart` |
| Admin | `/api/v1/admin/*` (JWT `isAdmin` or `X-Admin-Password`) |
| Legacy compat | `/api/store/catalog`, `/api/store/orders` (same SQLite backend) |

Data persists in SQLite (`data/homaire.db`). JSON snapshot files are used only for initial import.
