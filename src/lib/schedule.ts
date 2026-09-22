function getLocalScheduleState(timezone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    dayOfWeek: weekdays.indexOf(values.weekday),
  };
}

export function isScheduleDue(schedule: {
  enabled: boolean;
  frequency: string;
  day_of_week: number;
  run_time: string;
  timezone: string;
  last_run_at: string | null;
}, now = new Date()) {
  if (!schedule.enabled) return false;

  const current = getLocalScheduleState(schedule.timezone, now);
  const scheduledTime = schedule.run_time.slice(0, 5);
  const isAfterScheduledTime = current.time >= scheduledTime;
  const isCorrectDay = schedule.frequency === "daily" || current.dayOfWeek === schedule.day_of_week;

  if (!isAfterScheduledTime || !isCorrectDay) {
    return false;
  }

  if (!schedule.last_run_at) {
    return true;
  }

  const lastRunDate = getLocalScheduleState(schedule.timezone, new Date(schedule.last_run_at)).date;

  return lastRunDate !== current.date;
}

