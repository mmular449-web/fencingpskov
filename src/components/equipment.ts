import mediaData from "../data/media.json";

export function equipmentScene(): string {
  const media = mediaData.find(m => m.id === "equipment" && m.permissionStatus === "approved");
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
  return `<section class="product-showcase product-dark section" data-equipment-scene>
  <div class="wrap"><p class="eyebrow">03 / Оружие в деталях</p><h2>Шпага. Точность в каждой детали.</h2><p class="product-description">Глубокая чашеобразная гарда защищает кисть. Пистолетная или французская рукоятка помогает управлять клинком. Точность начинается с деталей.</p>
  <figure class="product-stage media-reveal"><img class="product-poster" src="${asset(media.src)}" srcset="${media.variants.map(v => `${asset(v.src)} ${v.width}w`).join(", ")}" sizes="(max-width: 760px) 100vw, 90vw" alt="${escape(media.alt)}" loading="lazy" width="${media.width}" height="${media.height}"></figure>
  <div class="equipment-details"><span>Гарда.<small>Защита кисти.</small></span><span>Рукоятка.<small>Контроль движения.</small></span><span>Клинок.<small>Точный укол.</small></span></div>
  <p class="product-credit">Фото: ${escape(media.author)} · <a href="${escape(media.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escape(media.license)}</a> · <a href="${escape(media.sourceUrl)}" target="_blank" rel="noopener noreferrer">Оригинал</a> · Адаптивный кроп, WebP.<br>${escape(media.caption)}</p></div></section>`;
}
