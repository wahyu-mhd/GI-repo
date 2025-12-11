// app/layout.tsx
import './globals.css';

import type {ReactNode} from 'react';

import {defaultLocale} from '@/i18n';

export const metadata = {
  title: 'Parents LMS',
  description: "Course platform for your parents' classes"
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground transition-colors">
        {children}
      </body>
    </html>
  );
}
