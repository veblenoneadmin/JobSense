import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobSense — Veblen Group',
  description: 'Active job execution hub for Veblen Group',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ height: '100%', margin: 0, padding: 0, overflow: 'hidden', background: '#1e1e1e' }}>
        {children}
      </body>
    </html>
  );
}
