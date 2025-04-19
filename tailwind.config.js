// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This should be correct
  ],
  darkMode: 'class',
  theme: {
    extend: {
       // Your theme using hsl(var(...)) is standard for v4
       colors: {
         primary: {
           DEFAULT: 'hsl(var(--primary))',
           foreground: 'hsl(var(--primary-foreground))',
         },
         secondary: {
           DEFAULT: 'hsl(var(--secondary))',
           foreground: 'hsl(var(--secondary-foreground))',
         },
         // ... rest of your theme colors ...
         border: 'hsl(var(--border))',
         input: 'hsl(var(--input))',
         ring: 'hsl(var(--ring))',
         background: 'hsl(var(--background))',
         foreground: 'hsl(var(--foreground))',
       },
       borderRadius: {
         lg: `var(--radius)`,
         md: `calc(var(--radius) - 2px)`,
         sm: "calc(var(--radius) - 4px)",
       },
       keyframes: { /* ... */ },
       animation: { /* ... */ },
    },
  },
  plugins: [],
}