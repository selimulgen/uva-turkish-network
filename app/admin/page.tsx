'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile, Job } from '@/lib/types';
import { formatRelativeDate, getInitials } from '@/lib/utils';
import { Users, Briefcase, Trash2, Shield, Search, AlertTriangle } from 'lucide-react';

export default function AdminPage() {
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);
  const [users, setUsers]   = useState<Profile[]>([]);
  const [jobs, setJobs]     = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState<'users' | 'jobs'>('users');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats]   = useState({ total: 0, students: 0, alumni: 0, jobs: 0 });

  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t }    = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return; }
      setAdminProfile(profile as Profile);

      const [usersRes, jobsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('jobs').select('*, profiles(full_name)').order('created_at', { ascending: false }),
      ]);

      const allUsers = (usersRes.data as Profile[]) || [];
      const allJobs  = (jobsRes.data as unknown as Job[]) || [];

      setUsers(allUsers);
      setJobs(allJobs);
      setStats({
        total:    allUsers.length,
        students: allUsers.filter(u => u.role === 'student').length,
        alumni:   allUsers.filter(u => u.role === 'alumni').length,
        jobs:     allJobs.filter(j => j.is_active).length,
      });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useVisibilityRefetch(fetchData);

  const deleteUser = async (userId: string) => {
    if (!confirm(t.admin.deleteWarning)) return;
    setDeleting(userId);
    await supabase.from('profiles').delete().eq('id', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setDeleting(null);
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Remove this posting?')) return;
    setDeleting(jobId);
    await supabase.from('jobs').update({ is_active: false }).eq('id', jobId);
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_active: false } : j));
    setDeleting(null);
  };

  const promoteToAdmin = async (userId: string) => {
    if (!confirm('Grant admin access to this user?')) return;
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u));
  };

  const filteredUsers = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredJobs = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  const ROLE_COLORS: Record<string, string> = {
    admin:   'bg-purple-100 text-purple-700',
    alumni:  'bg-blue-100 text-blue-700',
    student: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
              {t.admin.title}
            </h1>
            <p className="text-gray-500 text-sm">{t.admin.signedAs} {adminProfile?.full_name}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t.admin.totalMembers,  value: stats.total,    icon: <Users size={18} className="text-gray-400" /> },
            { label: t.admin.students,      value: stats.students, icon: <span className="text-base">🎓</span> },
            { label: t.admin.alumni,        value: stats.alumni,   icon: <span className="text-base">💼</span> },
            { label: t.admin.activePostings,value: stats.jobs,     icon: <Briefcase size={18} className="text-gray-400" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span>{stat.icon}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
            {(['users', 'jobs'] as const).map(tabKey => (
              <button key={tabKey} onClick={() => { setTab(tabKey); setSearch(''); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === tabKey ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-900'
                }`}>
                {tabKey === 'users'
                  ? `${t.admin.users} (${users.length})`
                  : `${t.admin.postings} (${jobs.length})`
                }
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'users' ? t.admin.searchUsers : t.admin.searchJobs}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
          </div>
        </div>

        {/* Users table */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.user}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.role}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.joined}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.profile}</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                            {getInitials(u.full_name || u.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{u.full_name || 'Unnamed'}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{formatRelativeDate(u.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs ${u.profile_completed ? 'text-green-600' : 'text-amber-500'}`}>
                          {u.profile_completed ? t.admin.complete : t.admin.incomplete}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/profile/${u.id}`}
                            className="text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                            {t.admin.view}
                          </Link>
                          {u.role !== 'admin' && u.id !== adminProfile?.id && (
                            <>
                              <button onClick={() => promoteToAdmin(u.id)}
                                className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                                {t.admin.makeAdmin}
                              </button>
                              <button onClick={() => deleteUser(u.id)} disabled={deleting === u.id}
                                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                                {deleting === u.id ? '...' : <Trash2 size={12} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">No users found.</div>
              )}
            </div>
          </div>
        )}

        {/* Jobs table */}
        {tab === 'jobs' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.job}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.role}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.posted}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.status}</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{t.admin.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredJobs.map(job => (
                    <tr key={job.id} className={`hover:bg-gray-50 transition-colors ${!job.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-400">{job.company}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs capitalize text-gray-600">{job.type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{formatRelativeDate(job.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {job.is_active ? t.admin.active : t.admin.removed}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {job.is_active && (
                          <button onClick={() => deleteJob(job.id)} disabled={deleting === job.id}
                            className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                            {deleting === job.id ? '...' : t.admin.remove}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredJobs.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">No postings found.</div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-start gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          {t.admin.deleteWarning}{' '}
          To grant admin access, run:{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded">UPDATE profiles SET role = &apos;admin&apos; WHERE email = &apos;your@email.com&apos;;</code>
        </div>
      </div>
    </div>
  );
}
