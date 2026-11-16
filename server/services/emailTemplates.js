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
        <style>
          body { font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1b45; margin: 0; padding: 20px; color: #0f172a; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(36, 64, 146, 0.16); box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
          .header { background: #0f214a; padding: 32px 28px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; }
          .body { padding: 32px 28px; line-height: 1.6; }
          .body h2 { color: #0f214a; margin-top: 0; font-size: 20px; font-weight: 700; }
          .code-box { background: #f8fafc; border: 2px dashed #244092; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0; }
          .code { font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #244092; font-family: 'IBM Plex Mono', Consolas, monospace; }
          .btn { display: inline-block; background: #244092; color: #ffffff !important; padding: 13px 32px; border-radius: 99px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 12px 0 20px; box-shadow: 0 6px 20px rgba(36,64,146,0.3); }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ AMPLE SEMICONDUCTORS</h1>
            <p>Engineering Academy & Learning Management System</p>
          </div>
          <div class="body">
            <h2>Welcome, ${esc(name)}!</h2>
            <p>Thank you for creating an account on <strong>Ample LMS</strong>. Please verify your email address to unlock your course curriculum, tapeout labs, and engineering certifications.</p>
            
            <div class="code-box">
              <div style="font-size:12px;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your 6-Digit Verification Code</div>
              <div class="code">${esc(code)}</div>
            </div>

            ${safeUrl(verificationUrl) ? `
            <p style="text-align:center;margin-top:20px;color:#475569;font-size:14px;">Or click the direct activation button below:</p>
            <div style="text-align:center;">
              <a href="${safeUrl(verificationUrl)}" class="btn" target="_blank">Verify My Email</a>
            </div>` : ''}

            <p style="color:#64748b;font-size:13px;margin-top:24px;">This code and link expire in <strong>24 hours</strong>. If you did not create this account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Ample Semiconductors. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to Ample LMS, ${name}!\n\nYour 6-digit verification code is: ${code}\n\n${verificationUrl ? `Or verify directly: ${verificationUrl}\n\n` : ''}This code expires in 24 hours.`
  })
};

export default emailTemplates;

