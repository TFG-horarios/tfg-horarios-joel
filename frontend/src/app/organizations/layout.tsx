import { getSessionUser } from '@/features/auth/actions';
import { AuthInitializer } from '@/features/auth/components/auth-initializer';

export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="relative h-screen w-full overflow-hidden text-foreground">
      <AuthInitializer user={user} />
      <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
