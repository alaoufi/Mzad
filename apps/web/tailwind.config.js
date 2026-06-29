/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // هوية بصرية ترابية أنيقة
        sand: {
          50: '#fbf9f4',
          100: '#f4eee1',
          200: '#e7dcc5',
          300: '#d6c19a',
          400: '#c2a468',
        },
        brand: {
          DEFAULT: '#0f7b6c',
          dark: '#0a5246',
          light: '#1aa893',
          50: '#eafaf6',
        },
        gold: '#c79a3a',
        cream: '#fcfbf7',
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['1.0625rem', '1.7'],
        lg: ['1.25rem', '1.7'],
        xl: ['1.5rem', '1.5'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,0.03), 0 8px 22px -12px rgba(16,24,40,0.16)',
        lift: '0 2px 6px rgba(16,24,40,0.05), 0 24px 40px -20px rgba(16,24,40,0.28)',
        glass: '0 8px 32px -12px rgba(16,24,40,0.22)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
