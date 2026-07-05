import { OrganizationHeader } from '@/components/layout/organization-header';
import type { ReactNode } from 'react';
import { OrganizationContentFrame } from './organization-content-frame';

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative h-screen w-full overflow-hidden text-foreground">
      <div className="flex h-full flex-col gap-2 p-2 lg:gap-3 lg:p-3">
        <div className="relative z-50">
          <OrganizationHeader />
        </div>
        <div className="relative z-10 flex h-full w-full min-h-0 flex-col gap-2 lg:gap-3">
          <OrganizationContentFrame>{children}</OrganizationContentFrame>
        </div>
      </div>
    </div>
  );
}
