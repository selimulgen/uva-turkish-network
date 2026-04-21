'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { getAuthUserId } from '@/lib/supabase/getAuthUserId';
import { useLanguage } from '@/lib/language-context';
import type { Profile } from '@/lib/types';
import { INDUSTRIES, getInitials } from '@/lib/utils';
import { Search, MapPin, Coffee, BookOpen, SlidersHorizontal, X, ArrowRight } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const DECADE_GROUPS = [
  { label: '2020s', min: 2020, max: CURRENT_YEAR },
  { label: '2010s', min: 2010, max: 2019 },
  { label: '2000s', min: 2000, max: 2009 },
  { label: '1990s', min: 1990, max: 1999 },
  { label: 'Before 1990', min: 0, max: 1989 },
];

export default function DirectoryPage() {
  const [alumni, setAlumni]           = useState<Profile[]>([]);
  const [filtered, setFiltered]       = useState<Profile[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch]                     = useState('');
  const [filterIndustry, setFilterIndustry]     = useState('');
  const [filterDecade, setFilterDecade]         = useState('');
  const [filterCity, setFilterCity]             = useState('');
  const [filterCoffee, setFilterCoffee]         = useState(false);
  const [filterMentor, setFilterMentor]         = useState(false);

  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t }    = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      const userId = await getAuthUserId();
      if (!userId) { router.push('/auth/login'); return; }

      const alumniRes = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni')
        .eq('profile_completed', true)
        .order('created_at', { ascending: false });

      if (alumniRes.data) setAlumni(alumniRes.data as Profile[]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useVisibilityRefetch(fetchData);

  useEffect(() => {
    let result = [...alumni];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.full_name?.toLowerCase().includes(q) ||
        a.company?.toLowerCase().includes(q) ||
        a.current_role?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.uva_major?.toLowerCase().includes(q)
      );
    }

    if (filterIndustry) result = result.filter(a => a.industry === filterIndustry);

    if (filterDecade) {
      const dec = DECADE_GROUPS.find(d => d.label === filterDecade);
      if (dec) result = result.filter(a =>
        a.uva_graduation_year != null &&
        a.uva_graduation_year >= dec.min &&
        a.uva_graduation_year <= dec.max
      );
    }

    if (filterCity) {
      const c = filterCity.toLowerCase();
      result = result.filter(a => a.city?.toLowerCase().includes(c));
    }

    if (filterCoffee) result = result.filter(a => a.open_to_coffee_chat);
    if (filterMentor) result = result.filter(a => a.open_to_mentorship);

    setFiltered(result);
  }, [alumni, search, filterIndustry, filterDecade, filterCity, filterCoffee, filterMentor]);

  const clearFilters = () => {
    setSearch('');
    setFilterIndustry('');
    setFilterDecade('');
    setFilterCity('');
    setFilterCoffee(false);
    setFilterMentor(false);
  };

  const hasActiveFilters = search || filterIndustry || filterDecade || filterCity || filterCoffee || filterMentor;
  const cities = Array.from(new Set(alumni.map(a => a.city).filter(Boolean))).sort() as string[];

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
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Header */}
        <div className="mb-8">
          <p className="text-primary-600 text-xs font-bold tracking-widest uppercase mb-2">
            {t.directory.eyebrow}
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
            {t.directory.title}
          </h1>
          <p className="text-gray-500 text-sm">
            {alumni.length} {t.directory.subtitle}
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="bg-white rounded-lg border border-[#E2D8CC] p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.directory.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={15} />
              {t.directory.filters}
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-uva-orange" />}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">
                <X size={14} /> {t.directory.clear}
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#E2D8CC] grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-600">{t.directory.industry}</label>
                <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
                  <option value="">{t.directory.allIndustries}</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-600">{t.directory.era}</label>
                <select value={filterDecade} onChange={e => setFilterDecade(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
                  <option value="">{t.directory.anyYear}</option>
                  {DECADE_GROUPS.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-medium text-gray-600">{t.directory.city}</label>
                <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
                  <option value="">{t.directory.anyCity}</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-3 justify-center">
                <label className="flex items-center gap-2 cursor-pointer" onClick={() => setFilterCoffee(!filterCoffee)}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${filterCoffee ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                    {filterCoffee && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{t.directory.coffee}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer" onClick={() => setFilterMentor(!filterMentor)}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${filterMentor ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                    {filterMentor && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{t.directory.mentor}</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <p className="text-sm text-gray-500 mb-4">
            {t.directory.showing} <strong className="text-gray-900">{filtered.length}</strong> {t.directory.of} {alumni.length}
          </p>
        )}

        {/* Alumni grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p>{t.directory.noResults}</p>
            <button onClick={clearFilters} className="text-primary-600 text-sm mt-2 hover:text-primary-700">
              {t.directory.clearFilters}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(alumnus => (
              <div key={alumnus.id} className="bg-white rounded-lg border border-[#E2D8CC] card-hover overflow-hidden">
                {/* Colored top band with avatar */}
                <div className="h-16 bg-[#C4001A] relative">
                  <div className="absolute -bottom-5 left-5">
                    <div className="w-12 h-12 rounded-lg bg-white border-2 border-white flex items-center justify-center text-[#C4001A] font-bold text-sm shadow-sm overflow-hidden">
                      {alumnus.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={alumnus.avatar_url} alt="" className="w-full h-full object-cover" />
                        : getInitials(alumnus.full_name || alumnus.email)
                      }
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 pt-8 pb-5">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{alumnus.full_name || 'Anonymous'}</h3>
                  {alumnus.current_role && alumnus.company && (
                    <p className="text-xs text-gray-500 mt-0.5">{alumnus.current_role} · {alumnus.company}</p>
                  )}
                  {!alumnus.company && alumnus.current_role && (
                    <p className="text-xs text-gray-500 mt-0.5">{alumnus.current_role}</p>
                  )}

                  {alumnus.uva_graduation_year && (
                    <p className="text-xs text-[#C4001A] font-medium mt-1">Class of {alumnus.uva_graduation_year}</p>
                  )}

                  {alumnus.city && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <MapPin size={10} /><span>{alumnus.city}</span>
                    </div>
                  )}

                  {alumnus.industry && (
                    <span className="inline-block mt-3 text-xs bg-[#F4EFE6] border border-[#E2D8CC] text-gray-600 rounded-full px-2.5 py-0.5">
                      {alumnus.industry}
                    </span>
                  )}

                  <div className="flex gap-1.5 mt-3">
                    {alumnus.open_to_coffee_chat && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5">
                        <Coffee size={9} /> Coffee
                      </span>
                    )}
                    {alumnus.open_to_mentorship && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2 py-0.5">
                        <BookOpen size={9} /> Mentor
                      </span>
                    )}
                  </div>

                  <Link href={`/profile/${alumnus.id}`}
                    className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#C4001A] hover:gap-2 transition-all">
                    View profile <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
