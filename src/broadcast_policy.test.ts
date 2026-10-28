import test from "node:test";
import assert from "node:assert/strict";
import { announcementRequest, decideBroadcast } from "./broadcast_policy.ts";

test("high-risk payment announcements wait for review", () => {
  const request = announcementRequest.parse({ audience: "fintech-members", message: "A payout rule changed.", riskLevel: "high", eventId: "payment-rule-7" });
  assert.deepEqual(decideBroadcast(request), { kind: "review", reason: "high-risk" });
});

test("low-risk announcements are publishable", () => {
  const request = announcementRequest.parse({ audience: "fintech-members", message: "The status page is updated.", riskLevel: "low", eventId: "status-8" });
  assert.deepEqual(decideBroadcast(request), { kind: "publish", reason: "low-risk" });
});
