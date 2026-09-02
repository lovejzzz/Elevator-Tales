import type { Metadata } from 'next';
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });
const display = Cormorant_Garamond({ variable: '--font-display', subsets: ['latin'], weight: ['500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Elevator Tales — Midnight Shift',
  description: 'Six positions. Sixty floors. Everyone has somewhere to be.',
  openGraph: {
    title: 'Elevator Tales — Midnight Shift',
    description: 'Six positions. Sixty floors. Everyone has somewhere to be.',
    images: ['/assets/elevator-cabin.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" className="dark"><body className={`${sans.variable} ${mono.variable} ${display.variable}`}>{children}</body></html>;
}
