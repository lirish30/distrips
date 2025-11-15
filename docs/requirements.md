# DisTrips Requirements

## 1. Users & Accounts

- Users can register with email + password.
- Users can log in, log out, and reset passwords.
- Each user’s trips and DVC data are private.
- Optional: mark a user as `is_pro_dvc` to unlock Pro features.

## 2. Trips

- Create, edit, and delete trips.
- Trip fields:
  - Name
  - Start date / end date
  - Party notes (free-form)
  - Budget target
  - Lodging info: on-site/off-site, resort, room type, confirmation number
  - “Using DVC?” boolean
- On trip creation:
  - Generate `trip_days` for each date in the range.
  - Generate default time blocks for each day.

## 3. Trip Dashboard

- Show:
  - Trip name, dates, countdown.
  - Lodging card (with DVC info if enabled).
  - Flights and ground transportation.
  - Tickets & reservations checklist.
  - Dining & reservation list.
  - Park days calendar overview.
- Allow editing all of the above inline or via modals.

## 4. Day Planner

- For each day:
  - Show date, day of week, park.
  - Allow park selection (MK, EPCOT, HS, AK, OFFSITE).
  - Display fixed blocks for Breakfast, Morning, Lunch, Afternoon, Dinner, Evening, Snacks.
- Activities:
  - Types: ADR, Ride, Show, Character, Note, Other.
  - Fields: name, type, start time, end time, confirmation code, notes, cost estimate.
  - For rides:
    - Dropdown list filtered by park.
    - Flags: Genie+, must-do.
  - For dining:
    - Restaurant dropdown with quick/table service metadata.
    - Optional Dining Plan credit usage.

## 5. DVC Pro

- Contracts:
  - Home resort, use year, total points, dues, nickname.
- Use years:
  - Starting points, allocations, remaining, expiring, banking deadline.
- Trip allocations:
  - Link trip to one or more contracts and use years.
  - Store total points used per trip.
- Scenarios:
  - Let users model hypothetical trips and see computed points.

## 6. Sharing & Export

- Users can invite others to view or edit a trip.
- System sends an email invitation with secure token.
- Guests can:
  - View a read-only itinerary.
  - Optionally add comments or notes if granted permission.
- Export:
  - Printable itinerary view (browser print-friendly).
  - Email itinerary to multiple recipients.

## 7. Non-Functional

- Responsive design for mobile, tablet, desktop.
- Fast initial load (<2s on modern broadband).
- All API endpoints secured by user auth and authorization.
- Input validation and error handling across the stack.
- Log key errors and actions for debugging.
