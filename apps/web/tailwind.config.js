/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // هوية بصرية ترابية تناسب السوق
        sand: {
          50: '#faf7f0',
          100: '#f3ebd9',
          200: '#e9d9b8',
          300: '#dcc28d',
        },
        brand: {
          DEFAULT: '#0f7b6c',
          dark: '#0a5c50',
          light: '#13a08c',
        },
        gold: '#c79a3a',
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // أحجام أكبر افتراضياً (اختبار الجد)
        base: ['1.0625rem', '1.7'],
        lg: ['1.25rem', '1.7'],
        xl: ['1.5rem', '1.5'],
      },
    },
  },
  plugins: [],
};
