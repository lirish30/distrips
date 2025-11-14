import { ActivityType, BudgetItem, DvcContract, DvcScenario, DvcUseYearSummary, TimeBlockLabel, Trip } from '../types';

const parks = ['MK', 'EPCOT', 'HS', 'AK'] as const;
const blocks: TimeBlockLabel[] = ['MORNING', 'AFTERNOON', 'EVENING'];
const activitiesPerBlock: ActivityType[][] = [
  ['ADR', 'RIDE'],
  ['RIDE', 'SHOW'],
  ['NOTE']
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
        startTime: blockIdx === 0 ? '08:00' : blockIdx === 1 ? '13:15' : undefined,
        endTime: blockIdx === 0 ? '09:30' : blockIdx === 1 ? '15:00' : undefined,
        notes: blockIdx === 2 ? 'Wind down with fireworks viewing' : undefined,
        isMustDo: type === 'RIDE'
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
    parkDays
  };
};

export const trips: Trip[] = [makeTrip(0), makeTrip(1)];

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

export const dvcUseYears: DvcUseYearSummary[] = [
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
