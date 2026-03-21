import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F4F4F0',
        surface: '#FFFFFF',
        border: '#DDDDD8',
        text: '#111111',
        'text-muted': '#6B6B66',
        accent: '#B30000',
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        kpi: ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        'section-header': ['12px', { lineHeight: '1.5', letterSpacing: '1.5px', fontWeight: '500' }],
        'page-header': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};

export default config;
