# Module 2 (Business Profile) — Manual Test Cases

Base URL: `http://localhost:5000/api/v1/business-profile`

All non-upload requests use `Content-Type: application/json`. Every endpoint requires `Authorization: Bearer <accessToken>` (from Module 1 login/verify-registration). `organization_id` is **always** derived from the authenticated JWT — no request body or query param can override it.

Cases marked **[Verified]** were executed live against a running `docker compose up` stack during development, using two separately registered organizations to prove cross-org isolation. Cases marked **[By design]** follow structurally from how the API is built (e.g. there is no `organizationId` parameter anywhere for a client to tamper with) rather than being independently fired over HTTP.

---

## Create Profile

| # | Case | Expected | Status |
|---|------|----------|--------|
| 1 | Successful profile creation | `201`, full profile returned, `organization_id` taken from JWT | **[Verified]** |
| 2 | Duplicate Business Profile | `409`, `"Business profile already exists for this organization"` | **[Verified]** |
| 3 | Organization not found | `404` — would require a JWT for a deleted organization; not independently forced, but the `organizationRepository.findById` check is the same code path proven in Module 1 | **[By design]** |
| 4 | Organization inactive | `403`, `"Organization is not active"` | **[Verified]** (flipped an organization's status to `SUSPENDED` directly in MongoDB, confirmed `403` on create/get/update/logo/cover, then restored it to `ACTIVE`) |
| 5 | Missing required fields | `400`, one `errors[]` entry per missing field (`business_type`, `address_line_1`, `city`, `state`, `country`, `postal_code`, `working_days`, `open_time`, `close_time`) | **[Verified]** |
| 6 | Invalid business type | `400`, `"A valid business_type is required"` | **[Verified]** |
| 7 | Invalid postal code | `400`, `"A valid postal_code is required"` | **[Verified]** |
| 8 | Invalid latitude | `400`, `"latitude must be a number between -90 and 90"` (tested with `999`) | **[Verified]** |
| 9 | Invalid longitude | Same rule, range -180 to 180 | **[By design]** (identical branch to #8) |
| 10 | Invalid working days | `400` — rejects any day not in the `MONDAY`–`SUNDAY` enum (tested with `"FUNDAY"`) | **[Verified]** |
| 11 | Empty working days | `400`, `"working_days must be a non-empty array of valid days"` (tested with `[]`) | **[Verified]** |
| 12 | Invalid open_time | `400`, `"open_time must be in HH:mm format"` (tested with `"9am"`) | **[Verified]** |
| 13 | close_time earlier than open_time | `400`, `"close_time must be after open_time"` (tested with `open_time:"18:00", close_time:"09:00"` on a fresh organization with no existing profile) | **[Verified]** |

---

## Get Profile

| # | Case | Expected | Status |
|---|------|----------|--------|
| 14 | Existing profile | `200`, full profile | **[Verified]** |
| 15 | Profile not found | `404`, `"Business profile not found"` (tested both before creation, and from a second organization with no profile of its own) | **[Verified]** |
| 16 | Unauthorized request (no token) | `401`, `"Missing Authorization header"` | **[Verified]** |
| 17 | Invalid JWT | `401`, `"Invalid access token"` (tampered token) | **[Verified]** |

---

## Update Profile

| # | Case | Expected | Status |
|---|------|----------|--------|
| 18 | Successful update | `200`, updated profile | **[Verified]** |
| 19 | Partial update | Only provided fields change; unset fields keep their existing value (tested updating only `business_name`) | **[Verified]** |
| 20 | Invalid values | `400` (tested `business_type: "INVALID_TYPE"`) | **[Verified]** |
| 21 | Update without profile | `404`, `"Business profile not found"` | **[Verified]** |
| 22 | Unauthorized update | `401` — same `authenticate` middleware as Get Profile | **[By design]** |
| 23 | Update another organization's profile | Structurally impossible: `organization_id` always comes from the caller's own JWT, and the repository query is always scoped to it — there is no profile-ID URL parameter to substitute another org's ID into | **[By design]** |
| — | Update blocked when organization suspended | `403`, `"Organization is not active"` | **[Verified]** (see Create #4) |
| — | Partial update cross-field time check | Updating only `close_time` to a value earlier than the **existing** `open_time` is correctly rejected (proves the service re-fetches current state before validating, not just the diff) | **[Verified]** |

---

## Logo Upload

| # | Case | Expected | Status |
|---|------|----------|--------|
| 24 | Upload logo | `200`, `logo_url` returned; file confirmed retrievable via `GET /uploads/logos/<file>` (`200`, `image/png`) | **[Verified]** |
| 25 | Invalid file type | `400`, `"Only JPEG, PNG, and WEBP images are allowed"` (tested with a `.txt` file) | **[Verified]** |
| 26 | Empty file | `400`, `"Uploaded file is empty"` (tested with a genuine 0-byte file) | **[Verified]** — also caught and fixed a real bug here: the 0-byte file multer had already written to disk was left as an orphan on rejection; fixed by deleting it before responding, then re-verified no orphan remains |
| 27 | Oversized file | `400`, `"File too large"` (tested with a 6 MB file against the 5 MB limit); confirmed no partial file is left in `uploads/logos/` afterward | **[Verified]** |
| 28 | Replace existing logo | New `logo_url` returned; old logo file confirmed deleted from disk (listed `uploads/logos/` before/after) | **[Verified]** |
| — | Spoofed Content-Type with non-image content (security hardening) | `400`, `"File content does not match a valid JPEG, PNG, or WEBP image"` | **[Verified]** — a real vulnerability was found and fixed here: `fileFilter` originally only checked the client-supplied `Content-Type` header (trivially spoofable), and the saved filename's extension came from the client's original filename, not the validated type. A file literally named `evil.html` with a spoofed `image/png` Content-Type was saved as `<id>-<timestamp>.html` and would have been served back by `express.static` as `text/html` — a stored-content/XSS vector. Fixed in two layers: (1) the saved extension is now derived from the server-validated MIME type, never the client's filename, so a malicious upload can never be saved with an executable/HTML extension; (2) the actual file content is now sniffed for real PNG/JPEG/WEBP magic bytes after upload, rejecting (and deleting) anything that doesn't match regardless of claimed Content-Type. Re-verified with the exact `evil.html` + spoofed-`image/png` attack — now rejected, no orphan file left, and legitimate PNG uploads still succeed. |

---

## Cover Upload

| # | Case | Expected | Status |
|---|------|----------|--------|
| 29 | Upload cover | `200`, `cover_image_url` returned; confirmed retrievable via static URL | **[Verified]** |
| 30 | Invalid file | Same fileFilter/size rules as logo (shared `handleUpload` + `validateUploadedFile`) | **[By design]** (identical code path to #25–27) |
| 31 | Replace cover image | Old file cleanup, same mechanism as #28 | **[By design]** (identical code path to #28, both call the same `deleteFileByUrl` helper) |

---

## Authorization

| # | Case | Expected | Status |
|---|------|----------|--------|
| 32 | Missing token | `401` | **[Verified]** |
| 33 | Invalid token | `401` | **[Verified]** |
| 34 | Expired token | `401`, `"Access token has expired"` — same `authenticate` middleware branch proven in Module 1 | **[By design]** |
| 35 | Organization mismatch | Not reachable — see Update Profile #23 | **[By design]** |

---

## Database

| # | Case | Expected | Status |
|---|------|----------|--------|
| 36 | Only one profile per organization | Enforced at the application layer (pre-check) **and** the database layer (unique index) | **[Verified]** |
| 37 | Index validation | `db.businessprofiles.getIndexes()` confirmed a `unique:true` index on `organization_id` | **[Verified]** (queried directly via `mongosh`) |
| 38 | Duplicate prevention | Even if the pre-check race loses, `businessProfileRepository.create()`'s `E11000` error is caught and re-thrown as a `409 Conflict`, not a raw `500` | **[Verified]** — fired 10 truly concurrent `POST /business-profile` requests (via `Promise.all`, not sequential) for the same brand-new organization: exactly 1 returned `201`, the other 9 returned `409`, and a direct MongoDB count afterward confirmed exactly 1 document exists for that organization. Repeated with a 2-request race first, then escalated to 10 concurrent to maximize the chance of hitting the true database-level race rather than just the app-level pre-check. |

---

## Performance

| # | Case | Notes |
|---|------|-------|
| 39 | 100 concurrent GET requests | **[Verified]** — fired 100 truly concurrent `GET /business-profile` requests via `Promise.all`. All 100 returned `200` with identical, correct data; total wall time ~1.5s; server remained healthy (`docker compose ps` still reported `healthy`) afterward. Not benchmarked with a dedicated load-testing tool (still no such dependency added), but this is a real concurrent-request test, not just reasoning about index behavior. |
| 40 | Concurrent profile creation race condition | **[Verified]** — see Database #38. |

---

## Security

| # | Case | Expected | Status |
|---|------|----------|--------|
| 41 | Injection attempts | A NoSQL-operator payload (e.g. `{"business_name": {"$gt": ""}}`) is rejected by validation, since every validator does a strict `typeof value === 'string'` check before any further processing — an object payload fails that check and never reaches Mongoose | **[Verified]** (tested with `{"$gt":""}` and `{"$ne":null}`) |
| 42 | XSS payloads | A `<script>` payload in `description` is accepted and stored as an inert string — this is a JSON API, not server-rendered HTML, so escaping on output is the frontend's responsibility, not the API's. Verified the payload round-trips as plain text with no server-side execution. | **[Verified]** |
| 43 | Invalid multipart requests | Wrong field name (`notlogo` instead of `logo`) → multer's `"Unexpected field"` error, converted to `400` by `handleUpload`, not a raw crash | **[Verified]** |

---

## Notes on file storage (a deliberate scope decision)

Logos and cover images are stored on **local disk** (`uploads/logos/`, `uploads/covers/`, served via `express.static`), not a cloud object store — no S3/Cloudinary/GCS dependency was added, consistent with the "no unnecessary dependencies" constraint from the original tech stack. In `docker-compose.yml`, `/app/uploads` is a named Docker volume (`uploads_data`) so uploaded files survive container recreation. For a real multi-instance production deployment, this should be swapped for a shared object store — local disk storage does not survive across multiple backend replicas.

## Environment used for verification

Same stack as Module 1 (`docker compose up --build`: backend + `mongo:7` single-node replica set + `redis:alpine`). Two organizations were registered and OTP-verified through Module 1's real endpoints to prove cross-organization isolation (organization B correctly gets `404` for organization A's profile, not a leaked result or a permissions error).
