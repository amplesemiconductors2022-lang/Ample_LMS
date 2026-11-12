import crypto from 'crypto';

/**
 * OAuth 2.0 helper supporting Google and GitHub sign-in.
 * Activated automatically when GOOGLE_CLIENT_ID/SECRET or GITHUB_CLIENT_ID/SECRET are set.
 */

export function getOAuthProviders() {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  };
}

export function getBaseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5001').split(',')[0].trim();
  return `${proto}://${host}`;
}

export function createOAuthState(provider, secret) {
  const payload = Buffer.from(
    JSON.stringify({ provider, nonce: crypto.randomBytes(12).toString('hex'), exp: Date.now() + 10 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyOAuthState(state, expectedProvider, secret) {
  const [payload, sig] = String(state || '').split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.provider === expectedProvider && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function getAuthorizeUrl(provider, req, secret) {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;
  const state = createOAuthState(provider, secret);

  if (provider === 'google') {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth is not configured.');
    }
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === 'github') {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw new Error('GitHub OAuth is not configured.');
    }
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

export async function exchangeOAuthCode(provider, code, req) {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;

  if (provider === 'google') {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Google token exchange failed.');
    }
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();
    if (!userRes.ok || !profile.email || !profile.email_verified) {
      throw new Error('Google account email could not be verified.');
    }
    return {
      email: String(profile.email).toLowerCase(),
      name: profile.name || profile.email.split('@')[0],
      avatar: profile.picture || '',
      provider: 'google',
    };
  }

  if (provider === 'github') {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'GitHub token exchange failed.');
    }
    const ghHeaders = {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Ample-LMS',
    };
    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);
    const profile = await profileRes.json();
    const emails = await emailsRes.json();
    const primaryVerified = Array.isArray(emails)
      ? emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified)
      : null;
    const email = primaryVerified?.email || profile.email;
    if (!email) {
      throw new Error('No verified email address found on GitHub account.');
    }
    return {
      email: String(email).toLowerCase(),
      name: profile.name || profile.login || email.split('@')[0],
      avatar: profile.avatar_url || '',
      provider: 'github',
    };
  }

  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

