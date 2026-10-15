import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'mesq — bird street',
  description: 'The full bird street portfolio ported into Next.js, with modular scene code. Original design by mesq.',
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#1f63f2',
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><head>
    <link rel="preload" href="/fonts/ibm-plex-mono-700-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    <link rel="stylesheet" href="/fonts/fonts.css" />
    <noscript><style>{'#no3d{display:block!important}#loader,#scene,#menu,#helper{display:none!important}body{opacity:1}'}</style></noscript>
  </head><body>{children}</body></html>;
}
