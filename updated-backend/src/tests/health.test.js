import assert from "node:assert";
import test from "node:test";
import request from "node-fetch";

// Basic smoke test expects server already running separately.
// For a more isolated test harness we'd instantiate the app and listen on ephemeral port.

const BASE = process.env.TEST_BASE || "http://localhost:5000";

test("health endpoint returns ok", async () => {
  const res = await request(`${BASE}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});
