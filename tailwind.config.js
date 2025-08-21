/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)", // This is comes from App.jsx | useEffect
        primaryOpacity: "var(--primaryOpacity)", // This is comes from App.jsx | useEffect
        secondary: "var(--secondary)", // This is comes from App.jsx | useEffect
        darkGray: "var(--darkGray)", // This is comes from App.jsx | useEffect
        gray: "var(--gray)", // This is comes from App.jsx | useEffect
        liteGrayV1: "var(--liteGrayV1)", // This is comes from App.jsx | useEffect
        liteGray: "var(--liteGray)", // This is comes from App.jsx | useEffect
        grayText: "var(--grayText)", // This is comes from App.jsx | useEffect
        success: "var(--success)", // This is comes from App.jsx | useEffect
        error: "var(--error)", // This is comes from App.jsx | useEffect
        erroOpacityr: "var(--erroOpacityr)", // This is comes from App.jsx | useEffect
      },
      screens: {
        "2xl": { min: "1536px", max: "1790px" },
        "3xl": "1791px",
      },
      fontSize: {
        base: "16px",
      },
      fontFamily: {
        sans: [
          "DM Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
        "dm-sans": ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
