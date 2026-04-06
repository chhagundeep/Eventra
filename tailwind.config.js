/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Enable dark mode support based on a class (needed for your PublicLayout)
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        // Playfair Display is perfect for that 'Butterfly' luxury feel
        serif: ['var(--font-playfair)', 'serif'], 
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // The specific "Butterfly" palette
        eventraSoft: '#FAFAFA',   // Off-white background
        eventraAccent: '#B39577', // Muted gold/tan for buttons and categories
        eventraDeep: '#1A1A1A',   // Deep charcoal (softer than pure black)
        eventraBMS: '#f84464',    // Keeping your original branding as a secondary highlight
      },
      // Added for the "BEYOND TRAINING" stroke text effect
      textStrokeWidth: {
        '1': '1px',
      },
    },
  },
  plugins: [],
}