'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile } from '@/lib/types';
import { LOOKING_FOR_OPTIONS, getInitials, formatRelativeDate } from '@/lib/utils';
import {
  MapPin, Building2, GraduationCap, Linkedin, Mail, Coffee,
  BookOpen, ArrowLeft, CheckCircle, Clock, X, Phone
} from 'lucide-react';

export default function ProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const supabase = createClient();
  const { t }    = useLanguage();

  const [profile, setProfile]         = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [requesting, setRequesting]   = useState(false);
  const [requestType, setRequestType] = useState<'coffee_chat' | 'mentorship' | null>(null);
  const [reqMessage, setReqMessage]   = useState('');
  const [reqSent, setReqSent]         = useState(false);
  const [existingReq, setExistingReq] = useState<string | null>(null);

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
        .from('requests')
        .select('id')
        .eq('from_user', authRes.data.user.id)
        .eq('to_user', profileId)
        .single();
      if (req) setExistingReq(req.id);
    }
    setLoading(false);
  }, [supabase, profileId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendRequest = async () => {
    if (!currentUser || !requestType) return;
    setRequesting(true);

    await supabase.from('requests').insert({
      from_user: currentUser.id,
      to_user: profileId,
      type: requestType,
      message: reqMessage,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={16} /> {t.common.back}
        </button>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Header banner */}
          <div className="h-24 bg-primary-600 turkish-pattern relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-700/60 to-primary-600/20" />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-12 mb-4">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profile'}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                />
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
                    {profile.city && (
                      <p className="text-gray-400 flex items-center gap-1.5 text-sm">
                        <MapPin size={13} /> {profile.city}
                      </p>
                    )}
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

              {/* Actions */}
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

            {/* Availability badges */}
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
              </div>
            )}

            {/* Looking for (students) */}
            {!isAlumni && profile.looking_for && profile.looking_for.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.looking_for.map(v => {
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

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t.profile.about}</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        {/* Member since */}
        <p className="text-xs text-gray-400 text-center">
          {t.profile.memberSince} {formatRelativeDate(profile.created_at)}
        </p>
      </div>

      {/* Request modal */}
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
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
                {requesting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Clock size={14} /> {t.profile.sendRequest}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
