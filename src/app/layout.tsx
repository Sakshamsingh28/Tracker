import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Double S Studio – Project Tracker',
  description: 'Track the progress of your Double S Studio project.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
