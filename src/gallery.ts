import { animate } from "motion/mini";

type GalleryImage = { id: string; type: string; src: string; alt: string; caption: string; author: string; license: string; licenseUrl: string; sourceUrl: string; changes: string };
export function initGallery(media: GalleryImage[], asset: (src: string) => string) {
  const dialog = document.querySelector<HTMLDialogElement>("#lightbox");
  if (!dialog) return () => {};
  const images = media.filter(item => item.type === "image");
  const stage = dialog.querySelector<HTMLElement>(".lightbox-stage")!;
  const image = dialog.querySelector<HTMLImageElement>(".lightbox-image")!;
  const buffer = dialog.querySelector<HTMLImageElement>(".lightbox-transition")!;
  const caption = dialog.querySelector<HTMLElement>(".lightbox-caption")!;
  const count = dialog.querySelector<HTMLElement>(".lightbox-count")!;
  const buttons = [...dialog.querySelectorAll<HTMLButtonElement>("[data-lightbox-step]")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const lifecycle = new AbortController();
  const options = { signal: lifecycle.signal };
  let animations: ReturnType<typeof animate>[] = [];
  let requested = 0;
  let displayed = 0;
  let generation = 0;
  let pointer: { x: number; y: number } | undefined;
  const cancel = () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
    image.style.removeProperty("opacity");
    image.style.removeProperty("transform");
    buffer.hidden = true;
    buffer.style.removeProperty("opacity");
    buffer.style.removeProperty("transform");
  };
  const update = (index: number) => {
    displayed = index;
    const item = images[index];
    image.src = asset(item.src);
    image.alt = item.alt;
    caption.replaceChildren(document.createTextNode(`${item.caption} © ${item.author} · `));
    for (const [text, href] of [[item.license, item.licenseUrl], ["Оригинал", item.sourceUrl]]) {
      const a = document.createElement("a");
      a.textContent = text; a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
      caption.append(a, document.createTextNode(" · "));
    }
    caption.append(document.createTextNode(item.changes));
    count.textContent = `${index + 1} / ${images.length}`;
    buttons.forEach(button => button.disabled = Number(button.dataset.lightboxStep) < 0 ? index === 0 : index === images.length - 1);
  };
  const change = async (direction: number) => {
    const next = Math.max(0, Math.min(images.length - 1, requested + direction));
    if (next === requested) return;
    requested = next;
    const token = ++generation;
    // Decode before the crossfade so the current photograph never disappears while loading.
    const preload = new Image();
    preload.src = asset(images[next].src);
    try { await preload.decode(); } catch {
      if (token === generation) requested = displayed;
      return;
    }
    if (token !== generation || !dialog.open) return;
    cancel();
    buffer.src = preload.src;
    try { await buffer.decode(); } catch {
      if (token === generation) requested = displayed;
      return;
    }
    if (token !== generation || !dialog.open) return;
    if (!reduced.matches) {
      buffer.hidden = false;
      animations = [
        animate(image, { opacity: [1, 0], transform: ["scale(1)", "scale(0.985)"] }, { duration: 0.32, ease: "easeInOut" }),
        animate(buffer, { opacity: [0, 1], transform: ["scale(1.025)", "scale(1)"] }, { duration: 0.4, ease: [0.22, 1, 0.36, 1] }),
      ];
      await Promise.all(animations.map(animation => animation.finished)).catch(() => {});
    }
    if (token !== generation || !dialog.open) return;
    update(next);
    cancel();
  };
  document.querySelectorAll<HTMLButtonElement>("[data-media]").forEach(button => {
    button.addEventListener("click", () => {
      const index = images.findIndex(item => item.id === button.dataset.media);
      if (index < 0) return;
      generation++; cancel(); requested = index; update(index); dialog.showModal();
    }, options);
  });
  dialog.querySelector(".lightbox-close")!.addEventListener("click", () => dialog.close(), options);
  buttons.forEach(button => button.addEventListener("click", () => void change(Number(button.dataset.lightboxStep)), options));
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }, options);
  dialog.addEventListener("close", () => { generation++; cancel(); }, options);
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); void change(event.key === "ArrowLeft" ? -1 : 1); }
  }, options);
  stage.addEventListener("pointerdown", event => {
    if (event.pointerType !== "mouse") pointer = { x: event.clientX, y: event.clientY };
  }, options);
  stage.addEventListener("pointerup", event => {
    if (!pointer) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    pointer = undefined;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) void change(dx < 0 ? 1 : -1);
  }, options);
  stage.addEventListener("pointercancel", () => { pointer = undefined; }, options);
  reduced.addEventListener("change", () => {
    if (reduced.matches && dialog.open && animations.length) {
      // Only a decoded, already transitioning frame can be committed early.
      generation++; update(requested); cancel();
    }
  }, options);
  return () => { generation++; lifecycle.abort(); cancel(); if (dialog.open) dialog.close(); };
}
