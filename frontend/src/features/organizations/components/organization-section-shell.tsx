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
      <div className="space-y-2 border-b border-black/10 pb-5 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          {typeof count === 'number' && (
            <span className="inline-flex items-center rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-200">
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
