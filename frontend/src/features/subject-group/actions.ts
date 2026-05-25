'use server';

import {
  SubjectGroupSchema,
  type SubjectGroupDTO,
  type SaveSubjectGroupDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

export async function createSubjectGroup(
  organizationId: string,
  subjectId: string,
  dto: SaveSubjectGroupDTO
): Promise<SubjectGroupDTO> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[organizationId]!.subjects[
    subjectId
  ]!.groups.$post({ json: dto });

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return SubjectGroupSchema.parse(payload);
}

export async function bulkCreateSubjectGroups(
  organizationId: string,
  subjectId: string,
  dtos: SaveSubjectGroupDTO[]
): Promise<SubjectGroupDTO[]> {
  const t = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[organizationId]!.subjects[
      subjectId
    ]!.groups.bulk.$post({ json: dtos });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERROR DEL BACKEND DE HONO (Grupos):', errorText);
      throw new Error(t('server'));
    }

    if (!response.ok) {
      throw new Error(t('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/subject-groups`);

    return SubjectGroupSchema.array().parse(payload);
  } catch (error) {
    console.error('❌ ERROR EN EL SERVER ACTION (Grupos Bulk):', error);
    throw error;
  }
}

export async function updateSubjectGroup(
  organizationId: string,
  groupId: string,
  dto: SaveSubjectGroupDTO
): Promise<SubjectGroupDTO> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[organizationId]![
    'subject-groups'
  ][groupId]!.$patch({ json: dto });

  if (!response.ok) {
    throw new Error(t('server'));
  }

  const payload = await response.json();
  return SubjectGroupSchema.parse(payload);
}

export async function removeSubjectGroup(
  organizationId: string,
  groupId: string
): Promise<void> {
  const t = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response =
    await client.api.organizations[organizationId]!['subject-groups'][
      groupId
    ]!.$delete();

  if (!response.ok) {
    throw new Error(t('server'));
  }
}
