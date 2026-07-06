import { cookies } from 'next/headers';

function isSecureCookieEnabled() {
  return process.env.COOKIE_SECURE === 'true';
}

export async function setAuthSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: isSecureCookieEnabled(),
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
