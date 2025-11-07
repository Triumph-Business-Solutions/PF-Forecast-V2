import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/styles/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f9ff",
          100: "#eaf1ff",
          200: "#caddff",
          300: "#9abfff",
          400: "#5f97ff",
          500: "#2f72f5",
          600: "#1858d1",
          700: "#1345a3",
          800: "#113882",
          900: "#102f6b"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 10px 30px -15px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
