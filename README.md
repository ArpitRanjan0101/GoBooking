# GoBooking

BookEasy is a SaaS booking system that integrates WhatsApp, UPI payments, automated reminders, and an owner dashboard to help salons, clinics, and local businesses reduce no-shows, manage appointments efficiently, and improve revenue through prepaid bookings.

This repository currently contains only the **backend infrastructure foundation** — no business modules, authentication, or APIs have been implemented yet.

## Tech Stack

- Node.js (LTS)
- Express.js
- MongoDB
- Redis
- Docker

## Project Structure

```
GoBooking/
├── src/
│   ├── config/         # Environment, server, MongoDB, Redis configuration
│   ├── routes/         # Route definitions
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic (empty, for future modules)
│   ├── middleware/     # Express middleware (404, error handler)
│   ├── utils/          # Utility functions (empty, for future modules)
│   ├── constants/       # Shared constants (empty, for future modules)
│   ├── helpers/         # Helper functions (empty, for future modules)
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── docker/               # Reserved for docker-related assets
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Running with Docker

1. Copy the example environment file:
   ```
   cp .env.example .env
   ```
2. Start the stack:
   ```
   docker compose up --build
   ```

This starts three services:

| Service | Port |
|---------|------|
| backend | 5000 |
| mongodb | 27017 |
| redis   | 6379 |

Source code is mounted as a volume with hot reload enabled via `nodemon`.

### Verifying

```
curl http://localhost:5000/
curl http://localhost:5000/health
```

Expected responses:

```json
{ "success": true, "message": "BookEasy Backend Running" }
```

```json
{ "status": "ok" }
```

### Running without Docker

```
npm install
cp .env.example .env
npm run dev
```

## Status

Only the backend foundation is implemented. MongoDB and Redis connection helpers are prepared in `src/config/` but are not invoked yet — no database or cache connections are established at startup. Future modules (auth, organizations, services, staff, customers, booking engine, availability engine, notifications, payments, dashboard, SaaS billing) will build on top of this foundation.
