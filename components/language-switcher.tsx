'use client';

import {useMemo} from 'react';

import {useLocale, useTranslations} from 'next-intl';
import {useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/navigation';

import {locales} from '@/i18n';

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({className}: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('nav');

  const options = useMemo(
    () =>
      locales.map(code => ({
        code,
        label: code.toUpperCase()
      })),
    []
  );

  const handleSelect = (nextLocale: string) => {
    if (nextLocale === locale) return;
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    router.replace(nextPath, {locale: nextLocale});
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('language')}</span>
        <div className="flex overflow-hidden rounded border">
          {options.map(option => {
            const active = option.code === locale;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => handleSelect(option.code)}
                className={`px-2 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:bg-muted'
                }`}
                aria-pressed={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
