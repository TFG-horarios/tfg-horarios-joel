import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { getSessionUser } from '@/features/auth/actions';
import { AuthInitializer } from '@/features/auth/components/auth-initializer';
import { Background } from '@/components/layout/background';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-login-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-login-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'TFG Horarios',
  description: 'Planificacion de horarios con acceso seguro',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Background />
          <AuthInitializer user={user} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
