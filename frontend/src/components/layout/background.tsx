'use client';

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] bg-neutral-50 dark:bg-neutral-950">
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_top,rgba(168,85,247,0.10),transparent_65%)] dark:bg-[radial-gradient(1200px_circle_at_top,rgba(168,85,247,0.12),transparent_60%)]" />
      <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-purple-500/15 blur-[120px] dark:bg-purple-500/10" />
      <div className="absolute -bottom-35 -left-15 h-96 w-96 rounded-full bg-violet-500/12 blur-[150px] dark:bg-violet-500/10" />
    </div>
  );
}
