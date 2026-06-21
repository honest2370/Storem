// supabase/functions/_shared/ashtech.ts
// Shared utilities for all AshTechPay edge functions

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export const ASHTECH_BASE = "https://ashtechpay.top";

// Subscription price in XAF/XOF
export const SUBSCRIPTION_PRICE = 1800;

// Country to currency mapping (West & Central Africa)
export const COUNTRY_CURRENCY: Record<string, string> = {
  // Central Africa (XAF)
  CM: "XAF",  // Cameroon
  CF: "XAF",  // Central African Republic
  CG: "XAF",  // Congo
  GA: "XAF",  // Gabon
  GQ: "XAF",  // Equatorial Guinea
  TD: "XAF",  // Chad
  CD: "CDF",  // DR Congo
  
  // West Africa (XOF)
  BJ: "XOF",  // Benin
  BF: "XOF",  // Burkina Faso
  CI: "XOF",  // Ivory Coast
  GW: "XOF",  // Guinea-Bissau
  ML: "XOF",  // Mali
  NE: "XOF",  // Niger
  SN: "XOF",  // Senegal
  TG: "XOF",  // Togo
  GN: "GNF",  // Guinea
  
  // East Africa
  KE: "KES",  // Kenya
  UG: "UGX",  // Uganda
  TZ: "TZS",  // Tanzania
  RW: "RWF",  // Rwanda
  MG: "MGA",  // Madagascar
  
  // Other
  NG: "NGN",  // Nigeria
  GH: "GHS",  // Ghana
  ZA: "ZAR",  // South Africa
};

// Currency conversion rates (to XAF)
export const CURRENCY_RATES: Record<string, number> = {
  XAF: 1,
  XOF: 1,
  USD: 600,
  EUR: 655,
  NGN: 0.4,
  KES: 4.5,
  GHS: 38,
  CDF: 0.33,
  ZAR: 32,
  UGX: 0.16,
  TZS: 0.23,
  RWF: 0.6,
  MGA: 0.16,
  GNF: 0.06,
};

// Get price for a country
export function priceFor(countryCode: string): { amount: number; currency: string } | null {
  const currency = COUNTRY_CURRENCY[countryCode];
  if (!currency) return null;
  
  // Convert from XAF to local currency if needed
  const rate = CURRENCY_RATES[currency] || 1;
  const amount = Math.round(SUBSCRIPTION_PRICE * rate);
  
  return { amount, currency };
}

// JSON response helper
export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Generate unique reference
export function generateReference(userId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `WC-${userId.slice(0, 8)}-${timestamp}-${random}`.toUpperCase();
}
