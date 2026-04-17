/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'mochi-bg': '#7B2E1E',
        'mochi-gold': '#D3C293',
      },
      fontFamily: {
        serif: ['var(--font-crimson-pro)', 'serif'],
      },
    },
  },
  plugins: [],
};