'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ResourcePaginationProps {
  page: number;
  totalPages: number;
}

export function ResourcePagination({
  page,
  totalPages,
}: ResourcePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Common.pagination');

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (pageNumber > 1) {
      params.set('page', pageNumber.toString());
    } else {
      params.delete('page');
    }
    return `${pathname}?${params.toString()}`;
  };

  const pages = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="mt-6">
      <Pagination>
        <PaginationContent>
          {page > 1 ? (
            <PaginationItem>
              <PaginationPrevious
                href={createPageUrl(page - 1)}
                text={t('previous')}
              />
            </PaginationItem>
          ) : (
            <PaginationItem>
              <PaginationPrevious
                className="pointer-events-none opacity-50"
                text={t('previous')}
              />
            </PaginationItem>
          )}

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink href={createPageUrl(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink href={createPageUrl(p)} isActive={page === p}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink href={createPageUrl(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          {page < totalPages ? (
            <PaginationItem>
              <PaginationNext href={createPageUrl(page + 1)} text={t('next')} />
            </PaginationItem>
          ) : (
            <PaginationItem>
              <PaginationNext
                className="pointer-events-none opacity-50"
                text={t('next')}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
