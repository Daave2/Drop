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
import { Inter, Lexend } from 'next/font/google';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontHeading = Lexend({
  subsets: ['latin'],
  variable: '--font-heading',
});

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
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontHeading.variable}`}
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
