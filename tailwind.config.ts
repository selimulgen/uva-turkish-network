import type { Config } from 'tailwindcss';

// v2
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Turkish flag red — primary brand color
        primary: {
          50:      '#fff1f1',
          100:     '#ffe0e0',
          200:     '#ffc6c6',
          300:     '#ff9e9e',
          400:     '#ff6565',
          500:     '#e8273a',
          600:     '#C4001A',
          700:     '#a3001a',
          800:     '#84001a',
          900:     '#6b001a',
          DEFAULT: '#C4001A',
        },
        // UVA Navy — secondary accent
        navy: {
          50:      '#eef1f8',
          100:     '#d5dcee',
          200:     '#aab8dc',
          300:     '#7f95cb',
          400:     '#5471b9',
          500:     '#3a5ba8',
          600:     '#2e4a8e',
          700:     '#1e3366',
          800:     '#162547',
          900:     '#0f1a33',
          DEFAULT: '#1E2D5A',
        },
        uva: {
          navy:   '#1E2D5A',   // UVA navy — used for footer, secondary UI
          orange: '#E57200',   // UVA orange — used for badges, UVA-specific accents
          cream:  '#F4EFE6',   // warm parchment backgrounds
          sand:   '#E2D8CC',   // borders and dividers
        },
        cream: '#F4EFE6',
        sand:  '#E2D8CC',
        ink:   '#1C1714',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        dm:       ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // White star/crescent-inspired geometric pattern (subtle)
        'turkish-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 0 L46 28 L80 40 L46 52 L40 80 L34 52 L0 40 L34 28 Z' fill='rgba(255%2C255%2C255%2C0.07)'/%3E%3Ccircle cx='40' cy='40' r='14' fill='none' stroke='rgba(255%2C255%2C255%2C0.05)' stroke-width='1'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
