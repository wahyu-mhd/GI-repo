// app/[locale]/layout.tsx
import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations, setRequestLocale} from 'next-intl/server';

import LanguageSwitcher from '@/components/language-switcher';
import {ThemeProvider} from '@/components/theme-provider';
import {ThemeToggle} from '@/components/theme-toggle';
import {Link} from '@/navigation';
import {locales} from '@/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: {locale: string} | Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  // Bind messages/translations to the current locale explicitly
  const messages = await getMessages({locale});
  const t = await getTranslations({locale, namespace: 'nav'});

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold font-serif text-primary">
              {t('brand')}
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
