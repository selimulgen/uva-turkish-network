'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile } from '@/lib/types';
import { ArrowLeft, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewJobPage() {
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  const [title, setTitle]           = useState('');
  const [company, setCompany]       = useState('');
  const [jobType, setJobType]       = useState<'full_time' | 'internship' | 'referral'>('full_time');
  const [location, setLocation]     = useState('');
  const [description, setDescription] = useState('');
  const [appUrl, setAppUrl]         = useState('');

  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t }    = useLanguage();

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!data || data.role !== 'alumni') {
      router.push('/dashboard');
      return;
    }
    setProfile(data as Profile);
    setCompany(data.company || '');
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: insertError } = await supabase.from('jobs').insert({
      posted_by: profile!.id,
      title,
      company,
      type: jobType,
      location,
      description,
      application_url: appUrl,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/jobs'), 1500);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        <Link href="/jobs" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={16} /> {t.common.back}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
            {t.jobs.postTitle}
          </h1>
          <p className="text-gray-500 text-sm mt-2">{t.jobs.postSub}</p>
        </div>

        {success ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t.jobs.published}</h2>
            <p className="text-gray-500 text-sm">{t.jobs.publishedSub}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.jobs.jobTitle}</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  className={inputClass} placeholder={t.jobs.jobTitlePH} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.jobs.company}</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} required
                    className={inputClass} placeholder={t.jobs.companyPH} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.jobs.type}</label>
                  <select value={jobType} onChange={e => setJobType(e.target.value as typeof jobType)}
                    className={inputClass + ' cursor-pointer'}>
                    <option value="full_time">{t.jobs.fullTimePos}</option>
                    <option value="internship">{t.jobs.internship}</option>
                    <option value="referral">{t.jobs.referral}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.jobs.location}</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  className={inputClass} placeholder={t.jobs.locationPH} />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.jobs.description}</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required
                  rows={5} className={inputClass + ' resize-none'}
                  placeholder={t.jobs.descPH} />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.jobs.appUrl}</label>
                <input type="url" value={appUrl} onChange={e => setAppUrl(e.target.value)}
                  className={inputClass} placeholder={t.jobs.appUrlPH} />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong className="block mb-1">ⓘ</strong>
              {t.jobs.privacyNote}{' '}
              <Link href="/profile/edit" className="underline">{t.jobs.adjustIn}</Link>.
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-4 py-2.5">
                {t.profile.cancel}
              </Link>
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors disabled:opacity-60">
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Briefcase size={16} /> {t.jobs.publishBtn}</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
