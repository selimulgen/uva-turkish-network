export type UserRole = 'student' | 'alumni' | 'admin';
export type JobType  = 'full_time' | 'internship' | 'referral';
export type RequestType   = 'coffee_chat' | 'mentorship';
export type RequestStatus = 'pending' | 'accepted' | 'declined';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;

  // Student-specific
  graduation_year?: number | null;
  major?: string | null;
  degree_type?: string | null;
  bio?: string | null;
  looking_for?: string[] | null;

  // Alumni-specific
  uva_graduation_year?: number | null;
  uva_major?: string | null;
  current_role?: string | null;
  company?: string | null;
  industry?: string | null;
  city?: string | null;
  linkedin_url?: string | null;
  show_contact_info: boolean;
  open_to_coffee_chat: boolean;
  open_to_mentorship: boolean;

  // UVA academic background (structured — replaces plain-text major/degree_type)
  uva_level?: string | null;       // 'undergraduate' | 'graduate' | 'phd'
  uva_school?: string | null;      // primary school
  uva_programs?: Array<{           // all programs (index 0 = primary major)
    type: 'major' | 'minor';
    school: string;
    program: string;
    customProgram?: string;
  }> | null;

  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  posted_by: string;
  title: string;
  company: string;
  description: string;
  type: JobType;
  location: string;
  application_url: string;
  is_active: boolean;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'email' | 'linkedin_url' | 'show_contact_info'>;
}

export interface NetworkRequest {
  id: string;
  from_user: string;
  to_user: string;
  type: RequestType;
  message: string;
  status: RequestStatus;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Message {
  id: string;
  from_user: string;
  to_user: string;
  content: string;
  is_read: boolean;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Conversation {
  partner: Profile;
  lastMessage: Message;
  unreadCount: number;
}
