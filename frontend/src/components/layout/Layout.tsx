import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

// Pages that need full-bleed (no container padding) for hero sections
const FULL_BLEED_ROUTES = ['/'];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isFullBleed = FULL_BLEED_ROUTES.includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page, #f9fafb)' }}>
      <Navbar />
      <main style={{
        flex: 1,
        ...(isFullBleed
          ? {}
          : { maxWidth: '1280px', width: '100%', margin: '0 auto', padding: 'clamp(1.25rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)' }),
      }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};
