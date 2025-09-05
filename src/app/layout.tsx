import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Pwa } from '@/components/pwa';
import { SettingsProvider } from '@/hooks/use-settings';
import { NdSprite } from '@/components/ui/nd-sprite';
import { Patrick_Hand } from 'next/font/google';

export const metadata: Metadata = {
  title: 'NoteDrop: Location-Based Notes',
  description: 'Leave and discover location-anchored virtual post-its.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-512.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const patrickHand = Patrick_Hand({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-hand',
    display: 'swap',
  });
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={patrickHand.variable}
    >
      <body className={cn('font-body antialiased', 'min-h-screen bg-background')}>
        <NdSprite />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <AuthProvider>
              {children}
              <Toaster />
              <Pwa />
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
