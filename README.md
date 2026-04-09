# Bitez — Dining & Delivery Ecosystem

Bitez is a dining and delivery platform that connects restaurants, customers, and delivery personnel in one place. Customers discover and order from local restaurants, track orders and deliveries in real time, and rate their experience. Restaurant owners manage menus and order flow from preparation to handoff. Delivery personnel receive assignments, update status, and get rated by customers. Admins oversee users and restaurants and use dashboards for insights. The system is built as a microservices backend behind an API gateway, with a Next.js front end for the full flow from browsing to delivery.


## Tech Stack

| Layer      | Tech |
|-----------|------|
| Client    | Next.js, React, TypeScript, Tailwind, Radix UI, Redux Toolkit Query |
| Gateway   | Express, http-proxy-middleware, morgan |
| Services  | Express, TypeScript, MongoDB, JWT, **Pino** (structured JSON logs) |
| Messaging | RabbitMQ (topic exchange `bitez`) |
| Infra     | Docker Compose |
| Observability (optional) | Grafana, Loki, Promtail, Prometheus — see `server/observability/` |

---

## Project Structure

```
Bitez/
├── client/                 # Next.js app (port 3000)
└── server/
    ├── gateway/            # API gateway (host port 8080 by default; see below)
    ├── services/
    │   ├── auth/           # Auth, users, profile (3001)
    │   ├── restaurant/     # Restaurants, menus, ratings (3002)
    │   ├── order/          # Orders, payment (3003)
    │   ├── delivery/       # Deliveries, delivery persons (3004)
    │   ├── notification/   # User notifications (3005)
    │   └── dashboard/      # Read-model dashboards (3006)
    ├── observability/      # Optional: Grafana/Loki/Prometheus stack (see README inside)
    └── docker-compose.yml
```

---

## Architecture (ASCII)

```
                    ┌─────────────┐
                    │   Client    │
                    │  (Next.js)  │
                    └──────┬──────┘
                           │
                           │ HTTP (/:8080)
                           ▼
                    ┌─────────────┐
                    │   Gateway   │
                    │  (Express)  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┬─────────────────┬─────────────────┐
         │                 │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼                 ▼
   ┌──────────┐     ┌────────────┐     ┌──────────┐     ┌──────────────┐  ┌───────────┐
   │  Auth    │     │ Restaurant │     │  Order   │     │  Delivery    │  │ Notification│
   │  :3001   │     │   :3002    │     │  :3003   │     │   :3004      │  │   :3005    │
   └────┬─────┘     └─────┬──────┘     └────┬─────┘     └──────┬───────┘  └─────┬─────┘
        │                 │                 │                   │                 │
        │                 │                 │                   │                 │
        ▼                 ▼                 ▼                   ▼                 ▼
   ┌──────────┐     ┌────────────┐     ┌──────────┐       ┌──────────────┐ ┌──────────────┐
   │ MongoDB  │     │  MongoDB   │     │ MongoDB  │       │   MongoDB    │ │   MongoDB    │
   │ bitez_   │     │ bitez_     │     │ bitez_   │       │ bitez_       │ │ bitez_       │
   │ auth     │     │ restaurant │     │ order    │       │ delivery     │ │ notification │
   └──────────┘     └────────────┘     └──────────┘       └──────────────┘ └──────────────┘
        │                 │                 │                   │                 │
        └─────────────────┴────────┬────────┴───────────────────┴─────────────────┘
                                   │
                           ┌───────┴───────┐
                           │   RabbitMQ    │
                           │  (bitez topic)│
                           └───────┬───────┘
                                   │
                    order.updated, notification.requested,
                    user.registered, delivery.*, etc.
                                   │
                           ┌───────┴───────┐
                    ┌──────┴──────┐  ┌─────┴─────┐
                    │  Dashboard  │  │Notification│
                    │   :3006     │  │ (consumer) │
                    │ (consumers) │  └───────────┘
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  MongoDB    │
                    │ bitez_      │
                    │ dashboard   │
                    └─────────────┘
```

- **Gateway** routes `/auth`, `/user`, `/restaurant`, `/order`, `/delivery`, `/notification`, `/dashboard` to the corresponding service.
- **Services** use MongoDB (each has its own DB) and RabbitMQ for events (order updates, notifications, dashboard read-models).

---

## Backend: logging and API errors

Each service uses **structured logging** (Pino) and a shared pattern for HTTP:

- **Request correlation**: Every request gets an `X-Request-Id` header (or one is generated). It is echoed on the response and included in access logs.
- **Errors**: Failures are logged in full on the server (stack and context). Responses use a **consistent JSON shape** so internal exception text is not exposed to clients:

```json
{
  "error": {
    "code": "INTERNAL",
    "message": "Internal server error",
    "requestId": "req_..."
  }
}
```

Expected validation or auth failures may use other `code` values and user-safe `message` text. Use the `requestId` from a failing response to find the matching log line.

Implementation lives under each service at `src/infrastructure/http/` (`requestContext`, `errors`, `errorHandler`).

---

## Observability (optional UI)

For browser-based **logs** (Grafana + Loki), **metrics** (Prometheus), and optional **RabbitMQ Management** / **Mongo Express**, see:

- **`server/observability/README.md`**

That stack is **separate** from `server/docker-compose.yml` and uses its own compose file. Default ports include Grafana on **3007** (so it does not clash with the client on 3000).

---

## Run locally

1. **Backend (from project root)**  
   `docker compose -f server/docker-compose.yml up --build`  
   Starts: Mongo, RabbitMQ, gateway, auth, restaurant, order, delivery, notification, dashboard.

2. **Client**  
   `cd client && npm install && npm run dev`  
   App at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL=http://localhost:8080` so the client talks to the gateway (or match whatever host port you use for the gateway; see below).

3. **Environment variables**  
   Create a `.env` next to `server/docker-compose.yml` (or export in your shell) for secrets and URLs. See [server/docker-compose.yml](server/docker-compose.yml) for the full list.

   - **`INTERNAL_SERVICE_TOKEN`** — Shared secret for server-to-server routes (`/internal/*` on auth and order, and selected delivery endpoints). Compose defaults to `bitez-internal-dev` for local use; **set a strong value in production** and keep it identical across `auth`, `order`, `delivery`, and `restaurant`.
   - **`CLOUDINARY_*`** — Required for restaurant/menu image uploads. Hardcoded defaults were removed from code; set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. In production the restaurant service exits on startup if any are missing.
   - **`JWT_SECRET`**, **`CHAPA_AUTH`**, **`SERVER_URL`**, **`CLIENT_URL`** — As before for auth, payments, and redirects.

### If port 8080 is already in use

The gateway binds host port **8080** by default (`GATEWAY_PORT` in `server/docker-compose.yml`). If another process or container already uses 8080, either stop it or run with a different port, for example:

```bash
GATEWAY_PORT=18080 docker compose -f server/docker-compose.yml up --build
```

Then point the client at `http://localhost:18080` (`NEXT_PUBLIC_API_URL`).

---

## Roles

- **Customer** — Browse restaurants/menus, cart, checkout, track orders and deliveries, rate.
- **Restaurant owner** — Register restaurant, manage menus, view and update order status (e.g. preparing → ready).
- **Delivery person** — View assigned deliveries, update delivery status; auto-created when a user registers as delivery.
- **Admin** — User/restaurant management, dashboards.
