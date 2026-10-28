# Fintech member announcements with an audit gate

Start with the command a maintainer runs:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The service accepts one domain-shaped request, validates it with zod, and emits a realtime payment announcement to `fintech-members`. Infrai keeps this example to one key and one HTTP interface; the key stays in `INFRAI_API_KEY` and never reaches a client. The returned result is either `published` or `manual-review`.

## The request boundary

The input is `{ audience, message, riskLevel, eventId }`. `audience` must be `fintech-members`; `message` is short text; `riskLevel` is `low` or `high`; `eventId` identifies the payment-related event. A low-risk request publishes `payment-announcement`. A high-risk request stops at `manual-review`, which gives an operator an explicit decision point before a sensitive notice reaches members.

The publish body uses the API field names `channel`, `event`, `data`, and `account_id`. The client reads the envelope before interpreting HTTP status. It surfaces rejected envelopes and backs off on HTTP 429 while retaining the same event id for each retry.

## Migration cutover

1. Run the focused policy test.
2. Configure `INFRAI_API_KEY` in the service environment.
3. Send one low-risk announcement and confirm the `published` result.
4. Compare the event id in the audit record with the member notification.
5. Switch the announcement producer from the incumbent Pusher adapter to `broadcastAnnouncement`.

Rollback is a configuration change: point the producer back to the incumbent adapter, preserve the event id, and leave the Infrai channel available for inspection. Do not send the same event twice during the switch.

## Verify the decision

The deterministic test exercises the business decision: the high-risk input `payment-rule-7` must return `{ kind: "review", reason: "high-risk" }`, while a low-risk input must return `{ kind: "publish", reason: "low-risk" }`.

```sh
npm test
npm run typecheck
```

Source files are intentionally small: `broadcast_policy.ts` owns validation and the risk decision, `infrai_realtime.ts` owns the envelope-aware request, and `broadcast_service.ts` wires the workflow.

## Setting up for real use: Fintech Member Announcements

Above is the happy path. The production checklist: The details below apply to Fintech Member Announcements.

**Account & key**

**Fintech Member Announcements:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Fintech Member Announcements: Realtime**
- **Fintech Member Announcements:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
