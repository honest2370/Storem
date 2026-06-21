// supabase/functions/ashtech-fees/index.ts
// Public, read-only proxy for GET /v1/fees

import { corsHeaders, ASHTECH_BASE, json } from "../_shared/ashtech.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ASHTECH_API_KEY");
  if (!apiKey) {
    return json({ error: "server_misconfigured" }, 500);
  }

  try {
    const res = await fetch(`${ASHTECH_BASE}/v1/fees`, {
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
    });
    
    const data = await res.json();
    return json(data, res.status);
  } catch (e) {
    return json({ error: "upstream_error", message: String(e) }, 502);
  }
});
