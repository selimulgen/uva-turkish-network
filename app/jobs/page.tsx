'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile, Job } from '@/lib/types';
import { JOB_TYPE_LABELS, JOB_TYPE_COLORS, formatRelativeDate } from '@/lib/utils';
import {
  Briefcase, MapPin, Building2, Plus, ExternalLink,
  Mail, Linkedin, Search
} from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [filtered, setFiltered]       = useState<Job[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const { t }    = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      const authRes = await supabase.auth.getSession();
      const user    = authRes.data.session?.user ?? null;

      const [jobsRes, profileRes] = await Promise.all([
        supabase.from('jobs')
          .select('*, profiles(id, full_name, email, linkedin_url, show_contact_info)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        user ? supabase.from('profiles').select('*').eq('id', user.id).single() : Promise.resolve({ data: null }),
      ]);

      setJobs((jobsRes.data as unknown as Job[]) || []);
      if (profileRes.data) setCurrentUser(profileRes.data as Profile);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useVisibilityRefetch(fetchData);

  useEffect(() => {
    let result = [...jobs];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }
    if (filterType) result = result.filter(j => j.type === filterType);
    setFiltered(result);
  }, [jobs, search, filterType]);

  const handleDelete = async (jobId: string) => {
    if (!confirm('Delete this posting?')) return;
    await supabase.from('jobs').update({ is_active: false }).eq('id', jobId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4EFE6]">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  const isAlumni   = currentUser?.role === 'alumni';
  const isLoggedIn = !!currentUser;

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-primary-600 text-xs font-bold tracking-widest uppercase mb-2">{t.jobs.eyebrow}</p>
            <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
              {t.jobs.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {jobs.length} {t.jobs.subtitle}
              {!isLoggedIn && t.jobs.subtitleGuest}
            </p>
          </div>
          {isAlumni && (
            <Link href="/jobs/new"
              className="inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors text-sm self-start">
              <Plus size={16} /> {t.jobs.postBtn}
            </Link>
          )}
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.jobs.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer">
            <option value="">{t.jobs.allTypes}</option>
            <option value="full_time">{t.jobs.fullTime}</option>
            <option value="internship">{t.jobs.internship}</option>
            <option value="referral">{t.jobs.referral}</option>
          </select>
        </div>

        {/* Job list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t.jobs.empty}</p>
            {isAlumni && (
              <Link href="/jobs/new" className="text-primary-600 text-sm mt-2 inline-block">
                {t.jobs.postFirst}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(job => {
              const isExpanded  = expandedJob === job.id;
              const isOwnJob    = currentUser?.id === job.posted_by;
              const showContact = isLoggedIn && job.profiles?.show_contact_info;

              return (
                <div key={job.id} className="bg-white rounded-lg border border-[#E2D8CC] overflow-hidden">
                  {/* Main row */}
                  <div
                    className="flex items-start gap-4 p-5 cursor-pointer hover:bg-[#F4EFE6] transition-colors"
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#F4EFE6] border border-[#E2D8CC] flex items-center justify-center flex-shrink-0">
                      <Building2 size={20} className="text-gray-300" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{job.title}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${JOB_TYPE_COLORS[job.type]}`}>
                          {JOB_TYPE_LABELS[job.type]}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm font-medium mt-0.5">{job.company}</p>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={11} /> {job.location}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatRelativeDate(job.created_at)}</span>
                        {job.profiles?.full_name && (
                          <span className="text-xs text-gray-400">
                            {t.jobs.postedBy} {isLoggedIn ? job.profiles.full_name : t.jobs.anAlumnus}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 flex-shrink-0 mt-1">
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-[#E2D8CC] bg-[#F4EFE6]">
                      <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-5 whitespace-pre-line">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        {job.application_url && (
                          <a href={job.application_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors">
                            {t.jobs.applyNow} <ExternalLink size={13} />
                          </a>
                        )}

                        {showContact && job.profiles && (
                          <>
                            <a href={`mailto:${job.profiles.email}`}
                              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                              <Mail size={13} /> {t.jobs.emailAlumni}
                            </a>
                            {job.profiles.linkedin_url && (
                              <a href={job.profiles.linkedin_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                <Linkedin size={13} /> LinkedIn
                              </a>
                            )}
                          </>
                        )}

                        {!isLoggedIn && (
                          <Link href="/auth/login"
                            className="text-xs text-primary-600 border border-primary-200 rounded-xl px-4 py-2 hover:bg-primary-50 transition-colors">
                            {t.jobs.signInContact}
                          </Link>
                        )}

                        {isOwnJob && (
                          <button onClick={() => handleDelete(job.id)}
                            className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors">
                            {t.jobs.removePosting}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
