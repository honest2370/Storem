// supabase/functions/ashtech-collect/index.ts
// Authenticated proxy for POST /v1/collect
// The AshTechPay bearer key NEVER leaves this function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  corsHeaders, 
  ASHTECH_BASE, 
  priceFor, 
  json, 
  generateReference 
} from "../_shared/ashtech.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = Deno.env.get("ASHTECH_API_KEY");
  if (!apiKey) {
    return json({ error: "server_misconfigured" }, 500);
  }

  // Identify the calling user from their JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "unauthorized", message: "Please sign in to continue" }, 401);
  }
  const userId = userData.user.id;

  // Parse request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request", message: "Invalid JSON body" }, 400);
  }

  const { phone, operator, country_code, otp, reference: existingReference, referrer_id } = body;
  
  if (!phone || !operator || !country_code) {
    return json({ 
      error: "bad_request", 
      message: "phone, operator and country_code are required" 
    }, 400);
  }

  // Calculate price based on country (never trust client)
  const price = priceFor(country_code as string);
  if (!price) {
    return json({ 
      error: "unprocessable", 
      message: "This country isn't enabled for payment yet." 
    }, 422);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Generate or reuse reference
  const reference = existingReference || generateReference(userId);

  // Create pending payment record (only on first attempt, not OTP retry)
  if (!existingReference) {
    const { error: insErr } = await admin.from("pending_payments").insert({
      reference,
      user_id: userId,
      referrer_id: referrer_id || null,
      expected_amount: price.amount,
      expected_currency: price.currency,
      phone,
      operator,
      country_code,
      status: "pending",
    });
    
    if (insErr) {
      console.error("Failed to create pending payment:", insErr);
      return json({ error: "server_error", message: insErr.message }, 500);
    }
  }

  // Webhook URL for AshTechPay to call back
  const notifyUrl = `${SUPABASE_URL}/functions/v1/ashtech-webhook`;

  // Build collect request
  const collectBody: Record<string, unknown> = {
    amount: price.amount,
    currency: price.currency,
    phone,
    operator,
    country_code,
    reference,
    notify_url: notifyUrl,
  };
  
  // Include OTP if this is a retry
  if (otp) {
    collectBody.otp = otp;
  }

  try {
    const res = await fetch(`${ASHTECH_BASE}/v1/collect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(collectBody),
    });
    
    const data = await res.json();

    // Store transaction_id for status checks
    if (data?.transaction_id) {
      await admin
        .from("pending_payments")
        .update({ transaction_id: data.transaction_id })
        .eq("reference", reference);
    }

    // Return response with our reference for OTP retry
    return json({ 
      success: res.ok,
      ...data, 
      reference,
      price: { amount: price.amount, currency: price.currency }
    }, res.status);
  } catch (e) {
    console.error("Collect request failed:", e);
    return json({ error: "upstream_error", message: String(e) }, 502);
  }
});
