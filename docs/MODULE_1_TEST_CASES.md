# Module 1 (Authentication & Organization) — Manual Test Cases

Base URL: `http://localhost:5000/api/v1`

All requests use `Content-Type: application/json`. Authenticated requests add `Authorization: Bearer <accessToken>`.

Cases marked **[Verified]** were executed live against a running `docker compose up` stack during development. Cases marked **[By design]** follow directly from code that was exercised via an adjacent verified case (e.g. the same validator, the same repository query) and were not separately re-run over HTTP.

---

## Registration

| # | Case | Request | Expected |
|---|------|---------|----------|
| 1 | Successful registration **[Verified]** | `POST /auth/register` with unique org name, email, phone, strong password | `201`, `{success:true, data:{userId, organizationId, otpExpiresInSeconds}}`. Organization + User both created with status `PENDING`. |
| 2 | Duplicate email **[Verified]** | Register again reusing an existing user's email | `409 Conflict`, `"Email is already registered"` |
| 3 | Duplicate phone **[By design]** | Register reusing an existing user's phone, new email | `409 Conflict`, `"Phone is already registered"` (mirrors email check, same code path) |
| 4 | Invalid email **[Verified]** | `email: "not-an-email"` | `400`, `errors:[{field:"email",...}]` |
| 5 | Weak password **[Verified]** | `password: "weak"` | `400`, `errors:[{field:"password",...}]` (requires 8+ chars, upper, lower, digit) |
| 6 | Missing fields **[By design]** | Omit `organizationName` | `400`, `errors:[{field:"organizationName", message:"Organization name is required"}]` |
| 7 | Organization transaction rollback **[Verified]** | Trigger the E11000 duplicate-key branch (e.g. two near-simultaneous registrations racing on the same email past the pre-check) | Mongoose transaction aborts; no orphaned Organization document is left in the `organizations` collection. Confirmed by inspecting the `organizations` collection after a failed duplicate registration — no partial org existed. |

---

## OTP Verification

| # | Case | Request | Expected |
|---|------|---------|----------|
| 8 | Correct OTP **[Verified]** | `POST /auth/verify-registration` with the OTP logged to the console (`[DEV OTP]`, dev-mode only) | `200`, returns `accessToken`, `refreshToken`, `user`, `organization`. User + Organization status flip to `ACTIVE`. |
| 9 | Wrong OTP **[Verified]** | Submit an incorrect 6-digit code | `400`, `"Invalid OTP"` |
| 10 | Expired OTP **[By design]** | Wait past `OTP_TTL_SECONDS` (default 300s), then submit | `400`, `"OTP has expired or was already used..."` (Redis key TTL-evicts; `redis.get` returns null) |
| 11 | OTP already used **[Verified]** | Verify once successfully, then replay the same OTP | `400`, `"OTP has expired or was already used..."` (key is deleted on first successful verification) |
| 12 | Multiple invalid attempts **[Verified]** | Submit wrong OTP 5 times (`OTP_MAX_ATTEMPTS`) | 5th attempt returns `"Too many invalid OTP attempts. Please register again."`; OTP key is deleted, so even the *correct* OTP fails afterward — confirmed live. |

---

## Login

| # | Case | Request | Expected |
|---|------|---------|----------|
| 13 | Email login **[Verified]** | `identifier` = email, correct password | `200`, tokens + user + organization |
| 14 | Phone login **[By design]** | `identifier` = phone, correct password | Same repository `$or` query as email; verified via code path shared with #13 |
| 15 | Wrong password **[Verified]** | Correct identifier, wrong password | `401`, `"Invalid credentials"` |
| 16 | Blocked user **[By design]** | `user.status = BLOCKED` (set directly in DB — no admin endpoint exists yet in Module 1) | `403`, `"Account is not active"` |
| 17 | Pending user **[By design]** | Login before completing OTP verification | `403`, `"Account is pending verification. Please complete OTP verification."` |
| 18 | Suspended organization **[By design]** | `organization.status = SUSPENDED` | `403`, `"Organization is not active"` |
| 19 | Deleted organization **[By design]** | `organization.status = DELETED` | `403`, `"Organization is not active"` (same branch as #18) |

---

## Refresh Token

| # | Case | Request | Expected |
|---|------|---------|----------|
| 20 | Valid refresh **[Verified]** | `POST /auth/refresh-token` with a live refresh token | `200`, new `accessToken` + `refreshToken` |
| 21 | Expired refresh **[By design]** | Refresh token whose session `expiresAt` has passed | `401`, `"Refresh token has expired"`; session document is deleted |
| 22 | Invalid refresh **[Verified]** | Malformed / signature-tampered token | `401`, `"Invalid refresh token"` |
| 23 | Rotated refresh token **[Verified]** | Use the *new* token returned from #20 | Succeeds; old token's hash no longer matches |
| — | Replay refresh token (old, already-rotated) **[Verified]** | Reuse the pre-rotation token from #20 | `401`, `"Refresh token has already been used or is invalid"`; session is deleted (forces re-login) |

---

## Logout

| # | Case | Request | Expected |
|---|------|---------|----------|
| 24 | Logout current device **[Verified]** | `POST /auth/logout` with a valid refresh token | `200`, `"Logged out successfully"`; session removed; that refresh token can no longer be used |
| 25 | Logout already logged out token **[Verified]** | Repeat #24 with the same (now-deleted) token | `200`, `"Logged out successfully"` (idempotent — no error) |

---

## Logout All

| # | Case | Request | Expected |
|---|------|---------|----------|
| 26 | Logout every session **[Verified via direct query]** | `POST /auth/logout-all` (auth required) | All `Session` documents for `req.user.id` deleted. Verified the underlying `deleteMany({ userId })` query directly against MongoDB (2 active sessions → 0 after); the controller/service wiring is a 2-line pass-through of the already-verified `authenticate` middleware's `req.user.id`. |

---

## Forgot Password

| # | Case | Request | Expected |
|---|------|---------|----------|
| 27 | Existing email **[Verified]** | `POST /auth/forgot-password` with a registered email | `200`, generic success message; reset token generated in Redis (`[DEV RESET TOKEN]` logged in dev mode) |
| 28 | Existing phone **[By design]** | Same endpoint with a registered phone | Same code path as #27 (falls through email lookup miss → phone lookup) |
| 29 | Invalid identifier **[Verified]** | Unregistered email/phone | `200`, **same generic success message** — deliberate, prevents user enumeration. No reset token is generated. |
| 30 | Expired reset token **[By design]** | Wait past `RESET_PASSWORD_TTL_SECONDS` (default 900s) before using the token | `400`, `"Reset token is invalid or has expired"` (Redis TTL eviction) |

---

## Reset Password

| # | Case | Request | Expected |
|---|------|---------|----------|
| 31 | Successful reset **[Verified]** | `POST /auth/reset-password` with valid token + new strong password | `200`; password updated; **all sessions for that user deleted** (confirmed old refresh tokens stop working) |
| 32 | Invalid token **[By design]** | Random/garbage token | `400`, `"Reset token is invalid or has expired"` |
| 33 | Expired token | Same as #30 | Same response |
| 34 | Reused token **[Verified]** | Use the same token twice | Second attempt: `400`, `"Reset token is invalid or has expired"` (key deleted after first use) |
| — | Old password rejected after reset **[Verified]** | Login with the pre-reset password | `401`, `"Invalid credentials"` |
| — | New password accepted **[Verified]** | Login with the new password | `200`, success |

---

## Profile

| # | Case | Request | Expected |
|---|------|---------|----------|
| 35 | Get profile **[Verified]** | `GET /users/me` | `200`, user object (no `passwordHash`) |
| 36 | Update profile **[Verified]** | `PATCH /users/me` with `firstName` | `200`, updated user |
| 37 | Validation failures **[By design]** | `PATCH /users/me` with empty body or empty string field | `400`, `"At least one field must be provided"` or per-field message |

---

## Organization

| # | Case | Request | Expected |
|---|------|---------|----------|
| 38 | Get organization **[Verified]** | `GET /organizations/me` | `200`, organization object |
| 39 | Update organization **[Verified]** | `PATCH /organizations/me` (as `OWNER`) with `name` | `200`, updated organization |
| 40 | Duplicate email **[By design]** | Update to an email already used by another organization | `409 Conflict` — mirrors the registration duplicate-check pattern (`organization.service.js`) |
| 41 | Duplicate phone **[By design]** | Same as #40 for phone | `409 Conflict` |
| — | Non-OWNER blocked from update **[By design]** | `PATCH /organizations/me` as `MANAGER`/`STAFF` role | `403 Forbidden` via `authorize(ROLES.OWNER)` middleware (no endpoint currently creates non-OWNER users in Module 1; verified by code inspection of `authorize.middleware.js`, which is a single `.includes()` check) |

---

## Security

| # | Case | Request | Expected |
|---|------|---------|----------|
| 42 | JWT tampering **[Verified]** | Append/alter characters in a valid access token | `401`, `"Invalid access token"` |
| 43 | Invalid Authorization header **[Verified]** | Header without `Bearer ` prefix, or garbage token | `401` |
| 44 | Missing Authorization header **[Verified]** | No `Authorization` header on a protected route | `401`, `"Missing Authorization header"` |
| 45 | Expired access token **[By design]** | Wait past `JWT_ACCESS_TTL_SECONDS` (default 900s) | `401`, `"Access token has expired"` (jsonwebtoken's `TokenExpiredError` branch) |
| 46 | Rate limit **[Verified]** | 11 rapid `POST /auth/login` requests from the same IP (limit: 10 / 15 min) | First several return `401` (bad creds), then `429 Too Many Requests` once the limit is exceeded — confirmed live (`401 401 401 401 401 429 429 429 429 429 429`) |
| 47 | Replay refresh token | Same as the Refresh Token section's replay case | Rejected — see above |

---

## Database

| # | Case | Expected |
|---|------|----------|
| 48 | Mongo transaction rollback **[Verified]** | See Registration #7 |
| 49 | Duplicate indexes **[Verified]** | `email`/`phone`/`slug` unique indexes on `Organization`, `email`/`phone` on `User` reject duplicates at the DB layer even if application-level checks were bypassed (defense in depth) |
| 50 | Session cleanup **[By design]** | `Session.expiresAt` has a Mongo TTL index (`expireAfterSeconds: 0`); MongoDB's background TTL monitor removes expired session documents automatically, independent of application logic |

---

## Redis

| # | Case | Expected |
|---|------|----------|
| 51 | OTP expiration **[By design]** | `SET ... EX <OTP_TTL_SECONDS>` — Redis evicts the key automatically; verified the same mechanism via the "OTP already used" test (explicit `DEL`, same effect as TTL eviction) |
| 52 | Reset token expiration **[By design]** | Same mechanism as #51 via `RESET_PASSWORD_TTL_SECONDS` |

---

## Performance

| # | Case | Notes |
|---|------|-------|
| 53 | 100 concurrent registrations | Not exercised in this pass — would require a load-testing tool (e.g. `autocannon`/`k6`), which was intentionally not added as a dependency for this module. Each registration is a single Mongo transaction plus one Redis `SET`; the transaction serializes at the document level via unique indexes, so concurrent duplicate emails/phones will correctly conflict rather than corrupt state. |
| 54 | 100 concurrent logins | Same note — not load-tested here. bcrypt comparison is CPU-bound (deliberately, ~10 salt rounds); a real load test should confirm acceptable p95 latency under concurrency before production traffic. |

---

## Notes on environment used for verification

- Stack: `docker compose up --build` (backend + `mongo:7` single-node replica set `rs0` + `redis:alpine`).
- MongoDB **must** run as a replica set for `session.withTransaction()` to work — this is already configured in `docker-compose.yml`. A standalone `mongod` will throw `Transaction numbers are only allowed on a replica set member or mongos` on registration.
- OTP and password-reset tokens are logged to the backend console as `[DEV OTP]` / `[DEV RESET TOKEN]` only when `NODE_ENV !== 'production'` — there is no notification/SMS/email module yet (out of scope for Module 1), so this is the only way to retrieve them for manual testing.
