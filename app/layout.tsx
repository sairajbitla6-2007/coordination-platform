import type { Metadata } from 'next';
import './globals.css';
import { PlatformProvider } from '@/lib/context/PlatformContext';
import Header from '@/components/Header';
import ToastContainer from '@/components/ToastContainer';
import SimulationDrawer from '@/components/SimulationDrawer';

export const metadata: Metadata = {
  title: 'LifeLink - Digital Organ Donation & Transplant Coordination Platform',
  description: 'Real-time organ donation, AI compatibility auto-matching, rapid transport tracking, and hospital verification system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-background">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-body-md text-on-background flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
        <PlatformProvider>
          <Header />
          <main className="flex-1 w-full pt-16 pb-24">{children}</main>
          <SimulationDrawer />
          <ToastContainer />
        </PlatformProvider>
      </body>
    </html>
  );
}
