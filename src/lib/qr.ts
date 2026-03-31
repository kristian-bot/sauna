import QRCode from 'qrcode';

export async function generateQRCodeDataURL(qrToken: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/booking/${qrToken}`;
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export async function generateQRCodeBuffer(qrToken: string): Promise<Buffer> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/booking/${qrToken}`;
  return QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    type: 'png',
  });
}
