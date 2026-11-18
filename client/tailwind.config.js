/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aviation: {
          bg: '#0a1119',
          panel: '#101a25',
          raised: '#162230',
          sheet: '#0e1722',
          field: '#0a121b',
          line: '#22344a',
          line2: '#34506b',
          accent: '#52c7ff',
          amber: '#ffb340',
          ok: '#43e0a0',
          bad: '#ff6f7d'
        }
      },
      fontFamily: {
        head: ['"Barlow Condensed"', '"Arial Narrow"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
