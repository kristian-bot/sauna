let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getVippsAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch(
    `${process.env.VIPPS_API_URL}/accesstoken/get`,
    {
      method: 'POST',
      headers: {
        'client_id': process.env.VIPPS_CLIENT_ID!,
        'client_secret': process.env.VIPPS_CLIENT_SECRET!,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
        'Merchant-Serial-Number': process.env.VIPPS_MSN!,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vipps auth failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}
