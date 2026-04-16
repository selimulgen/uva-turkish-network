'use client';

import { Plus, X, GraduationCap, BookOpen } from 'lucide-react';
import {
  getSchools,
  getMajors,
  getMinors,
  getSchoolsWithMajors,
  getSchoolsWithMinors,
  type EducationLevel,
} from '@/lib/uva-data';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AcademicProgram {
  type: 'major' | 'minor';
  school: string;
  program: string;
  customProgram?: string;
}

export interface AcademicInfo {
  level: EducationLevel | '';
  primarySchool: string;
  primaryProgram: string;
  primaryCustomProgram?: string;
  additionalPrograms: AcademicProgram[];
}

export const EMPTY_ACADEMIC_INFO: AcademicInfo = {
  level: '',
  primarySchool: '',
  primaryProgram: '',
  primaryCustomProgram: '',
  additionalPrograms: [],
};

const MAX_ADDITIONAL = 3;

const LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'graduate',      label: 'Graduate' },
  { value: 'phd',           label: 'PhD / Doctoral' },
];

// ─── Sub-component: a single school + program row ────────────────────────────

function ProgramRow({
  level,
  type,
  school,
  program,
  customProgram,
  onSchoolChange,
  onProgramChange,
  onCustomChange,
}: {
  level: EducationLevel;
  type: 'major' | 'minor';
  school: string;
  program: string;
  customProgram?: string;
  onSchoolChange: (s: string) => void;
  onProgramChange: (p: string) => void;
  onCustomChange: (c: string) => void;
}) {
  const schools  = type === 'minor' ? getSchoolsWithMinors(level) : getSchoolsWithMajors(level);
  const programs = type === 'minor' ? getMinors(level, school)    : getMajors(level, school);

  const selectClass =
    'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';

  return (
    <div className="space-y-2.5">
      {/* School */}
      <select
        value={school}
        onChange={e => onSchoolChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Select school within UVA…</option>
        {schools.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Program (only once a school is chosen) */}
      {school && (
        <select
          value={program}
          onChange={e => onProgramChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Select {type}…</option>
          {programs.map(p => <option key={p} value={p}>{p}</option>)}
          <option value="Other">Other (enter manually)</option>
        </select>
      )}

      {/* Custom text field when "Other" is chosen */}
      {program === 'Other' && (
        <input
          type="text"
          value={customProgram ?? ''}
          onChange={e => onCustomChange(e.target.value)}
          placeholder={`Enter your ${type} name…`}
          className={selectClass}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  value: AcademicInfo;
  onChange: (info: AcademicInfo) => void;
}

export default function AcademicSelector({ value, onChange }: Props) {
  const update = (partial: Partial<AcademicInfo>) =>
    onChange({ ...value, ...partial });

  const addProgram = () => {
    if (value.additionalPrograms.length >= MAX_ADDITIONAL) return;
    update({
      additionalPrograms: [
        ...value.additionalPrograms,
        { type: 'major', school: '', program: '', customProgram: '' },
      ],
    });
  };

  const removeProgram = (idx: number) =>
    update({ additionalPrograms: value.additionalPrograms.filter((_, i) => i !== idx) });

  const updateProgram = (idx: number, patch: Partial<AcademicProgram>) =>
    update({
      additionalPrograms: value.additionalPrograms.map((p, i) =>
        i === idx ? { ...p, ...patch } : p
      ),
    });

  const selectClass =
    'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';

  return (
    <div className="space-y-5">

      {/* ── Level ─────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          What level?
        </p>
        <select
          value={value.level}
          onChange={e =>
            update({
              level: e.target.value as EducationLevel | '',
              primarySchool: '',
              primaryProgram: '',
              primaryCustomProgram: '',
              additionalPrograms: [],
            })
          }
          className={selectClass}
        >
          <option value="">Select degree level…</option>
          {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      {/* ── Primary major (shown only after a level is chosen) ────────────── */}
      {value.level && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap size={15} className="text-primary-600" />
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">
              Primary Major / Program
            </span>
          </div>

          <ProgramRow
            level={value.level}
            type="major"
            school={value.primarySchool}
            program={value.primaryProgram}
            customProgram={value.primaryCustomProgram}
            onSchoolChange={primarySchool => update({ primarySchool, primaryProgram: '', primaryCustomProgram: '' })}
            onProgramChange={primaryProgram => update({ primaryProgram, primaryCustomProgram: '' })}
            onCustomChange={primaryCustomProgram => update({ primaryCustomProgram })}
          />
        </div>
      )}

      {/* ── Additional majors / minors ────────────────────────────────────── */}
      {value.level && value.additionalPrograms.map((prog, idx) => (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Additional {idx + 1}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeProgram(idx)}
              className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
            >
              <X size={12} />
            </button>
          </div>

          {/* Major / Minor toggle */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
            {(['major', 'minor'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => updateProgram(idx, { type: t, school: '', program: '', customProgram: '' })}
                className={`px-5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  prog.type === t
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <ProgramRow
            level={value.level as EducationLevel}
            type={prog.type}
            school={prog.school}
            program={prog.program}
            customProgram={prog.customProgram}
            onSchoolChange={school  => updateProgram(idx, { school, program: '', customProgram: '' })}
            onProgramChange={program => updateProgram(idx, { program, customProgram: '' })}
            onCustomChange={customProgram => updateProgram(idx, { customProgram })}
          />
        </div>
      ))}

      {/* ── Add button ───────────────────────────────────────────────────── */}
      {value.level && value.primaryProgram && value.additionalPrograms.length < MAX_ADDITIONAL && (
        <button
          type="button"
          onClick={addProgram}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-semibold px-4 py-2.5 border border-dashed border-primary-300 hover:border-primary-500 rounded-xl w-full justify-center transition-colors"
        >
          <Plus size={14} />
          Add another major or minor
        </button>
      )}
    </div>
  );
}
