'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-uva-navy text-white/60 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs" style={{ fontFamily: 'serif' }}>T</span>
            </div>
            <span className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-playfair)' }}>
              UVA Turkish Network
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/jobs" className="hover:text-white transition-colors">{t.nav.opportunities}</Link>
            <Link href="/auth/register" className="hover:text-white transition-colors">{t.nav.join}</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">{t.nav.signIn}</Link>
          </div>

          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} UVA Turkish Student Association
          </p>
        </div>
      </div>
    </footer>
  );
}
