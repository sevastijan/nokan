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
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        brand: {
          50: "#f0fdf9",
          100: "#ccfbee",
          200: "#99f6de",
          300: "#5ceac6",
          400: "#2ad4ab",
          500: "#00a68b",
          600: "#008570",
          700: "#006b5a",
          800: "#055347",
          900: "#043d34",
          950: "#022520",
        },
        primary: "#3b82f6",
        secondary: "#34d399",
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
  corePlugins: {
    preflight: true,
  },
  safelist: [],
  experimental: {
    optimizeUniversalDefaults: true,
  },
};
