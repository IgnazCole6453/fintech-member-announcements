import { z } from "zod";

export const announcementRequest = z.object({
  audience: z.literal("fintech-members"),
  message: z.string().trim().min(1).max(500),
  riskLevel: z.enum(["low", "high"]),
  eventId: z.string().min(1)
});

export type AnnouncementRequest = z.infer<typeof announcementRequest>;

export type BroadcastDecision =
  | { kind: "publish"; reason: "low-risk" }
  | { kind: "review"; reason: "high-risk" };

export function decideBroadcast(input: AnnouncementRequest): BroadcastDecision {
  return input.riskLevel === "high"
    ? { kind: "review", reason: "high-risk" }
    : { kind: "publish", reason: "low-risk" };
}
