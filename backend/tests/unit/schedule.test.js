import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateContractVisitDates } from "../../src/utils/schedule.js";

describe("Contract Schedule Engine", () => {
  const startDate = "2026-01-01T00:00:00.000Z";
  const endDate = "2026-12-31T23:59:59.000Z";

  test("one_time frequency generates exactly 1 visit", () => {
    const dates = calculateContractVisitDates(startDate, endDate, "one_time", 1);
    assert.equal(dates.length, 1);
    assert.equal(dates[0].toISOString().slice(0, 10), "2026-01-01");
  });

  test("weekly frequency generates 4 weekly visits", () => {
    const dates = calculateContractVisitDates(startDate, endDate, "weekly", 4);
    assert.equal(dates.length, 4);
    assert.equal(dates[0].toISOString().slice(0, 10), "2026-01-01");
    assert.equal(dates[1].toISOString().slice(0, 10), "2026-01-08");
    assert.equal(dates[2].toISOString().slice(0, 10), "2026-01-15");
    assert.equal(dates[3].toISOString().slice(0, 10), "2026-01-22");
  });

  test("monthly frequency generates 12 calendar month visits", () => {
    const dates = calculateContractVisitDates(startDate, endDate, "monthly", 12);
    assert.equal(dates.length, 12);
    assert.equal(dates[0].toISOString().slice(0, 10), "2026-01-01");
    assert.equal(dates[1].toISOString().slice(0, 10), "2026-02-01");
    assert.equal(dates[11].toISOString().slice(0, 10), "2026-12-01");
  });

  test("quarterly frequency generates 4 visits", () => {
    const dates = calculateContractVisitDates(startDate, endDate, "quarterly", 4);
    assert.equal(dates.length, 4);
    assert.equal(dates[0].toISOString().slice(0, 10), "2026-01-01");
    assert.equal(dates[1].toISOString().slice(0, 10), "2026-04-01");
    assert.equal(dates[2].toISOString().slice(0, 10), "2026-07-01");
    assert.equal(dates[3].toISOString().slice(0, 10), "2026-10-01");
  });

  test("caps visit generation at 52 visits maximum", () => {
    const dates = calculateContractVisitDates(startDate, endDate, "weekly", 100);
    assert.equal(dates.length, 52);
  });
});
