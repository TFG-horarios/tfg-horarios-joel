import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type OrganizationSectionShellProps = {
  label: string;
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function OrganizationSectionShell({
  label,
  title,
  description,
  count,
  countLabel,
  headerAction,
  children,
  className,
}: OrganizationSectionShellProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2 border-b border-black/10 pb-5 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            {typeof count === 'number' && (
              <span className="inline-flex items-center rounded-full border border-brand-purple-border bg-brand-purple-bg px-3 py-1 text-xs font-medium text-brand-purple">
                {count}
                {countLabel ? ` ${countLabel}` : ''}
              </span>
            )}
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
