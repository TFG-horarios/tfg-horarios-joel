import { useTranslations } from 'next-intl';
import { z } from 'zod';

export function useZodErrorMap() {
  const t = useTranslations('ZodErrors');
  const errorMap: z.ZodErrorMap = (issue) => {
    const path = issue.path?.join('.') || '';
    try {
      type TranslationKey = Parameters<typeof t>[0];
      const key = issue.code as TranslationKey;
      const translatedMessage = t(key, { path });
      if (
        issue.code === 'custom' &&
        issue.message &&
        issue.message !== 'Invalid input'
      ) {
        return { message: t(issue.message as TranslationKey) || issue.message };
      }
      return {
        message: translatedMessage || issue.message || 'Validation error',
      };
    } catch {
      return { message: issue.message || 'Validation error' };
    }
  };
  return errorMap;
}
