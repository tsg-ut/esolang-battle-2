import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import AuthProvider from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import TRPCProvider from '@/components/TRPCProvider';
import { App as AntdApp } from 'antd';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Esolang Battle 2',
  description: 'Esolang Golf Battle Platform',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <TRPCProvider>
            <AntdApp>
              <NavBar />
              <main>{children}</main>
            </AntdApp>
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
