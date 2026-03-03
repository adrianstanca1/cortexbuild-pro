import { format as dateFnsFormat, differenceInDays as dateFnsDifferenceInDays } from 'date-fns';

export const format = dateFnsFormat;
export const differenceInDays = dateFnsDifferenceInDays;

export const isOverdue = (date: Date): boolean => {
  const now = new Date();
  return date < now;
};