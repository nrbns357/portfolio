import type { Config } from "tailwindcss";
import bassGuitarTheme from "./src/configs/tailwind/bass-guitar";
import handGestureTheme from "./src/configs/tailwind/hand-gesture";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...bassGuitarTheme.colors,
        ...handGestureTheme.colors,
      },
    },
  },
  plugins: [],
};
export default config;
