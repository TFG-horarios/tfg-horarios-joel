import { cleanup, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAcademicYear,
  buildClassroom,
  buildDegree,
  buildItinerary,
  buildMember,
  buildOrganization,
  buildSubject,
  buildSubjectGroup,
  testIds,
} from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { ClassroomFormModal } from './classroom/components/classroom-form-modal';
import { DegreeFormModal } from './degree/components/degree-form-modal';
import { ItineraryFormModal } from './itinerary/components/itinerary-form-modal';
import { MemberFormModal } from './members/components/member-form-modal';
import { SubjectFormModal } from './subject/components/subject-form-modal';
import { SubjectGroupFormModal } from './subject-group/components/subject-group-form-modal';
import {
  createClassroomAction,
  updateClassroomAction,
} from './classroom/actions';
import { createDegreeAction, updateDegreeAction } from './degree/actions';
import {
  createItineraryAction,
  updateItineraryAction,
} from './itinerary/actions';
import { addMemberAction, updateMemberRoleAction } from './members/actions';
import { createSubjectAction, updateSubjectAction } from './subject/actions';
import {
  createSubjectGroupAction,
  updateSubjectGroupAction,
} from './subject-group/actions';

type ModalFormProps<TData> = {
  action: (data: TData) => Promise<unknown>;
  onCancel?: () => void;
  onSuccess?: () => void;
};

const actionResult = { success: true, message: 'Saved' };

vi.mock('./classroom/actions', () => ({
  createClassroomAction: vi.fn(async () => actionResult),
  updateClassroomAction: vi.fn(async () => actionResult),
}));

vi.mock('./degree/actions', () => ({
  createDegreeAction: vi.fn(async () => actionResult),
  updateDegreeAction: vi.fn(async () => actionResult),
}));

vi.mock('./itinerary/actions', () => ({
  createItineraryAction: vi.fn(async () => actionResult),
  updateItineraryAction: vi.fn(async () => actionResult),
}));

vi.mock('./members/actions', () => ({
  addMemberAction: vi.fn(async () => actionResult),
  updateMemberRoleAction: vi.fn(async () => actionResult),
}));

vi.mock('./subject/actions', () => ({
  createSubjectAction: vi.fn(async () => actionResult),
  updateSubjectAction: vi.fn(async () => actionResult),
}));

vi.mock('./subject-group/actions', () => ({
  createSubjectGroupAction: vi.fn(async () => actionResult),
  updateSubjectGroupAction: vi.fn(async () => actionResult),
}));

vi.mock('@/features/classroom/components/classroom-form', () => ({
  ClassroomForm: ({ action, onSuccess }: ModalFormProps<{ name: string }>) => (
    <button
      type="button"
      onClick={async () => {
        await action({ name: 'Room' });
        onSuccess?.();
      }}
    >
      save classroom
    </button>
  ),
}));

vi.mock('@/features/degree/components/degree-form', () => ({
  DegreeForm: ({ action, onSuccess }: ModalFormProps<{ name: string }>) => (
    <button
      type="button"
      onClick={async () => {
        await action({ name: 'Degree' });
        onSuccess?.();
      }}
    >
      save degree
    </button>
  ),
}));

vi.mock('@/features/itinerary/components/itinerary-form', () => ({
  ItineraryForm: ({
    action,
    onSuccess,
  }: ModalFormProps<{ degreeId: string; name: string; code: string }>) => (
    <button
      type="button"
      onClick={async () => {
        await action({
          degreeId: '123e4567-e89b-12d3-a456-426614174005',
          name: 'Itinerary',
          code: 'IT',
        });
        onSuccess?.();
      }}
    >
      save itinerary
    </button>
  ),
}));

vi.mock('@/features/members/components/member-form', () => ({
  MemberForm: ({
    action,
    onSuccess,
  }: ModalFormProps<{ email: string; role: string }>) => (
    <button
      type="button"
      onClick={async () => {
        await action({ email: 'grace@example.com', role: 'viewer' });
        onSuccess?.();
      }}
    >
      save member
    </button>
  ),
}));

vi.mock('@/features/subject/components/subject-form', () => ({
  SubjectForm: ({ action, onSuccess }: ModalFormProps<{ name: string }>) => (
    <button
      type="button"
      onClick={async () => {
        await action({ name: 'Subject' });
        onSuccess?.();
      }}
    >
      save subject
    </button>
  ),
}));

vi.mock('@/features/subject-group/components/subject-group-form', () => ({
  SubjectGroupForm: ({
    action,
    onSuccess,
  }: ModalFormProps<{ subjectId: string; name: string }>) => (
    <button
      type="button"
      onClick={async () => {
        await action({
          subjectId: '123e4567-e89b-12d3-a456-426614174007',
          name: 'Group',
        });
        onSuccess?.();
      }}
    >
      save subject group
    </button>
  ),
}));

describe('form modal components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates and updates classrooms', async () => {
    const onOpenChange = vi.fn();
    const { user, rerender } = renderWithUser(
      <ClassroomFormModal
        organizationId={testIds.organizationId}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'save classroom' }));
    expect(createClassroomAction).toHaveBeenCalledWith(testIds.organizationId, {
      name: 'Room',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <ClassroomFormModal
        organizationId={testIds.organizationId}
        classroom={buildClassroom()}
        open
        onOpenChange={onOpenChange}
      />
    );
    await user.click(screen.getByRole('button', { name: 'save classroom' }));
    expect(updateClassroomAction).toHaveBeenCalledWith(
      testIds.organizationId,
      testIds.classroomId,
      { name: 'Room' }
    );
  });

  it('creates and updates degrees and itineraries', async () => {
    const onOpenChange = vi.fn();
    const { user, rerender } = renderWithUser(
      <DegreeFormModal
        organizationId={testIds.organizationId}
        degree={buildDegree()}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'save degree' }));
    expect(updateDegreeAction).toHaveBeenCalledWith(
      testIds.organizationId,
      testIds.degreeId,
      { name: 'Degree' }
    );

    rerender(
      <ItineraryFormModal
        organizationId={testIds.organizationId}
        degrees={[buildDegree()]}
        open
        onOpenChange={onOpenChange}
      />
    );
    await user.click(screen.getByRole('button', { name: 'save itinerary' }));
    expect(createItineraryAction).toHaveBeenCalledWith(
      testIds.organizationId,
      testIds.degreeId,
      {
        name: 'Itinerary',
        code: 'IT',
      }
    );

    cleanup();
    const updateRender = renderWithUser(
      <ItineraryFormModal
        organizationId={testIds.organizationId}
        degrees={[buildDegree()]}
        itinerary={buildItinerary()}
        open
        onOpenChange={onOpenChange}
      />
    );
    await updateRender.user.click(
      screen.getByRole('button', { name: 'save itinerary' })
    );
    expect(updateItineraryAction).toHaveBeenCalledWith(
      testIds.organizationId,
      testIds.degreeId,
      testIds.itineraryId,
      { name: 'Itinerary', code: 'IT' }
    );
    expect(createDegreeAction).not.toHaveBeenCalled();
  });

  it('creates and updates members, subjects and subject groups', async () => {
    const onOpenChange = vi.fn();
    const organization = buildOrganization();
    const academicYear = buildAcademicYear();
    const degree = buildDegree();
    const subject = buildSubject();
    const { user } = renderWithUser(
      <MemberFormModal
        organizationId={testIds.organizationId}
        member={buildMember()}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'save member' }));
    expect(updateMemberRoleAction).toHaveBeenCalledWith(
      testIds.organizationId,
      testIds.memberId,
      { role: 'viewer' }
    );

    cleanup();
    const subjectRender = renderWithUser(
      <SubjectFormModal
        organization={organization}
        academicYear={academicYear}
        degrees={[degree]}
        itineraries={[buildItinerary()]}
        subject={buildSubject()}
        open
        onOpenChange={onOpenChange}
      />
    );
    await subjectRender.user.click(
      screen.getByRole('button', { name: 'save subject' })
    );
    expect(updateSubjectAction).toHaveBeenCalledWith(
      organization.id,
      subject.id,
      { name: 'Subject' }
    );

    cleanup();
    const groupCreateRender = renderWithUser(
      <SubjectGroupFormModal
        organizationId={testIds.organizationId}
        subjects={[subject]}
        open
        onOpenChange={onOpenChange}
      />
    );
    await groupCreateRender.user.click(
      screen.getByRole('button', { name: 'save subject group' })
    );
    expect(createSubjectGroupAction).toHaveBeenCalledWith(
      testIds.organizationId,
      testIds.subjectId,
      { subjectId: testIds.subjectId, name: 'Group' }
    );

    cleanup();
    const groupUpdateRender = renderWithUser(
      <SubjectGroupFormModal
        organizationId={testIds.organizationId}
        subjects={[subject]}
        group={buildSubjectGroup()}
        open
        onOpenChange={onOpenChange}
      />
    );
    await groupUpdateRender.user.click(
      screen.getByRole('button', { name: 'save subject group' })
    );
    expect(updateSubjectGroupAction).toHaveBeenCalledWith(
      testIds.organizationId,
      testIds.subjectGroupId,
      { subjectId: testIds.subjectId, name: 'Group' }
    );
    expect(addMemberAction).not.toHaveBeenCalled();
    expect(createSubjectAction).not.toHaveBeenCalled();
  });
});
