import { getSessionUser } from '@/features/auth/queries';
import { ProfilePageClient } from '@/features/profile/components/profile-page-client';

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) return null;

  return <ProfilePageClient user={user} />;
}
