-- Manual schema for the User module.
-- Required because spring.jpa.hibernate.ddl-auto=none (no auto DDL / migrations yet).
--
-- Example:
--   psql -U shopsphere -d shopsphere -f docs/sql/users.sql

CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(100) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('CUSTOMER', 'SELLER', 'ADMIN'))
);
