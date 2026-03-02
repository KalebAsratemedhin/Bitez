# Clean Architecture (Backend)

This backend follows **Uncle Bob's Clean Architecture**. Dependency rule: outer layers depend on inner layers; inner layers define interfaces that outer layers implement.

## Structure

```
src/
├── domain/                    # Entities (innermost) + interfaces
│   ├── entities/
│   │   ├── Order.ts
│   │   └── User.ts
│   └── interfaces/            # Contracts (repositories + services)
│       ├── index.ts           # Barrel
│       ├── repositories.ts    # IOrderRepository, IUserRepository, etc.
│       └── services.ts        # IPaymentGateway, INotificationService, ITokenService
│
├── application/               # Use cases (application business rules)
│   ├── dto/                   # Data transfer objects (inputs/outputs)
│   │   ├── auth.dto.ts
│   │   ├── order.dto.ts
│   │   └── delivery.dto.ts
│   └── usecases/
│       ├── AuthUseCase.ts     # Auth: signup, signin, logout, getCurrentUser
│       ├── OrderUseCase.ts    # Orders: create, updateStatus, cancel, get*, payment
│       └── DeliveryUseCase.ts # Delivery: updateStatus, get*
│
├── infrastructure/            # Interface adapters + frameworks & drivers
│   ├── config/                # DB connection, Swagger (infrastructure setup)
│   │   ├── db.js
│   │   └── swagger.js
│   ├── persistence/
│   │   └── models/            # Mongoose schemas (ODM layer)
│   │       ├── user.js
│   │       ├── order.js
│   │       └── ...
│   ├── controllers/           # HTTP adapters (classes; one per bounded context)
│   │   ├── AuthController.ts
│   │   ├── OrderController.ts
│   │   └── DeliveryController.ts
│   ├── repositories/          # Gateways (implement domain interfaces)
│   │   ├── OrderRepository.ts
│   │   ├── UserRepository.ts
│   │   └── ...
│   ├── services/              # External service implementations
│   │   ├── TokenService.ts
│   │   ├── ChapaPaymentGateway.ts
│   │   └── SocketNotificationService.ts
│   └── web/                   # Express app, routes, server wiring
│       ├── ExpressServer.ts   # Composition root
│       ├── middlewares/      # HTTP pipeline (e.g. auth)
│       │   └── auth.js
│       ├── orderRoutes.ts
│       ├── authRoutes.ts
│       └── deliveryRoutes.ts
│
└── server.ts                  # Entry point
```

## Layers

- **Domain**: Entities and repository/service interfaces. No dependencies on frameworks or outer layers.
- **Application (use cases)**: Orchestrate flow; depend only on domain entities and interfaces.
- **Infrastructure**: Controllers (HTTP), repositories (Mongoose), services (JWT, Chapa, Socket.io), and web (Express routes). Implements domain interfaces.

## References

- *Clean Architecture: A Craftsman's Guide to Software Structure and Design* — Robert C. Martin
- *The Clean Architecture* — Robert C. Martin (blog)
