'use client';

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-neutral-50 dark:bg-neutral-950 transition-colors duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(2000px_circle_at_top,rgba(168,85,247,0.12),transparent_85%)] dark:bg-[radial-gradient(2500px_circle_at_top,rgba(168,85,247,0.03),transparent_90%)]" />
      <div className="absolute -top-[20%] -right-[10%] h-[900px] w-[900px] rounded-full bg-purple-500/15 dark:bg-purple-600/2 blur-[200px] transition-all" />
      <div className="absolute -bottom-[25%] -left-[15%] h-[1000px] w-[1000px] rounded-full bg-indigo-500/12 dark:bg-indigo-600/2 blur-[220px] transition-all" />
      <div className="absolute top-[15%] -left-[20%] h-[800px] w-[800px] rounded-full bg-purple-500/8 dark:bg-purple-600/1.5 blur-[180px] transition-all" />
    </div>
  );
}

