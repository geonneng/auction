/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Noto Sans KR', 'system-ui', 'sans-serif'],
        'serif': ['Noto Sans KR', 'serif'],
      },
    },
  },
  plugins: [],
}
