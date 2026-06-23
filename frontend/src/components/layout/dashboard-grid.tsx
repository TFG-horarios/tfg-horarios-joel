import type { ReactNode } from 'react';

export interface DashboardGridProps {
  title: string;
  countLabel: string;
  description: string;
  actionButton?: ReactNode;
  error?: string | null;
  children: ReactNode;
}

export function DashboardGrid({
  title,
  countLabel,
  description,
  actionButton,
  error,
  children,
}: DashboardGridProps) {
  return (
    <div className="space-y-8">
      <div className="mb-8 mt-2 flex flex-col gap-4 border-b border-black/10 pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h2>

            <span className="hidden sm:flex items-center justify-center rounded-full border border-brand-purple-border bg-brand-purple-bg px-2.5 py-0.5 text-xs font-medium text-brand-purple whitespace-nowrap">
              {countLabel}
            </span>
          </div>

          <p className="text-muted-foreground">{description}</p>

          <div className="flex sm:hidden items-center justify-between w-full gap-3 pt-1">
            <span className="flex items-center justify-center rounded-full border border-brand-purple-border bg-brand-purple-bg px-2.5 py-0.5 text-xs font-medium text-brand-purple whitespace-nowrap">
              {countLabel}
            </span>

            {actionButton && <div>{actionButton}</div>}
          </div>
        </div>

        {actionButton && (
          <div className="hidden sm:block shrink-0">{actionButton}</div>
        )}
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
