import { defineConfig } from "vite";
import { resolve } from "node:path";

const pages = [
  "index",
  "federation",
  "epee",
  "children",
  "coaches",
  "news",
  "competitions",
  "gallery",
  "documents",
  "contacts",
  "sources",
];
export default defineConfig({
  base: "/fencingpskov/",
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [
          page,
          resolve(page === "index" ? "index.html" : `${page}/index.html`),
        ]),
      ),
    },
  },
});
