/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0F6E6A',
          50: '#E7F4F3',
          100: '#C9E7E5',
          500: '#0F6E6A',
          600: '#0C5A57',
          700: '#094644',
        },
        sky: {
          DEFAULT: '#2C8FEA',
          50: '#EAF4FE',
          500: '#2C8FEA',
          600: '#1C77CD',
        },
        sunrise: {
          DEFAULT: '#FF6B35',
          50: '#FFF1EA',
          400: '#FF8759',
          500: '#FF6B35',
          600: '#E5541F',
        },
        coral: {
          DEFAULT: '#FF9466',
          500: '#FF9466',
        },
        offwhite: '#F7FAFA',
        slate: {
          DEFAULT: '#445866',
          600: '#445866',
        },
        charcoal: '#1E2A32',
        success: '#2ECC71',
        warning: '#F5B914',
        error: '#E63946',
      },
      fontFamily: {
        heading: ['Poppins', 'Inter', 'sans-serif'],
        body: ['Inter', 'Nunito Sans', 'sans-serif'],
      },
      backgroundImage: {
        'phoenix-gradient': 'linear-gradient(135deg, #0F6E6A 0%, #2C8FEA 45%, #FF6B35 100%)',
        'phoenix-gradient-soft': 'linear-gradient(135deg, rgba(15,110,106,0.10) 0%, rgba(255,107,53,0.10) 100%)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(30, 42, 50, 0.08)',
        'soft-lg': '0 12px 40px -8px rgba(30, 42, 50, 0.14)',
        glass: '0 8px 32px 0 rgba(15, 110, 106, 0.12)',
      },
      keyframes: {
        'rise-wing': {
          '0%': { transform: 'translateY(12px) scale(0.9)', opacity: '0' },
          '60%': { transform: 'translateY(-4px) scale(1.02)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'rise-wing': 'rise-wing 1.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
