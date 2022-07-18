/** @type {import('tailwindcss').Config} */
module.exports = {
  daisyui: {
    themes: [
      {
        mytheme: {

          "primary": "#E779C1",

          "secondary": "#58C7F3",

          "accent": "#36D399",

          "neutral": "#1f2937",

          "base-100": "#000",

          "info": "#53C0",

          "success": "#36D399",

          "warning": "#F3CC30",

          "error": "#E24056",
        },
      },
    ],
  },
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}
