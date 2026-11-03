/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nuit: { DEFAULT: '#172B4D', 600: '#1F3A66', 700: '#142444', 800: '#0F1C36' },
        or: { DEFAULT: '#D6A84F', 600: '#BF9240', 100: '#F6ECD6' },
        vert: { DEFAULT: '#16865B', 600: '#106D4A', 100: '#DDF1E8' },
        gris: '#F5F7FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        carte: '0 4px 20px rgba(23, 43, 77, 0.08)',
      },
    },
  },
  plugins: [],
}
