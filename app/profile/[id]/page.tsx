'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile, WorkEntry } from '@/lib/types';
import { LOOKING_FOR_OPTIONS, AVAILABILITY_OPTIONS, getInitials, formatRelativeDate } from '@/lib/utils';
import {
  MapPin, Building2, GraduationCap, Linkedin, Mail, Coffee,
  BookOpen, ArrowLeft, CheckCircle, X, Phone, Briefcase,
  Lightbulb, Globe, Link2, School, Sparkles, Home,
} from 'lucide-react';

// ── Profile completeness (own profile only) ────────────────────────────────
function computeCompleteness(profile: Profile): { percent: number; missing: string[] } {
  const fields = profile.role === 'alumni'
    ? [
        { label: 'Profile photo',          done: !!profile.avatar_url },
        { label: 'Bio',                    done: !!(profile.bio?.trim()) },
        { label: 'Academic background',    done: !!profile.uva_level },
        { label: 'Graduation year',        done: !!profile.uva_graduation_year },
        { label: 'Current role',           done: !!(profile.current_role?.trim()) },
        { label: 'Company',                done: !!(profile.company?.trim()) },
        { label: 'Industry',               done: !!profile.industry },
        { label: 'City',                   done: !!(profile.city?.trim()) },
        { label: 'LinkedIn',               done: !!(profile.linkedin_url?.trim()) },
        { label: '"Can help with" topics', done: !!((profile.can_help_with as string[])?.length) },
      ]
    : [
        { label: 'Profile photo',           done: !!profile.avatar_url },
        { label: 'Bio',                     done: !!(profile.bio?.trim()) },
        { label: 'Academic background',     done: !!profile.uva_level },
        { label: 'Graduation year',         done: !!profile.graduation_year },
        { label: '"Looking for" interests', done: !!((profile.looking_for as string[])?.length) },
        { label: 'Career interests',        done: !!((profile.career_interests as string[])?.length) },
        { label: 'High school info',        done: !!(profile.high_school_name?.trim()) },
        { label: 'Portfolio / resume',      done: !!(profile.portfolio_url?.trim()) },
      ];

  const done    = fields.filter(f => f.done).length;
  const missing = fields.filter(f => !f.done).map(f => f.label);
  return { percent: Math.round((done / fields.length) * 100), missing };
}

// ── "What you have in common" ──────────────────────────────────────────────
function getCommonality(viewer: Profile, viewed: Profile): string[] {
  const items: string[] = [];

  // Same UVA school
  if (viewer.uva_school && viewed.uva_school && viewer.uva_school === viewed.uva_school) {
    items.push(`Both studied at ${viewed.uva_school}`);
  }

  // Same primary program
  const myProg    = (viewer.uva_programs as Array<{ program: string }>)?.[0]?.program;
  const theirProg = (viewed.uva_programs  as Array<{ program: string }>)?.[0]?.program;
  if (myProg && theirProg && myProg === theirProg && myProg !== 'Other') {
    items.push(`Both studied ${theirProg}`);
  }

  // Career interest aligns with their industry
  const ci = (viewer.career_interests as string[]) || [];
  if (viewed.industry && ci.includes(viewed.industry)) {
    items.push(`You're targeting ${viewed.industry}`);
  }

  // Turkey connection
  if (viewer.high_school_country === 'Turkey' && viewed.hometown) {
    const hsCity = viewer.high_school_city?.trim().toLowerCase();
    const htCity = viewed.hometown?.trim().toLowerCase();
    if (hsCity && htCity && hsCity === htCity) {
      items.push(`Both from ${viewed.hometown}`);
    } else {
      items.push('You both have roots in Turkey');
    }
  }

  // Alumni–alumni: shared hometown
  if (viewer.role === 'alumni' && viewer.hometown && viewed.hometown) {
    const h1 = viewer.hometown.trim().toLowerCase();
    const h2 = viewed.hometown.trim().toLowerCase();
    if (h1 === h2 && !items.some(i => i.includes(viewed.hometown!))) {
      items.push(`Both from ${viewed.hometown}`);
    }
  }

  return items.slice(0, 3);
}

export default function ProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t }    = useLanguage();

  const [profile, setProfile]         = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [requesting, setRequesting]   = useState(false);
  const [requestType, setRequestType] = useState<'coffee_chat' | 'mentorship' | null>(null);
  const [reqMessage, setReqMessage]   = useState('');
  const [reqSent, setReqSent]         = useState(false);
  const [existingReq, setExistingReq] = useState<string | null>(null);
  const [lightbox, setLightbox]       = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [lightbox]);

  const profileId = params.id as string;

  const fetchData = useCallback(async () => {
    const [profileRes, authRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.auth.getUser(),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);

    if (authRes.data.user) {
      const { data: myProfile } = await supabase
        .from('profiles').select('*').eq('id', authRes.data.user.id).single();
      if (myProfile) setCurrentUser(myProfile as Profile);

      const { data: req } = await supabase
        .from('requests').select('id')
        .eq('from_user', authRes.data.user.id).eq('to_user', profileId).single();
      if (req) setExistingReq(req.id);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendRequest = async () => {
    if (!currentUser || !requestType) return;
    setRequesting(true);
    await supabase.from('requests').insert({
      from_user: currentUser.id,
      to_user:   profileId,
      type:      requestType,
      message:   reqMessage,
    });
    setRequesting(false);
    setRequestType(null);
    setReqMessage('');
    setReqSent(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-screen text-gray-500">Profile not found.</div>
    </div>
  );

  const isOwn         = currentUser?.id === profileId;
  const isAlumni      = profile.role === 'alumni';
  const canSeeContact = currentUser && isAlumni && profile.show_contact_info;
  const canRequest    = currentUser?.role === 'student' && isAlumni && !isOwn;

  const completeness     = isOwn ? computeCompleteness(profile) : null;
  const commonality      = (!isOwn && currentUser) ? getCommonality(currentUser, profile) : [];
  const workHistory      = (profile.work_history as WorkEntry[]) || [];
  const canHelpWith      = (profile.can_help_with as string[]) || [];
  const careerInterests  = (profile.career_interests as string[]) || [];
  const extracurriculars = (profile.extracurriculars as string[]) || [];
  const availabilityLabel = AVAILABILITY_OPTIONS.find(o => o.value === profile.availability_preference)?.label;

  function highSchoolLocation(): string {
    if (!profile.high_school_country) return '';
    if (profile.high_school_country === 'Turkey') {
      return profile.high_school_city ? `${profile.high_school_city}, Turkey` : 'Turkey';
    }
    const country = profile.high_school_other_country || 'International';
    return profile.high_school_city ? `${profile.high_school_city}, ${country}` : country;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={16} /> {t.common.back}
        </button>

        {/* ── Main profile card ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Banner */}
          <div className="h-24 bg-primary-600 turkish-pattern relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-700/60 to-primary-600/20" />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-12 mb-4">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.full_name || 'Profile'}
                  onClick={() => setLightbox(true)}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md cursor-zoom-in hover:opacity-90 transition-opacity" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                  {getInitials(profile.full_name || profile.email)}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {profile.full_name || 'Anonymous'}
                  </h1>
                  {isAlumni && (
                    <span className="text-xs bg-primary-50 text-primary-600 font-semibold px-2 py-0.5 rounded-full">
                      {t.profile.alumniTag}
                    </span>
                  )}
                </div>

                {isAlumni ? (
                  <div className="space-y-1">
                    {profile.current_role && (
                      <p className="text-gray-700 font-medium flex items-center gap-1.5 text-sm">
                        <Building2 size={14} className="text-gray-400" />
                        {profile.current_role}
                        {profile.company && <span className="text-gray-400">{t.common.at}</span>}
                        {profile.company && <span>{profile.company}</span>}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                      {profile.city && (
                        <p className="text-gray-400 flex items-center gap-1.5 text-sm">
                          <MapPin size={13} /> {profile.city}
                        </p>
                      )}
                      {profile.hometown && (
                        <p className="text-gray-400 flex items-center gap-1.5 text-sm">
                          <Home size={13} /> From {profile.hometown}
                        </p>
                      )}
                    </div>
                    {profile.uva_graduation_year && (
                      <p className="text-gray-400 flex items-center gap-1.5 text-sm">
                        <GraduationCap size={13} /> UVA &apos;{String(profile.uva_graduation_year).slice(-2)}
                        {profile.uva_major && ` · ${profile.uva_major}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {profile.major && (
                      <p className="text-gray-700 font-medium flex items-center gap-1.5 text-sm">
                        <GraduationCap size={14} className="text-gray-400" />
                        {profile.degree_type && `${profile.degree_type} · `}{profile.major}
                      </p>
                    )}
                    {profile.graduation_year && (
                      <p className="text-gray-400 text-sm">{t.common.classOf} {profile.graduation_year}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 min-w-[160px]">
                {isOwn && (
                  <Link href="/profile/edit"
                    className="text-sm font-medium text-gray-700 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors text-center">
                    {t.profile.editLink}
                  </Link>
                )}

                {canSeeContact && (
                  <div className="flex flex-col gap-1.5">
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-white bg-[#0A66C2] rounded-xl px-4 py-2 hover:opacity-90 transition-opacity">
                        <Linkedin size={14} /> LinkedIn
                      </a>
                    )}
                    <a href={`mailto:${profile.email}`}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors">
                      <Mail size={14} /> {profile.email}
                    </a>
                    {profile.phone_number && (
                      <a href={`tel:${profile.phone_number}`}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors">
                        <Phone size={14} /> {profile.phone_number}
                      </a>
                    )}
                  </div>
                )}

                {canRequest && (
                  <div className="flex flex-col gap-1.5">
                    {reqSent || existingReq ? (
                      <div className="flex items-center gap-1.5 text-sm text-green-600 px-4 py-2">
                        <CheckCircle size={14} /> {t.profile.requestSent}
                      </div>
                    ) : (
                      <>
                        {profile.open_to_coffee_chat && (
                          <button onClick={() => setRequestType('coffee_chat')}
                            className="flex items-center gap-2 text-sm font-medium bg-primary-600 text-white rounded-xl px-4 py-2 hover:bg-primary-700 transition-colors">
                            <Coffee size={14} /> {t.profile.requestCoffee}
                          </button>
                        )}
                        {profile.open_to_mentorship && (
                          <button onClick={() => setRequestType('mentorship')}
                            className="flex items-center gap-2 text-sm font-medium bg-uva-navy text-white rounded-xl px-4 py-2 hover:opacity-90 transition-opacity">
                            <BookOpen size={14} /> {t.profile.requestMentor}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {!currentUser && isAlumni && (
                  <Link href="/auth/login"
                    className="text-xs text-center text-primary-600 border border-primary-200 rounded-xl px-4 py-2 hover:bg-primary-50 transition-colors">
                    {t.profile.signInConnect}
                  </Link>
                )}
              </div>
            </div>

            {/* Availability + status badges */}
            {isAlumni && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.open_to_coffee_chat && (
                  <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {t.profile.openToCoffee}
                  </span>
                )}
                {profile.open_to_mentorship && (
                  <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {t.profile.openToMentor}
                  </span>
                )}
                {profile.industry && (
                  <span className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1 rounded-full">
                    {profile.industry}
                  </span>
                )}
                {availabilityLabel && (
                  <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full">
                    <Globe size={10} /> {availabilityLabel}
                  </span>
                )}
              </div>
            )}

            {/* Looking for (students) */}
            {!isAlumni && profile.looking_for && (profile.looking_for as string[]).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {(profile.looking_for as string[]).map(v => {
                  const opt = LOOKING_FOR_OPTIONS.find(o => o.value === v);
                  return (
                    <span key={v} className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded-full">
                      {opt?.label || v}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Profile completeness (own profile only) ───────────────────────── */}
        {isOwn && completeness && completeness.percent < 100 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">
                Your profile is {completeness.percent}% complete
              </span>
              <Link href="/profile/edit" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Complete it →
              </Link>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${completeness.percent}%` }} />
            </div>
            {completeness.missing.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">Missing: {completeness.missing.join(', ')}</p>
            )}
          </div>
        )}

        {/* ── What you have in common ────────────────────────────────────────── */}
        {commonality.length > 0 && (
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles size={12} /> What you have in common
            </p>
            <div className="flex flex-wrap gap-2">
              {commonality.map(item => (
                <span key={item}
                  className="text-sm bg-white text-primary-700 border border-primary-100 px-3 py-1.5 rounded-full font-medium shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Advice / Quote (alumni only) ───────────────────────────────────── */}
        {isAlumni && profile.advice_snippet && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Lightbulb size={12} className="text-amber-500" />
              {profile.full_name?.split(' ')[0]} says
            </p>
            <blockquote className="text-gray-700 text-sm leading-relaxed italic border-l-2 border-primary-200 pl-4">
              {profile.advice_snippet}
            </blockquote>
          </div>
        )}

        {/* ── Availability note (alumni only) ───────────────────────────────── */}
        {isAlumni && profile.availability_note && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
            <p className="text-xs font-semibold text-amber-700 mb-1">Availability note</p>
            <p className="text-sm text-amber-800">{profile.availability_note}</p>
          </div>
        )}

        {/* ── Bio ───────────────────────────────────────────────────────────── */}
        {profile.bio && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t.profile.about}</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        {/* ── Work history (alumni) ──────────────────────────────────────────── */}
        {isAlumni && workHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Briefcase size={12} /> Career path
            </h3>
            <div className="space-y-0">
              {/* Current role at the top */}
              {(profile.current_role || profile.company) && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-primary-600" />
                    </div>
                    {workHistory.length > 0 && <div className="w-px flex-1 bg-gray-100 mt-2 mb-2" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-gray-900">{profile.current_role}</p>
                    {profile.company && <p className="text-xs text-gray-500 mt-0.5">{profile.company}</p>}
                    <span className="inline-block mt-1.5 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  </div>
                </div>
              )}
              {/* Past roles */}
              {workHistory.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-gray-400" />
                    </div>
                    {i < workHistory.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-2 mb-2" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-gray-900">{entry.role}</p>
                    {entry.company && <p className="text-xs text-gray-500 mt-0.5">{entry.company}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {entry.start_year ?? '?'} – {entry.end_year ?? 'Present'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Can help with (alumni) ─────────────────────────────────────────── */}
        {isAlumni && canHelpWith.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BookOpen size={12} /> Can help with
            </h3>
            <div className="flex flex-wrap gap-2">
              {canHelpWith.map(tag => (
                <span key={tag}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Student: career interests ──────────────────────────────────────── */}
        {!isAlumni && careerInterests.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Briefcase size={12} /> Career interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {careerInterests.map(tag => (
                <span key={tag}
                  className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-3 py-1.5 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Student: high school + extracurriculars + portfolio ────────────── */}
        {!isAlumni && (profile.high_school_name || extracurriculars.length > 0 || profile.portfolio_url) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-5">

            {profile.high_school_name && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <School size={12} /> High school
                </h3>
                <p className="text-sm font-semibold text-gray-900">{profile.high_school_name}</p>
                {highSchoolLocation() && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {highSchoolLocation()}
                  </p>
                )}
              </div>
            )}

            {extracurriculars.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} /> Involvement
                </h3>
                <div className="flex flex-wrap gap-2">
                  {extracurriculars.map(tag => (
                    <span key={tag}
                      className="text-xs bg-gray-50 text-gray-700 border border-gray-100 px-3 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.portfolio_url && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Link2 size={12} /> Portfolio / Resume
                </h3>
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  <Globe size={13} />
                  {profile.portfolio_url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Member since ──────────────────────────────────────────────────── */}
        <p className="text-xs text-gray-400 text-center">
          {t.profile.memberSince} {formatRelativeDate(profile.created_at)}
        </p>
      </div>

      <Footer />

      {/* ── Request modal ─────────────────────────────────────────────────── */}
      {requestType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
                {requestType === 'coffee_chat' ? t.profile.requestCoffee : t.profile.requestMentor}
              </h3>
              <button onClick={() => setRequestType(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              {t.profile.sendingTo} <strong className="text-gray-900">{profile.full_name}</strong>
            </p>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">{t.profile.messageOpt}</label>
            <textarea
              value={reqMessage}
              onChange={e => setReqMessage(e.target.value)}
              rows={4}
              placeholder={`Introduce yourself and explain what you're hoping to get from this ${requestType === 'coffee_chat' ? 'chat' : 'mentorship'}...`}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setRequestType(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                {t.profile.cancel}
              </button>
              <button onClick={sendRequest} disabled={requesting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60">
                {requesting
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : t.profile.sendRequest}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Avatar lightbox ───────────────────────────────────────────────── */}
      {lightbox && profile.avatar_url && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.avatar_url} alt={profile.full_name || 'Profile'}
            className="max-w-sm w-full rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
