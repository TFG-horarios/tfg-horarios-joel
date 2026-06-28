import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InteractiveCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  actions?: React.ReactNode;
  bottomActions?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  cutoutSize?: string;
  cutoutRadius?: string;
  cutoutGap?: string;
}

function parseValueToPx(val: string): number {
  if (val.endsWith('rem')) return parseFloat(val) * 16;
  if (val.endsWith('px')) return parseFloat(val);
  return parseFloat(val) || 0;
}

export const InteractiveCard = React.forwardRef<
  HTMLDivElement,
  InteractiveCardProps
>(
  (
    {
      className,
      children,
      actions,
      bottomActions,
      href,
      onClick,
      cutoutSize = '3.5rem',
      cutoutRadius = '0.625rem',
      cutoutGap = '0.5rem',
      style,
      ...props
    },
    ref
  ) => {
    const hasNavigation = !!href || !!onClick || !!bottomActions;
    const hasActions = !!actions;

    const s = parseValueToPx(cutoutSize) + parseValueToPx(cutoutGap);
    const r = parseValueToPx(cutoutRadius);

    const pathTR = `M 0 0 L ${-s - r} 0 A ${r} ${r} 0 0 1 ${-s} ${r} L ${-s} ${s - r} A ${r} ${r} 0 0 0 ${-s + r} ${s} L ${-r} ${s} A ${r} ${r} 0 0 1 0 ${s + r} Z`;
    const pathBR = `M 0 0 L 0 ${-s - r} A ${r} ${r} 0 0 1 ${-r} ${-s} L ${-s + r} ${-s} A ${r} ${r} 0 0 0 ${-s} ${-s + r} L ${-s} ${-r} A ${r} ${r} 0 0 1 ${-s - r} 0 Z`;

    const borderTR = `M ${-s - r} 0 A ${r} ${r} 0 0 1 ${-s} ${r} L ${-s} ${s - r} A ${r} ${r} 0 0 0 ${-s + r} ${s} L ${-r} ${s} A ${r} ${r} 0 0 1 0 ${s + r}`;
    const borderBR = `M 0 ${-s - r} A ${r} ${r} 0 0 1 ${-r} ${-s} L ${-s + r} ${-s} A ${r} ${r} 0 0 0 ${-s} ${-s + r} L ${-s} ${-r} A ${r} ${r} 0 0 1 ${-s - r} 0`;

    const maskSvgUri = React.useMemo(() => {
      if (!hasActions && !hasNavigation) return '';

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <mask id="m">
              <rect width="100%" height="100%" fill="white" />
              ${hasActions ? `<svg x="100%" y="0" overflow="visible"><path d="${pathTR}" fill="black" /></svg>` : ''}
              ${hasNavigation ? `<svg x="100%" y="100%" overflow="visible"><path d="${pathBR}" fill="black" /></svg>` : ''}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="white" mask="url(#m)" />
        </svg>
      `.trim();

      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    }, [hasActions, hasNavigation, pathTR, pathBR]);

    return (
      <div className={cn('relative group w-full', className)} style={style}>
        <div
          ref={ref}
          className="relative w-full h-full bg-card text-card-foreground shadow-sm min-h-[8rem] flex flex-col rounded-xl"
          style={{
            ...(maskSvgUri
              ? {
                WebkitMaskImage: `url("${maskSvgUri}")`,
                maskImage: `url("${maskSvgUri}")`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }
              : {}),
          }}
          {...props}
        >
          <div className="absolute inset-0 border border-border pointer-events-none rounded-xl" />

          <div className="p-6 flex-1 flex flex-col relative z-10">
            {children}
          </div>
        </div>

        {(hasActions || hasNavigation) && (
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full"
            overflow="visible"
          >
            {hasActions && (
              <svg x="100%" y="0" overflow="visible">
                <path
                  d={borderTR}
                  fill="none"
                  strokeWidth="1"
                  className="stroke-border"
                  transform="translate(-0.5, 0.5)"
                />
              </svg>
            )}
            {hasNavigation && (
              <svg x="100%" y="100%" overflow="visible">
                <path
                  d={borderBR}
                  fill="none"
                  strokeWidth="1"
                  className="stroke-border"
                  transform="translate(-0.5, -0.5)"
                />
              </svg>
            )}
          </svg>
        )}

        {hasActions && (
          <div
            className="absolute top-0 right-0 flex items-start justify-end z-20"
            style={{ width: cutoutSize, height: cutoutSize }}
          >
            {actions}
          </div>
        )}

        {hasNavigation && (
          <div
            className="absolute bottom-0 right-0 flex items-end justify-end z-20"
            style={{ width: cutoutSize, height: cutoutSize }}
          >
            {bottomActions ? (
              bottomActions
            ) : href ? (
              <Link
                href={href}
                className="flex items-center justify-center w-full h-full bg-brand-purple-bg text-brand-purple border border-brand-purple-border hover:bg-brand-purple-hover dark:hover:bg-brand-purple-hover transition-colors rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40"
              >
                <ArrowRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            ) : (
              <button
                onClick={onClick}
                className="flex items-center justify-center w-full h-full cursor-pointer bg-brand-purple-bg text-brand-purple border border-brand-purple-border hover:bg-brand-purple-hover dark:hover:bg-brand-purple-hover transition-colors rounded-lg shadow-lg shadow-black/10 dark:shadow-black/40"
              >
                <ArrowRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);
InteractiveCard.displayName = 'InteractiveCard';
