import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { count: alumniCount },
    { count: studentCount },
    { count: jobsCount },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['alumni', 'admin'])
      .eq('profile_completed', true),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('profile_completed', true),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ]);

  return NextResponse.json({
    alumni:   alumniCount  ?? 0,
    students: studentCount ?? 0,
    jobs:     jobsCount    ?? 0,
  });
}
