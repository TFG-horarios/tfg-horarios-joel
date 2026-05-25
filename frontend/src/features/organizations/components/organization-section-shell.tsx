type OrganizationSectionShellProps = {
  label: string;
  title: string;
  description: string;
  count?: number;
  countLabel?: string;
  children: React.ReactNode;
};

export function OrganizationSectionShell({
  label,
  title,
  description,
  count,
  countLabel,
  children,
}: OrganizationSectionShellProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          </div>
          {typeof count === 'number' && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary">
              {count}
              {countLabel ? ` ${countLabel}` : ''}
            </span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
