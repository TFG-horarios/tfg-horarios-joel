import Link from 'next/link';
import { ArrowRight, CalendarRange, ShieldCheck, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const highlights = [
  {
    icon: CalendarRange,
    title: 'Horario centralizado',
    description:
      'Visualiza y organiza franjas, aulas y asignaturas en un solo lugar.',
  },
  {
    icon: ShieldCheck,
    title: 'Acceso seguro',
    description:
      'JWT, permisos por rol y sesión preparada para crecer con el equipo.',
  },
  {
    icon: Users2,
    title: 'Trabajo en equipo',
    description:
      'Diseñado para coordinar organizaciones, miembros y cambios sin ruido.',
  },
];

export default function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-24">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="max-w-2xl space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              TFG Horarios
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Planifica horarios con una interfaz limpia, rápida y seria.
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400 sm:text-lg">
              Una base moderna para gestionar organizaciones, aulas, materias y
              usuarios con autenticación JWT y una experiencia visual coherente
              de principio a fin.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 px-5">
              <Link href="/login">
                Iniciar sesion
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-5">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="border-white/60 bg-white/70 shadow-lg shadow-zinc-900/5 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80 dark:shadow-black/20"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <aside className="lg:justify-self-end">
          <Card className="w-full max-w-md border-white/60 bg-white/80 shadow-2xl shadow-zinc-900/10 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80 dark:shadow-black/20">
            <CardHeader className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                Acceso
              </p>
              <CardTitle className="text-2xl">Entra o registrate</CardTitle>
              <CardDescription>
                Continua en la ruta que mejor encaje con tu estado actual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                El estilo del login se mantiene en todas las pantallas de
                autenticacion.
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="h-11 w-full">
                  <Link href="/login">Ir al login</Link>
                </Button>
                <Button asChild variant="outline" className="h-11 w-full">
                  <Link href="/register">Abrir registro</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
