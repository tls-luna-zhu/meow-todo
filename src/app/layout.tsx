import './globals.css';
import type { Metadata } from 'next';
import ClientProvider from './components/ClientProvider';
import { ThemeProvider } from './contexts/ThemeContext'; // Fixed path
import ThemeSwitcher from './components/ThemeSwitcher';
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
      <body className="font-pixel"> {/* Removed inline style */}
        <ThemeProvider>
          <ClientProvider>
            {children}
          </ClientProvider>
          <div className="fixed top-4 right-4 z-50">
            <ThemeSwitcher />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
