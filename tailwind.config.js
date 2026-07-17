/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,jsx,js}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        terminal: {
          bg: '#0a0e14',
          fg: '#b3b1ad',
          green: '#b8cc52',
          cyan: '#95e6cb',
          red: '#ff3333',
          yellow: '#e6db74',
          blue: '#66d9ef',
          dim: '#525252',
          highlight: '#1a1e26',
        },
      },
      animation: {
        'typing': 'typing 0.05s steps(1) forwards',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        typing: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
