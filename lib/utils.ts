// Lightweight class name combiner (no extra deps needed)
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export const UVA_EMAIL_DOMAINS = [
  'virginia.edu',
  'alumni.virginia.edu',
  'darden.virginia.edu',
  'law.virginia.edu',
  'med.virginia.edu',
];

export function isUvaEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return UVA_EMAIL_DOMAINS.includes(domain);
}

export const INDUSTRIES = [
  'Technology',
  'Finance & Banking',
  'Consulting',
  'Healthcare & Medicine',
  'Law',
  'Education',
  'Government & Policy',
  'Non-profit',
  'Real Estate',
  'Media & Entertainment',
  'Engineering',
  'Research & Academia',
  'Entrepreneurship',
  'Energy',
  'Other',
];

export const LOOKING_FOR_OPTIONS = [
  { value: 'mentorship',  label: 'Mentorship' },
  { value: 'referrals',   label: 'Referrals' },
  { value: 'internships', label: 'Internship Opportunities' },
  { value: 'full_time',   label: 'Full-time Opportunities' },
  { value: 'networking',  label: 'General Networking' },
];

export const JOB_TYPE_LABELS: Record<string, string> = {
  full_time:  'Full-time',
  internship: 'Internship',
  referral:   'Referral Available',
};

export const JOB_TYPE_COLORS: Record<string, string> = {
  full_time:  'bg-navy-100 text-navy-800',
  internship: 'bg-amber-100 text-amber-800',
  referral:   'bg-green-100 text-green-800',
};

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function generateYearRange(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => end - i);
}
