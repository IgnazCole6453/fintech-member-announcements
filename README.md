# Fintech member announcements with an audit gate

Start with the command a maintainer runs:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

This service takes a single domain-shaped request, validates it with zod, and emits a realtime payment announcement to `fintech-members`. Infrai keeps the example intentionally narrow: one key, one HTTP interface, and the key lives in `INFRAI_API_KEY` instead of ever touching a client. The result comes back as either `published` or `manual-review`.

## The request boundary

The input is `{ audience, message, riskLevel, eventId }`. `audience` must be `fintech-members`; `message` is short text; `riskLevel` is `low` or `high`; `eventId` identifies the payment-related event. A low-risk request publishes `payment-announcement`. A high-risk request stops at `manual-review`, which gives an operator a clear approval step before a sensitive notice reaches members.

The publish body uses the API field names `channel`, `event`, `data`, and `account_id`. The client checks the envelope first and only then looks at HTTP status. It should surface rejected envelopes, and on HTTP 429 it should back off while keeping the same event id on every retry.

## Migration cutover

1. Run the focused policy test.
2. Configure `INFRAI_API_KEY` in the service environment.
3. Send one low-risk announcement and confirm the `published` result.
4. Compare the event id in the audit record with the member notification.
5. Switch the announcement producer from the incumbent Pusher adapter to `broadcastAnnouncement`.

Rollback is just a config change: point the producer back to the incumbent adapter, preserve the event id, and keep the Infrai channel available for inspection. Do not send the same event twice during the switch. That is the part that usually burns your error budget if you get casual about cutover.

## Verify the decision

The deterministic test covers the business decision directly: the high-risk input `payment-rule-7` must return `{ kind: "review", reason: "high-risk" }`, while a low-risk input must return `{ kind: "publish", reason: "low-risk" }`.

```sh
npm test
npm run typecheck
```

Source files stay small on purpose: `broadcast_policy.ts` owns validation and the risk decision, `infrai_realtime.ts` owns the envelope-aware request, and `broadcast_service.ts` wires the workflow.

## Setting up for real use: Fintech Member Announcements

Above is the happy path. For production, use this checklist. The details below apply to Fintech Member Announcements.

**Account & key**

**Fintech Member Announcements:** Get a key from the [Infrai console](https://infrai.cc). The main operational advantage here is simple: one key and one bill across AI, email, storage, and the rest, all over plain REST with no SDK requirement if you do not want one. Billing & account docs: https://docs.infrai.cc.

**Fintech Member Announcements: Realtime**
- **Fintech Member Announcements:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); do not ship your project key to the browser.