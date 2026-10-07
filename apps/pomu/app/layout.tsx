import type { ReactNode } from 'react';
import './globals.css';
export const metadata = { title: 'Pomu', description: 'Your little slime companion. Pet, stretch and play together.' };
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className="antialiased">{children}</body></html>;
}
