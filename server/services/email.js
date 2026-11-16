/**
 * Transactional email service supporting Brevo (formerly Sendinblue) REST API v3.
 * Gracefully no-ops when BREVO_API_KEY / BREVO_SENDER_EMAIL are not configured.
 */
import { emailTemplates } from './emailTemplates.js';

export { emailTemplates };

export function getEmailStatus() {
  const configured = Boolean(
    process.env.BREVO_API_KEY && (process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL)
  );
  return {
    provider: configured ? 'brevo' : 'none',
    configured,
  };
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendEmail({ to, toName, subject, htmlContent, textContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || process.env.FROM_NAME || 'Ample Semiconductors';

  if (!apiKey || !senderEmail) {
    console.info(`[email:skipped] Brevo not configured. Would send "${subject}" to ${to}`);
    return { sent: false, skipped: true, reason: 'BREVO_API_KEY or BREVO_SENDER_EMAIL not set' };
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent,
      textContent,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.warn(`[Brevo Warning] Status ${res.status}:`, body.slice(0, 200));
    throw new Error(`Brevo API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  console.log(`✓ Verification e-mail accepted by Brevo (messageId: ${data.messageId})`);
  return { sent: true, messageId: data.messageId };
}

export async function sendVerificationEmail({ to, name, code, verificationUrl }) {
  const { subject, html, text } = emailTemplates.verifyEmail(name, verificationUrl, code);
  return sendEmail({
    to,
    toName: name,
    subject,
    htmlContent: html,
    textContent: text,
  });
}
