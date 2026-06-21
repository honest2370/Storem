# WebCash Backend

Express.js backend for WebCash payment integration with AshTechPay.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://whglmhqnestemuhvtpsm.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

ASHTECH_BASE_URL=https://ashtechpay.top
ASHTECH_API_KEY=your_ashtechpay_api_key

YOUR_DOMAIN=https://your-frontend.vercel.app
```

3. Run the SQL schema in Supabase:
```bash
# Run supabase/schema.sql and supabase/transactions.sql in Supabase SQL Editor
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/countries` | Fetch supported countries |
| GET | `/api/fees` | Fetch transaction fees |
| POST | `/api/pay` | Initiate payment |
| POST | `/api/otp` | Submit OTP for verification |
| GET | `/api/status/:id` | Check transaction status |
| POST | `/api/webhook` | AshTechPay webhook handler |
| GET | `/api/wallet/:user_id` | Get user wallet |
| GET | `/api/transactions/:user_id` | Get transaction history |

## Payment Flow

1. **Frontend** calls `POST /api/pay` with payment details
2. **Backend** creates pending transaction in Supabase
3. **Backend** calls AshTechPay `/v1/collect`
4. **AshTechPay** sends USSD/STK push to user's phone
5. User approves payment on phone
6. **AshTechPay** sends webhook to `POST /api/webhook`
7. **Backend** updates transaction status and credits wallet

## Deployment to Vercel

1. Create a new Vercel project for the backend
2. Add environment variables
3. Deploy

Or deploy as a single project with rewrites in `vercel.json`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `ASHTECH_BASE_URL` | No | AshTechPay API URL |
| `ASHTECH_API_KEY` | Yes | AshTechPay API key |
| `YOUR_DOMAIN` | Yes | Your frontend domain for webhooks |
