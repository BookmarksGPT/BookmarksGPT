import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
    './node_modules/flowbite/**/*.js',
  ],
  darkMode: 'media',
  plugins: [
    require('flowbite/plugin'),
    require('@tailwindcss/forms')({
      strategy: 'base', // only generate global styles
    }),
  ],
} satisfies Config;
