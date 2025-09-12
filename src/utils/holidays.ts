// South African public holidays calculation
import { isWeekend, format } from 'date-fns';

// Fixed South African public holidays
const FIXED_HOLIDAYS = [
  '01-01', // New Year's Day
  '03-21', // Human Rights Day
  '04-27', // Freedom Day
  '05-01', // Workers' Day
  '06-16', // Youth Day
  '08-09', // National Women's Day
  '09-24', // Heritage Day
  '12-16', // Day of Reconciliation
  '12-25', // Christmas Day
  '12-26', // Day of Goodwill
];

// Calculate Easter-based holidays for a given year
const getEasterDate = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const getEasterBasedHolidays = (year: number): string[] => {
  const easter = getEasterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  
  const familyDay = new Date(easter);
  familyDay.setDate(easter.getDate() + 1);
  
  return [
    format(goodFriday, 'MM-dd'),
    format(familyDay, 'MM-dd'),
  ];
};

export const isPublicHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const monthDay = format(date, 'MM-dd');
  
  // Check fixed holidays
  if (FIXED_HOLIDAYS.includes(monthDay)) return true;
  
  // Check Easter-based holidays
  const easterHolidays = getEasterBasedHolidays(year);
  return easterHolidays.includes(monthDay);
};

export const isWorkingDay = (date: Date): boolean => {
  return !isWeekend(date) && !isPublicHoliday(date);
};

export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  let workingDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};