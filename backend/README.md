# Billing System Backend (Spring Boot)

Java + Spring Boot backend for the billing system. Replaces an earlier
NestJS prototype that has since been removed.

## Stack

- Java 21, Maven
- Spring Web, Spring Data JPA (Hibernate), Spring Security
- PostgreSQL
- JWT auth (jjwt) — custom stateless auth, not Spring Security's default
  UserDetailsService flow
- Lombok

## Running locally

Requires a local PostgreSQL instance with a `billing_dev` database (see
`src/main/resources/application.yml` for connection defaults — override via
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` env vars).

```bash
./mvnw spring-boot:run
```

The app starts on `http://localhost:3000/api` (context path `/api`).

On first run, `DataSeeder` automatically creates a business, default
Owner/Manager/Cashier roles, and an owner login — configurable via
`SEED_BUSINESS_NAME`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` (defaults:
`Acme Retail` / `admin` / `admin`). It only runs if no business exists yet.

## Schema

`spring.jpa.hibernate.ddl-auto=update` — Hibernate manages the schema
directly from the JPA entities. There are no separate migration files yet;
if you need to start from a clean slate in development:

```sql
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
```

## Package layout

Organized by feature/module (`auth`, `business`, `branch`, `role`, `user`,
`product`, `customer`, `invoice`, `report`), each with its own entity,
repository, service, controller, and `dto/` package — mirroring the module
boundaries from the original NestJS backend and the project's `PLAN.md`.
