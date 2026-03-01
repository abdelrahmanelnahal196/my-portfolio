import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * GitHub Pages friendly base:
 * - Using relative base ("./") works whether you publish at:
 *   https://USERNAME.github.io/REPO_NAME/
 *   or behind a sub-path.
 *
 * If you prefer absolute base, replace "./" with "/REPO_NAME/".
 */
export default defineConfig({
  plugins: [react()],
  base: "./",
});
