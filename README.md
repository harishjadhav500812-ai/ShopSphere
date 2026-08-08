# ShopSphere

Production-quality full-stack multi-vendor e-commerce platform.

ShopSphere enables multiple sellers to manage catalogs and inventory while customers browse products, manage carts and wishlists, and place orders through a secure, role-based experience.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1.0, Maven, Spring Data JPA, Spring Security, OAuth2 Resource Server (JWT), Bean Validation, REST APIs |
| Database | PostgreSQL |
| Frontend | React 19, TypeScript, Vite 8, native `fetch` |
| Architecture | Monorepo (`backend/`, `frontend/`, `docs/`) |

## Current Development Status

**Full-stack foundation phase** — backend and frontend skeletons are in place, with shared API error handling and persistence wiring on the backend.

- Spring Boot application: created (`backend/`) with a minimal `GET /api/health` endpoint
- Common infrastructure: Bean Validation + global `@ControllerAdvice` error responses
- Persistence foundation: Spring Data JPA + PostgreSQL driver, env-based datasource config
- User module: registration + user read APIs (`CUSTOMER` / `SELLER` / `ADMIN` roles)
- Authentication: JWT access-token login (`POST /api/auth/login`); registration remains public
- React application: created (`frontend/`) with a health-check page using native `fetch`
- Database schema / entities: `users` table SQL provided in `docs/sql/users.sql` (`ddl-auto=none`)
- Authorization: role authorities from JWT (`ROLE_CUSTOMER` / `ROLE_SELLER` / `ROLE_ADMIN`); no refresh tokens yet

## High-Level Architecture

```text
ShopSphere (monorepo)
├── frontend/     React SPA (customer + seller UIs)
├── backend/      Spring Boot REST API
├── docs/         Architecture and module notes
└── PostgreSQL    Persistent data store
```

- The React frontend communicates with the Spring Boot backend over REST.
- The backend owns business logic, security, validation, and persistence.
- PostgreSQL is the system of record for users, catalog, inventory, carts, and orders.
- Role-based access control separates customer and seller capabilities (planned).

## Planned Modules

### Backend
- User management (customer and seller roles)
- Authentication and JWT-based authorization
- Role-based access control (RBAC)
- Product catalog and categories
- Seller product and inventory management
- Shopping cart and wishlist
- Orders and order lifecycle
- Coupons
- Reviews and ratings
- Request validation and global exception handling
- DTO pattern and layered architecture
- Pagination, filtering, and sorting
- Transaction management
- OpenAPI / Swagger documentation
- Security configuration

### Frontend
- Authentication pages
- Customer dashboard
- Seller dashboard
- Product browsing and product details
- Cart, wishlist, and checkout / order flow
- Order history
- Seller product and inventory management
- Role-based UI
- API integration with Spring Boot

### DevOps (later)
- Docker and Docker Compose
- CI/CD with GitHub Actions
- Production configuration

## Repository Layout

```text
ShopSphere/
├── backend/      Spring Boot 4.1.0 REST API foundation
├── frontend/     React + TypeScript + Vite foundation
├── docs/         Project documentation
├── .gitignore
└── README.md
```

## Getting Started

### Backend

Requirements: Java 21 and a local PostgreSQL database for runtime. Maven Wrapper is included (`mvnw` / `mvnw.cmd`).

Create a PostgreSQL database (example name: `shopsphere`), then set environment variables before starting the API. See `backend/.env.example` for the expected keys.

PowerShell:

```powershell
cd backend
$env:DB_URL="jdbc:postgresql://localhost:5432/shopsphere"
$env:DB_USERNAME="shopsphere"
$env:DB_PASSWORD="your-local-password"
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Bash:

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/shopsphere
export DB_USERNAME=shopsphere
export DB_PASSWORD=your-local-password
./mvnw test
./mvnw spring-boot:run
```

Notes:
- `DB_URL` defaults to `jdbc:postgresql://localhost:5432/shopsphere` if unset.
- `DB_USERNAME` and `DB_PASSWORD` are required at runtime (no credentials are hardcoded).
- `JWT_SECRET` is required at runtime and must be at least 32 characters (never commit real secrets).
- Optional: `JWT_ISSUER` (default `shopsphere`), `JWT_EXPIRATION_MINUTES` (default `60`).
- Optional: `CORS_ALLOWED_ORIGINS` (comma-separated). Leave unset when using the Vite `/api` proxy; set explicit origins only for cross-origin SPA hosting (never `*`).
- Apply `docs/sql/users.sql` once to create the `users` table (`ddl-auto=none`).
- Automated tests use an in-memory H2 database (`test` profile) and do not require PostgreSQL.

Health check: `GET http://localhost:8080/api/health`

### Frontend

Requirements: Node.js 20+ and npm.

```bash
cd frontend
npm install
npm run dev
```

Dev server: `http://localhost:5173`  
During development, `/api/*` is proxied to `http://localhost:8080` (no CORS changes required on the backend).

Optional: copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if you need an absolute API URL.
