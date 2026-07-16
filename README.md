# GoBooking

BookEasy is a SaaS booking system that integrates WhatsApp, UPI payments, automated reminders, and an owner dashboard to help salons, clinics, and local businesses reduce no-shows, manage appointments efficiently, and improve revenue through prepaid bookings.

**Module 1 (Authentication & Organization)** is implemented. No other business modules exist yet.

## Tech Stack

- Node.js (LTS), Express.js
- MongoDB via Mongoose
- Redis (OTP, password reset tokens, rate limiting)
- JWT (access + refresh), bcrypt
- Docker

## Project Structure

```
GoBooking/
├── src/
│   ├── config/         # env, MongoDB (Mongoose), Redis, server config
│   ├── modules/
│   │   ├── auth/        # auth.service.js, auth.controller.js, auth.routes.js
│   │   ├── organization/ # model, repository, service, controller, routes
│   │   ├── user/          # model, repository, service, controller, routes
│   │   └── session/       # model, repository (no dedicated routes — used by auth)
│   ├── middlewares/     # authenticate, authorize, rateLimiter, errorHandler, notFound
│   ├── routes/          # health.routes.js, index.js (mounts /api/v1/*)
│   ├── validators/       # per-module request validators + shared primitives
│   ├── helpers/          # jwt, hash, otp, token, slug
│   ├── utils/             # asyncHandler, pick.util
│   ├── constants/          # roles, status enums, http status, redis keys, rate limits
│   ├── errors/              # AppError + typed subclasses
│   ├── responses/           # successResponse / errorResponse
│   ├── controllers/          # health.controller.js (infra, not a business module)
│   ├── app.js
│   └── server.js
├── docs/
│   └── MODULE_1_TEST_CASES.md   # exhaustive manual acceptance test cases
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Running with Docker

1. Copy the example environment file and (optionally) replace the placeholder JWT secrets:
   ```
   cp .env.example .env
   ```
2. Start the stack:
   ```
   docker compose up --build
   ```

| Service | Port |
|---------|------|
| backend | 5000 |
| mongodb | 27017 |
| redis   | 6379 |

MongoDB runs as a **single-node replica set** (`rs0`) — this is required for Mongoose transactions (used during registration) to work. `docker-compose.yml` auto-initiates the replica set via a healthcheck; the backend waits for it to become healthy before starting.

Source code is bind-mounted with `nodemon --legacy-watch` for hot reload (polling mode is required for file-change detection to work through Docker Desktop bind mounts on Windows/Mac).

### Running without Docker

```
npm install
cp .env.example .env
npm run dev
```

Note: without a replica-set MongoDB instance, registration will fail at `session.withTransaction()`.

## API

Base path: `/api/v1`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create organization (PENDING) + OWNER user (PENDING), send OTP |
| POST | `/auth/verify-registration` | — | Verify OTP, activate org + user, issue tokens |
| POST | `/auth/login` | — | Login with email or phone |
| POST | `/auth/refresh-token` | — | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | — | Delete the session tied to the given refresh token |
| POST | `/auth/logout-all` | Bearer | Delete all sessions for the current user |
| POST | `/auth/forgot-password` | — | Generate a reset token (Redis, 15 min TTL) |
| POST | `/auth/reset-password` | — | Reset password, wipe all sessions |
| GET | `/users/me` | Bearer | Get current user profile |
| PATCH | `/users/me` | Bearer | Update first/last name |
| POST | `/users/me/change-password` | Bearer | Change password |
| GET | `/organizations/me` | Bearer | Get current organization |
| PATCH | `/organizations/me` | Bearer, OWNER only | Update name/email/phone |

Response shape:
```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "errors": [] }
```

Full manual test coverage (registration, OTP, login, refresh rotation, logout, password reset, rate limiting, JWT tampering, etc.) is documented in [docs/MODULE_1_TEST_CASES.md](docs/MODULE_1_TEST_CASES.md) — every flow there was exercised live against a running `docker compose` stack during development.

### OTP / reset tokens in development

There is no notification module yet, so OTPs and password-reset tokens are logged to the backend console (`[DEV OTP]` / `[DEV RESET TOKEN]`) whenever `NODE_ENV !== 'production'`. They are never included in API responses.

## Status

Module 1 (Authentication & Organization) is implemented per the design spec: registration with a Mongo transaction, OTP verification, login, JWT access/refresh tokens with rotation and replay protection, logout/logout-all, forgot/reset password, profile, and organization management. Future modules (Services, Staff, Customers, Booking Engine, Availability Engine, Notifications, Payments, Dashboard, SaaS Billing) build on top of this foundation.
