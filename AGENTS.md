# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project

GoBooking-backend (BookEasy) — a SaaS booking system backend for salons, clinics, and local businesses. WhatsApp integration, UPI payments, automated reminders, owner dashboard.

**Current state: Module 1 (Authentication & Organization) and Module 2 (Business Profile) are implemented.** Module 1: registration, OTP verification, login, JWT refresh rotation, logout/logout-all, forgot/reset password, profile, organization management. Module 2: one business profile per organization (name, type, address, geo, working hours, logo/cover image). No other business module (Services, Staff, Customers, Booking Engine, Availability Engine, Notifications, Payments, Dashboard, SaaS Billing) exists yet — check `src/modules/` before assuming one does.

## Tech stack

- Node.js (LTS), CommonJS (`require`/`module.exports`, not ESM)
- Express.js 5
- MongoDB via **Mongoose** (not the raw driver — that was true only in the pre-Module-1 boilerplate)
- Redis (`redis` package) — used only for OTP, password-reset tokens, and rate limiting
- JWT (`jsonwebtoken`) + bcrypt (native, not bcryptjs) for auth
- Multer (native disk storage, no S3/Cloudinary) for Module 2's logo/cover image uploads
- Docker / Docker Compose for local dev — MongoDB runs as a **single-node replica set** (`rs0`), required for Mongoose transactions

## Structure — Controller → Service → Repository

```
src/
├── config/         env.js, database.js (mongoose), redis.js, server.config.js
├── modules/
│   ├── auth/        auth.service.js, auth.controller.js, auth.routes.js (no model/repository — orchestrates the other three)
│   ├── organization/ organization.model.js, .repository.js, .service.js, .controller.js, .routes.js
│   ├── user/          same five-file pattern
│   ├── session/        session.model.js, session.repository.js only (no controller/routes — sessions are only touched by auth.service.js)
│   └── business-profile/ businessProfile.{model,repository,service,controller,routes,validation}.js — this module keeps its OWN validation file (per its spec) instead of using the shared top-level validators/ folder; see below
├── middlewares/     authenticate, authorize, rateLimiter, errorHandler, notFound, handleUpload (wraps multer errors into BadRequestError)
├── routes/           health.routes.js (infra, outside the module system) + index.js (mounts /api/v1/*)
├── validators/        Module 1 only: one file per module (auth/user/organization) + common.validator.js primitives + validationCollector.js. Module 2 (business-profile) does NOT put its validators here — its spec explicitly scoped a single businessProfile.validation.js file inside its own module folder. Both patterns import/reuse validationCollector.js and common.validator.js; new modules can follow either the Module 1 style (shared validators/ folder) or the Module 2 style (self-contained validation.js) depending on what that module's own spec asks for.
├── helpers/            jwt, hash, otp, token (random + sha256), slug, fileStorage (buildFileUrl / deleteFileByUrl for uploads)
├── utils/               asyncHandler (wraps every controller — no manual try/catch), pick.util (whitelist field updates)
├── constants/            roles, status enums, http-status, redisKeys, rateLimit thresholds, businessType, workingDays
├── errors/                AppError + typed subclasses (BadRequestError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, TooManyRequestsError)
├── responses/              successResponse / errorResponse — every endpoint returns {success, message, data} or {success, message, errors}
└── controllers/             health.controller.js only — health-check is infra, not a module
```

**Layer rules** (don't violate these when extending):
- Repositories are the *only* place that touch a Mongoose model directly (`Model.find...`, `.save()`, etc.). Services call repositories, never models. This was violated once during Module 1's own build (a service called `.save()` on a doc directly) and had to be fixed — watch for the same mistake.
- Controllers only: validate (via route-level middleware, not inline), call a service, return a response via `successResponse`/`errorResponse`. Business logic belongs in services.
- All controllers are wrapped in `asyncHandler` — never write a manual `try/catch` in a controller; let `asyncHandler` forward to the centralized `errorHandler.middleware.js`.
- **Field naming is per-module, not global.** Module 1 uses camelCase (`organizationId`, `firstName`). Module 2 (`business-profile`) uses snake_case (`organization_id`, `business_name`, `created_at`/`updated_at`) because its own spec explicitly named the fields that way. Don't "normalize" one to match the other — check what a given module's spec actually said before assuming a convention is repo-wide.
- **Cross-field / cross-request validation that needs current DB state (not just the request body) belongs in the service, not the validator.** Example: `businessProfile.service.js`'s `close_time must be after open_time` check re-reads the existing profile so a partial update of only `close_time` is validated against the *current* `open_time`, not `undefined`. The validator only checks per-field format (regex, enum, range); it has no DB access by design.
- **`business-profile`'s service checks `organization.status === ACTIVE` (via a shared `assertOrganizationActive` helper) on every single operation** — create, get, update, and both upload endpoints — not just create. This was originally only on create (matching the spec's literal flow description), but was deliberately widened after review: leaving GET/UPDATE/uploads open for a suspended organization was a real residual gap, not an intentional feature. If a future module's spec only calls out an active-org check for one flow, consider whether the same widening should apply before assuming the narrower literal reading is correct.

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
- `/app/uploads` is a **named volume** (`uploads_data`), not just relying on the `.:/app` bind mount — this is deliberate so uploaded files survive container recreation even in a non-dev context where the bind mount might not be present.
- **Anonymous-volume staleness gotcha, hit for real while building Module 2**: after adding `multer` to `package.json` and rebuilding the image, the container still crashed with `MODULE_NOT_FOUND: multer`. Cause: the `/app/node_modules` anonymous volume declared in `docker-compose.yml` was created during Module 1's very first `docker compose up`, *before* multer existed, and Compose reuses that same anonymous volume across rebuilds — it shadows the freshly-built image's `node_modules`. Fix: `docker compose down -v` (removes this project's volumes only — Compose namespaces anonymous volumes per-project, so it's safe even on a machine with many unrelated `docker compose` projects) then `docker compose up --build` again. **Whenever a new npm dependency is added, expect to need `down -v` before the container will see it**, not just `up --build`.

## File upload specifics (Module 2)

- `src/config/upload.config.js` configures `multer.diskStorage` for logos/covers (allowed MIME types: JPEG/PNG/WEBP; size limit from `env.MAX_UPLOAD_SIZE_BYTES`). `src/middlewares/handleUpload.middleware.js` wraps the multer middleware so *any* multer error (bad type from `fileFilter`, `LIMIT_FILE_SIZE`, wrong field name) becomes a `BadRequestError` through the normal centralized error handler, instead of an unhandled/raw error.
- **multer writes the file to disk before any of your own middleware runs.** `businessProfile.validation.js`'s `validateUploadedFile` (which rejects 0-byte files and non-image content, see below) must explicitly `fs.unlink(req.file.path)` when rejecting — otherwise the rejected file is orphaned on disk forever. This was a real bug caught during manual verification (confirmed live via `docker compose exec backend ls /app/uploads/logos`), not something to assume is handled. If you add another post-upload validation step anywhere, remember the file already exists on disk by the time your check runs.
- Replacing a logo/cover deletes the *old* file (`fileStorage.helper.js`'s `deleteFileByUrl`, fire-and-forget with error logging) — don't let old uploads accumulate silently.
- **Never derive the saved filename's extension from the client's original filename, and never trust the client-supplied `Content-Type`/`file.mimetype` alone.** A real vulnerability was found and fixed here: the original code used `path.extname(file.originalname)` for the saved extension and only checked `file.mimetype` (attacker-controlled) in `fileFilter`. A file named `evil.html` with a spoofed `image/png` Content-Type sailed through and was saved as `<id>-<timestamp>.html`, which `express.static` would then serve as `text/html` — stored XSS via the upload endpoint. Fixed with two independent layers, both required: (1) `upload.config.js`'s `MIME_TO_EXTENSION` map derives the saved extension from the *validated* MIME type only, so the file can never be saved with a `.html`/`.exe`/etc. extension no matter what the client names it; (2) `fileStorage.helper.js`'s `detectImageMimeType` reads the first 12 bytes of the saved file and checks real PNG/JPEG/WEBP magic bytes, rejecting (and deleting) anything whose actual content isn't a real image, regardless of claimed headers. If you add another upload endpoint anywhere in the app, both of these need to carry over — checking `file.mimetype` in `fileFilter` alone is not sufficient.

## Do not install

Beyond the original constraint (no auth/payment/queue/scheduling/testing libraries, no cors/helmet/compression/winston/zod/etc. without being asked): rate limiting and OTP/reset-token storage are hand-rolled on top of the existing `redis` client rather than adding `express-rate-limit` or similar — keep following that pattern rather than reaching for a new dependency when Redis primitives (`INCR`/`EXPIRE`/`SET ... EX`) already solve the problem.

## Planned future modules (not yet started)

Services, Staff, Customers, Booking Engine, Availability Engine, Notifications, Payments, Dashboard, SaaS Billing. Each new module should follow the `modules/<name>/` pattern (model, repository, service, controller, routes, +validation if self-contained) established by `organization/`, `user/`, and `business-profile/`, and reuse the existing `errors/`, `responses/`, `middlewares/authenticate.middleware.js`/`authorize.middleware.js`, and (for file uploads) `config/upload.config.js` + `helpers/fileStorage.helper.js` + `middlewares/handleUpload.middleware.js` infrastructure rather than reinventing it.
