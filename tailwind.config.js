/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eyelectric: {
          navy: "#172454",
          red: "#e62e3b",
          gold: "#f6d85b",
          blue: "#c7d8ea",
          ink: "#1f2937",
        },
      },
      boxShadow: {
        panel: "0 12px 32px rgba(23, 36, 84, 0.08)",
      },
    },
  },
  plugins: [],
};
