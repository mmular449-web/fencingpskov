/** Scroll updates write transforms only; geometry is cached outside the scroll handler. */
export function initMotion() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [...document.querySelectorAll<HTMLElement>('[data-motion-scene]')];
  const active = new Set<HTMLElement>();
  const geometry = new Map<HTMLElement, {top: number; height: number}>();
  let frame = 0;
  let measureFrame = 0;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const paint = () => {
    frame = 0;
    if (reduced.matches || document.hidden) return;
    const y = window.scrollY;
    for (const scene of active) {
      const box = geometry.get(scene);
      if (!box) continue;
      const progress = clamp((y - box.top + 64) / Math.max(1, box.height - innerHeight + 64));
      scene.style.setProperty('--progress', progress.toFixed(4));
      if (scene.dataset.motionScene === 'duel') scene.dataset.chapter = progress > .52 ? '2' : '1';
      if (scene.dataset.motionScene === 'hero') {
        scene.style.setProperty('--hero-shift', `${Math.min(70, Math.max(0, y - box.top) * .12).toFixed(1)}px`);
      }
    }
  };
  const schedule = () => { if (!frame && !reduced.matches) frame = requestAnimationFrame(paint); };
  const measure = () => {
    measureFrame = 0;
    for (const scene of scenes) {
      const box = scene.getBoundingClientRect();
      geometry.set(scene, {top: box.top + scrollY, height: box.height});
    }
    schedule();
  };
  const scheduleMeasure = () => { if (!measureFrame) measureFrame = requestAnimationFrame(measure); };
  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? active.add(entry.target as HTMLElement) : active.delete(entry.target as HTMLElement));
    schedule();
  });
  scenes.forEach(scene => sceneObserver.observe(scene));
  const photos = [...document.querySelectorAll<HTMLElement>('.media-reveal')];
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('photo-visible');
      reveal.unobserve(entry.target);
    }
  }, {threshold: .12});
  const syncMotion = () => {
    if (reduced.matches) {
      cancelAnimationFrame(frame); frame = 0;
      scenes.forEach(scene => { scene.style.removeProperty('--progress'); scene.style.removeProperty('--hero-shift'); });
      photos.forEach(photo => photo.classList.add('photo-visible'));
      reveal.disconnect();
    } else {
      photos.filter(photo => !photo.classList.contains('photo-visible')).forEach(photo => reveal.observe(photo));
      scheduleMeasure();
    }
  };
  reduced.addEventListener('change', syncMotion);
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', scheduleMeasure, {passive: true});
  window.addEventListener('pageshow', scheduleMeasure);
  document.addEventListener('visibilitychange', schedule);
  document.fonts.ready.then(scheduleMeasure);
  const resize = new ResizeObserver(scheduleMeasure);
  resize.observe(document.body);
  syncMotion();

  const rail = document.querySelector<HTMLElement>('.photo-rail');
  if (rail) {
    const slides = [...rail.querySelectorAll<HTMLElement>('.rail-frame')];
    const count = document.querySelector('.rail-count');
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-rail]')];
    let current = 0;
    const update = () => {
      current = slides.reduce((best, slide, index) => Math.abs(slide.offsetLeft - rail.offsetLeft - rail.scrollLeft) < Math.abs(slides[best].offsetLeft - rail.offsetLeft - rail.scrollLeft) ? index : best, 0);
      if (count) count.textContent = `${current + 1} / ${slides.length}`;
      buttons.forEach(button => button.disabled = Number(button.dataset.rail) < 0 ? current === 0 : current === slides.length - 1);
    };
    const go = (direction: number) => {
      const index = Math.max(0, Math.min(slides.length - 1, current + direction));
      rail.scrollTo({left: slides[index].offsetLeft - slides[0].offsetLeft, behavior: reduced.matches ? 'instant' : 'smooth'});
    };
    buttons.forEach(button => button.addEventListener('click', () => go(Number(button.dataset.rail))));
    rail.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault();go(event.key === 'ArrowLeft' ? -1 : 1);}
    });
    rail.addEventListener('scrollend', update);
    // Safari versions without scrollend still update the counter after a touch scroll.
    let timer: ReturnType<typeof setTimeout>;
    rail.addEventListener('scroll', () => {clearTimeout(timer);timer = setTimeout(update, 120);}, {passive: true});
    update();
  }
}
