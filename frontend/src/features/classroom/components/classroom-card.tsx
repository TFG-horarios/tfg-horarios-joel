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
import type { ClassroomDTO } from '@tfg-horarios/shared';

export interface ClassroomCardProps {
  classroom: ClassroomDTO;
  organizationName: string;
  translations: Record<string, string>;
}

export function ClassroomCard({
  classroom,
  organizationName,
  translations,
}: ClassroomCardProps) {
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <CardDescription>
          {classroom.type === 'theory'
            ? translations['type.theory']
            : translations['type.lab']}
        </CardDescription>
        <CardTitle className={`text-xl ${organizationHoverCardTitleClassName}`}>
          {classroom.name}
        </CardTitle>
        <div className="space-y-1 pt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            {translations.capacity}: {classroom.capacity} estudiantes
          </p>
          <p>
            {translations.organization}: {organizationName}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}
