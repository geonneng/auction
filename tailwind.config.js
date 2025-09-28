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
        'sans': ['Hi Melody', 'Gaegu', 'Noto Sans KR', 'system-ui', 'sans-serif'],
        'serif': ['Hi Melody', 'Gaegu', 'serif'],
        'handwriting': ['Hi Melody', 'Gaegu', 'cursive'],
        'cute': ['Hi Melody', 'Gaegu', 'cursive'],
      },
    },
  },
  plugins: [],
}
