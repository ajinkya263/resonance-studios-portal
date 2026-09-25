/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Resonance Studios palette ─────────────────────────────
        indigo: {
          // deep indigo — primary brand / text on cream
          DEFAULT: "#2B1B5A",
          50: "#EFECF8",
          100: "#D9D2EF",
          200: "#B4A6DF",
          300: "#8E79CF",
          400: "#684DBF",
          500: "#4B31A0",
          600: "#3A2680",
          700: "#2B1B5A",
          800: "#1E1240",
          900: "#130B29",
        },
        saffron: {
          // saffron / marigold accent
          DEFAULT: "#F4A300",
          50: "#FEF4DC",
          100: "#FDE9B9",
          200: "#FBD472",
          300: "#F9BF3A",
          400: "#F4A300",
          500: "#D98B00",
          600: "#B37100",
        },
        cream: {
          // warm off-white backgrounds
          DEFAULT: "#FBF5EA",
          50: "#FFFDF9",
          100: "#FBF5EA",
          200: "#F3E7D0",
          300: "#E9D6B4",
        },
      },
      fontFamily: {
        // wired up via next/font in layout.js (CSS variables)
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(43, 27, 90, 0.18)",
        card: "0 4px 24px -8px rgba(43, 27, 90, 0.15)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-pan": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        glow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(244,163,0,0)" },
          "50%": { boxShadow: "0 0 28px 4px rgba(244,163,0,0.35)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        ripple: {
          "0%": { transform: "scale(0.7)", opacity: "0.55" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        gradient: "gradient-pan 8s ease infinite",
        glow: "glow 3.5s ease-in-out infinite",
        "spin-slow": "spin-slow 120s linear infinite",
        "spin-slow-reverse": "spin-slow 90s linear infinite reverse",
        ripple: "ripple 2.6s ease-out infinite",
        pop: "pop 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
