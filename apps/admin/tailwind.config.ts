import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
      colors: {
        border: 'hsl(216 34% 17%)',
        input: 'hsl(216 34% 17%)',
        ring: 'hsl(215 20% 65%)',
        background: '#0b0e14',
        foreground: '#e2e8f0',
        primary: {
          DEFAULT: '#0B5FFF',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#E02424',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#101828',
          foreground: '#9ca3af',
        },
        accent: {
          DEFAULT: '#4F8CFF',
          foreground: '#0b0e14',
        },
      },
    },
  },
  plugins: [],
};

export default config;



