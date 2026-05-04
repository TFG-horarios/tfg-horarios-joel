import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <Card className="w-full max-w-md border-white/60 bg-white/80 shadow-2xl shadow-zinc-900/10 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80 dark:shadow-black/20">
      <CardHeader className="space-y-2">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
            {eyebrow}
          </p>
        )}
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
