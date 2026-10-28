import { announcementRequest, decideBroadcast } from "./broadcast_policy.ts";
import { InfraiRealtime } from "./infrai_realtime.ts";

export async function broadcastAnnouncement(input: unknown): Promise<{ status: string; eventId: string }> {
  const request = announcementRequest.parse(input);
  const decision = decideBroadcast(request);
  if (decision.kind === "review") return { status: "manual-review", eventId: request.eventId };

  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const infrai = new InfraiRealtime(key);
  await infrai.publish("fintech-members", "payment-announcement", {
    event_id: request.eventId,
    message: request.message,
    risk_level: request.riskLevel
  }, "fintech-broadcast-service");
  return { status: "published", eventId: request.eventId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { audience: "fintech-members", message: "Settlement window closes at 17:00 UTC.", riskLevel: "low", eventId: "settlement-window-2026-10-25" };
  broadcastAnnouncement(input).then(console.log).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
