import { cookies } from 'next/headers';

export async function setAuthSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
