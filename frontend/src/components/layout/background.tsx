'use client';

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-neutral-50 dark:bg-neutral-950 transition-colors duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(2000px_circle_at_top,rgba(156,163,175,0.1),transparent_85%)] dark:bg-[radial-gradient(2500px_circle_at_top,rgba(156,163,175,0.03),transparent_90%)]" />
      <div className="absolute -top-[20%] -right-[10%] h-[900px] w-[900px] rounded-full bg-neutral-300/20 dark:bg-neutral-800/10 blur-[200px] transition-all" />
      <div className="absolute -bottom-[25%] -left-[15%] h-[1000px] w-[1000px] rounded-full bg-neutral-200/30 dark:bg-neutral-800/10 blur-[220px] transition-all" />
      <div className="absolute top-[15%] -left-[20%] h-[800px] w-[800px] rounded-full bg-neutral-300/15 dark:bg-neutral-800/10 blur-[180px] transition-all" />
    </div>
  );
}
