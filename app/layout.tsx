import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Inswinger - Watch Live Sports Streaming',
  description: 'Watch live sports streaming from top athletes and teams. NFL, Football, Basketball, Cricket, F1, and more.',
  keywords: 'live streaming, sports, NFL, football, basketball, cricket, F1, racing',
  openGraph: {
    title: 'Inswinger - Watch Live Sports Streaming',
    description: 'Watch live sports streaming from top athletes and teams. NFL, Football, Basketball, Cricket, F1, and more.',
    type: 'website',
  },
	// Ensure Next resolves metadata URLs (OG / twitter images) using a canonical base.
	metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
