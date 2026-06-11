import type { ReactNode } from 'react';

export interface DashboardGridProps {
  icon: ReactNode;
  title: string;
  countLabel: string;
  description: string;
  actionButton?: ReactNode;
  error?: string | null;
  children: ReactNode;
}

export function DashboardGrid({
  icon,
  title,
  countLabel,
  description,
  actionButton,
  error,
  children,
}: DashboardGridProps) {
  return (
    <div className="space-y-8">
      <div className="mb-8 mt-2 flex flex-col justify-between gap-4 border-b border-black/10 pb-6 dark:border-white/10 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg border border-black/10 bg-white/70 p-2 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              {icon}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <span className="flex items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
              {countLabel}
            </span>
          </div>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {actionButton}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}
