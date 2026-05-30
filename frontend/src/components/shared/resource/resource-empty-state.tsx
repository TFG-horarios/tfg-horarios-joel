import { Card, CardDescription, CardHeader } from '@/components/ui/card';

export interface ResourceEmptyStateProps {
  message: string;
}

export function ResourceEmptyState({ message }: ResourceEmptyStateProps) {
  return (
    <Card className="border-dashed border-zinc-300 bg-transparent p-6 dark:border-zinc-700">
      <CardHeader className="p-0">
        <CardDescription className="text-center">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}
