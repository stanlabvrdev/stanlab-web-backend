export const addDaysToDate = (days: number): string => {
  return new Date(new Date().setDate(new Date().getDate() + days)).toISOString();
};
