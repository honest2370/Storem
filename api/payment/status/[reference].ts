import type { VercelRequest, VercelResponse } from '@vercel/node';

// AshTechPay Transaction Status Check Proxy

const ASHTECHPAY_BASE_URL = 'https://ashtechpay.top/v1/transaction';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reference } = req.query;

  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ error: 'Transaction reference is required' });
  }

  const apiKey = process.env.VITE_ASHTECHPAY_API_KEY || process.env.ASHTECHPAY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(`${ASHTECHPAY_BASE_URL}/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    return res.status(response.status).json({
      success: response.ok,
      status: data.status || 'unknown',
      paid: data.status === 'success' || data.status === 'completed',
      ...data
    });

  } catch (error) {
    console.error('AshTechPay status check error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
