'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirectedFrom') || '/dashboard';
  const supabase     = createClient();
  const { t }        = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push(redirectTo);
    router.refresh();
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors text-sm";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 turkish-pattern flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700/70 to-primary-600/30 pointer-events-none" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'serif' }}>T</span>
            </div>
            <span className="text-white font-semibold" style={{ fontFamily: 'var(--font-playfair)' }}>
              UVA Turkish Network
            </span>
          </Link>
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-0.5 bg-white/30" />
            <span className="text-white/40 text-xs uppercase tracking-widest">UVA · Charlottesville</span>
          </div>
          <blockquote className="text-white/85 text-xl italic leading-relaxed mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            &ldquo;The best investment you can make is in the network around you.&rdquo;
          </blockquote>
          <p className="text-white/40 text-sm">UVA Turkish Alumni Community</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'serif' }}>T</span>
            </div>
            <span className="text-gray-900 font-semibold" style={{ fontFamily: 'var(--font-playfair)' }}>
              UVA Turkish Network
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            {t.auth.loginTitle}
          </h1>
          <p className="text-gray-500 mb-8 text-sm">{t.auth.loginSub}</p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block mb-1.5">{t.auth.email}</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className={inputClass} placeholder="you@virginia.edu" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password">{t.auth.password}</label>
                <Link href="/auth/forgot-password" className="text-xs text-primary-600 hover:text-primary-700">{t.auth.forgotPassword}</Link>
              </div>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className={inputClass + ' pr-11'} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>{t.auth.signIn} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.noAccount}{' '}
            <Link href="/auth/register" className="text-primary-600 font-medium hover:text-primary-700">
              {t.auth.joinNetwork}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
