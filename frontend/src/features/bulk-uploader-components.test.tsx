import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDegree,
  buildItinerary,
  buildSubject,
  testIds,
} from '@/test/builders';
import { renderWithUser } from '@/test/render';
import { ClassroomBulkUploader } from './classroom/components/classroom-bulk-uploader';
import { ItineraryBulkUploader } from './itinerary/components/itinerary-bulk-uploader';
import { SubjectBulkUploader } from './subject/components/subject-bulk-uploader';
import { SubjectGroupBulkUploader } from './subject-group/components/subject-group-bulk-uploader';
import {
  bulkCreateClassrooms,
  fetchClassroomIdentifiersAction,
  replaceClassroomsAction,
} from './classroom/actions';
import {
  bulkCreateItineraries,
  fetchItineraryIdentifiersAction,
  replaceItinerariesAction,
} from './itinerary/actions';
import {
  bulkCreateSubjects,
  fetchSubjectIdentifiersAction,
  replaceSubjectsAction,
} from './subject/actions';
import {
  bulkCreateSubjectGroups,
  fetchSubjectGroupIdentifiersAction,
  replaceSubjectGroupsAction,
} from './subject-group/actions';

type CsvRow = Record<string, string>;
type AnalyzeResult = {
  finalValidData: unknown[];
  issues: Array<{ category: string; column?: string; severity: string }>;
};
type BulkItineraryRow = {
  degreeCode: string;
  code: string;
  name: string;
};
type BulkSubjectRow = {
  degreeCode: string;
  itineraryCode: string;
  name: string;
  code: string;
  availableShifts: string[];
  numberOfStudents: number;
  courseYear: number;
  period: number;
  weeklyHours: number;
  isCommon: boolean;
};
type BulkSubjectGroupRow = {
  subjectCode: string;
  name: string;
  groupType: string;
  shift: string;
  numberOfStudents: number;
  weeklyHours: number;
  groupNumber: number;
  needsComputerLab: boolean;
};
type GenericBulkUploaderProps = {
  title: string;
  rowTransformer: (row: CsvRow) => unknown;
  onAnalyze: (validData: unknown[]) => Promise<AnalyzeResult>;
  onBeforeUpload?: (
    mode: 'append' | 'overwrite' | undefined,
    validData: unknown[]
  ) => Promise<void>;
  onUpload: (finalData: unknown[]) => Promise<void>;
  mode?: 'append' | 'overwrite';
};

const bulkUploaderProps = vi.hoisted(() => ({
  current: null as GenericBulkUploaderProps | null,
}));

vi.mock('@/components/shared/generic-bulk-uploader', () => ({
  GenericBulkUploader: (props: GenericBulkUploaderProps) => {
    bulkUploaderProps.current = props;

    return <div>{props.title}</div>;
  },
}));

vi.mock('./classroom/actions', () => ({
  bulkCreateClassrooms: vi.fn(),
  fetchClassroomIdentifiersAction: vi.fn(),
  replaceClassroomsAction: vi.fn(),
}));

vi.mock('./itinerary/actions', () => ({
  bulkCreateItineraries: vi.fn(),
  fetchItineraryIdentifiersAction: vi.fn(),
  replaceItinerariesAction: vi.fn(),
}));

vi.mock('./subject/actions', () => ({
  bulkCreateSubjects: vi.fn(),
  fetchSubjectIdentifiersAction: vi.fn(),
  replaceSubjectsAction: vi.fn(),
}));

vi.mock('./subject-group/actions', () => ({
  bulkCreateSubjectGroups: vi.fn(),
  fetchSubjectGroupIdentifiersAction: vi.fn(),
  replaceSubjectGroupsAction: vi.fn(),
}));

function getBulkUploaderProps() {
  if (!bulkUploaderProps.current) {
    throw new Error('Bulk uploader was not rendered');
  }

  return bulkUploaderProps.current;
}

describe('bulk uploader wrappers', () => {
  beforeEach(() => {
    bulkUploaderProps.current = null;
    vi.mocked(fetchClassroomIdentifiersAction).mockResolvedValue(['Aula 1.1']);
    vi.mocked(fetchItineraryIdentifiersAction).mockResolvedValue(['SE']);
    vi.mocked(fetchSubjectIdentifiersAction).mockResolvedValue(['MAT101']);
    vi.mocked(fetchSubjectGroupIdentifiersAction).mockResolvedValue([]);
    vi.mocked(bulkCreateClassrooms).mockResolvedValue({ success: true });
    vi.mocked(replaceClassroomsAction).mockResolvedValue({ success: true });
    vi.mocked(bulkCreateItineraries).mockResolvedValue({ success: true });
    vi.mocked(replaceItinerariesAction).mockResolvedValue({ success: true });
    vi.mocked(bulkCreateSubjects).mockResolvedValue({ success: true });
    vi.mocked(replaceSubjectsAction).mockResolvedValue({ success: true });
    vi.mocked(bulkCreateSubjectGroups).mockResolvedValue({ success: true });
    vi.mocked(replaceSubjectGroupsAction).mockResolvedValue({ success: true });
  });

  it('transforms, analyzes and uploads classrooms', async () => {
    const beforeUpload = vi.fn(async () => undefined);
    renderWithUser(
      <ClassroomBulkUploader
        organizationId={testIds.organizationId}
        mode="overwrite"
        onBeforeUpload={beforeUpload}
      />
    );
    expect(screen.getByText('title')).toBeInTheDocument();
    const props = getBulkUploaderProps();
    const transformed = props.rowTransformer({
      name: ' Aula 2 ',
      capacity: '45',
      floor: '2',
      type: ' LAB ',
    });

    expect(transformed).toEqual({
      name: 'Aula 2',
      capacity: 45,
      floor: 2,
      type: 'lab',
    });

    const analysis = await props.onAnalyze([
      transformed,
      { name: 'Aula 2', capacity: 30, floor: 2, type: 'lab' },
    ]);
    expect(analysis.issues).toHaveLength(1);

    await props.onBeforeUpload?.('overwrite', [transformed]);
    await props.onUpload([transformed]);

    expect(beforeUpload).toHaveBeenCalledWith('overwrite', [transformed]);
    expect(replaceClassroomsAction).toHaveBeenCalledWith(
      testIds.organizationId,
      [transformed]
    );
  });

  it('maps itineraries to degree ids and reports missing degree references', async () => {
    const degree = buildDegree();
    renderWithUser(
      <ItineraryBulkUploader
        organizationId={testIds.organizationId}
        degrees={[degree]}
        mode="append"
      />
    );
    const props = getBulkUploaderProps();
    const valid = props.rowTransformer({
      degreeCode: ' ce ',
      code: ' se ',
      name: ' Software ',
    }) as BulkItineraryRow;

    expect(valid).toEqual({
      degreeCode: 'CE',
      code: 'SE',
      name: 'Software',
    });

    const analysis = await props.onAnalyze([
      valid,
      { degreeCode: 'UNKNOWN', code: 'UX', name: 'Unknown' },
    ]);
    expect(analysis.issues.map((issue) => issue.category)).toEqual([
      'duplicate',
      'reference',
    ]);

    await props.onUpload([valid]);
    expect(bulkCreateItineraries).toHaveBeenCalledWith(testIds.organizationId, [
      { code: 'SE', name: 'Software', degreeId: degree.id },
    ]);
  });

  it('maps subjects to degree and itinerary ids before uploading', async () => {
    const degree = buildDegree();
    const itinerary = buildItinerary();
    renderWithUser(
      <SubjectBulkUploader
        organizationId={testIds.organizationId}
        degrees={[degree]}
        itineraries={[itinerary]}
        mode="overwrite"
      />
    );
    const props = getBulkUploaderProps();
    const valid = props.rowTransformer({
      degreeCode: 'CE',
      itineraryCode: 'SE',
      name: 'Algorithms',
      code: ' alg ',
      availableShifts: 'morning, afternoon',
      courseYear: '2',
      weeklyHours: '6',
      numberOfStudents: '80',
      period: '1',
      isCommon: 'false',
    }) as BulkSubjectRow;

    const analysis = await props.onAnalyze([
      valid,
      { ...valid, degreeCode: 'NOPE' },
      { ...valid, itineraryCode: '' },
    ]);

    expect(analysis.finalValidData).toEqual([valid]);
    expect(analysis.issues).toHaveLength(2);

    await props.onUpload([valid]);
    expect(replaceSubjectsAction).toHaveBeenCalledWith(testIds.organizationId, [
      expect.objectContaining({
        degreeId: degree.id,
        itineraryId: itinerary.id,
        code: 'ALG',
      }),
    ]);
  });

  it('validates subject group references, totals and upload mapping', async () => {
    const subject = buildSubject({
      weeklyHours: 3,
      numberOfStudents: 60,
      availableShifts: ['morning'],
    });
    renderWithUser(
      <SubjectGroupBulkUploader
        organizationId={testIds.organizationId}
        subjects={[subject]}
        mode="append"
      />
    );
    const props = getBulkUploaderProps();
    const valid = props.rowTransformer({
      subjectCode: 'mat101',
      name: 'Theory 1',
      numberOfStudents: '60',
      weeklyHours: '3',
      groupType: 'teoría',
      shift: 'morning',
      groupNumber: '1',
      needsComputerLab: 'sí',
    }) as BulkSubjectGroupRow;

    const invalidShift = { ...valid, shift: 'afternoon' };
    const missingSubject = { ...valid, subjectCode: 'NOPE' };
    const analysis = await props.onAnalyze([
      valid,
      invalidShift,
      missingSubject,
    ]);

    expect(analysis.finalValidData).toEqual([valid]);
    expect(analysis.issues.map((issue) => issue.category)).toEqual([
      'validation',
      'reference',
    ]);

    await props.onUpload([valid]);
    expect(bulkCreateSubjectGroups).toHaveBeenCalledWith(
      testIds.organizationId,
      [
        expect.objectContaining({
          subjectId: subject.id,
          groupType: 'theory',
          needsComputerLab: true,
        }),
      ]
    );
  });

  it('handles subject group identifier and upload failures', async () => {
    const fetchError = new Error('unavailable');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.mocked(fetchSubjectGroupIdentifiersAction).mockRejectedValueOnce(
      fetchError
    );
    const subject = buildSubject({
      weeklyHours: 3,
      numberOfStudents: 60,
      availableShifts: ['morning'],
    });
    renderWithUser(
      <SubjectGroupBulkUploader
        organizationId={testIds.organizationId}
        subjects={[subject]}
        mode="overwrite"
      />
    );
    const props = getBulkUploaderProps();
    const valid = props.rowTransformer({
      subjectCode: 'MAT101',
      name: 'Theory 1',
      numberOfStudents: '60',
      weeklyHours: '3',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: '1',
      needsComputerLab: 'false',
    }) as BulkSubjectGroupRow;

    await expect(props.onAnalyze([valid])).resolves.toEqual({
      finalValidData: [],
      issues: [],
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching identifiers:',
      fetchError
    );

    vi.mocked(replaceSubjectGroupsAction).mockResolvedValueOnce({
      success: false,
      message: 'Upload failed',
    });

    await expect(props.onUpload([valid])).rejects.toThrow('Upload failed');
    expect(replaceSubjectGroupsAction).toHaveBeenCalledWith(
      testIds.organizationId,
      [
        expect.objectContaining({
          subjectId: subject.id,
          groupNumber: 1,
        }),
      ]
    );
    consoleErrorSpy.mockRestore();
  });

  it('rejects subject groups when student totals do not match the subject', async () => {
    const subject = buildSubject({
      weeklyHours: 3,
      numberOfStudents: 60,
      availableShifts: ['morning'],
    });
    renderWithUser(
      <SubjectGroupBulkUploader
        organizationId={testIds.organizationId}
        subjects={[subject]}
        mode="overwrite"
      />
    );
    const props = getBulkUploaderProps();
    const validHoursWrongStudents = props.rowTransformer({
      subjectCode: 'MAT101',
      name: 'Theory 1',
      numberOfStudents: '30',
      weeklyHours: '3',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: '1',
      needsComputerLab: 'no',
    }) as BulkSubjectGroupRow;

    const analysis = await props.onAnalyze([validHoursWrongStudents]);

    expect(analysis.finalValidData).toEqual([]);
    expect(analysis.issues).toEqual([
      expect.objectContaining({
        category: 'validation',
        column: 'numberOfStudents',
      }),
    ]);
  });

  it('includes existing subject groups in student totals for append mode', async () => {
    vi.mocked(fetchSubjectGroupIdentifiersAction).mockResolvedValueOnce([
      {
        subjectId: testIds.subjectId,
        shift: 'morning',
        groupType: 'theory',
        weeklyHours: 0,
        groupNumber: 9,
        numberOfStudents: 20,
      },
    ]);
    const beforeUpload = vi.fn(async () => undefined);
    const subject = buildSubject({
      weeklyHours: 3,
      numberOfStudents: 60,
      availableShifts: ['morning'],
    });
    renderWithUser(
      <SubjectGroupBulkUploader
        organizationId={testIds.organizationId}
        subjects={[subject]}
        mode="append"
        onBeforeUpload={beforeUpload}
      />
    );
    const props = getBulkUploaderProps();
    const row = props.rowTransformer({
      subjectCode: 'MAT101',
      name: 'Theory 1',
      numberOfStudents: '60',
      weeklyHours: '3',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: '1',
      needsComputerLab: 'no',
    }) as BulkSubjectGroupRow;

    const analysis = await props.onAnalyze([row]);
    await props.onBeforeUpload?.('append', [row]);

    expect(beforeUpload).toHaveBeenCalledWith('append', [row]);
    expect(analysis.finalValidData).toEqual([]);
    expect(analysis.issues).toEqual([
      expect.objectContaining({
        column: 'numberOfStudents',
        providedValue: '80',
      }),
    ]);
  });
});
