# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project

GoBooking-backend (BookEasy) — a SaaS booking system backend for salons, clinics, and local businesses. WhatsApp integration, UPI payments, automated reminders, owner dashboard.

**Current state: infrastructure foundation only.** No business modules, no authentication, no APIs beyond the health check. Do not assume any of the future modules listed below exist yet — check `src/` before referencing them.

## Tech stack (fixed — do not add to it without being asked)

- Node.js (LTS), CommonJS (`require`/`module.exports`, not ESM)
- Express.js 5
- MongoDB via the official `mongodb` driver — **no Mongoose**
- Redis via the official `redis` package
- Docker / Docker Compose for local dev

## Structure

```
src/
├── config/       env.js, server.config.js, mongo.js, redis.js
├── routes/       route definitions (currently: health.routes.js)
├── controllers/  request handlers (currently: health.controller.js)
├── services/     business logic — empty, for future modules
├── middleware/   notFound.js, errorHandler.js
├── utils/        empty, for future modules
├── constants/    empty, for future modules
├── helpers/      empty, for future modules
├── app.js        Express app: json/urlencoded parsing, routes, 404, error handler
└── server.js     entry point, calls app.listen()
```

## Key conventions

- **MongoDB and Redis are not connected at startup.** `src/config/mongo.js` and `src/config/redis.js` export `connect*()`/`get*()` functions that are fully implemented but never called. When a future module needs a DB or cache, call `connectMongo()` / `connectRedis()` explicitly (e.g. in `server.js` before `app.listen`) — don't add an implicit connection inside a route or controller.
- **No comments unless explaining non-obvious "why".** This codebase currently has zero comments; keep it that way.
- **Controllers are plain functions**, not classes, exported as an object (see `health.controller.js`). Follow this pattern for new controllers.
- **Error handling**: throw/pass errors to `next(err)`; the global `errorHandler` in `app.js` handles the response shape (`{ success: false, message }`). Don't add per-route try/catch response formatting.
- **Response shape**: existing endpoints return `{ success, message }` (root) or `{ status }` (health). New endpoints should stay consistent with `{ success, ... }` for actual API responses.

## Commands

```
npm install       # install deps
npm run dev        # nodemon, local (no Docker)
npm start          # plain node, local

docker compose up --build   # full stack: backend (5000), mongodb (27017), redis (6379)
```

Copy `.env.example` to `.env` before running either way.

`docker-compose.yml` bind-mounts the repo into the `backend` container with an anonymous volume over `node_modules`, and `nodemon` runs with `--legacy-watch` — this is required for file-change detection to work through Docker Desktop bind mounts on Windows/Mac; don't remove `--legacy-watch` without confirming hot reload still works.

The `Dockerfile` runs the app as the non-root `node` user and defines a `HEALTHCHECK` against `/health`.

## Do not install

Do not add: mongoose, jsonwebtoken, bcrypt, socket.io, bullmq, nodemailer, multer, cloudinary, swagger, cors, helmet, compression, cookie-parser, zod, winston, or any auth/payment/queue/scheduling/testing library — unless the user explicitly asks for it in that conversation. This project was deliberately built dependency-minimal; don't "helpfully" round it out.

## Planned future modules (not yet started)

Authentication, Organizations, Services, Staff, Customers, Booking Engine, Availability Engine, Notifications, Payments, Dashboard, SaaS Billing. When one of these is requested, it belongs in `src/services/` (logic) + `src/controllers/` + `src/routes/`, following the existing health-check pattern.
