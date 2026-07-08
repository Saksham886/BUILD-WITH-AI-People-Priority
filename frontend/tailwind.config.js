/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0f1e",
          secondary: "#0d1630",
        },
        text: {
          primary: "#f0f4ff",
          secondary: "#94a3b8",
          muted: "#475569",
        },
        accent: {
          blue: "#3b82f6",
          cyan: "#06b6d4",
          indigo: "#6366f1",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
