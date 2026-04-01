import test from "node:test";
import assert from "node:assert/strict";

import { differenceInDays, parseNaturalDate } from "./date.js";

test("parseNaturalDate resolves last Sunday before a Tuesday reference", () => {
  const result = parseNaturalDate("coffee last Sunday $5", "2026-03-31");
  assert.equal(result.isoDate, "2026-03-29");
});

test("parseNaturalDate returns null when no calendar phrase is present", () => {
  const result = parseNaturalDate("coffee $5 downtown", "2026-03-31");
  assert.equal(result.isoDate, null);
});

test("differenceInDays counts inclusive calendar distance", () => {
  assert.equal(differenceInDays("2026-03-01", "2026-03-03"), 2);
});
