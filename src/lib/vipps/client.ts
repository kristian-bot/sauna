import { getVippsAccessToken } from './auth';

const BASE_URL = process.env.VIPPS_API_URL!;
const MSN = process.env.VIPPS_MSN!;

async function vippsHeaders() {
  const token = await getVippsAccessToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
    'Merchant-Serial-Number': MSN,
    'Vipps-System-Name': 'sauna-booking',
    'Vipps-System-Version': '1.0.0',
  };
}

export interface CreatePaymentParams {
  reference: string;
  amount: number; // øre
  description: string;
  callbackUrl: string;
  returnUrl: string;
  customerPhone?: string;
}

export async function createVippsPayment(params: CreatePaymentParams) {
  const headers = await vippsHeaders();
  const body = {
    merchantInfo: {
      callbackPrefix: params.callbackUrl,
      returnUrl: params.returnUrl,
      paymentType: 'eComm Regular Payment',
    },
    transaction: {
      orderId: params.reference,
      amount: params.amount,
      transactionText: params.description,
    },
    ...(params.customerPhone ? {
      customerInfo: {
        mobileNumber: params.customerPhone.replace(/\D/g, '').replace(/^47/, ''),
      },
    } : {}),
  };

  const response = await fetch(
    `${BASE_URL}/ecomm/v2/payments`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vipps create payment failed: ${response.status} ${error}`);
  }

  return response.json() as Promise<{ orderId: string; url: string }>;
}

export async function captureVippsPayment(orderId: string, amount: number) {
  const headers = await vippsHeaders();
  const body = {
    merchantInfo: { merchantSerialNumber: MSN },
    transaction: {
      amount,
      transactionText: 'Badstu booking bekreftet',
    },
  };

  const response = await fetch(
    `${BASE_URL}/ecomm/v2/payments/${orderId}/capture`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vipps capture failed: ${response.status} ${error}`);
  }

  return response.json();
}

export async function cancelVippsPayment(orderId: string) {
  const headers = await vippsHeaders();
  const body = {
    merchantInfo: { merchantSerialNumber: MSN },
    transaction: { transactionText: 'Booking kansellert' },
  };

  const response = await fetch(
    `${BASE_URL}/ecomm/v2/payments/${orderId}/cancel`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vipps cancel failed: ${response.status} ${error}`);
  }

  return response.json();
}

export async function refundVippsPayment(orderId: string, amount: number) {
  const headers = await vippsHeaders();
  const body = {
    merchantInfo: { merchantSerialNumber: MSN },
    transaction: {
      amount,
      transactionText: 'Badstu booking refundert',
    },
  };

  const response = await fetch(
    `${BASE_URL}/ecomm/v2/payments/${orderId}/refund`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vipps refund failed: ${response.status} ${error}`);
  }

  return response.json();
}

export async function getVippsPaymentStatus(orderId: string) {
  const headers = await vippsHeaders();

  const response = await fetch(
    `${BASE_URL}/ecomm/v2/payments/${orderId}/details`,
    {
      method: 'GET',
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vipps status failed: ${response.status} ${error}`);
  }

  return response.json();
}
