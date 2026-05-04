import { notFound } from 'next/navigation';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchOrganizations } from '@/features/organizations/actions';

type OrganizationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationDetailPage({
  params,
}: OrganizationPageProps) {
  const { id } = await params;
  const organizations = await fetchOrganizations();
  const organization = organizations.find((item) => item.id === id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
          Organización
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {organization.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Vista detallada de la organización seleccionada.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="space-y-1 p-5">
            <CardDescription>Tipo de período</CardDescription>
            <CardTitle className="text-lg">{organization.periodType}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-1 p-5">
            <CardDescription>Mañana</CardDescription>
            <CardTitle className="text-lg">
              {organization.morningStart} - {organization.morningEnd}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-1 p-5">
            <CardDescription>Tarde</CardDescription>
            <CardTitle className="text-lg">
              {organization.afternoonStart} - {organization.afternoonEnd}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-1 p-5">
            <CardDescription>Duración por clase</CardDescription>
            <CardTitle className="text-lg">
              {organization.slotDurationMinutes} min
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
