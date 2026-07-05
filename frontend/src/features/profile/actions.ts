'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/api/server';
import {
  SaveUserBodySchema,
  UpdatePasswordBodySchema,
  type SaveUserDTO,
  type UpdatePasswordDTO,
  type UserDTO,
} from '@tfg-horarios/shared';
import { getTranslations } from 'next-intl/server';
import { type ActionResponse } from '@/types/actions';
import { clearAuthSession } from '@/lib/auth/session';
import { zodErrorToActionErrors } from '@/lib/validation/action-errors';

export async function updateProfileNameAction(
  dto: SaveUserDTO
): Promise<ActionResponse<UserDTO>> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = SaveUserBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const res = await client.api.users.me.$patch({ json: parsedInput.data });
    if (!res.ok) {
      throw new Error(tErrors('server'));
    }

    revalidatePath('/profile');
    revalidatePath('/');

    return {
      success: true,
      message: tSuccess('updated'),
      data: await res.json(),
    };
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
  const tSuccess = await getTranslations('Common.success');
  const parsedInput = UpdatePasswordBodySchema.safeParse(dto);

  if (!parsedInput.success) {
    return {
      success: false,
      message: tErrors('validation'),
      errors: zodErrorToActionErrors(parsedInput.error),
    };
  }

  try {
    const client = await getServerClient();
    const res = await client.api.users.me.password.$patch({
      json: parsedInput.data,
    });
    if (!res.ok) {
      let responseMessage = tErrors('server');
      try {
        const errorBody = (await res.json()) as { message?: string };
        responseMessage = errorBody.message ?? responseMessage;
      } catch (error) {
        void error;
      }
      throw new Error(responseMessage);
    }

    return {
      success: true,
      message: tSuccess('updated'),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function deleteAccountAction(): Promise<ActionResponse> {
  const tErrors = await getTranslations('Common.errors');
  const tSuccess = await getTranslations('Common.success');

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

    return {
      success: true,
      message: tSuccess('deleted'),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : tErrors('generic'),
    };
  }
}

export async function endProfileSessionAction(redirectTo: string = '/login') {
  await clearAuthSession();
  redirect(redirectTo);
}
