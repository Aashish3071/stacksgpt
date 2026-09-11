/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Editorial palette. Warm paper, near-black ink, one restrained accent.
        paper: "#fbfaf7",
        surface: "#ffffff",
        ink: "#15140f",
        muted: "#57534a",
        faint: "#59554d",
        rule: "#e3dfd5",
        "rule-strong": "#c9c3b5",
        accent: "#9c2b16",
        "accent-soft": "#f7ece8",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Editorial scale. Line heights are baked in so components stop guessing.
        kicker: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
        meta: ["0.8125rem", { lineHeight: "1.15rem" }],
        body: ["1.0625rem", { lineHeight: "1.65" }],
        "body-lg": ["1.1875rem", { lineHeight: "1.75" }],
        dek: ["1.25rem", { lineHeight: "1.5" }],
        "head-sm": ["1.125rem", { lineHeight: "1.3", letterSpacing: "-0.008em" }],
        "head-md": ["1.4375rem", { lineHeight: "1.25", letterSpacing: "-0.012em" }],
        "head-lg": ["1.875rem", { lineHeight: "1.18", letterSpacing: "-0.016em" }],
        "head-xl": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "head-2xl": ["3.25rem", { lineHeight: "1.05", letterSpacing: "-0.022em" }],
      },
      maxWidth: {
        // Article body measure: lands at ~70 rendered characters in the serif.
        measure: "64ch",
        "measure-wide": "78ch",
        shell: "72rem",
      },
      borderRadius: {
        // Deliberately small. No pill-shaped cards.
        DEFAULT: "2px",
        sm: "2px",
        md: "3px",
        lg: "4px",
      },
    },
  },
  plugins: [],
};
