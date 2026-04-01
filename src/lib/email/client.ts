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
    from: process.env.EMAIL_FROM || 'booking@chillsauna.no',
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
        <p style="color: #999; font-size: 12px;">Chill Sauna</p>
      </div>
    `,
  });
}

interface SendReviewRequestEmailParams {
  to: string;
  customerName: string;
  saunaName: string;
  reviewUrl: string;
}

export async function sendReviewRequestEmail(params: SendReviewRequestEmailParams) {
  const { to, customerName, saunaName, reviewUrl } = params;

  const resend = getResend();
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'booking@chillsauna.no',
    to,
    subject: `Hvordan var ${saunaName}? Gi din vurdering`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">Hvordan var badstuen?</h1>
        <p>Hei ${customerName},</p>
        <p>Vi håper du hadde en fin opplevelse hos <strong>${saunaName}</strong>!</p>
        <p>Vi ville satt stor pris på om du tok deg et øyeblikk til å gi en vurdering. Det hjelper andre med å finne gode badstuer.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${reviewUrl}" style="display: inline-block; background: #4a9d6e; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">
            Gi din vurdering
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Chill Sauna</p>
      </div>
    `,
  });
}
