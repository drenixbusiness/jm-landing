import fs from 'node:fs';
import path from 'node:path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SceneBackground from '@/components/SceneBackground';
import RevealObserver from '@/components/RevealObserver';
import HighwayScrollbar from '@/components/HighwayScrollbar';
import './globals.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800&family=JetBrains+Mono:wght@500;700&family=Overpass:wght@700;800&display=swap';

export const metadata = {
  metadataBase: new URL('https://joshua-llc.com'),
  title: {
    default: 'Reliable Logistics Solutions by Joshua Meuzelaar LLC - Your Trusted Partner in Freight Transportation',
    template: '%s · Joshua Meuzelaar LLC',
  },
  description:
    'Joshua Meuzelaar LLC is a dry van carrier recruiting owner-operators and drivers across the United States. Weekly pay, 24/7 dispatch, no trailer fee and no escrow.',
  icons: { icon: '/assets/jm-mark.png' },
};

export const viewport = {
  themeColor: '#0a7f6f',
  width: 'device-width',
  initialScale: 1,
};

// The Cascadia GLB is optional: drop it into /public/assets and the scene picks it up.
// Checked per render (not at module load) so adding the file never needs a server restart.
const GLB_URL = '/assets/cascadia.glb';
const glbExists = () => fs.existsSync(path.join(process.cwd(), 'public', 'assets', 'cascadia.glb'));

export default function RootLayout({ children }) {
  const hasGlb = glbExists();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SceneBackground glbUrl={GLB_URL} signFont="Overpass" />
        <Header />
        <main id="main" className="page">{children}</main>
        <Footer hasGlb={hasGlb} />
        <RevealObserver />
        <HighwayScrollbar />
      </body>
    </html>
  );
}
