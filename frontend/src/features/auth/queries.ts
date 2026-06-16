import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import type { UserDTO } from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    try {
      const client = await getServerClient();
      const res = await client.api.users.me.$get();
      if (res.ok) {
        return (await res.json()) as UserDTO;
      }
    } catch (error) {
      void error;
    }

    return decoded as UserDTO;
  } catch {
    return null;
  }
}
