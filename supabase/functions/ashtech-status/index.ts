// supabase/functions/ashtech-status/index.ts
// Authenticated proxy for GET /v1/transaction/:id
// Verifies ownership before returning status

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, ASHTECH_BASE, json } from "../_shared/ashtech.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ASHTECH_API_KEY");
  if (!apiKey) {
    return json({ error: "server_misconfigured" }, 500);
  }

  // Verify user authentication
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "unauthorized" }, 401);
  }

  // Get transaction_id from query params
  const url = new URL(req.url);
  const transactionId = url.searchParams.get("transaction_id");
  const reference = url.searchParams.get("reference");

  if (!transactionId && !reference) {
    return json({ error: "bad_request", message: "transaction_id or reference is required" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Look up the pending payment and verify ownership
  let query = admin.from("pending_payments").select("*");
  
  if (transactionId) {
    query = query.eq("transaction_id", transactionId);
  } else {
    query = query.eq("reference", reference);
  }
  
  const { data: pending } = await query.maybeSingle();

  if (!pending || pending.user_id !== userData.user.id) {
    return json({ error: "forbidden", message: "Transaction not found or access denied" }, 403);
  }

  // Get status from AshTechPay if we have a transaction_id
  let ashtechStatus = null;
  if (pending.transaction_id) {
    try {
      const res = await fetch(`${ASHTECH_BASE}/v1/transaction/${encodeURIComponent(pending.transaction_id)}`, {
        headers: { 
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
      });
      ashtechStatus = await res.json();
    } catch {
      // Continue with local status if upstream fails
    }
  }

  return json({
    success: true,
    local_status: pending.status,
    ashtech_status: ashtechStatus?.status,
    reference: pending.reference,
    transaction_id: pending.transaction_id,
    expected_amount: pending.expected_amount,
    expected_currency: pending.expected_currency,
    created_at: pending.created_at,
    paid: pending.status === "completed",
    ashtech_data: ashtechStatus
  });
});
