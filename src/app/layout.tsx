import './globals.css';
import type { Metadata } from 'next';
import ClientProvider from './components/ClientProvider';
import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

export const metadata: Metadata = {
  title: 'LunaTODO',
  description: 'A cute pastel pixel art todo list',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pixelFont.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body 
        style={{
          background: 'linear-gradient(45deg, #ffb6c1 25%, #ffc1d0 25%, #ffc1d0 50%, #ffb6c1 50%, #ffb6c1 75%, #ffc1d0 75%, #ffc1d0)',
          backgroundSize: '40px 40px',
          imageRendering: 'pixelated',
          minHeight: '100vh',
        }}
        className="font-pixel"
      >
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
