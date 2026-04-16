'use client';

import { useState, useCallback } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile } from '@/lib/types';
import { INDUSTRIES, LOOKING_FOR_OPTIONS, generateYearRange } from '@/lib/utils';
import { Save, CheckCircle2 } from 'lucide-react';

const DEGREE_TYPES = ['B.A.', 'B.S.', 'M.S.', 'M.A.', 'MBA', 'J.D.', 'M.D.', 'Ph.D.', 'Other'];
const YEARS = generateYearRange(1970, new Date().getFullYear() + 5);

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(true);

  const router   = useRouter();
  const supabase = createClient();
  const { t }    = useLanguage();

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data as Profile);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useVisibilityRefetch(fetchProfile);

  const update = (field: keyof Profile, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleLookingFor = (value: string) => {
    const current = (profile.looking_for as string[]) || [];
    update('looking_for', current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ ...profile, profile_completed: true, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  const isAlumni  = profile.role === 'alumni';
  const isStudent = profile.role === 'student';

  const inputClass  = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors text-sm";
  const selectClass = inputClass + " cursor-pointer";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
            {profile.profile_completed ? t.profile.editTitle : t.profile.completeTitle}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {profile.profile_completed ? t.profile.editSub : t.profile.completeSub}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Basic Info */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-5">{t.profile.basicInfo}</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.fullName}</label>
                <input type="text" value={profile.full_name || ''} onChange={e => update('full_name', e.target.value)}
                  className={inputClass} placeholder={t.auth.namePlaceholder} required />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.bio}</label>
                <textarea value={profile.bio || ''} onChange={e => update('bio', e.target.value)}
                  rows={3} className={inputClass + ' resize-none'}
                  placeholder={t.profile.bioPlaceholder} />
              </div>
            </div>
          </section>

          {/* Student fields */}
          {isStudent && (
            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-5">{t.profile.academic}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.gradYear}</label>
                  <select value={profile.graduation_year || ''} onChange={e => update('graduation_year', parseInt(e.target.value))}
                    className={selectClass}>
                    <option value="">{t.profile.selectYear}</option>
                    {generateYearRange(new Date().getFullYear(), new Date().getFullYear() + 6).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.degreeType}</label>
                  <select value={profile.degree_type || ''} onChange={e => update('degree_type', e.target.value)}
                    className={selectClass}>
                    <option value="">{t.profile.selectType}</option>
                    {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.major}</label>
                  <input type="text" value={profile.major || ''} onChange={e => update('major', e.target.value)}
                    className={inputClass} placeholder="e.g. Computer Science" />
                </div>
              </div>

              <div className="mt-5">
                <label className="block mb-3 text-sm font-medium text-gray-700">{t.profile.lookingFor}</label>
                <div className="flex flex-wrap gap-2">
                  {LOOKING_FOR_OPTIONS.map(opt => {
                    const selected = ((profile.looking_for as string[]) || []).includes(opt.value);
                    return (
                      <button key={opt.value} type="button" onClick={() => toggleLookingFor(opt.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                          selected
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                        }`}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Alumni fields */}
          {isAlumni && (
            <>
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-5">{t.profile.uvaBackground}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.uvaGradYear}</label>
                    <select value={profile.uva_graduation_year || ''} onChange={e => update('uva_graduation_year', parseInt(e.target.value))}
                      className={selectClass}>
                      <option value="">{t.profile.selectYear}</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.uvaStudied}</label>
                    <input type="text" value={profile.uva_major || ''} onChange={e => update('uva_major', e.target.value)}
                      className={inputClass} placeholder="e.g. Economics" />
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-5">{t.profile.currentPos}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.currentRole}</label>
                    <input type="text" value={profile.current_role || ''} onChange={e => update('current_role', e.target.value)}
                      className={inputClass} placeholder="e.g. Senior Software Engineer" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.company}</label>
                    <input type="text" value={profile.company || ''} onChange={e => update('company', e.target.value)}
                      className={inputClass} placeholder="e.g. Google" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.industry}</label>
                    <select value={profile.industry || ''} onChange={e => update('industry', e.target.value)}
                      className={selectClass}>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.city}</label>
                    <input type="text" value={profile.city || ''} onChange={e => update('city', e.target.value)}
                      className={inputClass} placeholder="e.g. New York, NY" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.linkedin}</label>
                    <input type="url" value={profile.linkedin_url || ''} onChange={e => update('linkedin_url', e.target.value)}
                      className={inputClass} placeholder="https://linkedin.com/in/yourname" />
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">{t.profile.privacy}</h2>
                <p className="text-gray-500 text-sm mb-5">{t.profile.privacySub}</p>
                <div className="space-y-5">
                  {[
                    { field: 'show_contact_info', label: t.profile.showContact,  desc: t.profile.showContactDesc },
                    { field: 'open_to_coffee_chat', label: t.profile.openCoffee, desc: t.profile.openCoffeeDesc },
                    { field: 'open_to_mentorship', label: t.profile.openMentor,  desc: t.profile.openMentorDesc },
                  ].map(item => (
                    <label key={item.field} className="flex items-center justify-between gap-4 cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <div
                        onClick={() => update(item.field as keyof Profile, !profile[item.field as keyof Profile])}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                          profile[item.field as keyof Profile] ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          profile[item.field as keyof Profile] ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t.profile.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saved ? (
                <><CheckCircle2 size={16} /> {t.profile.saved}</>
              ) : (
                <><Save size={16} /> {t.profile.save}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
