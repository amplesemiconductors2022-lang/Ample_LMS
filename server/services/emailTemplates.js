const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');

export const emailTemplates = {
  verifyEmail: (name, verificationUrl, code) => ({
    subject: 'Verify Your Email — Ample Semiconductors LMS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #0f214a; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; }
          .body { padding: 32px 28px; line-height: 1.6; }
          .body h2 { color: #0f214a; margin-top: 0; font-size: 18px; font-weight: 700; }
          .code-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
          .code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #244092; font-family: monospace; }
          .btn { display: inline-block; background: #244092; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 12px 0 20px; }
          .footer { background: #f8fafc; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ample Semiconductors LMS</h1>
          </div>
          <div class="body">
            <h2>Hello ${esc(name)},</h2>
            <p>Your verification code for Ample Semiconductors LMS is:</p>
            
            <div class="code-box">
              <div class="code">${esc(code)}</div>
            </div>

            <p>Enter this 6-digit code on the registration page to activate your account.</p>

            ${safeUrl(verificationUrl) ? `
            <p style="margin-top:24px;color:#475569;font-size:14px;">Alternatively, verify your account directly with this button:</p>
            <div style="text-align:center;">
              <a href="${safeUrl(verificationUrl)}" class="btn" target="_blank">Verify Email Address</a>
            </div>` : ''}

            <p style="color:#64748b;font-size:13px;margin-top:24px;">This code will expire in 24 hours. If you did not create an account on Ample LMS, you can safely disregard this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Ample Semiconductors. Bengaluru & Hyderabad campuses.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${name},\n\nYour 6-digit verification code for Ample LMS is: ${code}\n\n${verificationUrl ? `Or verify directly: ${verificationUrl}\n\n` : ''}This code expires in 24 hours.`
  })
};

export default emailTemplates;

