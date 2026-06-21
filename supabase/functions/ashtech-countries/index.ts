// supabase/functions/ashtech-countries/index.ts
// Public, read-only proxy for GET /v1/countries
// No secret reaches the browser — the key is attached here, server-side only

import { corsHeaders, ASHTECH_BASE, json } from "../_shared/ashtech.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ASHTECH_API_KEY");
  if (!apiKey) {
    return json({ error: "server_misconfigured", message: "API key not configured" }, 500);
  }

  try {
    const res = await fetch(`${ASHTECH_BASE}/v1/countries`, {
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
    });
    
    const data = await res.json();
    return json(data, res.status);
  } catch (e) {
    console.error("Failed to fetch countries:", e);
    return json({ error: "upstream_error", message: String(e) }, 502);
  }
});
