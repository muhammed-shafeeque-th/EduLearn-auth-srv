# Auth Service

The **Auth Service** is responsible for authentication, authorization, user registration, password management, and token management in the EduLearn platform. It is built with **TypeScript**, **NestJS**, and uses **gRPC** for inter-service communication, **Kafka** for event publishing, **Redis** for caching, and **PostgreSQL** with **TypeORM** for persistence.

## 📚 Documentation

This service documentation is organized into several focused documents:

- **[Overview](./docs/overview.md)** - Service purpose, scope, responsibilities, and key features
- **[Architecture](./docs/architecture.md)** - Internal design, layers, patterns, and technical decisions
- **[API Reference](./docs/api.md)** - Complete gRPC service definitions and endpoint documentation
- **[Database](./docs/database.md)** - Entity models, relationships, and data ownership
- **[Events](./docs/events.md)** - Kafka events published and consumed by this service
- **[Flows](./docs/flows.md)** - Authentication and authorization flows
- **[Errors](./docs/errors.md)** - Exception types, error codes, and failure scenarios

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.x or later)
- **npm** or **yarn**
- **PostgreSQL** (v15.x or later)
- **Redis** (v7.x or later)
- **Kafka** (v3.x or later)

### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Copy environment file
cp env.example .env

# Update .env with your configuration
```

### Running the Service

```bash
# Development mode
npm run dev
# or
yarn dev

# Production mode
npm run build
npm run start:prod
```

## 📋 Key Features

- **User Registration**: Email-based registration with verification
- **Authentication**: JWT-based authentication (access and refresh tokens)
- **OAuth2 Integration**: Google OAuth2 support
- **Password Management**: Forgot password, reset password, change password
- **OTP Management**: OTP generation and verification
- **Token Management**: JWT token issuance, refresh, and revocation
- **User Blocking**: Block/unblock user accounts
- **Admin Authentication**: Separate admin login flow
- **Instructor Registration**: Special registration flow for instructors
- **Event Publishing**: Publishes user lifecycle events to Kafka

## 🔌 Communication

- **gRPC Port**: `50051` (configurable)
- **Health Check**: HTTP health endpoints

## 📄 License

MIT License
