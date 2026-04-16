'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import Image from 'next/image';
import { Menu, X, ChevronDown, LogOut, User, Settings } from 'lucide-react';

export default function Navbar() {
  const [user, setUser]         = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { lang, setLang, t } = useLanguage();

  const isLanding = pathname === '/';

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      if (data) setUser(data as Profile);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
      } else if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) setUser(data as Profile);
      }
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDropOpen(false);
    router.push('/');
    router.refresh();
  };

  const navLinks = user
    ? [
        { href: '/dashboard',  label: t.nav.dashboard },
        { href: '/directory',  label: t.nav.directory },
        { href: '/jobs',       label: t.nav.opportunities },
        { href: '/requests',   label: t.nav.requests },
        ...(user.role === 'alumni' ? [{ href: '/messages', label: t.nav.messages }] : []),
        ...(user.role === 'admin'  ? [{ href: '/admin',    label: t.nav.admin }]    : []),
      ]
    : [
        { href: '/jobs',          label: t.nav.opportunities },
        { href: '/auth/login',    label: t.nav.signIn },
      ];

  // Navbar background: white always except on landing before scroll
  const navBg = isLanding && !scrolled
    ? 'bg-transparent'
    : 'bg-white shadow-sm border-b border-gray-100';

  const textColor = isLanding && !scrolled ? 'text-white' : 'text-gray-700';
  const logoColor = isLanding && !scrolled ? 'text-white' : 'text-gray-900';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* Turkish crescent-inspired red mark */}
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-primary-700 transition-colors">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'serif' }}>T</span>
            </div>
            <span className={`font-semibold text-sm tracking-wide hidden sm:block transition-colors ${logoColor}`}
              style={{ fontFamily: 'var(--font-playfair)' }}>
              UVA Turkish Network
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary-50 text-primary-600'
                    : `${textColor} hover:bg-gray-100 hover:text-gray-900`
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Join button (guests only) */}
            {!user && (
              <Link
                href="/auth/register"
                className="ml-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                {t.nav.join}
              </Link>
            )}

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
              title={lang === 'en' ? 'Türkçeye geç' : 'Switch to English'}
              className={`ml-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                isLanding && !scrolled
                  ? 'border-white/30 hover:bg-white/10'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Image
                src={lang === 'en' ? '/flag-tr.svg' : '/flag-us.svg'}
                alt={lang === 'en' ? 'Turkish flag' : 'US flag'}
                width={24}
                height={16}
                className="rounded-sm object-cover"
              />
            </button>

            {/* User dropdown */}
            {user && (
              <div className="relative ml-2">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
                    {getInitials(user.full_name || user.email)}
                  </div>
                  <span className="text-gray-700 text-sm max-w-[90px] truncate">
                    {user.full_name?.split(' ')[0] || 'Me'}
                  </span>
                  <ChevronDown size={13} className={`text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      <p className="text-xs font-semibold text-gray-700 capitalize mt-0.5">{user.role}</p>
                    </div>
                    <Link href={`/profile/${user.id}`} onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User size={14} /> {t.nav.myProfile}
                    </Link>
                    <Link href="/profile/edit" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings size={14} /> {t.nav.editProfile}
                    </Link>
                    <button onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100">
                      <LogOut size={14} /> {t.nav.signOut}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile: language toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-colors ${
                isLanding && !scrolled
                  ? 'border-white/30 hover:bg-white/10'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Image
                src={lang === 'en' ? '/flag-tr.svg' : '/flag-us.svg'}
                alt={lang === 'en' ? 'Turkish flag' : 'US flag'}
                width={22}
                height={14}
                className="rounded-sm object-cover"
              />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2 transition-colors ${isLanding && !scrolled ? 'text-white' : 'text-gray-600'}`}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link href="/auth/register" onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white text-center mt-2">
              {t.nav.join}
            </Link>
          )}
          {user && (
            <>
              <Link href={`/profile/${user.id}`} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                {t.nav.myProfile}
              </Link>
              <Link href="/profile/edit" onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                {t.nav.editProfile}
              </Link>
              <button onClick={handleSignOut}
                className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50">
                {t.nav.signOut}
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
