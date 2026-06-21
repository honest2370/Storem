// WebCash Payment Integration using Supabase Edge Functions
// All API calls go through Supabase functions - no CORS issues, keys stay server-side

import { supabase } from './supabase';

// Types
interface CollectResponse {
  success: boolean;
  transaction_id?: string;
  status?: string;
  message?: string;
  error?: string;
  otp_required?: boolean;
  reference?: string;
  price?: { amount: number; currency: string };
}

// Mobile Money Operators by Country
export const MOBILE_MONEY_OPERATORS: Record<string, { name: string; code: string }[]> = {
  CM: [
    { name: 'MTN Mobile Money', code: 'MTN' },
    { name: 'Orange Money', code: 'ORANGE' }
  ],
  NG: [
    { name: 'MTN Mobile Money', code: 'MTN' },
    { name: 'Airtel Money', code: 'AIRTEL' }
  ],
  KE: [
    { name: 'M-Pesa', code: 'MPESA' },
    { name: 'Airtel Money', code: 'AIRTEL' }
  ],
  GH: [
    { name: 'MTN Mobile Money', code: 'MTN' },
    { name: 'Vodafone Cash', code: 'VODAFONE' },
    { name: 'AirtelTigo Money', code: 'AIRTELTIGO' }
  ],
  CI: [
    { name: 'Orange Money', code: 'ORANGE' },
    { name: 'MTN Mobile Money', code: 'MTN' },
    { name: 'Moov Money', code: 'MOOV' }
  ],
  SN: [
    { name: 'Orange Money', code: 'ORANGE' },
    { name: 'Wave', code: 'WAVE' },
    { name: 'Free Money', code: 'FREE' }
  ],
  UG: [
    { name: 'MTN Mobile Money', code: 'MTN' },
    { name: 'Airtel Money', code: 'AIRTEL' }
  ],
  TZ: [
    { name: 'M-Pesa', code: 'MPESA' },
    { name: 'Airtel Money', code: 'AIRTEL' },
    { name: 'Tigo Pesa', code: 'TIGO' }
  ],
  RW: [
    { name: 'MTN Mobile Money', code: 'MTN' },
    { name: 'Airtel Money', code: 'AIRTEL' }
  ],
  MG: [
    { name: 'MVola', code: 'MVOLA' },
    { name: 'Orange Money', code: 'ORANGE' }
  ],
  CD: [
    { name: 'M-Pesa', code: 'MPESA' },
    { name: 'Orange Money', code: 'ORANGE' },
    { name: 'Airtel Money', code: 'AIRTEL' }
  ]
};

// Currencies with conversion rates
export const CURRENCIES: Record<string, { code: string; symbol: string; rate: number; name: string }> = {
  XAF: { code: 'XAF', symbol: 'FCFA', rate: 1, name: 'CFA Franc (Central)' },
  XOF: { code: 'XOF', symbol: 'FCFA', rate: 1, name: 'CFA Franc (West)' },
  NGN: { code: 'NGN', symbol: '₦', rate: 2.5, name: 'Nigerian Naira' },
  KES: { code: 'KES', symbol: 'KSh', rate: 0.21, name: 'Kenyan Shilling' },
  GHS: { code: 'GHS', symbol: 'GH₵', rate: 0.026, name: 'Ghanaian Cedi' },
  UGX: { code: 'UGX', symbol: 'USh', rate: 6.1, name: 'Ugandan Shilling' },
  TZS: { code: 'TZS', symbol: 'TSh', rate: 4.2, name: 'Tanzanian Shilling' },
  RWF: { code: 'RWF', symbol: 'FRw', rate: 2.5, name: 'Rwandan Franc' },
  CDF: { code: 'CDF', symbol: 'FC', rate: 4.8, name: 'Congolese Franc' },
  MGA: { code: 'MGA', symbol: 'Ar', rate: 7.5, name: 'Malagasy Ariary' }
};

// Countries
export const COUNTRIES = [
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF', phonePrefix: '+237' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', phonePrefix: '+234' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', phonePrefix: '+254' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', phonePrefix: '+233' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', currency: 'XOF', phonePrefix: '+225' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF', phonePrefix: '+221' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX', phonePrefix: '+256' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', phonePrefix: '+255' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', phonePrefix: '+250' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', currency: 'MGA', phonePrefix: '+261' },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩', currency: 'CDF', phonePrefix: '+243' }
];

export const BASE_AMOUNT_XAF = 1800;

// Helper functions
export const convertCurrency = (amountXAF: number, toCurrency: string): number => {
  const currency = CURRENCIES[toCurrency];
  if (!currency) return amountXAF;
  return Math.round(amountXAF * currency.rate * 100) / 100;
};

export const formatPhoneForAPI = (phone: string, countryCode: string): string => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return phone.replace(/\D/g, '');
  
  let cleanPhone = phone.replace(/\D/g, '');
  const prefix = country.phonePrefix.replace('+', '');
  
  if (cleanPhone.startsWith(prefix)) {
    cleanPhone = cleanPhone.substring(prefix.length);
  }
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  return cleanPhone;
};

export const getOperatorsForCountry = (countryCode: string) => MOBILE_MONEY_OPERATORS[countryCode] || [];
export const getCountryInfo = (countryCode: string) => COUNTRIES.find(c => c.code === countryCode);
export const getCurrencyInfo = (currencyCode: string) => CURRENCIES[currencyCode] || CURRENCIES.XAF;

/**
 * Fetch supported countries from Supabase Edge Function
 */
export const fetchCountries = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('ashtech-countries');
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch countries' };
  }
};

/**
 * Fetch transaction fees from Supabase Edge Function
 */
export const fetchFees = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('ashtech-fees');
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch fees' };
  }
};

/**
 * Initiate payment collection via Supabase Edge Function
 */
export const initiateCollect = async (params: {
  phone: string;
  operator: string;
  country_code: string;
  otp?: string;
  reference?: string;
  referrer_id?: string;
}): Promise<CollectResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('ashtech-collect', {
      body: params
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Payment request failed'
      };
    }

    return {
      success: data.success !== false,
      transaction_id: data.transaction_id,
      status: data.status || 'pending',
      message: data.message || 'Payment request sent. Check your phone.',
      otp_required: data.otp_required,
      reference: data.reference,
      price: data.price
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};

/**
 * Check payment status via Supabase Edge Function
 */
export const checkPaymentStatus = async (params: {
  transaction_id?: string;
  reference?: string;
}): Promise<{
  success: boolean;
  status: string;
  paid: boolean;
  local_status?: string;
  ashtech_status?: string;
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.transaction_id) {
      queryParams.set('transaction_id', params.transaction_id);
    }
    if (params.reference) {
      queryParams.set('reference', params.reference);
    }

    const { data, error } = await supabase.functions.invoke(
      `ashtech-status?${queryParams.toString()}`
    );

    if (error) {
      return { success: false, status: 'error', paid: false };
    }

    return {
      success: data.success,
      status: data.local_status || data.ashtech_status || 'unknown',
      paid: data.paid || false,
      local_status: data.local_status,
      ashtech_status: data.ashtech_status
    };
  } catch {
    return { success: false, status: 'unknown', paid: false };
  }
};

/**
 * Generate unique reference
 */
export const generateReference = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `WC-${timestamp}-${random}`.toUpperCase();
};
