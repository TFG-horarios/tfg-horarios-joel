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
import type {
  SubjectGroupDTO,
  SubjectDTO,
  DegreeDTO,
} from '@tfg-horarios/shared';

export interface SubjectGroupCardProps {
  group: SubjectGroupDTO;
  subject: SubjectDTO | undefined;
  degree: DegreeDTO | undefined;
  translations: Record<string, string>;
}

export function SubjectGroupCard({
  group,
  subject,
  degree,
  translations,
}: SubjectGroupCardProps) {
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <CardDescription className="capitalize">
          {translations.type}:{' '}
          {group.groupType
            ? translations[`typeOptions.${group.groupType}`]
            : translations['typeOptions.theory']}
        </CardDescription>
        <CardTitle className={`text-xl ${organizationHoverCardTitleClassName}`}>
          {group.name}
        </CardTitle>
        <div className="space-y-1 pt-1 text-sm text-muted-foreground dark:text-muted-foreground">
          {subject && (
            <p>
              {subject.name} · {subject.code} {degree && `· ${degree.name}`}
            </p>
          )}
          <p>
            {translations.shift}:{' '}
            <span className="capitalize">
              {translations[`shiftOptions.${group.shift}`]}
            </span>
          </p>
          <p>
            {translations.students}: {group.numberOfStudents}
          </p>
          <p>
            {translations.hours}: {group.weeklyHours}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}
