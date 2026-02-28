import type { Config } from 'tailwindcss';
import { withAccountKitUi, createColorSet } from '@account-kit/react/tailwind';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@account-kit/react/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
};

export default withAccountKitUi(config, {
  colors: {
    'btn-primary': createColorSet('#8b5cf6', '#7c3aed'),
    'fg-accent-brand': createColorSet('#8b5cf6', '#7c3aed'),
  },
  borderRadius: 'lg',
});
