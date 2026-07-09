export const SUBJECT_COLORS = [
  'bg-red-200 border-red-300 text-black dark:text-white dark:bg-red-950/90 dark:border-red-800',
  'bg-blue-200 border-blue-300 text-black dark:text-white dark:bg-blue-950/70 dark:border-blue-900',
  'bg-green-200 border-green-300 text-black dark:text-white dark:bg-green-950/70 dark:border-green-900',
  'bg-orange-200 border-orange-300 text-black dark:text-white dark:bg-orange-900/50 dark:border-orange-700',
  'bg-purple-200 border-purple-300 text-black dark:text-white dark:bg-purple-950/70 dark:border-purple-900',
  'bg-yellow-200 border-yellow-400 text-black dark:text-white dark:bg-yellow-950/40 dark:border-yellow-900',
  'bg-teal-200 border-teal-300 text-black dark:text-white dark:bg-teal-950/70 dark:border-teal-900',
  'bg-pink-200 border-pink-300 text-black dark:text-white dark:bg-pink-950/60 dark:border-pink-900',
  'bg-lime-200 border-lime-300 text-black dark:text-white dark:bg-lime-950/60 dark:border-lime-900',
  'bg-amber-200 border-amber-300 text-black dark:text-white dark:bg-amber-950/60 dark:border-amber-900',
];

export function getSubjectColorClasses(
  subjectId: string,
  subjectIdsPool?: string[]
): string {
  if (subjectIdsPool && subjectIdsPool.length > 0) {
    const sortedPool = Array.from(new Set(subjectIdsPool)).sort((a, b) =>
      a.localeCompare(b)
    );
    const index = sortedPool.indexOf(subjectId);
    if (index !== -1) {
      return SUBJECT_COLORS[index % SUBJECT_COLORS.length]!;
    }
  }

  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index]!;
}
