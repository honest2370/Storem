require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Initialize Express
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize AshTechPay Axios instance
const ashtech = axios.create({
  baseURL: process.env.ASHTECH_BASE_URL || 'https://ashtechpay.top',
  headers: {
    'Authorization': `Bearer ${process.env.ASHTECH_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate unique reference
const generateReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `WC-${timestamp}-${random}`.toUpperCase();
};

// Log helper
const logger = {
  info: (message, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, JSON.stringify(data)),
  error: (message, error = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error.message || error)
};

// Handle AshTechPay errors
const handleAshtechError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    const errorMap = {
      400: 'bad_request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not_found',
      422: 'unprocessable',
      429: 'rate_limited',
      500: 'server_error',
      502: 'gateway_error',
      503: 'gateway_error',
      504: 'gateway_error'
    };
    
    return {
      status,
      error: data.error || errorMap[status] || 'unknown_error',
      message: data.message || error.message,
      details: data
    };
  }
  
  return {
    status: 500,
    error: 'network_error',
    message: error.message || 'Network error occurred'
  };
};

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'WebCash Payment Server',
    timestamp: new Date().toISOString()
  });
});

// Health check for monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// ============================================
// GET /countries - Fetch supported countries
// ============================================
app.get('/api/countries', async (req, res) => {
  try {
    logger.info('Fetching countries');
    
    const response = await ashtech.get('/v1/countries');
    
    logger.info('Countries fetched successfully', { count: response.data?.length || 0 });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    logger.error('Failed to fetch countries', error);
    const apiError = handleAshtechError(error);
    res.status(apiError.status).json({
      success: false,
      error: apiError.error,
      message: apiError.message
    });
  }
});

// ============================================
// GET /fees - Fetch transaction fees
// ============================================
app.get('/api/fees', async (req, res) => {
  try {
    logger.info('Fetching fees');
    
    const response = await ashtech.get('/v1/fees');
    
    logger.info('Fees fetched successfully');
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    logger.error('Failed to fetch fees', error);
    const apiError = handleAshtechError(error);
    res.status(apiError.status).json({
      success: false,
      error: apiError.error,
      message: apiError.message
    });
  }
});

// ============================================
// POST /api/pay - Initiate payment collection
// ============================================
app.post('/api/pay', async (req, res) => {
  try {
    const {
      amount,
      currency,
      phone,
      operator,
      country_code,
      reference,
      user_id
    } = req.body;

    // Validate required fields
    if (!amount || !currency || !phone || !operator || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Missing required fields: amount, currency, phone, operator, user_id'
      });
    }

    // Generate reference if not provided
    const txReference = reference || generateReference();

    logger.info('Processing payment', { 
      amount, 
      currency, 
      phone: phone.replace(/\d(?=\d{4})/g, '*'), 
      operator, 
      reference: txReference 
    });

    // Insert pending transaction into database
    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        reference: txReference,
        user_id,
        amount,
        currency,
        phone,
        operator,
        country_code,
        status: 'pending'
      });

    if (dbError) {
      logger.error('Failed to create transaction record', dbError);
      // Continue anyway - the payment can still proceed
    }

    // Call AshTechPay collect API
    const response = await ashtech.post('/v1/collect', {
      amount,
      currency,
      phone,
      operator,
      country_code,
      reference: txReference,
      notify_url: `${process.env.YOUR_DOMAIN}/api/webhook`
    });

    logger.info('Payment initiated successfully', { reference: txReference });

    // Update transaction with AshTechPay response
    if (response.data?.transaction_id) {
      await supabase
        .from('transactions')
        .update({ transaction_id: response.data.transaction_id })
        .eq('reference', txReference);
    }

    res.json({
      success: true,
      reference: txReference,
      ...response.data
    });

  } catch (error) {
    logger.error('Payment failed', error);
    const apiError = handleAshtechError(error);
    
    // Update transaction status to failed
    if (req.body.reference) {
      await supabase
        .from('transactions')
        .update({ status: 'failed', error: apiError.message })
        .eq('reference', req.body.reference);
    }
    
    res.status(apiError.status).json({
      success: false,
      error: apiError.error,
      message: apiError.message,
      details: apiError.details
    });
  }
});

// ============================================
// POST /api/otp - Submit OTP for payment
// ============================================
app.post('/api/otp', async (req, res) => {
  try {
    const { otp, reference, ...paymentData } = req.body;

    if (!otp || !reference) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'OTP and reference are required'
      });
    }

    logger.info('Processing OTP submission', { reference });

    // Resubmit to collect endpoint with OTP
    const response = await ashtech.post('/v1/collect', {
      ...paymentData,
      otp,
      reference
    });

    logger.info('OTP processed successfully', { reference });

    res.json({
      success: true,
      reference,
      ...response.data
    });

  } catch (error) {
    logger.error('OTP submission failed', error);
    const apiError = handleAshtechError(error);
    res.status(apiError.status).json({
      success: false,
      error: apiError.error,
      message: apiError.message
    });
  }
});

// ============================================
// GET /api/status/:id - Check transaction status
// ============================================
app.get('/api/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'bad_request',
        message: 'Transaction ID or reference is required'
      });
    }

    logger.info('Checking transaction status', { id });

    // Check AshTechPay status
    const response = await ashtech.get(`/v1/transaction/${id}`);

    // Also check local database
    const { data: localTx } = await supabase
      .from('transactions')
      .select('*')
      .or(`reference.eq.${id},transaction_id.eq.${id}`)
      .single();

    res.json({
      success: true,
      reference: id,
      ashtech_status: response.data?.status,
      local_status: localTx?.status,
      transaction: localTx,
      ...response.data
    });

  } catch (error) {
    logger.error('Status check failed', error);
    const apiError = handleAshtechError(error);
    res.status(apiError.status).json({
      success: false,
      error: apiError.error,
      message: apiError.message
    });
  }
});

// ============================================
// POST /api/webhook - Handle AshTechPay webhooks
// ============================================
app.post('/api/webhook', async (req, res) => {
  // Immediately respond to prevent timeout
  res.status(200).json({ received: true, timestamp: new Date().toISOString() });

  const payload = req.body;
  
  logger.info('Webhook received', { 
    event: payload.event, 
    reference: payload.reference 
  });

  try {
    // Handle different webhook events
    switch (payload.event) {
      case 'payment.completed':
        await handlePaymentCompleted(payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      
      case 'payout.completed':
        logger.info('Payout completed', { reference: payload.reference });
        break;
      
      case 'payout.failed':
        logger.error('Payout failed', { reference: payload.reference });
        break;
      
      default:
        logger.info('Unknown webhook event', { event: payload.event });
    }
  } catch (error) {
    logger.error('Webhook processing error', error);
  }
});

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handlePaymentCompleted(payload) {
  const { reference, transaction_id, amount, user_id } = payload;

  logger.info('Processing payment.completed', { reference, transaction_id });

  // Update transaction status
  const { error: txError } = await supabase
    .from('transactions')
    .update({
      status: 'success',
      transaction_id,
      completed_at: new Date().toISOString()
    })
    .eq('reference', reference);

  if (txError) {
    logger.error('Failed to update transaction', txError);
    return;
  }

  // Get or create user wallet
  let { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (walletError || !wallet) {
    // Create wallet if doesn't exist
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        user_id,
        balance: 0
      })
      .select()
      .single();
    
    if (createError) {
      logger.error('Failed to create wallet', createError);
      return;
    }
    wallet = newWallet;
  }

  // Credit user wallet
  const newBalance = (wallet.balance || 0) + parseFloat(amount);
  
  const { error: updateError } = await supabase
    .from('wallets')
    .update({ 
      balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user_id);

  if (updateError) {
    logger.error('Failed to update wallet balance', updateError);
    return;
  }

  // Create wallet transaction record
  await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      user_id,
      type: 'deposit',
      amount: parseFloat(amount),
      reference,
      transaction_id,
      status: 'completed'
    });

  logger.info('Wallet credited successfully', { 
    user_id, 
    amount, 
    new_balance: newBalance 
  });

  // Update user subscription if this was a subscription payment
  // (You can add logic here based on payment metadata)
}

async function handlePaymentFailed(payload) {
  const { reference, error, message } = payload;

  logger.info('Processing payment.failed', { reference, error, message });

  await supabase
    .from('transactions')
    .update({
      status: 'failed',
      error: message || error,
      failed_at: new Date().toISOString()
    })
    .eq('reference', reference);
}

// ============================================
// USER WALLET ENDPOINTS
// ============================================

// Get user wallet balance
app.get('/api/wallet/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error) {
      // Create wallet if doesn't exist
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({ user_id, balance: 0 })
        .select()
        .single();
      
      return res.json({ success: true, wallet: newWallet });
    }

    res.json({ success: true, wallet });

  } catch (error) {
    logger.error('Failed to fetch wallet', error);
    res.status(500).json({ success: false, error: 'Failed to fetch wallet' });
  }
});

// Get transaction history
app.get('/api/transactions/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ success: true, transactions });

  } catch (error) {
    logger.error('Failed to fetch transactions', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'not_found',
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: 'server_error',
    message: 'Internal server error'
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, { 
    environment: process.env.NODE_ENV || 'development',
    ashtech_url: process.env.ASHTECH_BASE_URL
  });
});

module.exports = app;
