'use client';

import { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import { isUvaEmail } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle2, GraduationCap, Briefcase } from 'lucide-react';

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultRole  = searchParams.get('role') === 'alumni' ? 'alumni' : 'student';
  const { t }        = useLanguage();

  const [role, setRole]         = useState<'student' | 'alumni'>(defaultRole as 'student' | 'alumni');
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (role === 'student' && !isUvaEmail(email)) {
      setError(t.auth.studentEmailNote);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.minChars);
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName, role },
      },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors text-sm";

  if (success) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
          {t.auth.checkInbox}
        </h2>
        <p className="text-gray-500 text-sm mb-1 leading-relaxed">{t.auth.checkInboxSub}{' '}
          <strong className="text-gray-900">{email}</strong>.
        </p>
        <p className="text-gray-500 text-sm mb-6">{t.auth.checkInboxSub2}</p>
        <Link href="/auth/login" className="text-primary-600 font-medium text-sm hover:text-primary-700">
          {t.auth.backToSignIn}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex">
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
          <p className="text-white/50 text-xs uppercase tracking-widest mb-4">🇹🇷 &nbsp; 🇺🇸</p>
          <p className="text-white/85 text-xl leading-relaxed" style={{ fontFamily: 'var(--font-playfair)' }}>
            Hundreds of UVA Turkish alumni and students — connected, mentoring, and opening doors for each other.
          </p>
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
            {t.auth.registerTitle}
          </h1>
          <p className="text-gray-500 mb-6 text-sm">{t.auth.registerSub}</p>

          {/* Role toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            {(['student', 'alumni'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {r === 'student' ? <GraduationCap size={15} /> : <Briefcase size={15} />}
                {r === 'student' ? t.auth.student : t.auth.alumni}
              </button>
            ))}
          </div>

          {role === 'student' && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs px-3 py-2.5 rounded-lg mb-5 leading-relaxed">
              {t.auth.studentEmailNote}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5">{t.auth.fullName}</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                className={inputClass} placeholder={t.auth.namePlaceholder} />
            </div>
            <div>
              <label className="block mb-1.5">{role === 'student' ? t.auth.uvaEmail : t.auth.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className={inputClass} placeholder={role === 'student' ? 'abc2de@virginia.edu' : 'you@email.com'} />
            </div>
            <div>
              <label className="block mb-1.5">{t.auth.password}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={8}
                  className={inputClass + ' pr-11'} placeholder={t.auth.minChars} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 mt-2">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : t.auth.createAccount
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.alreadyMember}{' '}
            <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700">
              {t.auth.signInLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RegisterForm />
    </Suspense>
  );
}
