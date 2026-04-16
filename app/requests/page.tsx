'use client';

import { useEffect, useState, useCallback } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import type { Profile, NetworkRequest } from '@/lib/types';
import { getInitials, formatRelativeDate } from '@/lib/utils';
import { Coffee, BookOpen, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function RequestsPage() {
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'incoming' | 'outgoing'>('incoming');

  const router   = useRouter();
  const supabase = createClient();
  const { t }    = useLanguage();

  const STATUS_CONFIG = {
    pending:  { icon: <Clock size={14} />,       label: t.requests.pending,  color: 'bg-amber-100 text-amber-700' },
    accepted: { icon: <CheckCircle size={14} />, label: t.requests.accepted, color: 'bg-green-100 text-green-700' },
    declined: { icon: <XCircle size={14} />,     label: t.requests.declined, color: 'bg-red-100 text-red-600' },
  };

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const [profileRes, reqRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('requests')
          .select('*, from_profile:profiles!from_user(*), to_profile:profiles!to_user(*)')
          .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
          .order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      setRequests((reqRes.data as unknown as NetworkRequest[]) || []);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useVisibilityRefetch(fetchData);

  const updateStatus = async (reqId: string, status: 'accepted' | 'declined') => {
    await supabase.from('requests').update({ status }).eq('id', reqId);
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
  };

  const incoming = requests.filter(r => r.to_user === profile?.id);
  const outgoing = requests.filter(r => r.from_user === profile?.id);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  const currentList = tab === 'incoming' ? incoming : outgoing;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        <div className="mb-8">
          <p className="text-primary-600 text-xs font-bold tracking-widest uppercase mb-2">{t.requests.eyebrow}</p>
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
            {t.requests.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t.requests.subtitle}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-6 w-fit shadow-sm">
          {(['incoming', 'outgoing'] as const).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === tabKey ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}>
              {tabKey === 'incoming' ? t.requests.incoming : t.requests.outgoing}
              {tabKey === 'incoming' && incoming.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-1.5 bg-uva-orange text-white text-xs rounded-full px-1.5 py-0.5">
                  {incoming.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Request list */}
        {currentList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              {tab === 'incoming'
                ? <Coffee size={20} className="text-gray-400" />
                : <BookOpen size={20} className="text-gray-400" />
              }
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {tab === 'incoming' ? t.requests.noneIncoming : t.requests.noneOutgoing}
            </p>
            {tab === 'outgoing' && (
              <Link href="/directory" className="text-primary-600 text-xs mt-2 inline-flex items-center gap-1 hover:text-primary-700">
                {t.requests.browseDir} <ArrowRight size={12} />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map(req => {
              const other     = tab === 'incoming' ? req.from_profile : req.to_profile;
              const status    = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG];
              const isPending = req.status === 'pending';

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${other?.id}`}>
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-base flex-shrink-0 hover:bg-primary-100 transition-colors">
                        {getInitials(other?.full_name || '?')}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <Link href={`/profile/${other?.id}`}
                            className="font-bold text-gray-900 hover:text-primary-600 transition-colors">
                            {other?.full_name || 'Unknown'}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {other?.role === 'alumni'
                              ? `${other.current_role || ''}${other.company ? ` · ${other.company}` : ''}`
                              : `${other?.degree_type || ''} · ${other?.major || ''} ${other?.graduation_year ? `'${String(other.graduation_year).slice(-2)}` : ''}`
                            }
                          </p>
                        </div>

                        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.icon} {status.label}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          {req.type === 'coffee_chat'
                            ? <><Coffee size={11} /> {t.requests.coffeeChat}</>
                            : <><BookOpen size={11} /> {t.requests.mentorship}</>
                          }
                        </span>
                        <span className="text-xs text-gray-400">{formatRelativeDate(req.created_at)}</span>
                      </div>

                      {req.message && (
                        <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-xl leading-relaxed">
                          {req.message}
                        </p>
                      )}

                      {tab === 'incoming' && isPending && profile?.role === 'alumni' && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => updateStatus(req.id, 'accepted')}
                            className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors">
                            <CheckCircle size={13} /> {t.requests.accept}
                          </button>
                          <button onClick={() => updateStatus(req.id, 'declined')}
                            className="flex items-center gap-1.5 border border-red-200 text-red-500 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
                            <XCircle size={13} /> {t.requests.decline}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
