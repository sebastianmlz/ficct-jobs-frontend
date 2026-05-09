/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        ficct: {
          DEFAULT: '#1a4f8b',
          50: '#eaf2fb',
          100: '#cee0f4',
          200: '#9fc2e9',
          300: '#6fa3dd',
          400: '#3f7fc4',
          500: '#1a4f8b',
          600: '#143f70',
          700: '#0e2f55',
          800: '#091f39',
          900: '#04101e',
        },
        accent: {
          DEFAULT: '#d63047',
          50: '#fde9ec',
          100: '#fac8d0',
          200: '#f59ba9',
          300: '#ed6e80',
          400: '#df4a61',
          500: '#d63047',
          600: '#a8243a',
          700: '#7c1a2c',
          800: '#511220',
          900: '#290910',
        },
        institution: {
          green: '#2a8659',
          navy: '#192849',
          surface: '#f5f7fa',
          'text-primary': '#1f3a54',
          'text-secondary': '#6b7c8f',
          border: '#dfe3e8',
        },
        status: {
          info: '#1a4f8b',
          success: '#2a8659',
          warning: '#b67200',
          danger: '#b3162a',
          neutral: '#6b7c8f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
};
