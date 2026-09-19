import test from "node:test";
import assert from "node:assert/strict";

import { resolveCallTimestamp } from "../../src/lib/call-timestamp";

test("manual call timestamps are preserved instead of always using now", () => {
  const resolved = resolveCallTimestamp("2024-01-15T14:42");

  assert.equal(resolved instanceof Date, true);
  assert.equal(resolved.getFullYear(), 2024);
  assert.equal(resolved.getMonth(), 0);
  assert.equal(resolved.getDate(), 15);
  assert.equal(resolved.getHours(), 14);
  assert.equal(resolved.getMinutes(), 42);
  assert.equal(resolveCallTimestamp(undefined)?.getTime() > 0, true);
});
