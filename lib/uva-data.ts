// UVA schools, majors, and minors organized by degree level.
// Source: UVA majors/minors directory + school program pages (compiled Apr 2026).
// Users can verify and correct entries via the "Other" option in the form.

export type EducationLevel = 'undergraduate' | 'graduate' | 'phd';

type SchoolPrograms = {
  majors: string[];
  minors: string[];
};

export const UVA_DATA: Record<EducationLevel, Record<string, SchoolPrograms>> = {
  // ─── UNDERGRADUATE ────────────────────────────────────────────────────────
  undergraduate: {
    'College of Arts & Sciences': {
      majors: [
        'African American and African Studies',
        'American Studies',
        'Anthropology',
        'Archaeology',
        'Art History',
        'Astronomy',
        'Behavioral Neuroscience',
        'Biology',
        'Chemistry',
        'Chinese Language & Literature',
        'Classics',
        'Cognitive Science',
        'Computer Science',
        'Drama',
        'East Asian Languages & Culture',
        'Economics',
        'English',
        'Environmental Sciences',
        'Environmental Thought and Practice',
        'French',
        'German',
        'Global Environments and Sustainability',
        'Global Studies',
        'History',
        'Human Biology',
        'Italian',
        'Japanese Language & Literature',
        'Jewish Studies',
        'Latin American Studies',
        'Linguistics',
        'Mathematics',
        'Media Studies',
        'Medieval Studies',
        'Middle Eastern & South Asian Languages and Cultures',
        'Music',
        'Neuroscience',
        'Philosophy',
        'Physics',
        'Political and Social Thought',
        'Political Philosophy, Policy, and Law',
        'Politics',
        'Psychology',
        'Religious Studies',
        'Slavic Languages and Literatures',
        'Sociology',
        'South Asian Languages and Literatures',
        'Spanish',
        'Statistics',
        'Studio Art',
        'Women, Gender & Sexuality',
      ],
      minors: [
        'African American and African Studies',
        'American Sign Language',
        'Art History',
        'Asian Pacific American Studies',
        'Biology',
        'Business Spanish',
        'Chemistry',
        'Classics',
        'Computer Science',
        'Dance',
        'Data Analytics',
        'Drama',
        'Economics',
        'English',
        'Environmental Sciences',
        'Foreign Affairs',
        'French',
        'German',
        'Global Culture and Commerce',
        'Government',
        'Health, Ethics, and Society',
        'History',
        'Latin American Studies',
        'Latinx Studies',
        'Media Studies',
        'Middle Eastern & South Asian Languages and Cultures',
        'Native American Indigenous Studies',
        'Philosophy',
        'Physics',
        'Portuguese',
        'Psychology',
        'Public Writing and Rhetoric',
        'Religious Studies',
        'Slavic Languages and Literatures',
        'South Asian Languages and Literatures',
        'Statistics',
      ],
    },

    'School of Engineering and Applied Science': {
      majors: [
        'Aerospace Engineering',
        'Applied Mathematics',
        'Biomedical Engineering',
        'Chemical Engineering',
        'Civil Engineering',
        'Computer Engineering',
        'Computer Science',
        'Electrical Engineering',
        'Engineering Science',
        'Materials Science and Engineering',
        'Mechanical Engineering',
        'Systems Engineering',
      ],
      minors: [
        'Applied Mathematics',
        'Biomedical Engineering',
        'Chemical Engineering',
        'Civil Engineering',
        'Computer Science',
        'Electrical Engineering',
        'History of Science and Technology',
        'Materials Science and Engineering',
        'Science and Technology Policy',
        'Science, Technology, and Society',
        'Systems Engineering',
        'Technology and the Environment',
        'Technology Ethics',
      ],
    },

    'School of Architecture': {
      majors: [
        'Architectural History',
        'Architecture',
        'Urban and Environmental Planning',
      ],
      minors: [
        'Architectural History',
        'Architecture',
        'Design',
        'Historic Preservation',
        'Landscape Architecture',
        'Urban and Environmental Planning',
      ],
    },

    'McIntire School of Commerce': {
      majors: ['Commerce'],
      minors: [
        'Entrepreneurship',
        'General Business',
        'Leadership',
        'Real Estate',
      ],
    },

    'School of Education and Human Development': {
      majors: [
        'Early Childhood Education',
        'Elementary Education',
        'Kinesiology',
        'Special Education',
        'Speech Communication Disorders',
        'Youth & Social Innovation',
      ],
      minors: [
        'Global Studies in Education',
        'Health & Wellbeing',
      ],
    },

    'School of Nursing': {
      majors: ['Nursing (B.S.N.)'],
      minors: [],
    },

    'Frank Batten School of Leadership and Public Policy': {
      majors: ['Public Policy and Leadership'],
      minors: ['Public Policy and Leadership'],
    },

    'School of Data Science': {
      majors: ['Data Science'],
      minors: ['Data Science'],
    },

    'School of Continuing and Professional Studies': {
      majors: [
        'Health Sciences Management',
        'Interdisciplinary Studies (B.I.S.)',
      ],
      minors: [],
    },
  },

  // ─── GRADUATE ─────────────────────────────────────────────────────────────
  graduate: {
    'College of Arts & Sciences': {
      majors: [
        'Astronomy (M.A./M.S.)',
        'Biology (M.A./M.S.)',
        'Chemistry (M.A./M.S.)',
        'Classics (M.A.)',
        'Economics (M.A.)',
        'English (M.A.)',
        'French (M.A.)',
        'German (M.A.)',
        'History (M.A.)',
        'Mathematics (M.A./M.S.)',
        'Media Studies (M.A.)',
        'Music (M.A.)',
        'Philosophy (M.A.)',
        'Physics (M.A./M.S.)',
        'Politics (M.A.)',
        'Psychology (M.A.)',
        'Religious Studies (M.A.)',
        'Slavic Languages & Literatures (M.A.)',
        'Sociology (M.A.)',
        'South Asian Languages (M.A.)',
        'Statistics (M.S.)',
      ],
      minors: [],
    },

    'School of Engineering and Applied Science': {
      majors: [
        'Aerospace Engineering (M.S.)',
        'Applied Mathematics (M.S.)',
        'Biomedical Engineering (M.S.)',
        'Chemical Engineering (M.S.)',
        'Civil Engineering (M.S.)',
        'Computer Science (M.S.)',
        'Electrical Engineering (M.S.)',
        'Materials Science and Engineering (M.S.)',
        'Mechanical Engineering (M.S.)',
        'Systems Engineering (M.S.)',
      ],
      minors: [],
    },

    'Darden School of Business': {
      majors: [
        'MBA',
        'Executive MBA',
        'M.S. in Business Analytics (MSBA)',
      ],
      minors: [],
    },

    'School of Law': {
      majors: ['J.D.', 'LL.M.', 'S.J.D.'],
      minors: [],
    },

    'School of Medicine': {
      majors: ['M.D.'],
      minors: [],
    },

    'School of Nursing': {
      majors: ['M.S.N.', 'D.N.P.'],
      minors: [],
    },

    'School of Architecture': {
      majors: [
        'M.Arch.',
        'M.L.A. (Landscape Architecture)',
        'M.U.E.P. (Urban & Environmental Planning)',
        'M.Ar.H. (Architectural History)',
      ],
      minors: [],
    },

    'McIntire School of Commerce': {
      majors: [
        'M.S. in Accounting',
        'M.S. in Commerce',
        'M.S. in Global Commerce',
        'M.S. in Management of Information Technology',
        'M.S. in Business Analytics',
      ],
      minors: [],
    },

    'School of Education and Human Development': {
      majors: [
        'M.Ed.',
        'M.T. (Master of Teaching)',
        'Ed.S.',
      ],
      minors: [],
    },

    'Frank Batten School of Leadership and Public Policy': {
      majors: ['M.P.P. (Master of Public Policy)'],
      minors: [],
    },

    'School of Data Science': {
      majors: [
        'M.S. in Data Science',
        'M.S. in Data Science (Online)',
      ],
      minors: [],
    },
  },

  // ─── PhD / DOCTORAL ───────────────────────────────────────────────────────
  phd: {
    'College of Arts & Sciences': {
      majors: [
        'Astronomy',
        'Biology',
        'Chemistry',
        'Classics',
        'Economics',
        'English',
        'French',
        'German',
        'History',
        'Mathematics',
        'Music',
        'Philosophy',
        'Physics',
        'Politics',
        'Psychology',
        'Religious Studies',
        'Slavic Languages & Literatures',
        'Sociology',
        'Statistics',
      ],
      minors: [],
    },

    'School of Engineering and Applied Science': {
      majors: [
        'Aerospace Engineering',
        'Biomedical Engineering',
        'Chemical Engineering',
        'Civil Engineering',
        'Computer Science',
        'Electrical Engineering',
        'Materials Science and Engineering',
        'Mechanical Engineering',
        'Systems Engineering',
      ],
      minors: [],
    },

    'School of Architecture': {
      majors: ['Architectural History'],
      minors: [],
    },

    'Darden School of Business': {
      majors: ['Business Administration'],
      minors: [],
    },

    'School of Education and Human Development': {
      majors: [
        'Education (Ph.D.)',
        'Education (Ed.D.)',
        'Kinesiology',
        'Special Education',
      ],
      minors: [],
    },

    'School of Nursing': {
      majors: ['Nursing'],
      minors: [],
    },

    'School of Data Science': {
      majors: ['Data Science'],
      minors: [],
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getSchools(level: EducationLevel): string[] {
  return Object.keys(UVA_DATA[level]).sort();
}

export function getMajors(level: EducationLevel, school: string): string[] {
  return [...(UVA_DATA[level]?.[school]?.majors ?? [])].sort();
}

export function getMinors(level: EducationLevel, school: string): string[] {
  return [...(UVA_DATA[level]?.[school]?.minors ?? [])].sort();
}

export function getSchoolsWithMajors(level: EducationLevel): string[] {
  return Object.entries(UVA_DATA[level])
    .filter(([, data]) => data.majors.length > 0)
    .map(([school]) => school)
    .sort();
}

export function getSchoolsWithMinors(level: EducationLevel): string[] {
  return Object.entries(UVA_DATA[level])
    .filter(([, data]) => data.minors.length > 0)
    .map(([school]) => school)
    .sort();
}
