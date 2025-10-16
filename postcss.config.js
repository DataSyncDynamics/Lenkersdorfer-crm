module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          // Preserve modern CSS features that Tailwind uses
          cssDeclarationSorter: false,
          // Don't minify selectors that might break
          minifySelectors: false,
          // Preserve custom properties and calculations
          calc: false,
          colormin: false,
        }]
      }
    } : {})
  },
}