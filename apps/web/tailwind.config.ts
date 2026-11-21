import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ix: {
          offwhite: "#F5F5F2",
          softgrey: "#E7E7E4",
          charcoal: "#25262B",
          graphite: "#17191F",
          silver: "#B8BAC2",
          indigo: "#5657C9",
          blue: "#3979E8",
          mist: "#FAFAF7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px -28px rgba(23, 25, 31, 0.35)",
        card: "0 12px 40px -20px rgba(23, 25, 31, 0.28)",
        focus: "0 0 0 3px rgba(57, 121, 232, 0.28)",
      },
      borderRadius: {
        ix: "1.15rem",
        "ix-sm": "0.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
