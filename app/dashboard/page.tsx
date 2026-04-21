'use client';

import { useState, useCallback, useMemo } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { getAuthUserId } from '@/lib/supabase/getAuthUserId';
import { useLanguage } from '@/lib/language-context';
import type { Profile, Job, NetworkRequest } from '@/lib/types';
import { JOB_TYPE_LABELS, JOB_TYPE_COLORS, formatRelativeDate, getInitials } from '@/lib/utils';
import {
  Users, Briefcase, Coffee, MessageCircle, ArrowRight,
  Clock, CheckCircle, XCircle, Plus, Building2, MapPin, Edit3
} from 'lucide-react';

export default function DashboardPage() {
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [requests, setRequests]     = useState<NetworkRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t }    = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      const userId = await getAuthUserId();
      if (!userId) { router.push('/auth/login'); return; }

      const [profileRes, jobsRes, reqRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('jobs').select('*, profiles(full_name)').eq('is_active', true)
          .order('created_at', { ascending: false }).limit(3),
        supabase.from('requests')
          .select('*, from_profile:profiles!from_user(*), to_profile:profiles!to_user(*)')
          .or(`from_user.eq.${userId},to_user.eq.${userId}`)
          .order('created_at', { ascending: false }).limit(5),
      ]);

      if (!profileRes.data) { router.push('/auth/login'); return; }
      const p = profileRes.data as Profile;
      setProfile(p);
      if (!p.profile_completed) { router.push('/profile/edit'); return; }
      setRecentJobs((jobsRes.data as unknown as Job[]) || []);
      setRequests((reqRes.data as unknown as NetworkRequest[]) || []);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useVisibilityRefetch(fetchData);

  const statusIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle size={14} className="text-green-500" />;
    if (status === 'declined') return <XCircle size={14} className="text-red-400" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4EFE6]">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  const isAlumni = profile?.role === 'alumni';

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
              {t.dashboard.hello}, {profile?.full_name?.split(' ')[0] || ''}
            </h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">{profile?.role} · UVA Turkish Network</p>
          </div>
          <Link href="/profile/edit"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white rounded-xl px-4 py-2.5 hover:bg-gray-50 shadow-sm transition-colors self-start">
            <Edit3 size={14} /> {t.dashboard.editProfile}
          </Link>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mb-10">
          {[
            { icon: <Users size={16} />,         label: t.dashboard.alumniDir,     href: '/directory', show: true },
            { icon: <Briefcase size={16} />,     label: t.dashboard.opportunities, href: '/jobs',      show: true },
            { icon: <Coffee size={16} />,        label: t.dashboard.requests,      href: '/requests',  show: true },
            { icon: <MessageCircle size={16} />, label: t.dashboard.messages,      href: '/messages',  show: true },
            { icon: <Plus size={16} />,          label: t.dashboard.postOpp,       href: '/jobs/new',  show: isAlumni },
          ].filter(a => a.show).map(action => (
            <Link key={action.href} href={action.href}
              className="inline-flex items-center gap-2 bg-white border border-[#E2D8CC] rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#C4001A] hover:text-[#C4001A] transition-colors">
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-5">
            {/* Profile card */}
            <div className="bg-white rounded-lg border border-[#E2D8CC] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(profile?.full_name || profile?.email || 'U')}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{profile?.full_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
                </div>
              </div>
              {isAlumni && (
                <div className="space-y-1.5 mb-4">
                  {profile?.current_role && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Building2 size={12} className="text-gray-400" />
                      {profile.current_role}{profile.company && ` · ${profile.company}`}
                    </p>
                  )}
                  {profile?.city && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin size={12} className="text-gray-400" /> {profile.city}
                    </p>
                  )}
                </div>
              )}
              <Link href={`/profile/${profile?.id}`}
                className="block text-center text-xs font-semibold text-primary-600 border border-primary-200 rounded-xl py-2 hover:bg-primary-50 transition-colors">
                {t.profile.viewProfile}
              </Link>
            </div>

            {/* Requests */}
            <div className="bg-white rounded-lg border border-[#E2D8CC] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">{t.dashboard.recentRequests}</h3>
                <Link href="/requests" className="text-xs text-primary-600 hover:text-primary-700">{t.dashboard.viewAll}</Link>
              </div>
              {requests.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">{t.dashboard.noRequests}</p>
              ) : (
                <div className="space-y-3">
                  {requests.slice(0, 3).map(req => {
                    const other = req.from_user === profile?.id ? req.to_profile : req.from_profile;
                    return (
                      <div key={req.id} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                          {getInitials(other?.full_name || '?')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">{other?.full_name}</p>
                          <p className="text-xs text-gray-400 capitalize">{req.type.replace('_', ' ')}</p>
                        </div>
                        <div className="flex-shrink-0">{statusIcon(req.status)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Jobs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-[#E2D8CC] p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {t.dashboard.latestOpps}
                </h3>
                <div className="flex items-center gap-2">
                  {isAlumni && (
                    <Link href="/jobs/new"
                      className="flex items-center gap-1.5 text-xs font-semibold bg-primary-50 text-primary-600 rounded-lg px-3 py-1.5 hover:bg-primary-100 transition-colors">
                      <Plus size={12} /> Post
                    </Link>
                  )}
                  <Link href="/jobs" className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700">
                    {t.dashboard.all} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {recentJobs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.dashboard.noOpps}</p>
                  {isAlumni && (
                    <Link href="/jobs/new" className="text-primary-600 text-xs mt-2 inline-block font-medium">
                      {t.dashboard.beFirst}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map(job => (
                    <div key={job.id} className="flex items-start gap-4 p-4 rounded-xl bg-[#F4EFE6] border border-[#E2D8CC] hover:border-[#C4001A] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E2D8CC] flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${JOB_TYPE_COLORS[job.type]}`}>
                            {JOB_TYPE_LABELS[job.type]}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">{job.company}</p>
                        {job.location && (
                          <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                            <MapPin size={10} /> {job.location}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeDate(job.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
