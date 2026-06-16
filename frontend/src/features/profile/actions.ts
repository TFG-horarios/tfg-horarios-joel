'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/lib/api/server';
import { type UpdatePasswordDTO, type UserDTO } from '@tfg-horarios/shared';
import { getTranslations } from 'next-intl/server';
import { type ActionResponse } from '@/types/actions';

export async function updateProfileNameAction(
  name: string
): Promise<ActionResponse<UserDTO>> {
  const tErrors = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const res = await client.api.users.me.$patch({ json: { name } });
    if (!res.ok) throw new Error(tErrors('server'));

    revalidatePath('/profile');
    revalidatePath('/');
    return { success: true, data: await res.json() };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function updatePasswordAction(
  dto: UpdatePasswordDTO
): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const res = await client.api.users.me.password.$patch({ json: dto });
    if (!res.ok) {
      let responseMessage = tErrors('server');
      try {
        const errorBody = (await res.json()) as { message?: string };
        responseMessage = errorBody.message ?? responseMessage;
      } catch (error) {
        void error;
      }
      return { success: false, message: responseMessage };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }

  return { success: true };
}

export async function deleteAccountAction(): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const res = await client.api.users.me.$delete();
    if (!res.ok) {
      let responseMessage = tErrors('server');
      try {
        const errorBody = (await res.json()) as { message?: string };
        responseMessage = errorBody.message ?? responseMessage;
      } catch (e) {
        void e;
      }
      throw new Error(responseMessage);
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }

  return { success: true };
}
