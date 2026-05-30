import type { ISubjectProvider } from '../../domain/subject.provider';
import type { ISubjectRepository } from '@/modules/subject/domain/subject.repository';
import type { Shift } from '../../domain/subject-group.entity';

export class SubjectAdapter implements ISubjectProvider {
  constructor(private readonly subjectRepository: ISubjectRepository) {}

  async getAvailableShifts(
    subjectId: string,
    organizationId: string
  ): Promise<Shift[] | null> {
    const subject = await this.subjectRepository.findById(
      subjectId,
      organizationId
    );
    if (!subject) return null;
    return subject.availableShifts as Shift[];
  }
}
