/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#009B3A",
        primaryDark: "#007C2E",
        accent: "#FFB81C",

        background: "#F4F7F5",
        surface: "#ffffff",
        border: "#e5e7eb",

        textPrimary: "#14261C",
        textSecondary: "#65736B",
        textInverse: "#ffffff",

        black: "#000000",
        white: "#ffffff",

        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
