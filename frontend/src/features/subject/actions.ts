'use server';

import {
  SubjectSchema,
  type SubjectDTO,
  type SaveSubjectDTO,
} from '@tfg-horarios/shared';
import { getServerClient } from '@/lib/api/server';
import { revalidatePath } from 'next/dist/server/web/spec-extension/revalidate';
import { getTranslations } from 'next-intl/server';

export async function createSubject(
  organizationId: string,
  degreeId: string,
  dto: SaveSubjectDTO
): Promise<SubjectDTO> {
  const tErrors = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[organizationId]!.degrees[
    degreeId
  ]!.subjects.$post({ json: dto });

  if (!response.ok) {
    throw new Error(tErrors('server'));
  }

  const payload = await response.json();
  return SubjectSchema.parse(payload);
}

export async function bulkCreateSubjects(
  organizationId: string,
  degreeId: string,
  dtos: SaveSubjectDTO[]
): Promise<SubjectDTO[]> {
  const tErrors = await getTranslations('Common.errors');
  try {
    const client = await getServerClient();
    const response = await client.api.organizations[organizationId]!.degrees[
      degreeId
    ]!.subjects.bulk.$post({ json: dtos });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERROR DEL BACKEND DE HONO (Asignaturas):', errorText);
      throw new Error(tErrors('server'));
    }

    if (!response.ok) {
      throw new Error(tErrors('server'));
    }

    const payload = await response.json();

    revalidatePath(`/organizations/${organizationId}/subjects`);

    return SubjectSchema.array().parse(payload);
  } catch (error) {
    console.error('❌ ERROR EN EL SERVER ACTION (Asignaturas Bulk):', error);
    throw error;
  }
}

export async function updateSubject(
  organizationId: string,
  subjectId: string,
  dto: SaveSubjectDTO
): Promise<SubjectDTO> {
  const tErrors = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response = await client.api.organizations[organizationId]!.subjects[
    subjectId
  ]!.$patch({ json: dto });

  if (!response.ok) {
    throw new Error(tErrors('server'));
  }

  const payload = await response.json();
  return SubjectSchema.parse(payload);
}

export async function removeSubject(
  organizationId: string,
  subjectId: string
): Promise<void> {
  const tErrors = await getTranslations('Common.errors');
  const client = await getServerClient();
  const response =
    await client.api.organizations[organizationId]!.subjects[
      subjectId
    ]!.$delete();

  if (!response.ok) {
    throw new Error(tErrors('server'));
  }
}
