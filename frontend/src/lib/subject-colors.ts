export const SUBJECT_COLORS = [
  'bg-red-100 text-red-950 border-red-200 dark:bg-red-950/60 dark:text-red-200 dark:border-red-900',
  'bg-orange-100 text-orange-950 border-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-900',
  'bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900',
  'bg-green-100 text-green-950 border-green-200 dark:bg-green-950/60 dark:text-green-200 dark:border-green-900',
  'bg-emerald-100 text-emerald-950 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900',
  'bg-teal-100 text-teal-950 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900',
  'bg-cyan-100 text-cyan-950 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-900',
  'bg-sky-100 text-sky-950 border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-900',
  'bg-blue-100 text-blue-950 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-900',
  'bg-indigo-100 text-indigo-950 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-900',
  'bg-violet-100 text-violet-950 border-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-900',
  'bg-purple-100 text-purple-950 border-purple-200 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-900',
  'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-200 dark:border-fuchsia-900',
  'bg-pink-100 text-pink-950 border-pink-200 dark:bg-pink-950/60 dark:text-pink-200 dark:border-pink-900',
  'bg-rose-100 text-rose-950 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900',
];

export function getSubjectColorClasses(subjectId: string): string {
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index]!;
}
