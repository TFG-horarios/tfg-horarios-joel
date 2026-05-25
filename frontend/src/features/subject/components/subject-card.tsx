import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type { SubjectDTO } from '@tfg-horarios/shared';

export interface SubjectCardProps {
  subject: SubjectDTO;
  degreeName: string;
  translations: Record<string, string>;
}

export function SubjectCard({
  subject,
  degreeName,
  translations,
}: SubjectCardProps) {
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <CardDescription>{subject.code}</CardDescription>
        <CardTitle className={`text-xl ${organizationHoverCardTitleClassName}`}>
          {subject.name}
        </CardTitle>
        <div className="space-y-1 pt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p className="font-medium text-black dark:text-white">
            {translations.degree}: {degreeName}
          </p>
          <p>
            {translations.course} {subject.courseYear} · {subject.weeklyHours}{' '}
            {translations.weeklyHours}
          </p>
          {subject.isCommon && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {translations.common}
            </span>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
