import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Mosaic · Cross-media discovery',
  description:
    'Explore connections across books, music, games, movies, and television.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
