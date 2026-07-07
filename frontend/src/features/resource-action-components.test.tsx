import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  buildAcademicYear,
  buildDegree,
  buildItinerary,
  buildOrganization,
  buildSubject,
  buildSubjectGroup,
  testIds,
} from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { downloadCsv } from '@/lib/utils/csv';
import { DegreeActions } from './degree/components/degree-actions';
import { ItineraryActions } from './itinerary/components/itinerary-actions';
import { MemberActions } from './members/components/member-actions';
import { SubjectActions } from './subject/components/subject-actions';
import { SubjectGroupActions } from './subject-group/components/subject-group-actions';
import {
  deleteAllDegreesAction,
  fetchAllDegreesAction,
} from './degree/actions';
import {
  deleteAllItinerariesAction,
  fetchAllItinerariesAction,
} from './itinerary/actions';
import {
  deleteAllSubjectsAction,
  fetchAllSubjectsAction,
} from './subject/actions';
import {
  deleteAllSubjectGroupsAction,
  fetchAllSubjectGroupsAction,
} from './subject-group/actions';

type ToolbarProps = {
  onCreateClick?: () => void;
  onDeleteAll?: () => Promise<unknown> | unknown;
  onExportCsv?: () => Promise<void> | void;
  appendModalContent?: ReactNode;
  overwriteModalContent?: ReactNode;
};

vi.mock('@/components/shared/resource/resource-actions-toolbar', () => ({
  useResourceActionsToolbarTranslations: (namespace: string) => ({
    namespace,
  }),
  ResourceActionsToolbar: ({
    onCreateClick,
    onDeleteAll,
    onExportCsv,
    appendModalContent,
    overwriteModalContent,
  }: ToolbarProps) => (
    <div>
      <button type="button" onClick={onCreateClick} disabled={!onCreateClick}>
        create
      </button>
      <button
        type="button"
        onClick={() => void onDeleteAll?.()}
        disabled={!onDeleteAll}
      >
        delete all
      </button>
      <button type="button" onClick={() => void onExportCsv?.()}>
        export
      </button>
      <div>{appendModalContent}</div>
      <div>{overwriteModalContent}</div>
    </div>
  ),
}));

vi.mock('@/components/shared/resource/resource-actions', () => ({
  ResourceActions: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/lib/utils/csv', () => ({
  downloadCsv: vi.fn(),
}));

vi.mock('./degree/actions', () => ({
  deleteAllDegreesAction: vi.fn(),
  fetchAllDegreesAction: vi.fn(),
}));

vi.mock('./itinerary/actions', () => ({
  deleteAllItinerariesAction: vi.fn(),
  fetchAllItinerariesAction: vi.fn(),
}));

vi.mock('./subject/actions', () => ({
  deleteAllSubjectsAction: vi.fn(),
  fetchAllSubjectsAction: vi.fn(),
}));

vi.mock('./subject-group/actions', () => ({
  deleteAllSubjectGroupsAction: vi.fn(),
  fetchAllSubjectGroupsAction: vi.fn(),
}));

vi.mock('@/features/degree/components/degree-form-modal', () => ({
  DegreeFormModal: ({ open }: { open?: boolean }) => (
    <div>{open ? 'degree modal open' : 'degree modal closed'}</div>
  ),
}));

vi.mock('@/features/degree/components/degree-bulk-uploader', () => ({
  DegreeBulkUploader: ({ mode }: { mode?: string }) => (
    <div>{`degree uploader ${mode}`}</div>
  ),
}));

vi.mock('@/features/itinerary/components/itinerary-form-modal', () => ({
  ItineraryFormModal: ({ open }: { open?: boolean }) => (
    <div>{open ? 'itinerary modal open' : 'itinerary modal closed'}</div>
  ),
}));

vi.mock('@/features/itinerary/components/itinerary-bulk-uploader', () => ({
  ItineraryBulkUploader: ({ mode }: { mode?: string }) => (
    <div>{`itinerary uploader ${mode}`}</div>
  ),
}));

vi.mock('@/features/subject/components/subject-form-modal', () => ({
  SubjectFormModal: ({ open }: { open?: boolean }) => (
    <div>{open ? 'subject modal open' : 'subject modal closed'}</div>
  ),
}));

vi.mock('@/features/subject/components/subject-bulk-uploader', () => ({
  SubjectBulkUploader: ({ mode }: { mode?: string }) => (
    <div>{`subject uploader ${mode}`}</div>
  ),
}));

vi.mock('@/features/subject-group/components/subject-group-form-modal', () => ({
  SubjectGroupFormModal: ({ open }: { open?: boolean }) => (
    <div>
      {open ? 'subject group modal open' : 'subject group modal closed'}
    </div>
  ),
}));

vi.mock(
  '@/features/subject-group/components/subject-group-bulk-uploader',
  () => ({
    SubjectGroupBulkUploader: ({ mode }: { mode?: string }) => (
      <div>{`subject group uploader ${mode}`}</div>
    ),
  })
);

vi.mock('@/features/members/components/member-form-modal', () => ({
  MemberFormModal: ({ open }: { open?: boolean }) => (
    <div>{open ? 'member modal open' : 'member modal closed'}</div>
  ),
}));

describe('resource action wrappers', () => {
  beforeEach(() => {
    vi.mocked(fetchAllDegreesAction).mockResolvedValue([buildDegree()]);
    vi.mocked(fetchAllItinerariesAction).mockResolvedValue([buildItinerary()]);
    vi.mocked(fetchAllSubjectsAction).mockResolvedValue([
      buildSubject({ itineraryId: testIds.itineraryId }),
    ]);
    vi.mocked(fetchAllSubjectGroupsAction).mockResolvedValue([
      buildSubjectGroup(),
    ]);
    vi.mocked(deleteAllDegreesAction).mockResolvedValue({ success: true });
    vi.mocked(deleteAllItinerariesAction).mockResolvedValue({ success: true });
    vi.mocked(deleteAllSubjectsAction).mockResolvedValue({ success: true });
    vi.mocked(deleteAllSubjectGroupsAction).mockResolvedValue({
      success: true,
    });
  });

  it('wires degree create, delete, import and export actions', async () => {
    const { user } = renderWithUser(
      <DegreeActions
        organizationId={testIds.organizationId}
        canCreate
        canDeleteAll
        canImport
        canReplaceAll
      />
    );

    await user.click(screen.getByRole('button', { name: 'create' }));
    expect(screen.getByText('degree modal open')).toBeInTheDocument();
    expect(screen.getByText('degree uploader append')).toBeInTheDocument();
    expect(screen.getByText('degree uploader overwrite')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'delete all' }));
    expect(deleteAllDegreesAction).toHaveBeenCalledWith(testIds.organizationId);

    await user.click(screen.getByRole('button', { name: 'export' }));
    expect(downloadCsv).toHaveBeenCalledWith(
      [{ name: 'Computer Engineering', code: 'CE' }],
      'grados'
    );
  });

  it('exports itinerary rows with degree codes', async () => {
    const degree = buildDegree();
    const { user } = renderWithUser(
      <ItineraryActions
        organizationId={testIds.organizationId}
        degrees={[degree]}
        canCreate
        canDeleteAll
        canImport
        canReplaceAll
      />
    );

    await user.click(screen.getByRole('button', { name: 'create' }));
    expect(screen.getByText('itinerary modal open')).toBeInTheDocument();
    expect(screen.getByText('itinerary uploader append')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'export' }));
    expect(downloadCsv).toHaveBeenCalledWith(
      [{ degreeCode: degree.code, code: 'SE', name: 'Software Engineering' }],
      'itinerarios'
    );
  });

  it('exports subject rows with mapped degree and itinerary codes', async () => {
    const { user } = renderWithUser(
      <SubjectActions
        organization={buildOrganization()}
        academicYear={buildAcademicYear()}
        degrees={[buildDegree()]}
        itineraries={[buildItinerary()]}
        canCreate
        canDeleteAll
        canImport
        canReplaceAll
      />
    );

    await user.click(screen.getByRole('button', { name: 'create' }));
    expect(screen.getByText('subject modal open')).toBeInTheDocument();
    expect(screen.getByText('subject uploader overwrite')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'export' }));
    expect(downloadCsv).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          degreeCode: 'CE',
          itineraryCode: 'SE',
          availableShifts: 'morning',
          isCommon: 'true',
        }),
      ],
      'asignaturas'
    );
  });

  it('exports subject group rows with subject codes', async () => {
    const { user } = renderWithUser(
      <SubjectGroupActions
        organizationId={testIds.organizationId}
        subjects={[buildSubject()]}
        canCreate
        canDeleteAll
        canImport
        canReplaceAll
      />
    );

    await user.click(screen.getByRole('button', { name: 'create' }));
    expect(screen.getByText('subject group modal open')).toBeInTheDocument();
    expect(
      screen.getByText('subject group uploader append')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'export' }));
    expect(downloadCsv).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          subjectCode: 'MAT101',
          name: 'Theory 1',
          groupType: 'theory',
        }),
      ],
      'grupos'
    );
  });

  it('hides member creation for read-only users and opens it for managers', async () => {
    const { rerender, user } = renderWithUser(
      <MemberActions
        organizationId={testIds.organizationId}
        canManage={false}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'create' })
    ).not.toBeInTheDocument();

    rerender(
      <MemberActions organizationId={testIds.organizationId} canManage />
    );
    await user.click(screen.getByRole('button', { name: 'create' }));

    expect(screen.getByText('member modal open')).toBeInTheDocument();
  });
});
