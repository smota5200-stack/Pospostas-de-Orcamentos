import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";
import { sendPaymentConfirmationEmail, sendAdminNotificationEmail } from "../services/email";
import { sendOrderStatusUpdateWhatsApp } from "../services/whatsapp";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2026-01-28.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Detectar eventos de teste
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("[Webhook] Processing payment_intent.succeeded:", paymentIntent.id);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  try {
    // Buscar pedido pelo payment intent ID
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

    if (existingOrders.length > 0) {
      const order = existingOrders[0];
      await db
        .update(orders)
        .set({
          status: "paid",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      console.log(`[Webhook] Order ${order.id} marked as paid`);

      // Enviar email e WhatsApp de confirmacao
      if (order.customerEmail) {
        await sendPaymentConfirmationEmail(
          order.customerEmail,
          order.customerEmail.split("@")[0],
          order.id,
          order.totalAmount
        );
      }
      if (order.customerPhone) {
        await sendOrderStatusUpdateWhatsApp(order.customerPhone, "paid", order.id);
      }

      // Notificar admin
      if (ENV.ownerOpenId) {
        await sendAdminNotificationEmail(
          "admin@painelsexpress.com",
          "payment",
          {
            orderId: order.id,
            amount: order.totalAmount,
            customerName: order.customerEmail?.split("@")[0] || "Cliente",
            customerEmail: order.customerEmail,
          }
        );
      }
    }
  } catch (error) {
    console.error("[Webhook] Error updating order status:", error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("[Webhook] Processing payment_intent.payment_failed:", paymentIntent.id);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  try {
    // Atualizar status do pedido para "cancelled"
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

    if (existingOrders.length > 0) {
      const order = existingOrders[0];
      await db
        .update(orders)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      console.log(`[Webhook] Order ${order.id} marked as cancelled`);
    }
  } catch (error) {
    console.error("[Webhook] Error updating order status:", error);
    throw error;
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log("[Webhook] Processing charge.refunded:", charge.id);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  try {
    // Atualizar status do pedido para "cancelled" se foi reembolsado
    if (charge.payment_intent && typeof charge.payment_intent === "string") {
      const existingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, charge.payment_intent));

      if (existingOrders.length > 0) {
        const order = existingOrders[0];
        await db
          .update(orders)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        console.log(`[Webhook] Order ${order.id} marked as cancelled (refunded)`);
      }
    }
  } catch (error) {
    console.error("[Webhook] Error updating order status:", error);
    throw error;
  }
}
