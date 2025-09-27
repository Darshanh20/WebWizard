/**
 * Tailwind configuration file that adds the project's custom palette.
 * Palette taken from the user's attachment and exposed as `ww-<shade>`
 */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // WebWizard (ww) palette from attachment
        ww: {
          900: '#8DBCC7', // deep blue/teal
          700: '#A4CCD9', // mid blue
          500: '#C4E1E6', // pale blue
          300: '#EBFFD8'  // mint / pale green
        }
      }
    }
  },
  plugins: []
}
