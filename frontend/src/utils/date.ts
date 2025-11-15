const enDash = '\u2013';

const parseDateInput = (value?: string | Date) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const isoString = value.includes('T') ? value : `${value}T00:00:00`;
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? null : date;
};

const fullFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const monthDayFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

export const formatDate = (value?: string | Date) => {
  const parsed = parseDateInput(value);
  if (!parsed) return '—';
  return fullFormatter.format(parsed);
};

export const formatDateRange = (start?: string | Date, end?: string | Date) => {
  const startDate = parseDateInput(start);
  if (!startDate) return '—';
  const endDate = parseDateInput(end);
  if (!endDate) return formatDate(startDate);

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  if (sameYear) {
    const sameMonth = startDate.getMonth() === endDate.getMonth();
    if (sameMonth) {
      const monthName = monthFormatter.format(startDate);
      return `${monthName} ${startDate.getDate()}${enDash}${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
    return `${monthDayFormatter.format(startDate)} ${enDash} ${monthDayFormatter.format(endDate)}, ${startDate.getFullYear()}`;
  }

  return `${fullFormatter.format(startDate)} ${enDash} ${fullFormatter.format(endDate)}`;
};
