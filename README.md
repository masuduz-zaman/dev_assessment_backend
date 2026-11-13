# DevAssess API
API_URL/api/v1/endpoint

Express + Prisma + PostgreSQL

```
backend/
  prisma/
    schema/              one .prisma file per table (+ base.prisma, enums.prisma)
    seed.ts              seeds accounts, plans, jobs, assessments, leaderboard
    seed-data/           the seed content (no data is hard-coded in code paths)
  postman/               generated Postman collection + environment
  src/
    config/              env (validated with Zod), prisma, google, cloudinary
    constants/           roles, permissions, option lists
    shared/              errors, response helpers, middlewares, utils, types
    modules/<feature>/   <feature>.routes.ts -> .controller.ts -> .service.ts, plus .validation.ts
    routes/index.ts      mounts every module under /api
    app.ts, server.ts
```

Modules: `auth`, `profile`, `dashboard`, `admin`, `team`, `assessments`, `invitations`, `attempts`, `evaluations`, `results`, `coding`, `rankings`, `jobs`, `applications`, `offers`, `plans`, `payments`, `notifications`, `uploads`, `public`, `audit`.

Flow of a request: **route** (auth + role/permission + Zod validation) -> **controller** (HTTP only) -> **service** (business rules, Prisma) -> `sendSuccess()` envelope. Errors are thrown as `ApiError` and rendered by one global handler.

## Scripts

| Command                             | Purpose                                     |
| ----------------------------------- | ------------------------------------------- |
| `npm run dev`                       | watch mode API                              |
| `npm run build` / `npm start`       | compile and run                             |
| `npx prisma migrate dev -- --name init` | create/apply migrations (multi-file schema) |
| `npx prisma generate`                 | apply migrations in production              |
data                                   |
| `npm run postman`                   | regenerate the Postman collection           |

## Response format

```json
{ "success": true,  "message": "Operation successful", "data": {} }
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Enter a valid email address" }] }
```

Status codes: 200/201 success, 400 bad request, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 validation, 429 rate limited, 503 external service not configured.

## Endpoint map

| Area                | Endpoints                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                | `POST /auth/register`, `/auth/login`, `/auth/google`; `GET /auth/me`, `/auth/google/config`, `/auth/demo-accounts`                                                     |
| Profile / dashboard | `GET,PATCH /profile`, `GET /dashboard`                                                                                                                                 |
| Public              | `GET /public/{stats,meta,assessments,assessments/:id,companies,jobs,candidates}`, `GET /rankings`, `GET /plans`                                                        |
| Admin               | `GET /admin/{companies,users,assessments,payments,reports,audit-logs}`, `PATCH /admin/companies/:id/status`, `PATCH /admin/users/:id/status`, plan CRUD under `/plans` |
| Company team        | `GET,POST /company/members`, `PATCH,DELETE /company/members/:id`                                                                                                       |
| Assessments         | `GET,POST /assessments`, `GET,PATCH,DELETE /assessments/:id`, `PATCH /assessments/:id/{publish,archive}`                                                               |
| Invitations         | `POST /invitations`, `GET /invitations/{mine,assessment/:id}`, `POST /invitations/:id/accept`                                                                          |
| Exams               | `POST /attempts`, `POST /attempts/:id/submit`, `POST /coding/execute`                                                                                                  |
| Evaluation          | `GET /evaluations/pending`, `POST /evaluations/:submissionId`, `GET /results/{mine,company}`                                                                           |
| Recruitment         | `GET,POST /jobs...`, `/applications...`, `/offers...`                                                                                                                  |
| Payments            | `POST /payments/checkout`, `GET /payments`, `GET /payments/:id`, `POST /payments/:id/verify` + provider callbacks                                                      |
| Misc                | `/notifications`, `POST /uploads`, `GET /health`                                                                                                                       |

Full request bodies, chained variables and tests are in the Postman collection.

## Payments in detail

1. `POST /payments/checkout {planId}` - amount and currency come from the `Plan` row; a `PENDING` payment is stored and a real **Stripe Checkout** or **SSLCommerz** session is created.
2. The user pays on the provider's hosted page.
3. Provider -> backend: Stripe webhook (signature verified) / SSLCommerz IPN and success redirect (re-validated against the SSLCommerz validation API; amount, currency and tran_id must match).
4. The frontend success page calls `POST /payments/:id/verify`, which asks the gateway directly. All paths funnel into one idempotent `markPaid()`.

Stripe webhook need a **public URL** (use ngrok / cloudflared locally and set `API_URL`). The `verify` endpoint lets local development work without webhooks.

