'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile } from '@/lib/types';
import {
  INDUSTRIES, LOOKING_FOR_OPTIONS, CAN_HELP_WITH_OPTIONS,
  CAREER_INTEREST_OPTIONS, AVAILABILITY_OPTIONS,
  generateYearRange, getInitials,
} from '@/lib/utils';
import { Save, CheckCircle2, Camera, Plus, Trash2, X } from 'lucide-react';
import AcademicSelector, {
  type AcademicInfo,
  EMPTY_ACADEMIC_INFO,
} from '@/components/profile/AcademicSelector';
import type { EducationLevel } from '@/lib/uva-data';

const YEARS = generateYearRange(1970, new Date().getFullYear() + 5);

// Local form type for work history entries (years as strings for input binding)
type WorkEntryForm = { role: string; company: string; start_year: string; end_year: string };

function profileToAcademic(profile: Partial<Profile>): AcademicInfo {
  if (!profile.uva_level) return EMPTY_ACADEMIC_INFO;
  const programs = (profile.uva_programs as AcademicInfo['additionalPrograms']) ?? [];
  const [primary, ...rest] = programs;
  return {
    level:                (profile.uva_level as EducationLevel) ?? '',
    primarySchool:        profile.uva_school ?? primary?.school ?? '',
    primaryProgram:       primary?.program ?? '',
    primaryCustomProgram: primary?.customProgram ?? '',
    additionalPrograms:   rest,
  };
}

function academicToProfile(info: AcademicInfo): Pick<Profile, 'uva_level' | 'uva_school' | 'uva_programs'> {
  if (!info.level) return { uva_level: null, uva_school: null, uva_programs: null };
  const primaryEntry = {
    type: 'major' as const,
    school: info.primarySchool,
    program: info.primaryProgram,
    customProgram: info.primaryCustomProgram,
  };
  return {
    uva_level:    info.level,
    uva_school:   info.primarySchool,
    uva_programs: info.primaryProgram ? [primaryEntry, ...info.additionalPrograms] : [],
  };
}

export default function EditProfilePage() {
  const [profile, setProfile]                 = useState<Partial<Profile>>({});
  const [academicInfo, setAcademicInfo]       = useState<AcademicInfo>(EMPTY_ACADEMIC_INFO);
  const [workHistory, setWorkHistory]         = useState<WorkEntryForm[]>([]);
  const [extraInput, setExtraInput]           = useState('');
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);
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

      if (data) {
        setProfile(data as Profile);
        setAcademicInfo(profileToAcademic(data as Profile));
        // Convert stored numeric years to strings for input binding
        const storedHistory = ((data.work_history as WorkEntryForm[]) || []).map((e: WorkEntryForm) => ({
          role:       e.role       ?? '',
          company:    e.company    ?? '',
          start_year: e.start_year != null ? String(e.start_year) : '',
          end_year:   e.end_year   != null ? String(e.end_year)   : '',
        }));
        setWorkHistory(storedHistory);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useVisibilityRefetch(fetchProfile);

  // ── Generic field updater ──────────────────────────────────────────────────
  const update = (field: keyof Profile, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // ── Tag toggle helpers ─────────────────────────────────────────────────────
  const toggleTag = (field: keyof Profile, value: string) => {
    const current = (profile[field] as string[]) || [];
    update(field, current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    );
  };

  // ── Extracurriculars free-text tag ─────────────────────────────────────────
  const addExtracurricular = () => {
    const val = extraInput.trim();
    if (!val) return;
    const current = (profile.extracurriculars as string[]) || [];
    if (!current.includes(val)) update('extracurriculars', [...current, val]);
    setExtraInput('');
  };

  const removeExtracurricular = (val: string) => {
    const current = (profile.extracurriculars as string[]) || [];
    update('extracurriculars', current.filter(v => v !== val));
  };

  // ── Work history ───────────────────────────────────────────────────────────
  const addWorkEntry = () => {
    if (workHistory.length >= 4) return;
    setWorkHistory(prev => [...prev, { role: '', company: '', start_year: '', end_year: '' }]);
  };

  const removeWorkEntry = (i: number) =>
    setWorkHistory(prev => prev.filter((_, idx) => idx !== i));

  const updateWorkEntry = (i: number, field: keyof WorkEntryForm, value: string) =>
    setWorkHistory(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File is too large. Please choose an image under 5 MB.'); return; }

    setAvatarUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) { alert(`Upload failed: ${uploadError.message}`); return; }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      update('avatar_url', `${publicUrl}?t=${Date.now()}`);
    } catch (err) {
      alert(`Unexpected error: ${err}`);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const academicCols = academicToProfile(academicInfo);

    // Clean up work history: drop empty entries, convert year strings to numbers
    const cleanWorkHistory = workHistory
      .filter(e => e.role.trim() || e.company.trim())
      .map(e => ({
        role:       e.role.trim(),
        company:    e.company.trim(),
        start_year: e.start_year ? parseInt(e.start_year) : null,
        end_year:   e.end_year   ? parseInt(e.end_year)   : null,
      }));

    const { error } = await supabase
      .from('profiles')
      .update({
        ...profile,
        ...academicCols,
        work_history: cleanWorkHistory,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // ── Profile completeness ───────────────────────────────────────────────────
  const completenessFields = isAlumni ? [
    { label: 'Profile photo',        done: !!profile.avatar_url },
    { label: 'Bio',                  done: !!(profile.bio?.trim()) },
    { label: 'Academic background',  done: !!academicInfo.level },
    { label: 'Graduation year',      done: !!profile.uva_graduation_year },
    { label: 'Current role',         done: !!(profile.current_role?.trim()) },
    { label: 'Company',              done: !!(profile.company?.trim()) },
    { label: 'Industry',             done: !!profile.industry },
    { label: 'City',                 done: !!(profile.city?.trim()) },
    { label: 'LinkedIn',             done: !!(profile.linkedin_url?.trim()) },
    { label: '"Can help with" topics', done: !!((profile.can_help_with as string[])?.length) },
  ] : [
    { label: 'Profile photo',           done: !!profile.avatar_url },
    { label: 'Bio',                     done: !!(profile.bio?.trim()) },
    { label: 'Academic background',     done: !!academicInfo.level },
    { label: 'Graduation year',         done: !!profile.graduation_year },
    { label: '"Looking for" interests', done: !!((profile.looking_for as string[])?.length) },
    { label: 'Career interests',        done: !!((profile.career_interests as string[])?.length) },
    { label: 'High school info',        done: !!(profile.high_school_name?.trim()) },
    { label: 'Portfolio / resume',      done: !!(profile.portfolio_url?.trim()) },
  ];

  const completedCount      = completenessFields.filter(f => f.done).length;
  const completenessPercent = Math.round((completedCount / completenessFields.length) * 100);
  const missingFields       = completenessFields.filter(f => !f.done).map(f => f.label);

  // ── Shared style tokens ────────────────────────────────────────────────────
  const inputClass  = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors text-sm';
  const selectClass = inputClass + ' cursor-pointer';

  const tagBtn = (selected: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
      selected
        ? 'bg-primary-600 text-white border-primary-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
            {profile.profile_completed ? t.profile.editTitle : t.profile.completeTitle}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {profile.profile_completed ? t.profile.editSub : t.profile.completeSub}
          </p>
        </div>

        {/* ── Profile Completeness Bar ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">Profile completeness</span>
            <span className={`text-sm font-bold ${completenessPercent === 100 ? 'text-green-600' : 'text-primary-600'}`}>
              {completenessPercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completenessPercent === 100 ? 'bg-green-500' : 'bg-primary-600'}`}
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          {missingFields.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Still missing: {missingFields.join(', ')}
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Profile Picture ────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-5">{t.profile.profilePicture}</h2>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Profile"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-100">
                    {getInitials(profile.full_name || profile.email || '')}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  avatarUploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                  <Camera size={14} />
                  {avatarUploading ? t.profile.uploadingPicture : t.profile.changePicture}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarUpload} disabled={avatarUploading} className="hidden" />
                </label>
                <p className="text-xs text-gray-400 mt-2">{t.profile.pictureHint}</p>
              </div>
            </div>
          </section>

          {/* ── Basic Info ─────────────────────────────────────────────────── */}
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
                  rows={3} className={inputClass + ' resize-none'} placeholder={t.profile.bioPlaceholder} />
              </div>
            </div>
          </section>

          {/* ── UVA Academic Background ────────────────────────────────────── */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1">UVA Academic Background</h2>
            <p className="text-gray-400 text-xs mb-5">
              Select your degree level, school, and program(s) at UVA.
              Use &quot;Add another major or minor&quot; to list up to 4 total.
            </p>
            <AcademicSelector value={academicInfo} onChange={setAcademicInfo} />
          </section>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── STUDENT-SPECIFIC SECTIONS ───────────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {isStudent && (
            <>
              {/* Academic details */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-5">{t.profile.academic}</h2>
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

                <div className="mt-5">
                  <label className="block mb-3 text-sm font-medium text-gray-700">{t.profile.lookingFor}</label>
                  <div className="flex flex-wrap gap-2">
                    {LOOKING_FOR_OPTIONS.map(opt => {
                      const selected = ((profile.looking_for as string[]) || []).includes(opt.value);
                      return (
                        <button key={opt.value} type="button" onClick={() => toggleTag('looking_for', opt.value)}
                          className={tagBtn(selected)}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Career interests */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">Career Interests</h2>
                <p className="text-gray-400 text-xs mb-4">
                  Which fields or industries are you targeting? Alumni in these areas will know you&apos;re interested.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CAREER_INTEREST_OPTIONS.map(opt => {
                    const selected = ((profile.career_interests as string[]) || []).includes(opt);
                    return (
                      <button key={opt} type="button" onClick={() => toggleTag('career_interests', opt)}
                        className={tagBtn(selected)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Extracurriculars */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">Extracurriculars & Involvement</h2>
                <p className="text-gray-400 text-xs mb-4">
                  UVA clubs, organizations, sports, or any other activities. Type one and press Enter to add.
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={extraInput}
                    onChange={e => setExtraInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExtracurricular(); } }}
                    placeholder="e.g. Turkish Student Association"
                    className={inputClass + ' flex-1'}
                  />
                  <button type="button" onClick={addExtracurricular}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5">
                    <Plus size={14} /> Add
                  </button>
                </div>
                {((profile.extracurriculars as string[]) || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {((profile.extracurriculars as string[]) || []).map(tag => (
                      <span key={tag}
                        className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-100 px-3 py-1.5 rounded-full text-sm">
                        {tag}
                        <button type="button" onClick={() => removeExtracurricular(tag)}
                          className="hover:text-primary-900 transition-colors">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* High school */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">High School</h2>
                <p className="text-gray-400 text-xs mb-4">
                  Optional. Helps alumni and fellow students find shared roots.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">School Name</label>
                    <input type="text" value={profile.high_school_name || ''}
                      onChange={e => update('high_school_name', e.target.value)}
                      className={inputClass} placeholder="e.g. Robert College" />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Where was it?</label>
                    <div className="flex gap-2">
                      {['Turkey', 'Other'].map(c => (
                        <button key={c} type="button"
                          onClick={() => { update('high_school_country', c); if (c === 'Turkey') update('high_school_other_country', ''); }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            profile.high_school_country === c
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                          }`}>
                          {c === 'Turkey' ? 'Turkey' : 'Outside Turkey'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {profile.high_school_country === 'Turkey' && (
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">City in Turkey</label>
                      <input type="text" value={profile.high_school_city || ''}
                        onChange={e => update('high_school_city', e.target.value)}
                        className={inputClass} placeholder="e.g. Istanbul" />
                    </div>
                  )}

                  {profile.high_school_country === 'Other' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Country</label>
                        <input type="text" value={profile.high_school_other_country || ''}
                          onChange={e => update('high_school_other_country', e.target.value)}
                          className={inputClass} placeholder="e.g. United States" />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">City</label>
                        <input type="text" value={profile.high_school_city || ''}
                          onChange={e => update('high_school_city', e.target.value)}
                          className={inputClass} placeholder="e.g. Washington, DC" />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Portfolio / resume link */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">Portfolio / Resume Link</h2>
                <p className="text-gray-400 text-xs mb-4">
                  Optional. Link to your personal site, GitHub, portfolio, or a hosted resume.
                </p>
                <input type="url" value={profile.portfolio_url || ''}
                  onChange={e => update('portfolio_url', e.target.value)}
                  className={inputClass} placeholder="https://yourname.com or github.com/yourname" />
              </section>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── ALUMNI-SPECIFIC SECTIONS ────────────────────────────────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {isAlumni && (
            <>
              {/* UVA Graduation Year */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-5">{t.profile.uvaBackground}</h2>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.uvaGradYear}</label>
                  <select value={profile.uva_graduation_year || ''} onChange={e => update('uva_graduation_year', parseInt(e.target.value))}
                    className={selectClass}>
                    <option value="">{t.profile.selectYear}</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </section>

              {/* Current position */}
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
                    <select value={profile.industry || ''} onChange={e => update('industry', e.target.value)} className={selectClass}>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.city}</label>
                    <input type="text" value={profile.city || ''} onChange={e => update('city', e.target.value)}
                      className={inputClass} placeholder="e.g. New York, NY" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Hometown <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" value={profile.hometown || ''} onChange={e => update('hometown', e.target.value)}
                      className={inputClass} placeholder="e.g. Istanbul" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.linkedin}</label>
                    <input type="url" value={profile.linkedin_url || ''} onChange={e => update('linkedin_url', e.target.value)}
                      className={inputClass} placeholder="https://linkedin.com/in/yourname" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.phone} <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="tel" value={profile.phone_number || ''} onChange={e => update('phone_number', e.target.value)}
                      className={inputClass} placeholder={t.profile.phonePlaceholder} />
                  </div>
                </div>
              </section>

              {/* Work history */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-gray-900">Work History <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
                  {workHistory.length < 4 && (
                    <button type="button" onClick={addWorkEntry}
                      className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                      <Plus size={14} /> Add position
                    </button>
                  )}
                </div>
                <p className="text-gray-400 text-xs mb-4">
                  Past roles beyond your current position. Helps students understand your career path.
                </p>

                {workHistory.length === 0 ? (
                  <button type="button" onClick={addWorkEntry}
                    className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm hover:border-primary-300 hover:text-primary-500 transition-colors">
                    <Plus size={16} className="mx-auto mb-1" />
                    Add a past position
                  </button>
                ) : (
                  <div className="space-y-4">
                    {workHistory.map((entry, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 relative">
                        <button type="button" onClick={() => removeWorkEntry(i)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                        <div className="grid sm:grid-cols-2 gap-3 pr-6">
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-600">Role</label>
                            <input type="text" value={entry.role}
                              onChange={e => updateWorkEntry(i, 'role', e.target.value)}
                              className={inputClass} placeholder="e.g. Analyst" />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-600">Company</label>
                            <input type="text" value={entry.company}
                              onChange={e => updateWorkEntry(i, 'company', e.target.value)}
                              className={inputClass} placeholder="e.g. McKinsey" />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-600">Start year</label>
                            <input type="number" value={entry.start_year} min={1970} max={new Date().getFullYear()}
                              onChange={e => updateWorkEntry(i, 'start_year', e.target.value)}
                              className={inputClass} placeholder="e.g. 2018" />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-600">End year <span className="text-gray-400">(leave blank if current)</span></label>
                            <input type="number" value={entry.end_year} min={1970} max={new Date().getFullYear()}
                              onChange={e => updateWorkEntry(i, 'end_year', e.target.value)}
                              className={inputClass} placeholder="e.g. 2021" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Can help with */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">What Can You Help With? <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
                <p className="text-gray-400 text-xs mb-4">
                  Select the topics you&apos;re comfortable advising students on. This shows on your profile.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CAN_HELP_WITH_OPTIONS.map(opt => {
                    const selected = ((profile.can_help_with as string[]) || []).includes(opt);
                    return (
                      <button key={opt} type="button" onClick={() => toggleTag('can_help_with', opt)}
                        className={tagBtn(selected)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Advice snippet */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">Advice or Quote <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
                <p className="text-gray-400 text-xs mb-4">
                  Entirely up to you. Share a piece of advice, a career reflection, a quote you live by, or
                  anything else you&apos;d want a student to read before reaching out. This is shown prominently on your profile.
                </p>
                <textarea
                  value={profile.advice_snippet || ''}
                  onChange={e => update('advice_snippet', e.target.value)}
                  rows={4}
                  maxLength={300}
                  className={inputClass + ' resize-none'}
                  placeholder="e.g. &quot;Don't optimize your career for prestige — optimize it for learning.&quot;"
                />
                <p className="text-right text-xs text-gray-400 mt-1">
                  {(profile.advice_snippet || '').length} / 300
                </p>
              </section>

              {/* Privacy & availability */}
              <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">{t.profile.privacy}</h2>
                <p className="text-gray-500 text-sm mb-5">{t.profile.privacySub}</p>
                <div className="space-y-5">
                  {[
                    { field: 'show_contact_info',   label: t.profile.showContact,  desc: t.profile.showContactDesc },
                    { field: 'open_to_coffee_chat', label: t.profile.openCoffee,   desc: t.profile.openCoffeeDesc },
                    { field: 'open_to_mentorship',  label: t.profile.openMentor,   desc: t.profile.openMentorDesc },
                  ].map(item => (
                    <label key={item.field} className="flex items-center justify-between gap-4 cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <div onClick={() => update(item.field as keyof Profile, !profile[item.field as keyof Profile])}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                          profile[item.field as keyof Profile] ? 'bg-primary-600' : 'bg-gray-200'
                        }`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          profile[item.field as keyof Profile] ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </label>
                  ))}
                </div>

                {/* Availability preference */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Meeting preference <span className="text-gray-400 font-normal">(optional)</span></p>
                  <p className="text-xs text-gray-400 mb-3">How do you prefer to connect with students?</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {AVAILABILITY_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => update('availability_preference',
                          profile.availability_preference === opt.value ? null : opt.value
                        )}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          profile.availability_preference === opt.value
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Availability note <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={profile.availability_note || ''}
                    onChange={e => update('availability_note', e.target.value)}
                    className={inputClass} placeholder="e.g. I usually respond within a week" maxLength={120} />
                </div>
              </section>
            </>
          )}

          {/* ── Save / Cancel ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              {t.profile.cancel}
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors disabled:opacity-60">
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
