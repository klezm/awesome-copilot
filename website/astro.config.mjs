// @ts-check
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [pagefind()],
  vite: { plugins: [tailwindcss()] },
});
