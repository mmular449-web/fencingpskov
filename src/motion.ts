import { animate } from "motion/mini";
import { inView, scroll } from "motion";

type Playback = ReturnType<typeof animate>;
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const textSelector = ".reveal, .section-heading, .coach, .news-card, .timeline article";

export function initMotion() {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const lifecycle = new AbortController();
  const options = { signal: lifecycle.signal };
  let stopRuntime = () => {};
  let refresh = (_scope: ParentNode = document) => {};
  root.classList.add("motion-ready");
  root.dataset.motionEngine = "motion";

  const showContent = (scope: ParentNode = document) => {
    scope.querySelectorAll<HTMLElement>(textSelector).forEach(el => el.classList.add("is-visible"));
    scope.querySelectorAll(".media-reveal").forEach(el => el.classList.add("photo-visible"));
  };
  const start = () => {
    stopRuntime();
    if (reduced.matches || !("IntersectionObserver" in window)) {
      root.dataset.motionState = "reduced";
      root.dataset.heroEntered = "true";
      showContent();
      document.querySelectorAll<HTMLElement>(".duel-note").forEach(note => {
        note.inert = false;
        note.removeAttribute("aria-hidden");
      });
      refresh = showContent;
      stopRuntime = () => {};
      return;
    }

    root.dataset.motionState = "active";
    let running = true;
    const stops: (() => void)[] = [];
    const animations = new Set<Playback>();
    const timed = new Map<HTMLElement, Playback>();
    const originals = new Map<HTMLElement, Map<string, string>>();
    const registered = new WeakSet<Element>();
    const remember = (el: HTMLElement, properties: string[]) => {
      let saved = originals.get(el);
      if (!saved) originals.set(el, saved = new Map());
      for (const property of properties) if (!saved.has(property)) saved.set(property, el.style.getPropertyValue(property));
    };
    const play = (el: HTMLElement, values: Parameters<typeof animate>[1], settings: Parameters<typeof animate>[2] = {}) => {
      remember(el, Object.keys(values).map(key => key === "clipPath" ? "clip-path" : key));
      const animation = animate(el, values, settings);
      animations.add(animation);
      void animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
      return animation;
    };
    const attach = (el: HTMLElement | null, values: Parameters<typeof animate>[1], target: HTMLElement, offset: NonNullable<Parameters<typeof scroll>[1]>["offset"]) => {
      if (!el) return;
      const animation = play(el, values, { duration: 1, ease: "linear" });
      const detach = scroll(animation, { target, offset });
      // Cancel first: scroll() also stops its animation on detach. In browsers
      // using the JS fallback, stop() would otherwise commit styles to elements
      // that the reduced-motion stylesheet has already hidden.
      stops.push(() => { animation.cancel(); detach(); });
    };

    const hero = document.querySelector<HTMLElement>("[data-motion-scene='hero']");
    if (hero) {
      attach(hero.querySelector(".hero-photo"), {
        transform: ["translateY(0px) scale(1.03)", "translateY(70px) scale(1.07)"],
      }, hero, ["start start", "end start"]);
      attach(hero.querySelector(".hero-copy"), {
        transform: ["translateY(0px)", "translateY(-38px)"],
        opacity: [1, 0.55],
      }, hero, ["start start", "end start"]);
      if (!root.dataset.heroEntered) {
        hero.querySelectorAll<HTMLElement>(".hero-enter").forEach((el, index) => {
          play(el, { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] }, {
            duration: 0.7, delay: index * 0.09, ease,
          });
        });
        root.dataset.heroEntered = "true";
      }
    }

    const duel = document.querySelector<HTMLElement>("[data-motion-scene='duel']");
    if (duel) {
      const offset: NonNullable<Parameters<typeof scroll>[1]>["offset"] = ["start start", "end end"];
      attach(duel.querySelector(".duel-photo"), { transform: ["scale(1.12)", "scale(1)"] }, duel, offset);
      attach(duel.querySelector(".duel-content h2"), { transform: ["translateY(0px)", "translateY(-22px)"] }, duel, offset);
      attach(duel.querySelector(".scene-progress span"), { transform: ["scaleX(0)", "scaleX(1)"] }, duel, offset);
      const notes = [...duel.querySelectorAll<HTMLElement>(".duel-note")];
      let current = 0;
      duel.dataset.chapter = "1";
      notes.forEach((note, index) => { note.inert = index !== current; note.setAttribute("aria-hidden", String(index !== current)); });
      stops.push(scroll(progress => {
        const next = progress > 0.52 ? 1 : 0;
        if (next === current || notes.length !== 2) return;
        const outgoing = notes[current];
        const incoming = notes[next];
        const outgoingStyle = getComputedStyle(outgoing);
        const incomingStyle = getComputedStyle(incoming);
        const fromOpacity = outgoingStyle.opacity;
        const fromTransform = outgoingStyle.transform;
        const toOpacity = incomingStyle.opacity;
        const toTransform = incomingStyle.transform;
        timed.get(outgoing)?.cancel();
        timed.get(incoming)?.cancel();
        duel.dataset.chapter = String(next + 1);
        outgoing.inert = true;
        outgoing.setAttribute("aria-hidden", "true");
        incoming.inert = false;
        incoming.setAttribute("aria-hidden", "false");
        timed.set(outgoing, play(outgoing, { opacity: [fromOpacity, 0], transform: [fromTransform, "translateY(-10px)"] }, { duration: 0.14, ease }));
        timed.set(incoming, play(incoming, { opacity: [toOpacity, 1], transform: [toTransform, "translateY(0px)"] }, { duration: 0.36, delay: 0.09, ease }));
        current = next;
      }, { target: duel, offset }));
    }

    refresh = (scope: ParentNode = document) => {
      for (const [el, saved] of originals) if (!el.isConnected) {
        timed.get(el)?.cancel();
        timed.delete(el);
        for (const [property, value] of saved) value ? el.style.setProperty(property, value) : el.style.removeProperty(property);
        originals.delete(el);
      }
      scope.querySelectorAll<HTMLElement>(textSelector).forEach(el => {
        if (registered.has(el) || el.classList.contains("is-visible")) return;
        registered.add(el);
        el.classList.add("reveal");
        stops.push(inView(el, () => {
          el.classList.add("is-visible");
          const siblings = [...(el.parentElement?.children || [])].filter(child => child.matches(textSelector));
          const delay = Math.min(Math.max(0, siblings.indexOf(el)) * 0.065, 0.195);
          timed.set(el, play(el, { opacity: [0, 1], transform: ["translateY(22px)", "translateY(0px)"] }, { duration: 0.58, delay, ease }));
        }, { amount: 0.12 }));
      });
      scope.querySelectorAll<HTMLElement>(".media-reveal").forEach(frame => {
        if (registered.has(frame) || frame.classList.contains("photo-visible")) return;
        registered.add(frame);
        stops.push(inView(frame, () => {
          const img = frame.querySelector<HTMLImageElement>("img");
          if (!img) return;
          void img.decode().catch(() => {}).then(() => {
            if (!running) return;
            frame.classList.add("photo-visible");
            play(img, { transform: ["scale(1.07)", "scale(1)"], clipPath: ["inset(7% 4%)", "inset(0% 0%)"] }, { duration: 0.9, ease });
          });
        }, { amount: 0.12 }));
      });
    };
    refresh();
    const focus = (event: FocusEvent) => {
      const el = (event.target as Element).closest<HTMLElement>(".reveal");
      if (!el) return;
      el.classList.add("is-visible");
      timed.get(el)?.complete();
    };
    document.addEventListener("focusin", focus);
    stopRuntime = () => {
      running = false;
      stops.forEach(stop => stop());
      animations.forEach(animation => animation.cancel());
      for (const [el, saved] of originals) for (const [property, value] of saved) {
        value ? el.style.setProperty(property, value) : el.style.removeProperty(property);
      }
      document.removeEventListener("focusin", focus);
    };
  };
  reduced.addEventListener("change", start, options);
  start();

  const rail = document.querySelector<HTMLElement>(".photo-rail");
  let timer: ReturnType<typeof setTimeout>;
  if (rail) {
    const slides = [...rail.querySelectorAll<HTMLElement>(".rail-frame")];
    const count = document.querySelector(".rail-count");
    const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-rail]")];
    let current = 0;
    const update = () => {
      current = slides.reduce((best, slide, index) => Math.abs(slide.offsetLeft - rail.offsetLeft - rail.scrollLeft) < Math.abs(slides[best].offsetLeft - rail.offsetLeft - rail.scrollLeft) ? index : best, 0);
      if (count) count.textContent = `${current + 1} / ${slides.length}`;
      buttons.forEach(button => button.disabled = Number(button.dataset.rail) < 0 ? current === 0 : current === slides.length - 1);
    };
    const go = (direction: number) => {
      const index = Math.max(0, Math.min(slides.length - 1, current + direction));
      rail.scrollTo({ left: slides[index].offsetLeft - slides[0].offsetLeft, behavior: reduced.matches ? "instant" : "smooth" });
    };
    buttons.forEach(button => button.addEventListener("click", () => go(Number(button.dataset.rail)), options));
    rail.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); go(event.key === "ArrowLeft" ? -1 : 1); }
    }, options);
    rail.addEventListener("scrollend", update, options);
    rail.addEventListener("scroll", () => { clearTimeout(timer); timer = setTimeout(update, 120); }, { ...options, passive: true });
    window.addEventListener("resize", update, { ...options, passive: true });
    update();
  }
  return {
    refresh: (scope: ParentNode = document) => refresh(scope),
    dispose: () => { lifecycle.abort(); clearTimeout(timer); stopRuntime(); },
  };
}
