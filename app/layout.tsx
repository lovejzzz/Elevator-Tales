import type { Metadata } from 'next';
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google';
import type { CSSProperties } from 'react';
import './globals.css';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });
const display = Cormorant_Garamond({ variable: '--font-display', subsets: ['latin'], weight: ['500', '600', '700'] });
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const elevatorImage = `${publicBasePath}/assets/elevator-cabin.png`;
const publicOrigin = process.env.GITHUB_PAGES === 'true'
  ? 'https://lovejzzz.github.io/'
  : 'https://elevator-tales-midnight.skylab.chatgpt.site/';

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: 'Elevator Tales — Midnight Shift',
  description: "You are tonight's temporary elevator operator in a strange, endless building. Manage riders, power, and agitation—and survive.",
  openGraph: {
    title: 'Elevator Tales — Midnight Shift',
    description: "You are tonight's temporary elevator operator in a strange, endless building. Manage riders, power, and agitation—and survive.",
    images: [elevatorImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const imageStyle = {
    '--elevator-cabin-image': `url("${elevatorImage}")`,
  } as CSSProperties;

  return <html lang="en" className="dark" style={imageStyle}><body className={`${sans.variable} ${mono.variable} ${display.variable}`}>{children}</body></html>;
}
