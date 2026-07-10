import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ReactNode } from 'react';

type AuthShellProps = {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <Card className="w-full max-w-md bg-white/70 shadow-sm shadow-black/5 backdrop-blur-lg transition-colors duration-300 dark:bg-white/5 dark:shadow-black/60">
      <CardHeader className="space-y-2 pb-4">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground dark:text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
