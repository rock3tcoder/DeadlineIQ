import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"Fira Code"',
          'ui-monospace',
          'monospace',
        ],
      },
      colors: {
        // shadcn/ui tokens (unchanged)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },

        // ── Apple system colours (dark-mode canonical) ──────────────
        'sys-blue':   '#0A84FF',
        'sys-green':  '#30D158',
        'sys-orange': '#FF9F0A',
        'sys-red':    '#FF453A',
        'sys-purple': '#BF5AF2',
        'sys-indigo': '#5E5CE6',
        'sys-yellow': '#FFD60A',
        'sys-cyan':   '#5AC8FA',

        // ── App surface layers ───────────────────────────────────────
        surface: {
          '0': '#000000',   // true black — page base
          '1': '#0D0D11',   // sidebar / nav
          '2': '#111116',   // cards (barely visible lift)
          '3': '#1C1C1E',   // elevated cards / modals
          '4': '#2C2C2E',   // tooltips / popovers
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'apple-sm':  '0 1px 3px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.06)',
        'apple-md':  '0 4px 16px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.07)',
        'apple-lg':  '0 8px 32px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.08)',
        'glow-blue': '0 0 20px rgba(10,132,255,0.25)',
        'glow-green':'0 0 20px rgba(48,209,88,0.20)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
