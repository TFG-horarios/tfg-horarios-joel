import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  organizationHoverCardClassName,
  organizationHoverCardTitleClassName,
} from '@/features/organizations/components/organization-card-styles';
import type { SubjectDTO } from '@tfg-horarios/shared';

export interface SubjectCardProps {
  subject: SubjectDTO;
  degreeName: string;
  itineraryName?: string;
  translations: Record<string, string>;
}

export function SubjectCard({
  subject,
  degreeName,
  itineraryName,
  translations,
}: SubjectCardProps) {
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <Badge
          variant="outline"
          className="w-fit font-mono uppercase tracking-[0.2em] border-purple-500/20 bg-purple-500/5 text-purple-500"
        >
          {subject.code}
        </Badge>
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
          {itineraryName ? (
            <span className="inline-block bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs px-2 py-1 rounded">
              {itineraryName}
            </span>
          ) : (
            <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-1 rounded">
              {translations.common}
            </span>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
