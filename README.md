# Bitez — Dining & Delivery Ecosystem

Bitez is a dining and delivery platform that connects restaurants, customers, and delivery personnel in one place. Customers discover and order from local restaurants, track orders and deliveries in real time, and rate their experience. Restaurant owners manage menus and order flow from preparation to handoff. Delivery personnel receive assignments, update status, and get rated by customers. Admins oversee users and restaurants and use dashboards for insights. The system is built as a microservices backend behind an API gateway, with a Next.js front end for the full flow from browsing to delivery.


## Tech Stack

| Layer      | Tech |
|-----------|------|
| Client    | Next.js, React, TypeScript, Tailwind, Radix UI, Redux Toolkit Query |
| Gateway   | Express, http-proxy-middleware, morgan |
| Services  | Express, TypeScript, MongoDB, JWT |
| Messaging | RabbitMQ (topic exchange `bitez`) |
| Infra     | Docker Compose |

---

## Project Structure

```
Bitez/
├── client/                 # Next.js app (port 3000)
└── server/
    ├── gateway/            # API gateway (port 8080)
    ├── services/
    │   ├── auth/           # Auth, users, profile (3001)
    │   ├── restaurant/     # Restaurants, menus, ratings (3002)
    │   ├── order/          # Orders, payment (3003)
    │   ├── delivery/       # Deliveries, delivery persons (3004)
    │   ├── notification/   # User notifications (3005)
    │   └── dashboard/      # Read-model dashboards (3006)
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

## Run locally

1. **Backend (from project root)**  
   `docker compose -f server/docker-compose.yml up --build`  
   Starts: Mongo, RabbitMQ, gateway, auth, restaurant, order, delivery, notification, dashboard.

2. **Client**  
   `cd client && npm install && npm run dev`  
   App at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL=http://localhost:8080` so the client talks to the gateway.

3. **Optional env**  
   Create `.env` (or set in the environment) for `JWT_SECRET`, `CLOUDINARY_*`, `CHAPA_AUTH`, etc. See `server/docker-compose.yml` and service code for names.

---

## Roles

- **Customer** — Browse restaurants/menus, cart, checkout, track orders and deliveries, rate.
- **Restaurant owner** — Register restaurant, manage menus, view and update order status (e.g. preparing → ready).
- **Delivery person** — View assigned deliveries, update delivery status; auto-created when a user registers as delivery.
- **Admin** — User/restaurant management, dashboards.
