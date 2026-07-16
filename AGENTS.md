# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project

GoBooking-backend (BookEasy) — a SaaS booking system backend for salons, clinics, and local businesses. WhatsApp integration, UPI payments, automated reminders, owner dashboard.

**Current state: Module 1 (Authentication & Organization) is implemented.** Registration, OTP verification, login, JWT refresh rotation, logout/logout-all, forgot/reset password, profile, organization management. No other business module (Services, Staff, Customers, Booking Engine, Availability Engine, Notifications, Payments, Dashboard, SaaS Billing) exists yet — check `src/modules/` before assuming one does.

## Tech stack

- Node.js (LTS), CommonJS (`require`/`module.exports`, not ESM)
- Express.js 5
- MongoDB via **Mongoose** (not the raw driver — that was true only in the pre-Module-1 boilerplate)
- Redis (`redis` package) — used only for OTP, password-reset tokens, and rate limiting
- JWT (`jsonwebtoken`) + bcrypt (native, not bcryptjs) for auth
- Docker / Docker Compose for local dev — MongoDB runs as a **single-node replica set** (`rs0`), required for Mongoose transactions

## Structure — Controller → Service → Repository

```
src/
├── config/         env.js, database.js (mongoose), redis.js, server.config.js
├── modules/
│   ├── auth/        auth.service.js, auth.controller.js, auth.routes.js (no model/repository — orchestrates the other three)
│   ├── organization/ organization.model.js, .repository.js, .service.js, .controller.js, .routes.js
│   ├── user/          same five-file pattern
│   └── session/        session.model.js, session.repository.js only (no controller/routes — sessions are only touched by auth.service.js)
├── middlewares/     authenticate, authorize, rateLimiter, errorHandler, notFound
├── routes/           health.routes.js (infra, outside the module system) + index.js (mounts /api/v1/*)
├── validators/        one file per module (auth/user/organization) + common.validator.js primitives + validationCollector.js. Validators are Express middleware — applied at the route level, not inside controllers.
├── helpers/            jwt, hash, otp, token (random + sha256), slug
├── utils/               asyncHandler (wraps every controller — no manual try/catch), pick.util (whitelist field updates)
├── constants/            roles, status enums, http-status, redisKeys, rateLimit thresholds
├── errors/                AppError + typed subclasses (BadRequestError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, TooManyRequestsError)
├── responses/              successResponse / errorResponse — every endpoint returns {success, message, data} or {success, message, errors}
└── controllers/             health.controller.js only — health-check is infra, not a module
```

**Layer rules** (don't violate these when extending):
- Repositories are the *only* place that touch a Mongoose model directly (`Model.find...`, `.save()`, etc.). Services call repositories, never models. This was violated once during Module 1's own build (a service called `.save()` on a doc directly) and had to be fixed — watch for the same mistake.
- Controllers only: validate (via route-level middleware, not inline), call a service, return a response via `successResponse`/`errorResponse`. Business logic belongs in services.
- All controllers are wrapped in `asyncHandler` — never write a manual `try/catch` in a controller; let `asyncHandler` forward to the centralized `errorHandler.middleware.js`.

## Security-sensitive conventions (learned the hard way — see below)

- **`User.toJSON()` strips `passwordHash`** via a schema transform in `user.model.js`. This exists because `login()` must `.select('+passwordHash')` to compare it, and the full doc was originally returned straight to the client, leaking the bcrypt hash in the API response — caught during manual verification, not by any test suite. If you add a new field that must never leave the server (e.g. a future MFA secret), strip it the same way — at the schema level, not by remembering to omit it in every service function.
- Refresh tokens are JWTs *and* their sha256 hash is stored on the `Session` document (`session.refreshTokenHash`). Verifying a refresh token requires both: valid JWT signature/expiry AND matching stored hash. Rotation replaces the hash in place (same session `_id`), which is what makes replay of a pre-rotation token fail.
- Rate limiting (`middlewares/rateLimiter.middleware.js`) is keyed by `req.ip`, not by request body identifier. This is intentional (protects against distributed-account brute force from one IP) but means, e.g., hammering `/auth/login` with different emails from the same IP exhausts the limit for all of them — expected, not a bug.
- `forgotPassword()` always returns the same generic success message regardless of whether the identifier exists, to prevent user enumeration. Don't "fix" this to return 404 for unknown identifiers.
- Mongoose's `{ new: true }` option is deprecated as of the Mongoose version pinned here (9.x) — use `{ returnDocument: 'after' }` instead. All existing repositories already do this; match it in new ones.

## Docker specifics

- `docker-compose.yml`: `mongodb` uses `mongo:7` (pinned, not `:latest` — an existing `mongodb_data` volume created by a newer Mongo version won't downgrade-start) with `--replSet rs0`, and a healthcheck that auto-initiates the replica set on first boot. `backend` has `depends_on: mongodb: condition: service_healthy`.
- `Dockerfile` is multi-stage: a `deps` stage installs `python3 make g++` to compile bcrypt's native binding, then the final stage copies only `node_modules` — the compiler toolchain never ships in the runtime image. Final image runs as the non-root `node` user and has a `HEALTHCHECK` against `/health`.
- `nodemon --legacy-watch` is required in the `dev` script — plain `nodemon` does not detect file changes through Docker Desktop bind mounts on Windows/Mac.

## Do not install

Beyond the original constraint (no auth/payment/queue/scheduling/testing libraries, no cors/helmet/compression/winston/zod/etc. without being asked): rate limiting and OTP/reset-token storage are hand-rolled on top of the existing `redis` client rather than adding `express-rate-limit` or similar — keep following that pattern rather than reaching for a new dependency when Redis primitives (`INCR`/`EXPIRE`/`SET ... EX`) already solve the problem.

## Planned future modules (not yet started)

Services, Staff, Customers, Booking Engine, Availability Engine, Notifications, Payments, Dashboard, SaaS Billing. Each new module should follow the `modules/<name>/` five-file pattern (model, repository, service, controller, routes) established by `organization/` and `user/`, and reuse the existing `errors/`, `responses/`, `validators/`, `middlewares/authenticate.middleware.js`/`authorize.middleware.js` infrastructure rather than reinventing it.
