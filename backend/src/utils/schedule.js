const addCalendarMonths = (date, months) => {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  const targetDate = d.getDate();
  d.setMonth(targetMonth);
  // Check for month overflow (e.g. 31st on a 30-day month)
  if (d.getDate() !== targetDate) {
    d.setDate(0); // Last day of previous month
  }
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const calculateContractVisitDates = (startDateInput, endDateInput, frequency, totalVisits = 12) => {
  const startDate = new Date(startDateInput);
  const endDate = endDateInput ? new Date(endDateInput) : addDays(startDate, 365);
  const visitCount = Math.min(Math.max(1, Number(totalVisits) || 1), 52);

  if (frequency === "one_time") {
    return [new Date(startDate)];
  }

  const visitDates = [];
  let currentDate = new Date(startDate);

  let customStepDays = 30;
  if (frequency === "custom" && visitCount > 1) {
    const totalDurationMs = endDate.getTime() - startDate.getTime();
    if (totalDurationMs > 0) {
      customStepDays = Math.max(1, Math.floor(totalDurationMs / ((visitCount - 1) * 24 * 60 * 60 * 1000)));
    }
  }

  for (let i = 0; i < visitCount; i++) {
    visitDates.push(new Date(currentDate));

    switch (frequency) {
      case "weekly":
        currentDate = addDays(currentDate, 7);
        break;
      case "bi_weekly":
        currentDate = addDays(currentDate, 14);
        break;
      case "monthly":
        currentDate = addCalendarMonths(currentDate, 1);
        break;
      case "every_2_months":
        currentDate = addCalendarMonths(currentDate, 2);
        break;
      case "quarterly":
        currentDate = addCalendarMonths(currentDate, 3);
        break;
      case "half_yearly":
        currentDate = addCalendarMonths(currentDate, 6);
        break;
      case "yearly":
        currentDate = addCalendarMonths(currentDate, 12);
        break;
      case "custom":
        currentDate = addDays(currentDate, customStepDays);
        break;
      default:
        currentDate = addDays(currentDate, 30);
        break;
    }
  }

  return visitDates;
};
