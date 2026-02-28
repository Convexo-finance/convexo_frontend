import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { cookieToInitialState } from '@account-kit/core';
import './globals.css';
import { Providers } from './providers';
import { alchemyConfig } from '@/lib/alchemy/config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Convexo Protocol',
  description: 'Reducing the Gap funding for SMEs in Latin America',
  icons: {
    icon: '/logo_convexo.png',
    shortcut: '/logo_convexo.png',
    apple: '/logo_convexo.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialState = cookieToInitialState(
    alchemyConfig,
    (await headers()).get('cookie') ?? undefined
  );

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}

