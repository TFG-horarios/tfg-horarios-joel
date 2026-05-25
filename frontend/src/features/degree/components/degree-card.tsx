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
import type { DegreeDTO } from '@tfg-horarios/shared';

export interface DegreeCardProps {
  degree: DegreeDTO;
  organizationName: string;
  translations: Record<string, string>;
}

export function DegreeCard({
  degree,
  organizationName,
  translations,
}: DegreeCardProps) {
  return (
    <Card className={`h-full ${organizationHoverCardClassName}`}>
      <CardHeader className="space-y-2 p-5">
        <CardDescription>{translations.code}</CardDescription>
        <CardTitle className={`text-xl ${organizationHoverCardTitleClassName}`}>
          {degree.name}
        </CardTitle>
        <div className="space-y-1 pt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p>{degree.code}</p>
          <p>
            {translations.organization}: {organizationName}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}
