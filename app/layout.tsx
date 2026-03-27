import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobSense — Veblen Group',
  description: 'Active job execution hub for Veblen Group',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
