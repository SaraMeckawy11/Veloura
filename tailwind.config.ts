import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"],
        serif: ["Cormorant Garamond", "Playfair Display", "Georgia", "serif"],
        display: ["Playfair Display", "Cormorant Garamond", "Georgia", "serif"],
        arabic: ["Noto Naskh Arabic", "Amiri", "Tahoma", "serif"]
      },
      boxShadow: {
        glow: "0 24px 90px rgba(120, 146, 130, 0.22)",
        gold: "0 24px 90px rgba(214, 177, 95, 0.18)",
        editorial: "0 18px 60px rgba(20, 20, 20, 0.08)"
      },
      backgroundImage: {
        paper:
          "linear-gradient(135deg, rgba(255,255,250,0.95), rgba(240,248,245,0.88))",
        blackSatin:
          "radial-gradient(circle at 20% 10%, rgba(207,174,95,0.16), transparent 32%), linear-gradient(135deg, #070604 0%, #17130d 45%, #050505 100%)",
        royal:
          "radial-gradient(circle at 50% 0%, rgba(215,177,93,0.22), transparent 28%), linear-gradient(145deg, #fff7e7 0%, #f1e1bd 100%)"
      }
    }
  },
  plugins: []
} satisfies Config;
