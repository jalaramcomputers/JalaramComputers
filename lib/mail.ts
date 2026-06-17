import nodemailer from 'nodemailer';

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getMailTransporter(): ReturnType<typeof nodemailer.createTransport> | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  if (!isMailConfigured()) {
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
}

function shopDetails() {
  return {
    name: process.env.SHOP_NAME || 'Jalaram Computers',
    phone: process.env.SHOP_PHONE || '9892848643',
    email: process.env.SHOP_EMAIL || process.env.SMTP_USER || 'jalaramcomputers21@gmail.com',
    siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  };
}

function welcomeHtml(toEmail: string): string {
  const shop = shopDetails();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${shop.name}</title>
</head>
<body style="margin:0;padding:0;background:#091A2E;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#091A2E;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#0F2640;border:1px solid rgba(212,175,55,0.25);">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#D4AF37,#e0bc4a,#D4AF37);"></td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#D4AF37;">Newsletter</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#ffffff;line-height:1.25;">
                Welcome to the family
              </h1>
              <p style="margin:18px 0 0;font-size:15px;line-height:1.65;color:rgba(232,232,232,0.88);">
                Thank you for subscribing! You&apos;re now on our list for product launches, exclusive deals, and IT tips from Mumbai&apos;s trusted partner.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;">Subscribed as</p>
                    <p style="margin:0;font-size:15px;color:#ffffff;font-weight:600;">${toEmail}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${shop.siteUrl}/shop" style="display:inline-block;padding:14px 28px;background:#D4AF37;color:#091A2E;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
                Browse Products
              </a>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(192,192,192,0.75);">
                Questions? Call <a href="tel:${shop.phone}" style="color:#D4AF37;text-decoration:none;">${shop.phone}</a>
                or email <a href="mailto:${shop.email}" style="color:#D4AF37;text-decoration:none;">${shop.email}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid rgba(212,175,55,0.15);text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(192,192,192,0.5);letter-spacing:0.08em;">
                &copy; ${new Date().getFullYear()} ${shop.name} &middot; Mumbai
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function welcomeText(toEmail: string): string {
  const shop = shopDetails();
  return `Welcome to the family — you're subscribed!

Thank you for joining the ${shop.name} newsletter.

Subscribed email: ${toEmail}

You'll receive updates on new products, exclusive deals, and IT tips.

Browse our shop: ${shop.siteUrl}/shop
Phone: ${shop.phone}
Email: ${shop.email}

— ${shop.name}, Mumbai`;
}

export async function sendNewsletterWelcomeEmail(toEmail: string): Promise<void> {
  const transporter = getMailTransporter();
  if (!transporter) {
    throw new Error('MAIL_NOT_CONFIGURED');
  }

  const shop = shopDetails();
  const fromName = process.env.MAIL_FROM_NAME || shop.name;
  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `Welcome to the family — you're subscribed! | ${shop.name}`,
    text: welcomeText(toEmail),
    html: welcomeHtml(toEmail),
  });
}
