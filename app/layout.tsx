import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/language-context';

export const metadata: Metadata = {
  title: 'UVA Turkish Network',
  description: 'Connecting UVA Turkish alumni with current students for mentorship, career opportunities, and community.',
  openGraph: {
    title: 'UVA Turkish Network',
    description: 'Connecting UVA Turkish alumni with current students.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
