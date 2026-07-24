# 01 — Auth & RBAC

**Type:** build · **Wireframe:** page 01 (14 boards) + page 15 (RBAC screens) · **Effort:** ~2 person-weeks

## 1. Purpose & scope

Session auth for the dashboard (email+password, mobile OTP verification, password reset via OTP), plus the platform-wide permission system: platform roles (superadmin, staff roles, customer) and workspace roles (org-admin/manager/agent/read-only + custom roles per customer).

Already scaffolded in this repo: login/register/OTP/forgot/reset screens, spatie/laravel-permission, role middleware, seeded roles. This plan takes it to production.

## 2. Screens

Login, Register, OTP Verification, Forgot Password, Forgot OTP, Reset Password, Reset Success (all D+M — built). RBAC surfaces: Roles list, Role studio (customer & admin), Create/edit role, Assign role, Temporary permissions, Access approval workflow, IP restrictions (page 15 → doc 15).

## 3. Data model

```sql
users (
  id BIGINT UNSIGNED PK, public_id CHAR(26) UNIQUE,
  customer_id BIGINT UNSIGNED NULL,            -- NULL = internal staff
  name VARCHAR(120), email VARCHAR(190) UNIQUE, mobile VARCHAR(20) NULL,
  city VARCHAR(120) NULL, password VARCHAR(255),
  status VARCHAR(16) DEFAULT 'active',          -- active|inactive|locked
  email_verified_at TS NULL, mobile_verified_at TS NULL,
  last_login_at TS NULL, last_login_ip VARBINARY(16) NULL,
  department_id FK NULL, manager_id FK NULL,    -- staff fields (doc 19)
  timestamps, deleted_at,
  INDEX (customer_id, status), INDEX (mobile)
)

otp_codes (
  id PK, user_id FK NULL, channel VARCHAR(8),   -- sms|email
  destination VARCHAR(190), purpose VARCHAR(24),-- register|password_reset|login
  code_hash CHAR(64), attempts TINYINT DEFAULT 0,
  expires_at TS, consumed_at TS NULL, created_at,
  INDEX (destination, purpose, expires_at)
)

-- spatie/laravel-permission with teams enabled:
roles (id, team_id NULL /* = customer_id for workspace roles */, name, guard_name,
       description VARCHAR(255) NULL, is_system BOOL DEFAULT 0, UNIQUE(team_id,name,guard_name))
permissions (id, name /* {module}.{ability} */, guard_name)
role_has_permissions / model_has_roles / model_has_permissions (spatie defaults + team FK)

temporary_permissions (
  id PK, user_id FK, permission_id FK, customer_id NULL,
  granted_by FK users, reason VARCHAR(255), expires_at TS, revoked_at TS NULL,
  INDEX (user_id, expires_at)
)

access_requests (               -- approval workflow (page 15)
  id PK, customer_id NULL, requested_by FK, permission_id FK,
  status VARCHAR(16) DEFAULT 'pending',  -- pending|approved|rejected
  decided_by FK NULL, decided_at TS NULL, note VARCHAR(255), timestamps,
  INDEX (status, created_at)
)

ip_restrictions (
  id PK, customer_id NULL /* NULL = platform-wide */,
  cidr VARCHAR(43), mode VARCHAR(8) DEFAULT 'allow',  -- allow|deny
  label VARCHAR(120), created_by FK, timestamps, INDEX (customer_id)
)

login_activities (              -- partitioned monthly, retention 12mo
  id BIGINT PK, user_id, customer_id NULL, event VARCHAR(16), -- login|logout|failed|locked
  ip VARBINARY(16), user_agent VARCHAR(255), created_at,
  INDEX (user_id, created_at)
) PARTITION BY RANGE (TO_DAYS(created_at))

audit_logs (                    -- global, partitioned monthly (used by all modules)
  id BIGINT PK, customer_id NULL, user_id NULL, action VARCHAR(48),
  entity_type VARCHAR(48), entity_id BIGINT, before JSON NULL, after JSON NULL,
  ip VARBINARY(16), created_at,
  INDEX (customer_id, created_at), INDEX (entity_type, entity_id)
) PARTITION BY RANGE (TO_DAYS(created_at))
```

Sessions: DB driver (`sessions` table) or Redis; `password_reset_tokens` replaced by `otp_codes`.

## 4. Flows & rules

- **Register** → create user (status inactive) + customer shell → SMS OTP (MSG91/engine) → verify → activate + login. Throttle: 5 OTP/hour/destination, 5 verify attempts then invalidate.
- **Login** → attempt + `login_activities` row; lock after 10 failed/15min (status locked + notify). Remember-me 30d.
- **Password reset** → email OTP → verify (server-side session token, not client state) → reset + invalidate all sessions.
- **Middleware stack**: `auth` → `tenant` (resolve customer, bind scopes) → `ip.restricted` → `role/permission`.
- Workspace role changes and temporary grants always write `audit_logs`.

## 5. Laravel implementation

- `AuthController` (exists) + `OtpService` (issue/verify, hash codes), `SmsChannel` via engine/MSG91.
- `TenantContext` singleton + `BelongsToCustomer` trait; `EnsureIpAllowed` middleware with per-tenant cached CIDR list.
- Policies generated per module; `PermissionMatrixService` renders/persists the module × ability grid used by onboarding admin screens and doc 15.
- Scheduled: purge expired OTPs nightly; expire `temporary_permissions`; partition maintenance.

## 6. Build phases

1. Harden existing flows (OTP real delivery, throttles, lockout) — 2d
2. Teams-mode roles + workspace custom roles + policies — 3d
3. Temporary permissions + access requests + IP restrictions — 3d
4. Audit/login activity + retention jobs + tests — 2d

**Open questions:** SSO (Google) now or later? SMS provider = engine or direct MSG91?
