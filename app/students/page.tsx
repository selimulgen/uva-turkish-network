'use client';

import { useState, useCallback, useMemo } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { getAuthUserId } from '@/lib/supabase/getAuthUserId';
import { useLanguage } from '@/lib/language-context';
import type { Profile } from '@/lib/types';
import { LOOKING_FOR_OPTIONS, getInitials } from '@/lib/utils';
import { Search, Mail, GraduationCap, X } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents]   = useState<Profile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [search, setSearch]       = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t }    = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      const userId = await getAuthUserId();
      if (!userId) { router.push('/auth/login'); return; }

      const [meRes, studentsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .eq('profile_completed', true)
          .order('full_name', { ascending: true }),
      ]);

      if (meRes.data) setCurrentUser(meRes.data as Profile);
      if (studentsRes.data) setStudents(studentsRes.data as Profile[]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useVisibilityRefetch(fetchData);

  // Derive graduation years for the filter dropdown
  const allYears = Array.from(
    new Set(students.map(s => s.graduation_year).filter(Boolean))
  ).sort() as number[];

  // Primary program label from structured data
  function getPrimaryProgram(student: Profile): string {
    const programs = student.uva_programs as Array<{ type: string; program: string; customProgram?: string }> | null;
    if (programs && programs.length > 0) {
      const p = programs[0];
      return p.customProgram || p.program || '';
    }
    // Fallback to legacy plain-text fields
    return student.major || '';
  }

  const filtered = students.filter(s => {
    const prog = getPrimaryProgram(s).toLowerCase();
    const lookingStr = ((s.looking_for as string[]) || []).join(' ').toLowerCase();
    const q = search.toLowerCase();

    const matchSearch = !q
      || (s.full_name || '').toLowerCase().includes(q)
      || prog.includes(q)
      || lookingStr.includes(q)
      || (s.bio || '').toLowerCase().includes(q);

    const matchYear = !yearFilter || String(s.graduation_year) === yearFilter;

    return matchSearch && matchYear;
  });

  const clearFilters = () => {
    setSearch('');
    setYearFilter('');
  };

  const hasFilters = search || yearFilter;

  if (loading) return (
    <div className="min-h-screen bg-[#F4EFE6]">
      <Navbar />
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-white border-b border-[#E2D8CC] pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">{t.students.eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            {t.students.title}
          </h1>
          <p className="text-gray-500 text-sm">
            <span className="font-semibold text-gray-900">{students.length}</span> {t.students.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.students.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </div>

          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
          >
            <option value="">{t.students.anyYear}</option>
            {allYears.map(y => (
              <option key={y} value={String(y)}>{t.students.classOf} {y}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl bg-white transition-colors"
            >
              <X size={13} /> {t.students.clearFilters}
            </button>
          )}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-400 mb-5">
          Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {students.length} students
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-2">{t.students.noResults}</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:underline">
                {t.students.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(student => {
              const prog    = getPrimaryProgram(student);
              const isMe    = currentUser?.id === student.id;
              const looking = (student.looking_for as string[]) || [];

              return (
                <Link
                  key={student.id}
                  href={`/profile/${student.id}`}
                  className="group bg-white rounded-lg border border-[#E2D8CC] hover:shadow-md hover:border-[#C4001A] transition-all p-5 flex flex-col gap-4"
                >
                  {/* Top row: avatar + name + year */}
                  <div className="flex items-start gap-3">
                    {student.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={student.avatar_url}
                        alt={student.full_name || ''}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                        {getInitials(student.full_name || student.email)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                          {student.full_name || 'Anonymous'}
                        </p>
                        {isMe && (
                          <span className="text-xs bg-primary-50 text-primary-600 font-semibold px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>

                      {prog && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                          <GraduationCap size={11} className="flex-shrink-0" />
                          {prog}
                        </p>
                      )}

                      {student.graduation_year && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.students.classOf} {student.graduation_year}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio snippet */}
                  {student.bio && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{student.bio}</p>
                  )}

                  {/* Looking for tags */}
                  {looking.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {looking.slice(0, 3).map(v => {
                        const opt = LOOKING_FOR_OPTIONS.find(o => o.value === v);
                        return (
                          <span key={v} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                            {opt?.label || v}
                          </span>
                        );
                      })}
                      {looking.length > 3 && (
                        <span className="text-xs text-gray-400">+{looking.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Email */}
                  <div className="pt-1 border-t border-[#E2D8CC]">
                    <a
                      href={`mailto:${student.email}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <Mail size={11} />
                      <span className="truncate">{student.email}</span>
                    </a>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
