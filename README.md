# DisTrips

DisTrips is an all-in-one Disney trip planner web app with optional Disney Vacation Club (DVC) power tools.

- Plan trips day-by-day (parks, rides, dining, activities).
- Share the itinerary with family members.
- For DVC members, track contracts, points, and use-years tied directly to trips.

> Note: DisTrips is an independent tool and is not affiliated with, endorsed by, or connected with The Walt Disney Company or its affiliates.

---

## Features

### Core (All Users)

- Create and manage multiple trips.
- Step-by-step planner:
  - Dates & party details
  - Lodging (on-site, off-site, room type)
  - Flights and ground transportation
  - Park tickets & reservations checklist
  - Dining reservations and special activities
- Per-day planner:
  - Assign park per day
  - Time blocks for Breakfast / Morning / Lunch / Afternoon / Dinner / Evening / Snacks
  - Activities (rides, ADRs, shows, notes, extras)
- Trip-level dashboard:
  - Lodging summary
  - Logistics (flights, transport)
  - Park-day overview calendar
  - Dining & reservation list
  - Budget target
- Printable and shareable itinerary (read-only link + print view).

### Pro – DVC Upgrade

- DVC contract management (home resort, use year, points, dues).
- Use-year view: starting points, allocations, remaining, expiring, banking deadlines.
- Trip-level DVC integration:
  - Mark trips as “Using DVC”
  - Night-by-night point usage
  - Allocations by contract/use year
- Scenario planner for future trips (compare resorts, seasons, and point usage).
- Email reminders for key deadlines (banking, booking windows).

---

## Tech Stack

**Frontend**

- React + TypeScript
- Vite dev server
- CSS modules / utility classes (TBD: Tailwind)

**Backend (planned)**

- Node.js + TypeScript
- REST API (see `docs/product-blueprint.md`)
- PostgreSQL (via Prisma ORM)
- JWT auth with httpOnly cookies

**Hosting (suggested)**

- Frontend: Vercel
- Backend: Railway / Render / Vercel serverless functions
- DB: Supabase / Neon Postgres
- Email: Postmark / Resend

---

## Getting Started (Frontend Prototype)

```bash
cd frontend
npm install
npm run dev
```

---

## Requirements Spec

A short-form requirements list that mirrors the product vision lives in `docs/requirements.md` for quick reference when grooming work or reviewing scope.
