import { TripChecklist } from '../types';

const tripChecklistItems: Array<{ key: keyof TripChecklist; label: string }> = [
  { key: 'ticketsPurchased', label: 'Tickets purchased' },
  { key: 'parkReservationsMade', label: 'Park reservations made' },
  { key: 'genieStrategyDecided', label: 'Genie+ strategy decided' },
  { key: 'magicBandsReady', label: 'MagicBands / room keys ready' },
  { key: 'memoryMaker', label: 'Memory Maker planned' }
];

export default tripChecklistItems;
