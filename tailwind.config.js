/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          800: "#1f2937",
          700: "#374151",
          600: "#4b5563",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};
