# DisTrips Product Blueprint

## 1. Product Overview
- **Name:** DisTrips
- **Purpose:** All-in-one Disney vacation planner for any guest, with an optional DVC-focused upgrade that unlocks advanced Disney Vacation Club tooling. Core and Pro (DVC) features mirror the previous product; only the branding changes.
- **Core Experience:** Trip creation, day-by-day park planning, dining/ride scheduling, activities, budgeting, and curated park priorities.
- **Pro (DVC) Upgrade:** Adds DVC contract tracking, point calculations, allocations, reminders, scenarios, and use-year planning. Route access is gated by `user.is_pro_dvc`.

## 2. Data Model
Relational schema suitable for PostgreSQL. Timestamp fields default to `now()` with timezone where noted.

### 2.1 Users & Auth
`users`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| email | varchar unique not null |
| password_hash | varchar not null |
| name | varchar nullable |
| is_pro_dvc | boolean default false |
| created_at / updated_at | timestamptz default now |

### 2.2 Trips & Planning
`trips`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| user_id | uuid fk → users.id cascade |
| name | varchar not null |
| start_date / end_date | date not null |
| home_resort_or_hotel | varchar nullable |
| budget_target | numeric(10,2) nullable |
| party_notes | text nullable |
| created_at / updated_at | timestamp default now |

Behavior: on create, backend generates `trip_days` for each date range, and default `time_blocks` for every day.

`trip_days`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| trip_id | uuid fk → trips.id cascade |
| date | date not null |
| park | varchar default 'UNSET'; allowed `MK/EPCOT/HS/AK/OFFSITE/UNSET` |
| notes | text nullable |
| timestamps | default now |

`time_blocks`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| trip_day_id | uuid fk → trip_days.id cascade |
| label | varchar not null; `MORNING/AFTERNOON/EVENING/NIGHT` |
| sort_order | integer not null |
| timestamps | default now |

### 2.3 Activities
`activities`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| time_block_id | uuid fk → time_blocks.id cascade |
| type | varchar not null; `ADR/RIDE/SHOW/NOTE/OTHER` |
| name | varchar not null |
| start_time / end_time | time nullable |
| confirmation_code | varchar nullable |
| cost_estimate | numeric(10,2) nullable |
| is_must_do | boolean default false |
| notes | text nullable |
| timestamps | default now |

### 2.4 Budget Items
`budget_items`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| trip_id | uuid fk → trips.id cascade |
| date | date nullable (trip-level when null) |
| category | varchar not null; suggested `LODGING/FOOD/TRANSPORT/MERCH/TICKETS/OTHER` |
| amount | numeric(10,2) not null |
| description | varchar nullable |
| paid_by | varchar nullable |
| timestamps | default now |

### 2.5 Park Day Blueprint
`park_plans`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| trip_day_id | uuid fk → trip_days.id cascade |
| persona_type | varchar not null; suggested `FAMILY/ADULTS/THRILL/CHILL` |
| timestamps | default now |

`park_plan_items`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| park_plan_id | uuid fk → park_plans.id cascade |
| ride_name | varchar not null |
| priority_rank | integer not null (1 highest) |
| recommended_block_label | varchar nullable (`MORNING/AFTERNOON/EVENING/NIGHT`) |
| assigned_block_id | uuid fk → time_blocks.id nullable |
| completed | boolean default false |
| notes | text nullable |
| timestamps | default now |

Static defaults stored in `park_ride_priorities.json` with per-park persona lists. Backend endpoint surfaces suggestions.

### 2.6 DVC (Pro) Tables
`dvc_contracts`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| user_id | uuid fk → users.id cascade |
| home_resort | varchar not null |
| use_year_month | integer 1-12 |
| total_points | integer not null |
| annual_dues_amount | numeric(10,2) nullable |
| nickname | varchar nullable |
| timestamps | default now |

`dvc_point_charts` (seed/static)
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| resort | varchar not null |
| room_type | varchar not null |
| season | varchar not null |
| points_per_night | integer not null |

Season mapping is handled in code or JSON.

`dvc_trip_allocations`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| trip_id | uuid fk → trips.id cascade |
| dvc_contract_id | uuid fk → dvc_contracts.id cascade |
| use_year_label | varchar not null |
| total_points_used | integer not null |
| notes | text nullable |
| timestamps | default now |

`dvc_reminders`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| user_id | uuid fk → users.id cascade |
| remind_at | timestamptz not null |
| title | varchar not null |
| body | text nullable |
| sent | boolean default false |
| timestamps | default now |

`dvc_scenarios`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| user_id | uuid fk → users.id cascade |
| name | varchar not null |
| description | text nullable |
| timestamps | default now |

`dvc_scenario_trips`
| column | type | notes |
| --- | --- | --- |
| id | uuid pk |
| scenario_id | uuid fk → dvc_scenarios.id cascade |
| dvc_contract_id | uuid fk → dvc_contracts.id nullable |
| resort | varchar not null |
| room_type | varchar not null |
| nights | integer not null |
| season | varchar not null |
| target_year | integer not null |
| computed_points | integer not null |
| notes | text nullable |
| timestamps | default now |

## 3. API Design (REST/JSON)
JWT secured routes expect `Authorization: Bearer <token>` header once authenticated.

### 3.1 Auth
- `POST /auth/register` → `{ token, user }`
- `POST /auth/login` → `{ token, user }`

### 3.2 Trips
- `GET /trips` – list user trips.
- `POST /trips` – create trip; backend also seeds `trip_days` and default `time_blocks`.
- `GET /trips/:tripId` – fetch trip, optionally with nested days.
- `PATCH /trips/:tripId` – update base fields.
- `DELETE /trips/:tripId` – cascade delete.

### 3.3 Trip Days & Time Blocks
- `GET /trips/:tripId/days`
- `PATCH /trip-days/:dayId`
- `GET /trip-days/:dayId/time-blocks`
- `PATCH /time-blocks/:blockId`

### 3.4 Activities
- `GET /time-blocks/:blockId/activities`
- `POST /time-blocks/:blockId/activities`
- `PATCH /activities/:activityId`
- `DELETE /activities/:activityId`

### 3.5 Budget
- `GET /trips/:tripId/budget-items`
- `POST /trips/:tripId/budget-items`
- `PATCH /budget-items/:id`
- `DELETE /budget-items/:id`

### 3.6 Park Day Blueprint
- `GET /park-priorities?park=MK&persona=FAMILY` – static suggestions.
- `POST /trip-days/:dayId/park-plan` – create plan + seed items.
- `GET /trip-days/:dayId/park-plan`
- `PATCH /park-plan-items/:id` – assign blocks / mark complete.

### 3.7 DVC (Pro Only)
Routes guarded by middleware that enforces `user.is_pro_dvc`.

#### 3.7.1 Contracts
- `GET /dvc/contracts`
- `POST /dvc/contracts`
- `PATCH /dvc/contracts/:id`
- `DELETE /dvc/contracts/:id`

#### 3.7.2 Trip Point Calculations & Allocations
- `POST /dvc/trips/:tripId/calculate` – compute per-night totals using `dvc_point_charts`. Returns `{ total_points_used, use_year_label, per_night[] }`.
- `POST /dvc/trips/:tripId/allocations` – persist allocation rows.
- `GET /dvc/trips/:tripId/allocations`

#### 3.7.3 Use Year Overview
- `GET /dvc/use-years` – summarize starting points, allocations, remaining amounts, expiring totals, and banking deadlines per contract/year.

#### 3.7.4 Reminders
- `GET /dvc/reminders`
- `POST /dvc/reminders`

Cron process scans reminders with `sent = false` and `remind_at <= now()`, sends email, then sets `sent = true`.

#### 3.7.5 Scenarios
- `GET /dvc/scenarios`
- `POST /dvc/scenarios`
- `GET /dvc/scenarios/:scenarioId` – include nested trips.
- `POST /dvc/scenarios/:scenarioId/trips` – compute `computed_points` via `dvc_point_charts` lookup.
- `GET /dvc/scenarios/:scenarioId/summary` – aggregated totals per year, total points, expiring estimate, total nights.

## 4. Frontend Screens
React/Vue/etc. SPA with protected routes once authenticated.

- `/login`, `/register` – entry points for email/password auth.
- `/trips` – list view, create button.
- `/trips/:tripId` – trip dashboard (summary metadata, budget vs target chart, trip day list).
- `/trips/:tripId/day/:dayId` – per-day planner with park selector, time blocks, activities CRUD, open park plan modal if park assigned.
- `/trips/:tripId/budget` – budget management + charts.
- `/dvc` (Pro users) – overview hub.
- `/dvc/contracts` – contract CRUD.
- `/dvc/use-years` – use year planner view.
- `/dvc/scenarios` – manage scenarios, drill into scenario detail.

Each screen relies strictly on the REST endpoints above; no GraphQL assumed. JWT token stored securely (httpOnly cookie or secure storage) and attached to subsequent requests.
