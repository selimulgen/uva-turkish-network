'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createImplicitClient } from '@/lib/supabase/implicit-client';
import { useLanguage } from '@/lib/language-context';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';

// Implicit-flow singleton shared with reset-password so the reset link works
// across browsers/devices, without spawning extra GoTrueClient instances.
const supabase = createImplicitClient();

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);
  const { t }    = useLanguage();

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors text-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

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
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'serif' }}>T</span>
            </div>
            <span className="text-gray-900 font-semibold" style={{ fontFamily: 'var(--font-playfair)' }}>
              UVA Turkish Network
            </span>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                {t.auth.checkInbox}
              </h1>
              <p className="text-gray-500 text-sm mb-1">{t.auth.forgotPwSuccessSub}</p>
              <p className="text-gray-800 text-sm font-medium mb-6">{email}</p>
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700">
                <ArrowLeft size={14} /> {t.auth.backToSignIn}
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft size={14} /> {t.auth.backToSignIn}
              </Link>

              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                {t.auth.forgotPwTitle}
              </h1>
              <p className="text-gray-500 mb-8 text-sm">{t.auth.forgotPwSub}</p>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block mb-1.5">{t.auth.email}</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="you@virginia.edu"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {loading
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : t.auth.forgotPwBtn
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
