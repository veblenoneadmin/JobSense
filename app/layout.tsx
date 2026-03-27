import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JobSense — Veblen Group',
  description: 'Active job execution hub for Veblen Group',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0B0B0B' }}>
        {children}
      </body>
    </html>
  );
}
