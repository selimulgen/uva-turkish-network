'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/language-context';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { Job } from '@/lib/types';
import { JOB_TYPE_LABELS, JOB_TYPE_COLORS, formatRelativeDate } from '@/lib/utils';
import { Users, Briefcase, Coffee, Star, ArrowRight, MapPin, Building2, Shield } from 'lucide-react';

function useCountUp(target: number, duration = 1400, trigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger || target === 0) return;
    let startTime: number | null = null;
    const step = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, trigger]);
  return count;
}

export default function LandingPage() {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ alumni: 0, students: 0, jobs: 0 });
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const alumniCount   = useCountUp(stats.alumni,   1400, statsVisible);
  const studentCount  = useCountUp(stats.students, 1400, statsVisible);
  const jobsCount     = useCountUp(stats.jobs,     1400, statsVisible);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('jobs')
      .select('id, title, company, description, type, location, created_at, profiles(id, full_name, show_contact_info)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setJobs((data as unknown as Job[]) || []));

    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen bg-primary-600 turkish-pattern flex items-center overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700/60 via-transparent to-primary-800/40 pointer-events-none" />

        {/* TSA Logo — large faded watermark (right side, behind content) */}
        <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-[580px] h-[580px] pointer-events-none select-none hidden lg:block">
          {/* Radial fade mask so logo dissolves into background */}
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, transparent 30%, rgba(196,10,23,0.4) 60%, #C0081A 80%)' }}
          />
          <Image
            src="/tsa_logo.png"
            alt=""
            fill
            className="object-contain opacity-[0.18] mix-blend-luminosity"
            priority
          />
        </div>

        {/* White glow accent */}
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-3xl">
            {/* Eyebrow with the actual logo */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <Image
                src="/tsa_logo.png"
                alt="TSA at UVA"
                width={28}
                height={28}
                className="rounded-full opacity-90"
              />
              <span className="text-white/90 text-sm font-medium">{t.landing.eyebrow}</span>
            </div>

            {/* Headline */}
            <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'var(--font-playfair)' }}>
              {t.landing.headline1}
              <br />
              <em className="not-italic text-white/90 italic">{t.landing.headline2}</em>
              <br />
              {t.landing.headline3}
            </h1>

            <p className="text-white/75 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl">
              {t.landing.subtitle}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register"
                className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-all shadow-lg shadow-black/20 hover:-translate-y-0.5">
                {t.landing.ctaJoin}
                <ArrowRight size={18} />
              </Link>
              <Link href="#how-it-works"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-xl border border-white/20 transition-all">
                {t.landing.ctaLearn}
              </Link>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="flex flex-wrap gap-8 mt-14 pt-10 border-t border-white/15">
              {[
                { label: t.landing.stat1, value: alumniCount },
                { label: t.landing.stat2, value: studentCount },
                { label: t.landing.stat3, value: jobsCount },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>{stat.value}</p>
                  <p className="text-white/50 text-sm mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UVA badge — bottom right */}
        <div className="absolute bottom-8 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
          <Image src="/tsa_logo.png" alt="" width={16} height={16} className="opacity-80" />
          <span className="text-white/60 text-xs">University of Virginia</span>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-[#F4EFE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="ornament-divider max-w-xs mx-auto mb-4">
              <Star size={14} className="fill-primary-600 text-primary-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
              {t.landing.sectionTitle}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t.landing.sectionSub}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                iconBg: 'bg-rose-50',
                icon: <Users size={22} className="text-[#C4001A]" />,
                title: t.landing.card1Title,
                subtitle: t.landing.card1Sub,
                subtitleColor: 'text-[#C4001A]',
                points: [t.landing.card1p1, t.landing.card1p2, t.landing.card1p3, t.landing.card1p4],
              },
              {
                num: '02',
                iconBg: 'bg-slate-100',
                icon: <Briefcase size={22} className="text-[#1E2D5A]" />,
                title: t.landing.card2Title,
                subtitle: t.landing.card2Sub,
                subtitleColor: 'text-gray-700',
                points: [t.landing.card2p1, t.landing.card2p2, t.landing.card2p3, t.landing.card2p4],
              },
              {
                num: '03',
                iconBg: 'bg-amber-50',
                icon: <Shield size={22} className="text-[#E57200]" />,
                title: t.landing.card3Title,
                subtitle: t.landing.card3Sub,
                subtitleColor: 'text-[#E57200]',
                points: [t.landing.card3p1, t.landing.card3p2, t.landing.card3p3, t.landing.card3p4],
              },
            ].map((card, i) => (
              <div key={i} className="relative bg-white rounded-xl p-8 border border-[#E2D8CC] overflow-hidden transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/8 cursor-default">
                {/* Ghost number watermark */}
                <span
                  className="absolute top-4 right-6 text-8xl font-bold leading-none select-none pointer-events-none"
                  style={{ fontFamily: 'var(--font-playfair)', color: '#E2D8CC' }}
                >
                  {card.num}
                </span>

                {/* Icon */}
                <div className={`relative z-10 w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-6`}>
                  {card.icon}
                </div>

                <h3 className="relative z-10 text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {card.title}
                </h3>
                <p className={`relative z-10 text-sm font-semibold mb-5 ${card.subtitleColor}`}>{card.subtitle}</p>

                <ul className="relative z-10 space-y-2.5">
                  {card.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-gray-500 text-sm">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#E2D8CC] flex-shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Job Board ── */}
      <section className="py-24 bg-[#F4EFE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-primary-600 text-xs font-bold tracking-widest uppercase mb-2">
                {t.landing.jobsEyebrow}
              </p>
              <h2 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
                {t.landing.jobsTitle}
              </h2>
            </div>
            <Link href="/jobs" className="inline-flex items-center gap-2 text-primary-600 font-semibold text-sm hover:gap-3 transition-all">
              {t.landing.jobsViewAll} <ArrowRight size={16} />
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
              <p>{t.landing.jobsEmpty}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map(job => (
                <div key={job.id} className="bg-white rounded-lg p-6 border border-[#E2D8CC] card-hover">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Building2 size={18} className="text-gray-400" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${JOB_TYPE_COLORS[job.type]}`}>
                      {JOB_TYPE_LABELS[job.type]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">{job.title}</h3>
                  <p className="text-gray-500 text-sm font-medium mb-3">{job.company}</p>
                  {job.location && (
                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-4">
                      <MapPin size={11} /><span>{job.location}</span>
                    </div>
                  )}
                  <p className="text-gray-400 text-sm line-clamp-3 mb-5 leading-relaxed">{job.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{formatRelativeDate(job.created_at)}</span>
                    <Link href="/auth/register"
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      {t.landing.jobsSignIn} <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-primary-600 turkish-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-700/50 to-transparent pointer-events-none" />
        {/* UVA navy accent strip at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-uva-navy opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
            {t.landing.ctaTitle}
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-lg mx-auto">{t.landing.ctaSub}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/register?role=student"
              className="bg-white text-primary-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-lg">
              {t.landing.ctaStudent}
            </Link>
            <Link href="/auth/register?role=alumni"
              className="bg-uva-navy text-white font-bold px-8 py-4 rounded-xl hover:bg-navy-800 transition-colors shadow-lg">
              {t.landing.ctaAlumni}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
