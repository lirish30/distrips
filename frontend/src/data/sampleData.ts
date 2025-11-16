import { ActivityType, BudgetItem, DvcContract, DvcScenario, DvcUseYear, TimeBlockLabel, Trip } from '../types';

const parks = ['MK', 'EPCOT', 'HS', 'AK'] as const;
const blocks: TimeBlockLabel[] = ['BREAKFAST', 'MORNING', 'LUNCH', 'AFTERNOON', 'DINNER', 'EVENING', 'SNACKS'];
const activitiesPerBlock: ActivityType[][] = [
  ['ADR'],
  ['RIDE'],
  ['ADR'],
  ['RIDE', 'SHOW'],
  ['ADR'],
  ['NOTE'],
  []
];

const makeTrip = (idx: number): Trip => {
  const start = new Date(2026, 9, 10 + idx * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const pad = (value: number) => String(value).padStart(2, '0');
  const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const parkDays = Array.from({ length: 5 }).map((_, dayIdx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + dayIdx);
    const timeBlocks = blocks.map((label, blockIdx) => ({
      id: `tb-${idx}-${dayIdx}-${blockIdx}`,
      tripDayId: `day-${idx}-${dayIdx}`,
      label,
      sortOrder: blockIdx + 1,
      activities: activitiesPerBlock[blockIdx].map((type, actIdx) => ({
        id: `act-${idx}-${dayIdx}-${blockIdx}-${actIdx}`,
        timeBlockId: `tb-${idx}-${dayIdx}-${blockIdx}`,
        type,
        name: `${type} placeholder ${actIdx + 1}`,
        startTime:
          blockIdx === 0
            ? '08:00'
            : blockIdx === 1
              ? '09:30'
              : blockIdx === 2
                ? '12:15'
                : blockIdx === 3
                  ? '14:00'
                  : blockIdx === 4
                    ? '18:00'
                    : blockIdx === 5
                      ? '20:30'
                      : undefined,
        endTime:
          blockIdx === 0
            ? '09:00'
            : blockIdx === 2
              ? '13:30'
              : blockIdx === 4
                ? '19:30'
                : undefined,
        notes: blockIdx === 5 ? 'Wind down with fireworks viewing' : undefined,
        isMustDo: type === 'RIDE',
        useGeniePlus: type === 'RIDE'
      }))
    }));

    return {
      id: `day-${idx}-${dayIdx}`,
      tripId: `trip-${idx}`,
      date: formatDate(date),
      park: parks[(dayIdx + idx) % parks.length],
      notes: dayIdx === 0 ? 'Arrival, rope drop planned.' : undefined,
      timeBlocks
    };
  });

  return {
    id: `trip-${idx}`,
    name: idx === 0 ? 'Fall 2026 Family Trip' : `Explorers ${2025 + idx}`,
    startDate: formatDate(start),
    endDate: formatDate(end),
    homeResortOrHotel: idx === 0 ? 'Pop Century' : 'Saratoga Springs',
    budgetTarget: idx === 0 ? 4200 : 3800,
    logistics: {
      departureFlight: {
        airline: idx === 0 ? 'Delta' : 'JetBlue',
        flightNumber: idx === 0 ? 'DL 1782' : 'B6 612',
        departureAirport: 'BOS',
        departureTime: `${formatDate(start)}T07:25`,
        arrivalAirport: 'MCO',
        arrivalTime: `${formatDate(start)}T10:35`
      },
      returnFlight: {
        airline: idx === 0 ? 'Delta' : 'JetBlue',
        flightNumber: idx === 0 ? 'DL 1905' : 'B6 623',
        departureAirport: 'MCO',
        departureTime: `${formatDate(end)}T18:45`,
        arrivalAirport: 'BOS',
        arrivalTime: `${formatDate(end)}T22:05`
      },
      groundTransport: idx === 0 ? 'Rideshare' : 'Rental Car'
    },
    checklist: {
      ticketsPurchased: true,
      parkReservationsMade: idx === 0,
      genieStrategyDecided: idx === 0,
      magicBandsReady: idx === 0 ? false : true,
      memoryMaker: false
    },
    diningPlan: idx === 0 ? { enabled: true, totalCredits: 12 } : { enabled: false, totalCredits: 0 },
    usingDvc: idx === 0,
    dvcSummary:
      idx === 0
        ? {
            contractNickname: 'Main Contract',
            useYear: '2025 April',
            pointsAllocated: 118
          }
        : undefined,
    parkDays
  };
};

export const trips: Trip[] = [makeTrip(0), makeTrip(1)];
export const dvcUseYearTrips = trips
  .filter((trip) => trip.usingDvc && trip.dvcSummary)
  .map((trip) => ({
    tripId: trip.id,
    tripName: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    pointsUsed: trip.dvcSummary?.pointsAllocated ?? 0,
    useYear: trip.dvcSummary?.useYear ?? 'Unknown'
  }));

export const budgetItems: BudgetItem[] = [
  {
    id: 'budget-1',
    tripId: 'trip-0',
    date: '2026-10-11',
    category: 'FOOD',
    amount: 120.5,
    description: 'Lunch at EPCOT',
    paidBy: 'Logan'
  },
  {
    id: 'budget-2',
    tripId: 'trip-0',
    date: '2026-10-12',
    category: 'TICKETS',
    amount: 800,
    description: "Mickey's Not-So-Scary Halloween Party"
  },
  {
    id: 'budget-3',
    tripId: 'trip-0',
    category: 'LODGING',
    amount: 1600,
    description: 'DVC point rental'
  }
];

export const dvcContracts: DvcContract[] = [
  {
    id: 'contract-1',
    homeResort: 'Saratoga Springs',
    useYearMonth: 4,
    totalPoints: 150,
    annualDuesAmount: 1100,
    nickname: 'Main Contract'
  }
];

export const dvcUseYears: DvcUseYear[] = [
  {
    year: '2025',
    contractId: 'contract-1',
    startingPoints: 150,
    pointsAllocated: 90,
    pointsRemaining: 60,
    pointsExpiring: 10,
    bankingDeadline: '2025-07-31'
  }
];

export const dvcScenarios: DvcScenario[] = [
  {
    id: 'scenario-1',
    name: 'All-in 2026',
    description: 'Use most points for a deluxe stay.',
    totalPointsUsed: 142,
    targetYears: {
      '2026': 120,
      '2027': 22
    }
  }
];
