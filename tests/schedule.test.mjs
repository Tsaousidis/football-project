import assert from "node:assert/strict";
import { test } from "node:test";
import { isScheduleDue } from "../src/lib/schedule.ts";

const schedule = {
  enabled: true,
  frequency: "daily",
  day_of_week: 1,
  run_time: "06:00:00",
  timezone: "UTC",
  last_run_at: null,
};

test("disabled schedules never run", () => {
  assert.equal(isScheduleDue({ ...schedule, enabled: false }, new Date("2026-09-21T12:00:00Z")), false);
});

test("daily schedule waits for its time, including midnight", () => {
  for (const time of ["00:15", "05:59"]) {
    assert.equal(isScheduleDue(schedule, new Date(`2026-09-21T${time}:00Z`)), false);
  }
  assert.equal(isScheduleDue(schedule, new Date("2026-09-21T06:00:00Z")), true);
});

test("weekly schedule only runs on the selected local weekday", () => {
  const weekly = { ...schedule, frequency: "weekly" };
  assert.equal(isScheduleDue(weekly, new Date("2026-09-20T12:00:00Z")), false);
  assert.equal(isScheduleDue(weekly, new Date("2026-09-21T12:00:00Z")), true);
});

test("deduplication uses the local calendar date across UTC midnight", () => {
  const local = { ...schedule, timezone: "Europe/Athens", last_run_at: "2026-09-20T22:00:00Z" };
  assert.equal(isScheduleDue(local, new Date("2026-09-21T07:00:00Z")), false);
  assert.equal(isScheduleDue(local, new Date("2026-09-22T07:00:00Z")), true);
});

test("repeated daylight-saving hour does not trigger a second run", () => {
  const local = { ...schedule, timezone: "Europe/Athens", run_time: "03:00:00", last_run_at: "2026-10-25T00:15:00Z" };
  assert.equal(isScheduleDue(local, new Date("2026-10-25T01:15:00Z")), false);
});
