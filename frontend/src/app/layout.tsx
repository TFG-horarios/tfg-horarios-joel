import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { getSessionUser } from '@/features/auth/queries';
import { SessionProvider } from '@/components/providers/session-provider';
import { Background } from '@/components/layout/background';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-login-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-login-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [user, locale, messages] = await Promise.all([
    getSessionUser(),
    getLocale(),
    getMessages(),
  ]);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased text-foreground">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider initialUser={user}>
              <Background />
              {children}
              <Toaster position="bottom-right" richColors />
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
