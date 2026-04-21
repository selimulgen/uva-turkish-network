'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';
import { getAuthUserId } from '@/lib/supabase/getAuthUserId';
import { useLanguage } from '@/lib/language-context';
import type { Profile, Message } from '@/lib/types';
import { getInitials, formatRelativeDate } from '@/lib/utils';
import { Send, MessageCircle, Users, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

interface Thread {
  partner: Profile;
  messages: Message[];
  unreadCount: number;
}

function MessagesContent() {
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [threads, setThreads]           = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [allAlumni, setAllAlumni]       = useState<Profile[]>([]);
  const [newMessage, setNewMessage]     = useState('');
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [showNewDm, setShowNewDm]       = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = useMemo(() => createClient(), []);
  const { t }        = useLanguage();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const markAsRead = useCallback(async (partnerId: string, myId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('to_user', myId)
      .eq('from_user', partnerId)
      .eq('is_read', false);

    setThreads(prev => prev.map(th =>
      th.partner.id === partnerId ? { ...th, unreadCount: 0 } : th
    ));
    setActiveThread(prev =>
      prev?.partner.id === partnerId ? { ...prev, unreadCount: 0 } : prev
    );
    window.dispatchEvent(new Event('unread-updated'));
  }, [supabase]);

  const fetchData = useCallback(async () => {
    try {
      const userId = await getAuthUserId();
      if (!userId) { router.push('/auth/login'); return; }

      const [profileRes, msgRes, allUsersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('messages')
          .select('*, from_profile:profiles!from_user(*), to_profile:profiles!to_user(*)')
          .or(`from_user.eq.${userId},to_user.eq.${userId}`)
          .order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').eq('profile_completed', true).neq('id', userId),
      ]);

      if (!profileRes.data) {
        router.push('/dashboard');
        return;
      }

      const myProfile = profileRes.data as Profile;
      setProfile(myProfile);
      setAllAlumni((allUsersRes.data as Profile[]) || []);

      const messages = (msgRes.data as unknown as Message[]) || [];
      const partnerMap = new Map<string, { messages: Message[]; partner: Profile }>();

      for (const msg of messages) {
        const partnerId = msg.from_user === myProfile.id ? msg.to_user : msg.from_user;
        const partner   = (msg.from_user === myProfile.id ? msg.to_profile : msg.from_profile) as Profile;
        if (!partner) continue;

        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, { messages: [], partner });
        }
        partnerMap.get(partnerId)!.messages.push(msg);
      }

      const builtThreads: Thread[] = Array.from(partnerMap.values()).map(({ messages: msgs, partner }) => ({
        partner,
        messages: msgs,
        unreadCount: msgs.filter(m => !m.is_read && m.to_user === myProfile.id).length,
      }));

      builtThreads.sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.created_at || '';
        const bLast = b.messages[b.messages.length - 1]?.created_at || '';
        return bLast.localeCompare(aLast);
      });

      setThreads(builtThreads);

      const withId = searchParams.get('with');
      if (withId) {
        const existing = builtThreads.find(th => th.partner.id === withId);
        if (existing) {
          setActiveThread(existing);
          if (existing.unreadCount > 0) markAsRead(existing.partner.id, myProfile.id);
        } else {
          const { data: partnerProfile } = await supabase.from('profiles').select('*').eq('id', withId).single();
          if (partnerProfile) {
            setActiveThread({ partner: partnerProfile as Profile, messages: [], unreadCount: 0 });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, router, searchParams, markAsRead]);

  useVisibilityRefetch(fetchData);
  useEffect(() => { scrollToBottom(); }, [activeThread?.messages.length]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile || !activeThread) return;
    setSending(true);

    const { data, error } = await supabase.from('messages').insert({
      from_user: profile.id,
      to_user:   activeThread.partner.id,
      content:   newMessage.trim(),
    }).select('*, from_profile:profiles!from_user(*), to_profile:profiles!to_user(*)').single();

    if (!error && data) {
      const newMsg = data as unknown as Message;
      const updatedThread = { ...activeThread, messages: [...activeThread.messages, newMsg] };
      setActiveThread(updatedThread);
      setThreads(prev => {
        const idx = prev.findIndex(th => th.partner.id === activeThread.partner.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = updatedThread;
          return updated;
        }
        return [updatedThread, ...prev];
      });
      setNewMessage('');
    }
    setSending(false);
  };

  const openThread = (partner: Profile) => {
    const existing = threads.find(th => th.partner.id === partner.id);
    const thread = existing || { partner, messages: [], unreadCount: 0 };
    setActiveThread(thread);
    setShowNewDm(false);
    if (existing?.unreadCount && existing.unreadCount > 0 && profile) {
      markAsRead(partner.id, profile.id);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4EFE6]">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4EFE6]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-6 h-screen flex flex-col">
        <div className="flex-1 flex gap-4 min-h-0 pt-4">

          {/* Sidebar */}
          <div className={`w-full sm:w-72 flex-shrink-0 bg-white rounded-lg border border-[#E2D8CC] flex flex-col ${activeThread ? 'hidden sm:flex' : 'flex'}`}>
            <div className="p-4 border-b border-[#E2D8CC] flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{t.messages.title}</h2>
              <button onClick={() => setShowNewDm(!showNewDm)}
                className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                <span className="text-lg leading-none">+</span>
              </button>
            </div>

            {showNewDm && (
              <div className="p-3 border-b border-[#E2D8CC] bg-[#F4EFE6]">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{t.messages.newMessage}</p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {allAlumni.map(a => (
                    <button key={a.id} onClick={() => openThread(a)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors text-left">
                      <div className="w-7 h-7 rounded-lg bg-[#C4001A] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {getInitials(a.full_name || '?')}
                      </div>
                      <span className="text-xs text-gray-900 truncate">{a.full_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400">
                  <MessageCircle size={28} className="mb-2 opacity-40" />
                  <p className="text-xs">{t.messages.noMessages}</p>
                  <p className="text-xs">{t.messages.startConvo}</p>
                </div>
              ) : (
                threads.map(thread => (
                  <button key={thread.partner.id} onClick={() => { setActiveThread(thread); if (thread.unreadCount > 0 && profile) markAsRead(thread.partner.id, profile.id); }}
                    className={`w-full flex items-center gap-3 p-4 border-b border-[#E2D8CC] last:border-0 hover:bg-[#F4EFE6] transition-colors text-left ${
                      activeThread?.partner.id === thread.partner.id ? 'bg-[#F4EFE6]' : ''
                    }`}>
                    <div className="w-10 h-10 rounded-lg bg-[#C4001A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                      {thread.partner.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={thread.partner.avatar_url} alt="" className="w-full h-full object-cover" />
                        : getInitials(thread.partner.full_name || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{thread.partner.full_name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {thread.messages[thread.messages.length - 1]?.content || ''}
                      </p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-[#C4001A] rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          {activeThread ? (
            <div className="flex-1 bg-white rounded-lg border border-[#E2D8CC] flex flex-col min-w-0">
              <div className="flex items-center gap-3 p-4 border-b border-[#E2D8CC]">
                <button onClick={() => setActiveThread(null)} className="sm:hidden text-gray-500 mr-1">
                  <ArrowLeft size={18} />
                </button>
                <div className="w-10 h-10 rounded-lg bg-[#C4001A] flex items-center justify-center text-white font-bold">
                  {getInitials(activeThread.partner.full_name || '?')}
                </div>
                <div>
                  <Link href={`/profile/${activeThread.partner.id}`}
                    className="font-bold text-gray-900 text-sm hover:text-primary-600 transition-colors">
                    {activeThread.partner.full_name}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {activeThread.partner.current_role}
                    {activeThread.partner.company && ` · ${activeThread.partner.company}`}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4EFE6]">
                {activeThread.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Start the conversation with {activeThread.partner.full_name?.split(' ')[0]}
                  </div>
                ) : (
                  activeThread.messages.map(msg => {
                    const isOwn = msg.from_user === profile?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-lg text-sm ${
                          isOwn
                            ? 'bg-[#C4001A] text-white ml-auto'
                            : 'bg-white border border-[#E2D8CC] text-gray-800'
                        }`}>
                          <p className="leading-relaxed">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                            {formatRelativeDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[#E2D8CC] bg-white">
                <div className="flex items-end gap-3">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={t.messages.placeholder}
                    rows={1}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none"
                  />
                  <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
                    className="w-10 h-10 bg-[#C4001A] rounded-xl flex items-center justify-center text-white hover:bg-[#a3001a] transition-colors disabled:opacity-40 flex-shrink-0">
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center bg-[#F4EFE6] rounded-lg border border-[#E2D8CC]">
              <div className="text-center text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">{t.messages.selectConvo}</p>
                <p className="text-xs mt-1">{t.messages.orStartNew}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4EFE6]"><Navbar /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
