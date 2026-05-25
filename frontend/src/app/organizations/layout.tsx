export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen w-full overflow-hidden text-foreground">
      <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
