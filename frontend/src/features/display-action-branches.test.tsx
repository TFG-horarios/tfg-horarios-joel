import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
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
import { AcademicYearCard } from './academic-year/components/academic-year-card';
import { ClassroomCard } from './classroom/components/classroom-card';
import { ClassroomRow } from './classroom/components/classroom-row';
import { DegreeCard } from './degree/components/degree-card';
import { DegreeRow } from './degree/components/degree-row';
import { ItineraryCard } from './itinerary/components/itinerary-card';
import { ItineraryRow } from './itinerary/components/itinerary-row';
import { MemberCard } from './members/components/member-card';
import { MemberRow } from './members/components/member-row';
import { OrganizationCard } from './organizations/components/organization-card';
import { SubjectCard } from './subject/components/subject-card';
import { SubjectRow } from './subject/components/subject-row';
import { SubjectGroupCard } from './subject-group/components/subject-group-card';
import { SubjectGroupRow } from './subject-group/components/subject-group-row';
import { deleteAcademicYearAction } from './academic-year/actions';
import { deleteClassroomAction } from './classroom/actions';
import { deleteDegreeAction } from './degree/actions';
import { deleteItineraryAction } from './itinerary/actions';
import { removeMemberAction } from './members/actions';
import { removeOrganizationAction } from './organizations/actions';
import { deleteSubjectAction } from './subject/actions';
import { deleteSubjectGroupAction } from './subject-group/actions';

type CardActionsProps = {
  children?: ReactNode;
  onDelete?: () => Promise<unknown> | unknown;
  onEdit?: () => void;
};

vi.mock('@/components/shared/resource/resource-card-actions', () => ({
  ResourceCardActions: ({ children, onDelete, onEdit }: CardActionsProps) => (
    <div>
      {children}
      {onEdit && (
        <button type="button" onClick={onEdit}>
          edit card
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={() => void onDelete()}>
          delete card
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/components/shared/resource/resource-row-actions', () => ({
  ResourceRowActions: ({ children, onDelete, onEdit }: CardActionsProps) => (
    <td>
      {children}
      {onEdit && (
        <button type="button" onClick={onEdit}>
          edit row
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={() => void onDelete()}>
          delete row
        </button>
      )}
    </td>
  ),
}));

vi.mock('@/features/classroom/components/classroom-form-modal', async () => {
  const { createPortal } =
    await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ClassroomFormModal: ({ open }: { open?: boolean }) =>
      open ? createPortal(<div>classroom edit open</div>, document.body) : null,
  };
});

vi.mock('@/features/degree/components/degree-form-modal', async () => {
  const { createPortal } =
    await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    DegreeFormModal: ({ open }: { open?: boolean }) =>
      open ? createPortal(<div>degree edit open</div>, document.body) : null,
  };
});

vi.mock('@/features/itinerary/components/itinerary-form-modal', async () => {
  const { createPortal } =
    await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ItineraryFormModal: ({ open }: { open?: boolean }) =>
      open ? createPortal(<div>itinerary edit open</div>, document.body) : null,
  };
});

vi.mock('@/features/members/components/member-form-modal', async () => {
  const { createPortal } =
    await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    MemberFormModal: ({ open }: { open?: boolean }) =>
      open ? createPortal(<div>member edit open</div>, document.body) : null,
  };
});

vi.mock('@/features/subject/components/subject-form-modal', async () => {
  const { createPortal } =
    await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    SubjectFormModal: ({ open }: { open?: boolean }) =>
      open ? createPortal(<div>subject edit open</div>, document.body) : null,
  };
});

vi.mock(
  '@/features/subject-group/components/subject-group-form-modal',
  async () => {
    const { createPortal } =
      await vi.importActual<typeof import('react-dom')>('react-dom');
    return {
      SubjectGroupFormModal: ({ open }: { open?: boolean }) =>
        open
          ? createPortal(<div>subject group edit open</div>, document.body)
          : null,
    };
  }
);

vi.mock('./academic-year/actions', () => ({
  deleteAcademicYearAction: vi.fn(),
}));

vi.mock('./classroom/actions', () => ({
  deleteClassroomAction: vi.fn(),
}));

vi.mock('./degree/actions', () => ({
  deleteDegreeAction: vi.fn(),
}));

vi.mock('./itinerary/actions', () => ({
  deleteItineraryAction: vi.fn(),
}));

vi.mock('./members/actions', () => ({
  removeMemberAction: vi.fn(),
}));

vi.mock('./organizations/actions', () => ({
  removeOrganizationAction: vi.fn(),
}));

vi.mock('./subject/actions', () => ({
  deleteSubjectAction: vi.fn(),
}));

vi.mock('./subject-group/actions', () => ({
  deleteSubjectGroupAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const classroomTranslations = {
  'type.theory': 'Theory',
  'type.lab': 'Lab',
  'type.computer_lab': 'Computer lab',
  floor: 'Floor',
  capacity: 'Students',
} satisfies Record<string, string>;

const organization = buildOrganization();
const academicYear = buildAcademicYear();
const degree = buildDegree();
const itinerary = buildItinerary();
const subject = buildSubject({ itineraryId: testIds.itineraryId });
const subjectGroup = buildSubjectGroup();
const subjectTranslations = {
  common: 'Common',
  course: 'Course',
  degree: 'Degree',
  period1: 'First semester',
  periodAnnual: 'Annual',
  shiftMorning: 'Morning',
  shiftAfternoon: 'Afternoon',
  students: 'Students',
  unassigned: 'Unassigned',
} satisfies Record<string, string>;
const itineraryTranslations = {
  degree: 'Degree',
  unassigned: 'Unassigned',
} satisfies Record<string, string>;
const subjectGroupTranslations = {
  ...subjectTranslations,
  groupType_theory: 'Theory',
  shift_morning: 'Morning',
} satisfies Record<string, string>;

describe('display component action branches', () => {
  beforeEach(() => {
    vi.mocked(deleteAcademicYearAction).mockResolvedValue({ success: true });
    vi.mocked(deleteClassroomAction).mockResolvedValue({ success: true });
    vi.mocked(deleteDegreeAction).mockResolvedValue({ success: true });
    vi.mocked(deleteItineraryAction).mockResolvedValue({ success: true });
    vi.mocked(removeMemberAction).mockResolvedValue({ success: true });
    vi.mocked(removeOrganizationAction).mockResolvedValue({ success: true });
    vi.mocked(deleteSubjectAction).mockResolvedValue({ success: true });
    vi.mocked(deleteSubjectGroupAction).mockResolvedValue({ success: true });
  });

  it('executes card edit and delete branches for resource cards', async () => {
    const onEditAcademicYear = vi.fn();
    const onEditOrganization = vi.fn();
    const { user } = renderWithUser(
      <>
        <AcademicYearCard
          organizationId={testIds.organizationId}
          academicYear={academicYear}
          canEdit
          canDelete
          onEdit={onEditAcademicYear}
        />
        <OrganizationCard
          organization={organization}
          canEdit
          canDelete
          onEdit={onEditOrganization}
        />
        <ClassroomCard
          item={buildClassroom()}
          translations={classroomTranslations}
          canEdit
          canDelete
        />
        <DegreeCard item={degree} canEdit canDelete />
        <ItineraryCard
          item={itinerary}
          degreeMap={new Map([[degree.id, degree]])}
          translations={itineraryTranslations}
          canEdit
          canDelete
        />
        <MemberCard
          item={buildMember()}
          organizationId={testIds.organizationId}
          currentUserId="other-user"
          canManage
        />
        <SubjectCard
          item={subject}
          organization={organization}
          academicYear={academicYear}
          degreeMap={new Map([[degree.id, degree]])}
          itineraryMap={new Map([[itinerary.id, itinerary]])}
          translations={subjectTranslations}
          canEdit
          canDelete
        />
        <SubjectGroupCard
          item={subjectGroup}
          subjectMap={new Map([[subject.id, subject]])}
          degreeMap={new Map([[degree.id, degree]])}
          itineraryMap={new Map([[itinerary.id, itinerary]])}
          translations={subjectGroupTranslations}
          canEdit
          canDelete
        />
      </>
    );

    for (const editButton of screen.getAllByRole('button', {
      name: 'edit card',
    })) {
      await user.click(editButton);
    }
    for (const deleteButton of screen.getAllByRole('button', {
      name: 'delete card',
    })) {
      await user.click(deleteButton);
    }

    expect(onEditAcademicYear).toHaveBeenCalled();
    expect(onEditOrganization).toHaveBeenCalled();
    expect(screen.getByText('classroom edit open')).toBeInTheDocument();
    expect(screen.getByText('degree edit open')).toBeInTheDocument();
    expect(screen.getByText('itinerary edit open')).toBeInTheDocument();
    expect(screen.getByText('member edit open')).toBeInTheDocument();
    expect(screen.getByText('subject edit open')).toBeInTheDocument();
    expect(screen.getByText('subject group edit open')).toBeInTheDocument();
    expect(deleteAcademicYearAction).toHaveBeenCalledWith(
      testIds.organizationId,
      testIds.academicYearId
    );
    expect(removeOrganizationAction).toHaveBeenCalledWith(
      testIds.organizationId
    );
    expect(deleteClassroomAction).toHaveBeenCalled();
    expect(deleteDegreeAction).toHaveBeenCalled();
    expect(deleteItineraryAction).toHaveBeenCalled();
    expect(removeMemberAction).toHaveBeenCalled();
    expect(deleteSubjectAction).toHaveBeenCalled();
    expect(deleteSubjectGroupAction).toHaveBeenCalled();
  });

  it('executes row edit and delete branches for table rows', async () => {
    const { user } = renderWithUser(
      <table>
        <tbody>
          <ClassroomRow
            item={buildClassroom()}
            translations={classroomTranslations}
            canEdit
            canDelete
          />
          <DegreeRow item={degree} canEdit canDelete />
          <ItineraryRow
            item={itinerary}
            degreeMap={new Map([[degree.id, degree]])}
            translations={itineraryTranslations}
            canEdit
            canDelete
          />
          <MemberRow
            item={buildMember()}
            currentUserId="other-user"
            canManage
          />
          <SubjectRow
            item={subject}
            organization={organization}
            academicYear={academicYear}
            degreeMap={new Map([[degree.id, degree]])}
            itineraryMap={new Map([[itinerary.id, itinerary]])}
            translations={subjectTranslations}
            canEdit
            canDelete
          />
          <SubjectGroupRow
            item={subjectGroup}
            subjectMap={new Map([[subject.id, subject]])}
            degreeMap={new Map([[degree.id, degree]])}
            itineraryMap={new Map([[itinerary.id, itinerary]])}
            translations={subjectGroupTranslations}
            canEdit
            canDelete
          />
        </tbody>
      </table>
    );

    for (const editButton of screen.getAllByRole('button', {
      name: 'edit row',
    })) {
      await user.click(editButton);
    }
    for (const deleteButton of screen.getAllByRole('button', {
      name: 'delete row',
    })) {
      await user.click(deleteButton);
    }

    expect(screen.getByText('classroom edit open')).toBeInTheDocument();
    expect(screen.getByText('degree edit open')).toBeInTheDocument();
    expect(screen.getByText('itinerary edit open')).toBeInTheDocument();
    expect(screen.getByText('member edit open')).toBeInTheDocument();
    expect(screen.getByText('subject edit open')).toBeInTheDocument();
    expect(screen.getByText('subject group edit open')).toBeInTheDocument();
    expect(deleteClassroomAction).toHaveBeenCalled();
    expect(deleteDegreeAction).toHaveBeenCalled();
    expect(deleteItineraryAction).toHaveBeenCalled();
    expect(removeMemberAction).toHaveBeenCalled();
    expect(deleteSubjectAction).toHaveBeenCalled();
    expect(deleteSubjectGroupAction).toHaveBeenCalled();
  });
});
