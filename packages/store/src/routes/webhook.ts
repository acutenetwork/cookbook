import type { Payment } from "@cookbook/acute";
import { verifyAcuteSignature, type AcuteEvent } from "@cookbook/acute/webhook";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { webhookEvents } from "../db/schema";
import { applyPayment, findOrderForPayment } from "../orders";

/**
 * The receiver for every Acute event, at `/api/webhooks/acute`.
 *
 * Verify over the RAW body, skip an event already handled (delivery is
 * at-least-once), apply it, and only then record it. Recording last means a
 * failure part way through is retried by Acute instead of being remembered as
 * done; applying twice is harmless because order statuses only move forward.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.ACUTE_WEBHOOK_SECRET;
  if (!secret) throw new Error("ACUTE_WEBHOOK_SECRET is not set, so no webhook can be verified.");

  if (!verifyAcuteSignature(raw, request.headers.get("x-acute-signature"), secret)) {
    return new Response("invalid signature", { status: 400 });
  }

  let event: AcuteEvent<{ id?: string }>;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const seen = await db
    .select({ eventId: webhookEvents.eventId })
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, event.id))
    .get();
  if (seen) return Response.json({ ok: true, duplicate: true });

  if (event.type.startsWith("payment.")) {
    const payment = event.data as unknown as Payment;
    const order = await findOrderForPayment(payment);
    if (order) await applyPayment(order, payment);
  }

  await db
    .insert(webhookEvents)
    .values({
      eventId: event.id,
      type: event.type,
      resourceId: event.data?.id ?? null,
      payload: raw,
      receivedAt: new Date(),
    })
    .onConflictDoNothing();

  return Response.json({ ok: true });
}
