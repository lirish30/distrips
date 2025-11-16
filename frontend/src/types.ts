export type ParkCode = 'MK' | 'EPCOT' | 'HS' | 'AK' | 'OFFSITE' | 'UNSET';
export type TimeBlockLabel = 'BREAKFAST' | 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'DINNER' | 'EVENING' | 'SNACKS' | 'NIGHT';
export type ActivityType = 'ADR' | 'RIDE' | 'SHOW' | 'NOTE' | 'OTHER';

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  homeResortOrHotel?: string;
  budgetTarget?: number;
  logistics?: TripLogistics;
  checklist?: TripChecklist;
  diningPlan?: TripDiningPlan;
  usingDvc?: boolean;
  dvcSummary?: TripDvcSummary;
  parkDays: TripDay[];
}

export interface TripDay {
  id: string;
  tripId: string;
  date: string;
  park: ParkCode;
  notes?: string;
  timeBlocks: TimeBlock[];
}

export interface TimeBlock {
  id: string;
  tripDayId: string;
  label: TimeBlockLabel;
  sortOrder: number;
  activities: Activity[];
}

export interface Activity {
  id: string;
  timeBlockId: string;
  type: ActivityType;
  name: string;
  startTime?: string;
  endTime?: string;
  isMustDo?: boolean;
  useGeniePlus?: boolean;
  notes?: string;
}

export interface BudgetItem {
  id: string;
  tripId: string;
  date?: string;
  category: 'LODGING' | 'FOOD' | 'TRANSPORT' | 'MERCH' | 'TICKETS' | 'OTHER';
  amount: number;
  description?: string;
  paidBy?: string;
}

export interface DvcContract {
  id: string;
  homeResort: string;
  useYearMonth: number;
  totalPoints: number;
  annualDuesAmount?: number;
  nickname?: string;
}

export interface DvcUseYear {
  year: string;
  contractId: string;
  startingPoints: number;
  pointsAllocated: number;
  pointsRemaining: number;
  pointsExpiring: number;
  bankingDeadline: string;
}

export interface DvcScenario {
  id: string;
  name: string;
  description?: string;
  totalPointsUsed: number;
  targetYears: Record<string, number>;
}

export interface TripFlightDetails {
  id?: string;
  direction?: 'OUTBOUND' | 'INBOUND';
  airline?: string;
  flightNumber?: string;
  departureAirport?: string;
  departureTime?: string;
  arrivalAirport?: string;
  arrivalTime?: string;
  confirmationCode?: string;
  travelers?: string[];
}

export interface TripLogistics {
  flights?: TripFlightDetails[];
  departureFlight?: TripFlightDetails;
  returnFlight?: TripFlightDetails;
  groundTransport?: string;
}

export interface TripChecklist {
  ticketsPurchased?: boolean;
  parkReservationsMade?: boolean;
  genieStrategyDecided?: boolean;
  magicBandsReady?: boolean;
  memoryMaker?: boolean;
}

export interface TripDiningPlan {
  enabled: boolean;
  totalCredits: number;
}

export interface TripDvcSummary {
  contractNickname: string;
  useYear: string;
  pointsAllocated: number;
}
