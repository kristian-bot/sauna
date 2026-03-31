import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendBookingConfirmationParams {
  to: string;
  customerName: string;
  saunaName: string;
  date: string;
  hour: string;
  bookingType: string;
  numPeople: number;
  price: string;
  qrCodeUrl: string;
  bookingUrl: string;
}

export async function sendBookingConfirmation(params: SendBookingConfirmationParams) {
  const { to, customerName, saunaName, date, hour, bookingType, numPeople, price, qrCodeUrl, bookingUrl } = params;

  const typeLabel = bookingType === 'private' ? 'Privat' : 'Felles';

  const resend = getResend();
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'booking@sauna.bondep.com',
    to,
    subject: `Bookingbekreftelse – ${saunaName} ${date}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">Bookingbekreftelse</h1>
        <p>Hei ${customerName},</p>
        <p>Din booking er bekreftet!</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Badstu:</strong> ${saunaName}</p>
          <p style="margin: 4px 0;"><strong>Dato:</strong> ${date}</p>
          <p style="margin: 4px 0;"><strong>Tid:</strong> ${hour}</p>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${typeLabel}</p>
          <p style="margin: 4px 0;"><strong>Antall:</strong> ${numPeople} ${numPeople === 1 ? 'person' : 'personer'}</p>
          <p style="margin: 4px 0;"><strong>Pris:</strong> ${price}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p><strong>Vis denne QR-koden ved ankomst:</strong></p>
          <img src="${qrCodeUrl}" alt="QR-kode" style="width: 200px; height: 200px;" />
        </div>

        <p>Du kan også se bookingen din her: <a href="${bookingUrl}">${bookingUrl}</a></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">BON DEP Badstu</p>
      </div>
    `,
  });
}
