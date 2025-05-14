/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
        pixelify: ["var(--font-pixelify-sans)", "monospace"],
      },
      fontSize: {
        'pixelify-sm': ['1.075rem', { lineHeight: '1.5' }],
        'pixelify-base': ['1.15rem', { lineHeight: '1.5' }],
        'pixelify-lg': ['1.225rem', { lineHeight: '1.5' }],
        'pixelify-xl': ['1.3rem', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}; 