module.exports = {
  // mode: "jit",
  content: [
    // 'node_modules/daisyui/dist/**/*.js',
    // 'node_modules/react-daisyui/dist/**/*.js',
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require('daisyui')],
}