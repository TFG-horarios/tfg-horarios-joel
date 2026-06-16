'use server';

import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import {
  LoginSchema,
  RegisterSchema,
  type LoginDTO,
  type RegisterDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { redirect } from 'next/navigation';

import { type ActionResponse } from '@/types/actions';

async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function loginAction(dto: LoginDTO): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');
  const tLogin = await getTranslations('Auth.login');
  const parsedInput = LoginSchema.safeParse(dto);
  if (!parsedInput.success)
    return { success: false, message: tErrors('validation') };

  try {
    const client = await getServerClient();
    const response = await client.api.auth.login.$post({
      json: parsedInput.data,
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, message: tLogin('invalidCredentials') };
      }

      let responseMessage = tErrors('server');
      try {
        const errorBody = (await response.json()) as { message?: string };
        responseMessage = errorBody.message ?? responseMessage;
      } catch (error) {
        void error;
      }

      return { success: false, message: responseMessage };
    }

    const { token } = await response.json();

    await setAuthCookie(token);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
  redirect('/organizations');
}

export async function registerAction(
  dto: RegisterDTO
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');
  const parsedInput = RegisterSchema.safeParse(dto);
  if (!parsedInput.success)
    return { success: false, message: tErrors('validation') };

  try {
    const client = await getServerClient();
    const response = await client.api.auth.register.$post({
      json: parsedInput.data,
    });

    if (!response.ok) throw new Error(tErrors('server'));

    const { token } = await response.json();

    await setAuthCookie(token);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
  redirect('/organizations');
}

export async function logoutAction(redirectTo: string = '/login') {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  redirect(redirectTo);
}
