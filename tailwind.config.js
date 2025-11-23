/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* ============================================================
         🎨 Fluent Hybrid Color Tokens (EXACT MATCH to index.css)
         Uses nested structure that matches your CSS variable names
      ============================================================ */
      colors: {
        // Primary accent - using direct Tailwind colors instead of CSS custom properties
        primary: '#2563eb', // blue-600
        
        // Background colors - using direct Tailwind colors
        background: {
          primary: '#0f172a', // slate-900
          secondary: '#1e293b', // slate-800
        },
        
        // Text colors - using direct Tailwind colors
        text: {
          primary: '#ffffff', // white
          secondary: '#cbd5e1', // slate-300
          muted: '#94a3b8', // slate-400
        },
        
        // Accent gradient (from CSS lines 32-34)
        accent: {
          'grad-start': 'var(--accent-grad-start)',
          'grad-end': 'var(--accent-grad-end)',
        },
      },

      /* ============================================================
         🌀 Animations — EXACT MATCH to index.css keyframes
      ============================================================ */
      animation: {
        // Toast lifecycle
        'toast-enter': 'toastEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-exit': 'toastExit 0.3s cubic-bezier(0.7, 0, 0.84, 0)',

        // Fluent Hybrid global animations (matching CSS)
        'wave': 'wave 1s ease-in-out infinite',
        'theme-glow': 'themeGlow 3s ease-in-out infinite',
        'fade-out': 'fadeOut 1s ease forwards',
      },

      keyframes: {
        /* Toast Animations */
        toastEnter: {
          '0%': { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
          '60%': { opacity: '1', transform: 'translateX(-4%) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        toastExit: {
          '0%': { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(120%) scale(0.95)' },
        },

        /* Global Motion System - matching CSS lines 565-793 */
        wave: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '24px' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '80%': { opacity: '1', transform: 'translateY(-2px)' },
          '100%': { opacity: '0', transform: 'translateY(-6px)' },
        },
        themeGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(59,130,246,0.9), 0 0 60px rgba(59,130,246,0.5)',
          },
        },
      },

      /* ============================================================
         📏 Responsive scaling + Fluent radius & shadows
         EXACT MATCH to index.css lines 36-40
      ============================================================ */
      borderRadius: {
        DEFAULT: 'var(--radius-default, 0.5rem)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        elevate: 'var(--shadow-elevate)',
      },
      
      /* ============================================================
         ⚡ Fluent Transitions - matching CSS lines 44-47
      ============================================================ */
      transitionTimingFunction: {
        'fluent': 'var(--fluent-ease)',
      },
      transitionDuration: {
        'fluent-fast': 'var(--fluent-fast, 150ms)',
        'fluent-medium': 'var(--fluent-medium, 250ms)',
        'fluent-slow': 'var(--fluent-slow, 400ms)',
      },
      
      /* ============================================================
         📐 Backdrop Blur - matching CSS line 43
      ============================================================ */
      backdropBlur: {
        'fluent': 'var(--blur-bg)',
      },
    },
  },
  plugins: [],
};
