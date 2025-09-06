import type { Metadata, Viewport } from 'next';
import './globals.css';
import './themes/sketch.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Pwa } from '@/components/pwa';
import { SettingsProvider } from '@/hooks/use-settings';
import { NdSprite } from '@/components/ui/nd-sprite';
import { Inter, Lexend } from 'next/font/google';
import SketchSprite from '@/components/ui/SketchSprite';

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
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
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
      <head>
        {/* Handwritten, readable fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Kalam:wght@300;400;700&family=Patrick+Hand&display=swap"
          rel="stylesheet"
        />
        {/* wired-elements (sketchy web components) */}
        <script
          type="module"
          defer
          src="https://unpkg.com/wired-elements/lib/wired-elements-bundled.js"
        ></script>
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background')}>
        <NdSprite />
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              {children}
              <Toaster />
              <Pwa />
            </AuthProvider>
          </SettingsProvider>
          {/* Inline the sketch SVG symbols once per document */}
          <SketchSprite />
        </ThemeProvider>
      </body>
    </html>
  );
}
