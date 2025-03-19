import './globals.css';
import { Metadata } from 'next';
import ClientProvider from './components/ClientProvider';
import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

export const metadata: Metadata = {
  title: 'MeowTODO - Pixel Art Todo App',
  description: 'A cute pixel art themed todo list application with social features!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={pixelFont.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
