import type { VercelRequest, VercelResponse } from '@vercel/node';

// AshTechPay Direct Collect API Proxy
// This serverless function handles API calls to avoid CORS issues

const ASHTECHPAY_API_URL = 'https://ashtechpay.top/v1/collect';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variables
  const apiKey = process.env.VITE_ASHTECHPAY_API_KEY || process.env.ASHTECHPAY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'AshTechPay API key not configured' 
    });
  }

  try {
    const { amount, currency, phone, operator, reference } = req.body;

    // Validate required fields
    if (!amount || !currency || !phone || !operator) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, currency, phone, operator'
      });
    }

    // Make request to AshTechPay
    const response = await fetch(ASHTECHPAY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        phone,
        operator,
        reference: reference || `WC-${Date.now()}`
      })
    });

    const data = await response.json();

    // Return the response
    return res.status(response.status).json({
      success: response.ok && data.success !== false,
      ...data
    });

  } catch (error) {
    console.error('AshTechPay proxy error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
