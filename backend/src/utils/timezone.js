/**
 * Timezone helper functions for Asia/Dubai (UTC+4)
 */

export const getDubaiDateParts = (date = new Date()) => {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10), // 1-12
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10)
  };
};

export const getDubaiDayBoundaries = (date = new Date()) => {
  const parts = getDubaiDateParts(date);
  // Dubai is UTC+4. 00:00:00 Dubai time is UTC (hour - 4)
  const startOfDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0 - 4, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 23 - 4, 59, 59, 999));
  const dateString = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  return { startOfDay, endOfDay, dateString };
};

export const getDubaiDateString = (date) => {
  const parts = getDubaiDateParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
};

export const formatDubaiDate = (date) => {
  return new Date(date).toLocaleDateString("en-AE", {
    timeZone: "Asia/Dubai",
    dateStyle: "medium"
  });
};

export const formatDubaiDateTime = (date) => {
  return new Date(date).toLocaleString("en-AE", {
    timeZone: "Asia/Dubai",
    dateStyle: "medium",
    timeStyle: "short"
  });
};
