import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Berber Randevu',
  description: 'Online berber randevu sistemi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-950 min-h-screen antialiased">{children}</body>
    </html>
  );
}
