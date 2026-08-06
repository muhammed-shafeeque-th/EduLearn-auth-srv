# Auth Service

The **Auth Service** is the identity and authentication service of the Edulearn platform. It is responsible for user authentication, authorization, JWT token management, OAuth integration, OTP verification, password recovery, account security, and authentication-related event publishing.

The service is built with **TypeScript**, **Node.js**, **Clean Architecture**, and **InversifyJS**, and depends on **@edulearn/core** for shared infrastructure including logging, metrics, distributed tracing, Redis, Kafka, health checks, and observability utilities.

---

## Overview

The Auth Service is the authoritative owner of authentication and identity data within the platform. It manages credentials, tokens, OTPs, and account security while coordinating with other services through **gRPC** and **Kafka**.

### Responsibilities

* User registration
* Email verification
* OTP generation and verification
* Email/password authentication
* Google OAuth authentication
* JWT access and refresh token management
* Password reset and recovery
* Account blocking and lockout
* Authentication event publishing
* User identity synchronization

### Out of Scope

* User profile management (User Service)
* Course management (Course Service)
* Payment processing (Payment Service)
* Order lifecycle management (Order Service)

---

# Architecture

This service follows **Clean Architecture (Hexagonal Architecture)** with **SOLID principles**, enabling framework-independent business logic, high testability, and clear separation of concerns.

## Layered Architecture

```text
            gRPC / HTTP Controllers
                     │
             Application Layer
       (Use Cases / DTOs / Services)
                     │
                Domain Layer
   (Entities / Repository Interfaces / Events)
                     │
           Infrastructure Layer
(PostgreSQL / Redis / Kafka / OAuth / JWT / Observability)
```

### Layers

#### Presentation Layer

* gRPC controllers
* HTTP controllers
* Request validation
* Response mapping

#### Application Layer

* Authentication use cases
* Token orchestration
* OTP workflows
* Event publishing
* OAuth provider coordination

#### Domain Layer

* User entity
* Refresh token entity
* Reset token entity
* OTP entity
* Repository interfaces
* Domain events

#### Infrastructure Layer

* PostgreSQL persistence
* Redis token storage
* Kafka integration
* Google OAuth implementation
* JWT infrastructure
* Logging, metrics, and tracing

---

# Technology Stack

| Category             | Technology                                          |
| -------------------- | --------------------------------------------------- |
| Language             | TypeScript 5.x                                      |
| Runtime              | Node.js                                             |
| Framework            | Custom Clean Architecture                           |
| Dependency Injection | InversifyJS                                         |
| Transport            | gRPC                                                |
| Database             | PostgreSQL                                          |
| ORM                  | TypeORM                                             |
| Cache                | Redis                                               |
| Messaging            | Kafka                                               |
| Authentication       | JWT                                                 |
| OAuth                | Google OAuth 2.0                                    |
| Password Security    | bcrypt                                              |
| Observability        | @edulearn/core (Winston, Prometheus, OpenTelemetry) |

---

# Core Domain

The Auth Service owns the authentication domain.

## User

* Authentication identity
* Credentials
* Account status
* Provider metadata
* Security information

## Refresh Token

* Long-lived authentication sessions
* Token rotation
* Revocation
* Expiration management

## Reset Token

* Password recovery workflow
* Secure token generation
* Expiration handling

## OTP

* Email verification
* Password reset verification
* Time-based expiration
* Rate limiting

---

# Authentication Flow

## Email Registration

```text
Client
   │
   ▼
Auth Service
   │
   ▼
Generate OTP
   │
   ▼
Publish notification event
   │
   ▼
Notification Service
   │
   ▼
Email Delivery
```

## Login

```text
Client
   │
   ▼
Validate Credentials
   │
   ▼
Generate JWT Tokens
   │
   ▼
Store Refresh Token
   │
   ▼
Return Access + Refresh Tokens
```

## Token Refresh

```text
Refresh Token
      │
      ▼
Validate Token
      │
      ▼
Rotate Refresh Token
      │
      ▼
Issue New Access Token
```

---

# OAuth Strategy Pattern

The service supports multiple authentication providers using the **Strategy Pattern**.

```text
                 AuthProvider
                      │
      ┌───────────────┴───────────────┐
      │                               │
GoogleAuthProvider            Future Providers
                                   │
                            GitHub / Apple / etc.
```

This design allows additional authentication providers to be added without modifying existing authentication workflows.

---

# Project Structure

```text
src/
├── application/
│   ├── dtos/
│   ├── services/
│   ├── use-cases/
│   └── adaptors/
├── domain/
│   ├── entities/
│   ├── repositories/
│   ├── events/
│   └── exceptions/
├── infrastructure/
│   ├── database/
│   ├── grpc/
│   ├── kafka/
│   ├── redis/
│   ├── oauth/
│   ├── jwt/
│   └── observability/
├── presentation/
│   ├── grpc/
│   └── http/
└── shared/
```

---

# Communication

## gRPC APIs

The Auth Service exposes internal gRPC APIs consumed by:

* API Gateway
* User Service
* Payment Service
* Order Service
* Notification Service

Example operations:

* RegisterUser
* Login
* RefreshToken
* Logout
* ValidateToken
* VerifyOTP
* ForgotPassword
* ResetPassword
* BlockUser
* UnblockUser

---

## Kafka Integration

Authentication workflows are coordinated through Kafka domain events.

### Published Events

| Topic                                        | Purpose                |
| -------------------------------------------- | ---------------------- |
| auth.user.created.v1                         | New user created       |
| auth.user.registered.v1                      | Registration completed |
| auth.user.login.v1                           | Successful login       |
| auth.otp.requested.v1                        | OTP generated          |
| auth.otp.verified.v1                         | OTP verified           |
| auth.account.locked.v1                       | Account locked         |
| auth.account.unlocked.v1                     | Account unlocked       |
| notification.request.auth.otp.v1             | Email OTP request      |
| notification.request.auth.forgot-password.v1 | Password reset email   |

### Consumed Events

| Topic                         | Purpose                   |
| ----------------------------- | ------------------------- |
| user.updated.v1               | Synchronize user identity |
| user.instructor.registered.v1 | Instructor registration   |
| user.blocked.v1               | Block account             |
| user.unblocked.v1             | Unblock account           |

This event-driven approach keeps authentication decoupled from profile management and notification delivery.

---

# Data Ownership

The Auth Service is the single source of truth for authentication-related data.

| Entity         | Owner        |
| -------------- | ------------ |
| users          | Auth Service |
| refresh_tokens | Auth Service |
| reset_tokens   | Auth Service |
| otp_records    | Auth Service |

Other services interact with this data through gRPC APIs or Kafka events rather than direct database access.

---

# JWT & Security Model

## Token Types

### Access Token

* Short-lived
* Used for API authentication
* Contains user identity and roles

### Refresh Token

* Long-lived
* Stored securely
* Rotated on refresh
* Revoked on logout

## Account Security

* bcrypt password hashing
* Configurable salt rounds
* Account lockout after repeated failures
* OTP expiration
* Token revocation
* Refresh token rotation
* Provider-aware authentication

---

# Dependency on @edulearn/core

The Auth Service relies on **@edulearn/core** for shared platform infrastructure.

## Logging

* Winston structured logging
* JSON log output
* Correlation IDs
* Trace-aware logging

## Metrics

Prometheus metrics include:

* Login requests
* Registration requests
* OTP requests
* Token refreshes
* Authentication failures
* OAuth provider usage
* gRPC latency
* Kafka publish metrics

Exposed at:

```text
/metrics
```

## Distributed Tracing

OpenTelemetry instrumentation provides end-to-end authentication tracing.

Trace flow:

```text
API Gateway
      │
      ▼
Auth Service
      │
      ▼
PostgreSQL / Redis / Kafka / OAuth
```

Traces are exported to **OTEL Collector → Tempo → Grafana**.

## Shared Infrastructure

Provided by **@edulearn/core**:

* Logger
* Metrics registry
* Tracer
* Redis client
* Kafka producer/consumer
* Health checks
* Configuration utilities
* Common error handling

---

# Redis Usage

Redis is used for:

* Refresh token storage
* Token blacklist
* OTP storage
* OTP expiration
* Rate limiting
* Authentication cache
* Temporary verification state

---

# Database

PostgreSQL is the primary persistent datastore.

TypeORM manages:

* Entity mapping
* Migrations
* Repository implementations
* Transaction management

Typical migration command:

```bash
yarn migration:run
```

---

# Local Development

## Prerequisites

* Node.js 22+
* Yarn
* PostgreSQL
* Redis
* Kafka

## Install

```bash
yarn install
```

## Start Development

```bash
yarn dev
```

## Build

```bash
yarn build
```

## Start Production

```bash
yarn start
```

---

# Environment Variables

| Variable                    | Description                  |
| --------------------------- | ---------------------------- |
| PORT                        | gRPC server port             |
| DATABASE_URL                | PostgreSQL connection string |
| REDIS_URL                   | Redis connection string      |
| KAFKA_BROKERS               | Kafka broker list            |
| JWT_ACCESS_SECRET           | Access token secret          |
| JWT_REFRESH_SECRET          | Refresh token secret         |
| JWT_ACCESS_EXPIRES_IN       | Access token TTL             |
| JWT_REFRESH_EXPIRES_IN      | Refresh token TTL            |
| GOOGLE_CLIENT_ID            | Google OAuth client ID       |
| GOOGLE_CLIENT_SECRET        | Google OAuth client secret   |
| OTEL_EXPORTER_OTLP_ENDPOINT | OTLP collector endpoint      |
| LOG_LEVEL                   | Logging level                |

See `env.example` for the complete configuration.

---

# Docker

The service uses a **multi-stage Docker build** optimized for production.

Optimizations include:

* Multi-stage compilation
* Dependency pruning
* Layer caching
* Minimal runtime image
* Non-root execution
* Reduced attack surface

---

# Kubernetes Deployment

Deployment is managed through the **Edulearn umbrella Helm chart**.

The service is deployed with:

* ClusterIP service
* gRPC exposure
* Liveness probes
* Readiness probes
* Resource requests and limits
* Horizontal Pod Autoscaler support
* Prometheus ServiceMonitor

---

# CI/CD

This service participates in the platform GitOps deployment pipeline.

```text
Git Push
    │
    ▼
GitHub Actions
    ├── Test
    ├── Build
    ├── Lint
    ├── Trivy Scan
    └── Push to GHCR
             │
             ▼
ArgoCD Image Updater
             │
             ▼
ArgoCD
             │
             ▼
Amazon EKS
```

---

# Performance Optimizations

Implemented optimizations include:

* JWT stateless authentication
* Refresh token caching
* Redis-based OTP storage
* Efficient token validation
* Connection pooling
* Asynchronous Kafka publishing
* Lightweight DTO mapping
* Optimized Docker image size

---

# Testing

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# End-to-end tests
yarn test:e2e

# Coverage
yarn test:cov
```

---

# Related Repositories

| Repository                    | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| [edulearn-platform](https://github.com/muhammed-shafeeque-th/edulearn-platform)             | Platform orchestration repository                             |
| [edulearn-api-gateway](https://github.com/muhammed-shafeeque-th/edulearn-api-gateawy)          | API Gateway                                                   |
| [edulearn-user-service](https://github.com/muhammed-shafeeque-th/edulearn-user-srv)         | User profile service                                          |
| [edulearn-course-service](https://github.com/muhammed-shafeeque-th/edulearn-course-srv)       | Course management service                                     |
| [edulearn-payment-service](https://github.com/muhammed-shafeeque-th/edulearn-payment-srv)      | Payment processing service                                    |
| [edulearn-order-service](https://github.com/muhammed-shafeeque-th/edulearn-order-srv)        | Order management service                                      |
| [edulearn-notification-service](https://github.com/muhammed-shafeeque-th/edulearn-notification-srv) | Notification service                                          |
| [edulearn-chat-service](https://github.com/muhammed-shafeeque-th/edulearn-chat-srv)         | Chat service                                                  |
| [@edulearn/core](https://github.com/muhammed-shafeeque-th/edulearn-core)                | Shared logging, metrics, tracing, Redis, Kafka, health checks |
| [@edulearn/nest](https://github.com/muhammed-shafeeque-th/edulearn-nest)                | Shared NestJS infrastructure package                          |

---

# License

This project is part of the **Edulearn Platform** and is licensed under the MIT [License](./LICENSE).
