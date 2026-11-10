import test from "node:test";
import assert from "node:assert/strict";
import { writeRequestMetric } from "./telemetry.mjs";

test("writes bounded-cardinality request metrics to Analytics Engine", () => {
  const points = [];
  const binding = { writeDataPoint: (point) => points.push(point) };
  assert.equal(writeRequestMetric(binding, { method: "GET", routeClass: "services", status: 200, requestId: "req-12345678", path: "/api/v1/services", durationMs: 12.5 }), true);
  assert.deepEqual(points[0].indexes, ["GET", "services", "2xx"]);
  assert.deepEqual(points[0].blobs, ["req-12345678", "/api/v1/services"]);
  assert.deepEqual(points[0].doubles, [12.5]);
});

test("normalizes untrusted metric dimensions and bounds duration", () => {
  const points = [];
  writeRequestMetric({ writeDataPoint: (point) => points.push(point) }, { method: "SECRET", routeClass: "user-controlled", status: 503, requestId: "x".repeat(200), path: "/".repeat(300), durationMs: 999999 });
  assert.deepEqual(points[0].indexes, ["OTHER", "other", "5xx"]);
  assert.equal(points[0].blobs[0].length, 80);
  assert.equal(points[0].blobs[1].length, 160);
  assert.deepEqual(points[0].doubles, [120000]);
});

test("does not fail when Analytics Engine binding is absent", () => {
  assert.equal(writeRequestMetric(undefined, {}), false);
});
