import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  "",
  "federation/",
  "epee/",
  "children/",
  "coaches/",
  "news/",
  "competitions/",
  "gallery/",
  "documents/",
  "contacts/",
  "sources/",
];
for (const route of routes) {
  test(`direct route, assets, links and accessibility: ${route || "home"}`, async ({
    page,
    request,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.url().startsWith("http://127.0.0.1") && r.status() >= 400)
        errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(route);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("main h1")).toBeVisible();
    await page.reload();
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".review-strip")).toContainText(
      "Версия для согласования",
    );
    expect(
      await page.locator('meta[name="description"]').getAttribute("content"),
    ).toBeTruthy();
    expect(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
    ).toBe(`https://mmular449-web.github.io/fencingpskov/${route}`);
    // Force each lazy photograph into the viewport, then verify the selected srcset asset.
    for (const image of await page.locator('img:not(dialog img)').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      await expect(image).not.toHaveJSProperty('naturalWidth', 0);
    }
    const brokenImages = await page
      .locator("img:not(dialog img)")
      .evaluateAll((images) =>
        images
          .filter(
            (img) =>
              !(img as HTMLImageElement).complete ||
              (img as HTMLImageElement).naturalWidth === 0,
          )
          .map((img) => (img as HTMLImageElement).src),
      );
    expect(brokenImages).toEqual([]);
    const links = await page
      .locator("a[href]")
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")!));
    for (const href of [...new Set(links)]) {
      expect(href).not.toBe("");
      if (href.startsWith("/fencingpskov/")) {
        const target = href.split("#")[0];
        const response = await request.get(target);
        expect(response.status(), `internal link ${href}`).toBe(200);
        if (href.includes("#")) {
          const id = href.split("#")[1];
          const current = new URL(page.url()).pathname;
          if (target === current)
            expect(await page.locator(`[id="${id}"]`).count()).toBe(1);
        }
      } else expect(href).toMatch(/^(https:\/\/|tel:\+7|#)/);
    }
    expect(errors).toEqual([]);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      accessibility.violations,
      JSON.stringify(accessibility.violations, null, 2),
    ).toEqual([]);
  });
}

for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
  test(`responsive layout ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `horizontal overflow on ${route} at ${width}px`,
      ).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      const orphanPunctuation = await page
        .locator("h1,h2,h3")
        .evaluateAll((headings) => {
          const errors: string[] = [];
          for (const heading of headings) {
            const walker = document.createTreeWalker(
              heading,
              NodeFilter.SHOW_TEXT,
            );
            let node: Node | null;
            while ((node = walker.nextNode())) {
              const text = node.textContent || "";
              for (let i = 1; i < text.length; i++) {
                if (!/[.,!?;:]/.test(text[i]) || /\s/.test(text[i - 1]))
                  continue;
                const range = document.createRange();
                range.setStart(node, i - 1);
                range.setEnd(node, i);
                const before = range.getBoundingClientRect();
                range.setStart(node, i);
                range.setEnd(node, i + 1);
                const punctuation = range.getBoundingClientRect();
                if (
                  before.width &&
                  punctuation.width &&
                  Math.abs(before.y - punctuation.y) > 3
                )
                  errors.push(heading.textContent || "");
              }
            }
          }
          return errors;
        });
      expect(
        orphanPunctuation,
        `isolated heading punctuation on ${route} at ${width}px`,
      ).toEqual([]);
    }
  });
}

test("mobile menu, Escape and enrollment", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("");
  const menu = page.getByRole("button", { name: "Меню" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("navigation", { name: "Основная навигация" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  await page
    .locator(".hero")
    .getByRole("link", { name: "Начать заниматься" })
    .click();
  await expect(page).toHaveURL(/contacts\/#enroll$/);
  await expect(page.locator("#enroll")).toBeInViewport();
  await expect(
    page.getByRole("link", { name: /\+7 911 358-24-60/ }).first(),
  ).toHaveAttribute("href", "tel:+79113582460");
});

test("keyboard skip link and FAQ", async ({ page }) => {
  await page.goto("children/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Перейти к содержанию" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const question = page.getByText("Какое расписание и стоимость занятий?", {
    exact: true,
  });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Подтверждённых данных пока нет.")).toBeVisible();
});

test("reduced motion and slow connection", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 200000,
    uploadThroughput: 100000,
  });
  await page.goto("", { waitUntil: "networkidle" });
  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(page.locator(".hero .button").first()).toBeVisible();
  expect(
    await page
      .locator(".hero h1")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".opening")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
  const resourceBytes = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .reduce(
        (total, entry) =>
          total + (entry as PerformanceResourceTiming).transferSize,
        0,
      ),
  );
  expect(resourceBytes).toBeLessThan(700000);
});

test("only real photo scenes are shipped; no 3D viewer or synthetic equipment assets", async ({
  page,
}) => {
  const forbiddenRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /viewer-.*\.js|\.(glb|gltf)(\?|$)|images\/(epee|mask|piste)\.svg/.test(
        request.url(),
      )
    )
      forbiddenRequests.push(request.url());
  });
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(
      page.locator(
        "canvas, .product-canvas, .product-controls, [data-product], .coach-portrait, .portrait-monogram",
      ),
    ).toHaveCount(0);
  }
  expect(forbiddenRequests).toEqual([]);
});

test("news filters show the verified publication category", async ({
  page,
}) => {
  await page.goto("news/");
  await expect(page.locator(".news-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Сборы", exact: true }).click();
  await expect(page.locator(".news-card")).toHaveCount(1);
  await expect(page.locator(".news-card h3")).toContainText("Голубых озёрах");
  await expect(
    page.getByRole("button", { name: "Сборы", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Все публикации" }).click();
  await expect(page.locator(".news-card")).toHaveCount(3);
});

test("scroll reveals content and changing reduced motion reveals every section", async ({
  page,
}) => {
  await page.goto("");
  const coach = page.locator(".coach").first();
  await coach.scrollIntoViewIfNeeded();
  await expect(coach).toHaveClass(/is-visible/);
  await expect(coach).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".reveal")
      .evaluateAll((elements) =>
        elements.every((el) => getComputedStyle(el).opacity === "1"),
      ),
  ).toBe(true);
});


test("photo scenes animate on touch widths, rail and lightbox work", async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("");
  const hero = page.locator('.hero-photo');
  await expect(hero).toBeVisible();
  await expect(hero).toHaveJSProperty('complete', true);
  const scene = page.locator('.duel-scene');
  await scene.scrollIntoViewIfNeeded();
  const before = await page.locator('.duel-photo').evaluate(el => getComputedStyle(el).transform);
  await page.evaluate(() => window.scrollBy({top: 300, behavior: 'instant'}));
  await expect.poll(() => page.locator('.duel-photo').evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  const rail = page.locator('.photo-rail');
  await rail.scrollIntoViewIfNeeded();
  await page.getByRole('button', {name: 'Следующая фотография'}).click();
  await expect(page.locator('.rail-count')).toHaveText('2 / 4');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(page.locator('.duel-photo')).toHaveCSS('transform', 'none');
  await expect(page.locator('.note-first')).toHaveCSS('opacity', '1');
  await expect(page.locator('.note-second')).toHaveCSS('opacity', '1');
  const photoBottom = await page.locator('.duel-photo').evaluate(el => el.getBoundingClientRect().bottom);
  const textTop = await page.locator('.duel-notes').evaluate(el => el.getBoundingClientRect().top);
  expect(textTop).toBeGreaterThanOrEqual(photoBottom);
  await page.goto('gallery/');
  await page.locator('.gallery-open').first().click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await expect(page.locator('#lightbox .lightbox-image')).toHaveJSProperty('complete', true);
  await expect(page.locator('#lightbox p')).toContainText('CC BY 2.5');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
});


test("Motion gallery crossfades, arrow keys, swipe and reduced motion", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('gallery/');
  await page.locator('.gallery-open').first().click();
  await expect(page.locator('.lightbox-count')).toHaveText('1 / 5');
  await page.getByRole('button',{name:'Следующий снимок'}).click();
  await expect(page.locator('.lightbox-count')).toHaveText('2 / 5');
  await expect(page.locator('.lightbox-transition')).toBeHidden();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.lightbox-count')).toHaveText('3 / 5');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.lightbox-count')).toHaveText('2 / 5');
  await page.locator('.lightbox-stage').dispatchEvent('pointerdown',{pointerType:'touch',clientX:300,clientY:250});
  await page.locator('.lightbox-stage').dispatchEvent('pointerup',{pointerType:'touch',clientX:100,clientY:255});
  await expect(page.locator('.lightbox-count')).toHaveText('3 / 5');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await expect(page.locator('.gallery-open').first()).toBeFocused();
});

test("Motion scroll has a fallback and can restart after reduced motion and resize", async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(()=>{
    Object.defineProperty(window,'ScrollTimeline',{value:undefined,configurable:true});
    Object.defineProperty(window,'ViewTimeline',{value:undefined,configurable:true});
  });
  await page.setViewportSize({width:375,height:812});
  await page.goto('');
  await expect(page.locator('html')).toHaveAttribute('data-motion-engine','motion');
  const scene = page.locator('.duel-scene');
  await scene.scrollIntoViewIfNeeded();
  const before=await page.locator('.duel-photo').evaluate(el=>getComputedStyle(el).transform);
  await page.evaluate(()=>scrollBy({top:220,behavior:'instant'}));
  await expect.poll(()=>page.locator('.duel-photo').evaluate(el=>getComputedStyle(el).transform)).not.toBe(before);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('html')).toHaveAttribute('data-motion-state','reduced');
  await expect(page.locator('.duel-photo')).toHaveCSS('transform','none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('html')).toHaveAttribute('data-motion-state','active');
  await page.setViewportSize({width:430,height:932});
  await scene.scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
