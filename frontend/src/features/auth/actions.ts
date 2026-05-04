'use server';

import { cookies } from 'next/headers';
import {
  AuthResponseSchema,
  LoginSchema,
  RegisterSchema,
  type AuthResponseDTO,
  type LoginDTO,
  type RegisterDTO,
} from '@tfg-horarios/shared';
import type { User } from '@/types/user';
import { api } from '@/lib/api';
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getFieldErrors } from '@/lib/zod';
import { parseJsonResponse } from '@/lib/api-utils';

const apiClient = api as unknown as {
  api: {
    auth: {
      login: { $post: (params: { json: LoginDTO }) => Promise<Response> };
      register: { $post: (params: { json: RegisterDTO }) => Promise<Response> };
    };
  };
};

export type AuthActionState = {
  success: boolean;
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
  user: User | null;
};

const initialState: AuthActionState = {
  success: false,
  message: '',
  fieldErrors: {},
  user: null,
};

export async function login(dto: LoginDTO): Promise<AuthResponseDTO> {
  const response = await apiClient.api.auth.login.$post({
    json: dto,
  });

  const payload = await parseJsonResponse(
    response,
    'No se pudo iniciar sesión'
  );

  const parsed = AuthResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Respuesta de autenticación inválida');
  }

  return parsed.data;
}

export async function register(dto: RegisterDTO): Promise<AuthResponseDTO> {
  const response = await apiClient.api.auth.register.$post({
    json: dto,
  });

  const payload = await parseJsonResponse(
    response,
    'No se pudo crear la cuenta'
  );

  const parsed = AuthResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Respuesta de autenticación inválida');
  }

  return parsed.data;
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsedInput = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsedInput.success) {
    return {
      ...initialState,
      message: 'Revisa los campos e intenta de nuevo.',
      fieldErrors: getFieldErrors(parsedInput.error),
    };
  }

  try {
    const result = await login(parsedInput.data);
    const cookieStore = await cookies();
    cookieStore.set('auth-token', result.token, {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (error) {
    return {
      ...initialState,
      message:
        error instanceof Error ? error.message : 'No se pudo iniciar sesión',
    };
  }
  redirect('/organizations');
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsedInput = RegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsedInput.success) {
    return {
      ...initialState,
      message: 'Revisa los campos e intenta de nuevo.',
      fieldErrors: getFieldErrors(parsedInput.error),
    };
  }

  try {
    const result = await register(parsedInput.data);
    const cookieStore = await cookies();
    cookieStore.set('auth-token', result.token, {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (error) {
    return {
      ...initialState,
      message:
        error instanceof Error ? error.message : 'No se pudo crear la cuenta',
    };
  }
  redirect('/organizations');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded as User;
  } catch {
    return null;
  }
}
