import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        lilita: ["var(--font-lilita)"],
        anek: ["var(--font-anek)"],
      },
      colors: {
        forest: {
          "50": "#f4f9f4",
          "100": "#e5f3e8",
          "200": "#cbe7d1",
          "300": "#a3d2ad",
          "400": "#73b581",
          "500": "#4f985f",
          "600": "#3d7c4a",
          "700": "#2f5c39", // Forest
          "800": "#2c4f34",
          "900": "#25422d",
          "950": "#102315",
        },
        cream: {
          "50": "#f8f6f4",
          "100": "#e8e1d7", // Cream
          "200": "#dfd5c9",
          "300": "#cbbaa6",
          "400": "#b59a82",
          "500": "#a68369",
          "600": "#99735d",
          "700": "#805e4e",
          "800": "#684e44",
          "900": "#554039",
          "950": "#2d201d",
        },
        orange: {
          "50": "#fcf6f0",
          "100": "#f8eadc",
          "200": "#f0d3b8",
          "300": "#e6b58b",
          "400": "#db8e5c",
          "500": "#d4733e", // Orange
          "600": "#c55c31",
          "700": "#a4472a",
          "800": "#843a28",
          "900": "#6a3224",
          "950": "#391811",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0px" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0px" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
