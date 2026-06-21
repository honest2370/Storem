// supabase/functions/ashtech-webhook/index.ts
// Called by AshTechPay (server-to-server), NOT by the browser
// Deploy with --no-verify-jwt since AshTechPay won't send a Supabase JWT

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json } from "../_shared/ashtech.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Referral commission in XAF
const REFERRAL_AMOUNT = 200;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // Parse webhook payload
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    // Acknowledge even if we can't parse
    return json({ received: true });
  }

  // Acknowledge immediately, process asynchronously
  const ackResponse = json({ received: true });
  
  handleWebhookEvent(payload).catch((e) => {
    console.error("Webhook handling failed:", e);
  });
  
  return ackResponse;
});

async function handleWebhookEvent(payload: Record<string, unknown>) {
  const { event, reference, total_amount, currency, transaction_id } = payload;
  
  if (!reference) {
    console.log("No reference in webhook payload");
    return;
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Look up the pending payment
  const { data: pending, error: fetchError } = await admin
    .from("pending_payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (!pending) {
    console.log("Unknown reference:", reference);
    return;
  }

  // Handle payment failed
  if (event === "payment.failed") {
    await admin
      .from("pending_payments")
      .update({ 
        status: "failed",
        failed_at: new Date().toISOString()
      })
      .eq("reference", reference);
    return;
  }

  // Handle payment completed
  if (event !== "payment.completed") {
    return;
  }

  // Prevent double-processing
  if (pending.status === "completed") {
    console.log("Already processed:", reference);
    return;
  }

  // Verify paid amount matches expected
  const paidEnough =
    typeof total_amount === "number" &&
    total_amount >= pending.expected_amount &&
    currency === pending.expected_currency;

  if (!paidEnough) {
    console.log("Amount mismatch:", { 
      expected: pending.expected_amount, 
      paid: total_amount,
      currency 
    });
    await admin
      .from("pending_payments")
      .update({ status: "amount_mismatch" })
      .eq("reference", reference);
    return;
  }

  const userId = pending.user_id;

  // Update payment status
  await admin
    .from("pending_payments")
    .update({
      status: "completed",
      transaction_id: transaction_id || pending.transaction_id,
      completed_at: new Date().toISOString()
    })
    .eq("reference", reference);

  // Grant subscription access
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await admin
    .from("users")
    .update({
      subscription_active: true,
      subscription_expires_at: expiresAt.toISOString(),
      subscription_purchased_at: new Date().toISOString()
    })
    .eq("id", userId);

  // Credit wallet with purchase amount
  const { data: wallet } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (wallet) {
    await admin
      .from("wallets")
      .update({
        balance: wallet.balance + pending.expected_amount,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);
  } else {
    await admin
      .from("wallets")
      .insert({
        user_id: userId,
        balance: pending.expected_amount
      });
  }

  // Record wallet transaction
  await admin
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      type: "subscription",
      amount: pending.expected_amount,
      reference,
      transaction_id: transaction_id || pending.transaction_id,
      status: "completed"
    });

  // Handle referral commission
  if (pending.referrer_id && pending.referrer_id !== userId) {
    try {
      // Credit referrer's wallet
      const { data: referrerWallet } = await admin
        .from("wallets")
        .select("balance")
        .eq("user_id", pending.referrer_id)
        .maybeSingle();

      if (referrerWallet) {
        await admin
          .from("wallets")
          .update({
            balance: referrerWallet.balance + REFERRAL_AMOUNT,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", pending.referrer_id);
      } else {
        await admin
          .from("wallets")
          .insert({
            user_id: pending.referrer_id,
            balance: REFERRAL_AMOUNT
          });
      }

      // Record referral earning
      await admin
        .from("referral_earnings")
        .insert({
          referrer_id: pending.referrer_id,
          referred_user_id: userId,
          amount: REFERRAL_AMOUNT,
          status: "completed"
        });

      // Notify referrer
      await admin
        .from("notifications")
        .insert({
          user_id: pending.referrer_id,
          title: "Referral Bonus",
          message: `You earned ${REFERRAL_AMOUNT} XAF from a referral!`,
          type: "success"
        });

    } catch (e) {
      console.error("Failed to process referral:", e);
    }
  }

  console.log("Payment completed successfully:", {
    userId,
    reference,
    amount: pending.expected_amount
  });
}
