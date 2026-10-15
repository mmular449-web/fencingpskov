import { products, type ProductKey } from "./config";
import mediaData from "../data/media.json";

export function productShowcase(key: ProductKey): string {
  const config = products[key];
  // No empty slots or controls. A real approved photograph is the prerequisite.
  if (!config.posterPath || !config.posterMediaId) return "";
  const media = (
    mediaData as {
      id: string;
      src: string;
      author: string;
      license: string;
      sourceUrl: string;
      permissionStatus: string;
    }[]
  ).find(
    (m) =>
      m.id === config.posterMediaId &&
      m.src === config.posterPath &&
      m.permissionStatus === "approved",
  );
  if (!media) return "";
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const asset = (file: string) => `${import.meta.env.BASE_URL}${file}`;
  return `<section class="product-showcase product-${config.theme} section" data-product="${key}">
    <div class="wrap"><p class="eyebrow">В деталях</p><h2>${config.title}</h2><p class="product-description">${config.description}</p>
    <div class="product-stage"><img class="product-poster" src="${asset(config.posterPath)}" alt="${config.title}" loading="lazy" width="1600" height="1000">
    <div class="product-canvas" role="img" aria-label="Интерактивная модель: ${config.title}"></div></div>
    <div class="product-controls" hidden><button type="button" data-viewer-action="rotate" aria-pressed="false">Включить вращение</button><button type="button" data-viewer-action="reset">Исходный ракурс</button><label>Ракурс <input type="range" min="-180" max="180" value="0" step="1" data-viewer-angle aria-label="Угол осмотра модели"></label></div>
    <p class="viewer-status sr-only" aria-live="polite"></p><p class="product-credit">Фото: ${escape(media.author)} · ${escape(media.license)} · <a href="${escape(media.sourceUrl)}" target="_blank" rel="noopener noreferrer">Источник<span class="sr-only"> (новая вкладка)</span></a></p></div></section>`;
}

export function initShowcases(): () => void {
  const roots = [
    ...document.querySelectorAll<HTMLElement>("[data-product]"),
  ].filter((root) => {
    const config = products[root.dataset.product as ProductKey];
    return config?.enabled && config.modelPath;
  });
  if (!roots.length || !("IntersectionObserver" in window)) return () => {};
  const disposers: (() => void)[] = [];
  let disposed = false;
  const observer = new IntersectionObserver(
    async (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const root = entry.target as HTMLElement;
        const config = products[root.dataset.product as ProductKey];
        if (!config?.enabled || !config.modelPath || !config.posterPath)
          continue;
        try {
          const { createViewer } = await import("./viewer");
          if (disposed) return;
          const viewer = createViewer(root, config);
          disposers.push(viewer.dispose);
        } catch {
          // The real poster remains usable when the optional 3D chunk is unavailable.
          root.dataset.viewerState = "fallback";
        }
      }
    },
    { rootMargin: "200px" },
  );
  roots.forEach((root) => observer.observe(root));
  return () => {
    disposed = true;
    observer.disconnect();
    disposers.forEach((dispose) => dispose());
  };
}
