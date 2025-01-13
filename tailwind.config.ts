import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      screens: {
        xl: { min: "1024px", max: "1279px" },
        // => @media (max-width: 1279px) { ... }

        lg: { min: "768px", max: "1023px" },
        // => @media (max-width: 1023px) { ... }

        md: { min: "640px", max: "767px" },
        // => @media (max-width: 767px) { ... }

        sm: { max: "639px" },
        // => @media (max-width: 639px) { ... }
      },
      fontFamily: {
        mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        overlayShow: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        contentShow: {
          from: { opacity: '0', transform: "translate(-50%, -48%) scale(0.96)" },
          to: { opacity: '1', transform: "translate(-50%, -50%) scale(1)" },
        },
        blip: {
          "50%": { opacity: '0' },
        },
      },
      animation: {
        overlayShow: "overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        contentShow: "contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        blip: "blip 1s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config
