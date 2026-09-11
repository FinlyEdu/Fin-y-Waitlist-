/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // fin!y brand tokens, mirrored from the main app's CSS variables.
        paper: "#FFFFFF",
        ink: "#1A1A1A",
        vermillion: "#28C76F",
        forest: "#2D5A27",
        chrome: "#C8C9CB",
        border: "#E9E7E4",
        destructive: "#EF4444",
      },
      fontFamily: {
        sans: ["Fredoka", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
