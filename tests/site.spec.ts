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
    const brokenImages = await page
      .locator("img")
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

test("3D is fully dormant and old equipment illustrations are absent", async ({
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
        "[data-product], canvas, .product-controls, .coach-portrait, .portrait-monogram",
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

test("optional viewer preserves fallback when a future model request fails", async ({
  page,
}) => {
  const { readdirSync } = await import("node:fs");
  const chunk = readdirSync("dist/assets").find((name) =>
    /^viewer-.*\.js$/.test(name),
  )!;
  await page.route("**/models/not-provided.glb", (route) =>
    route.fulfill({ status: 404, body: "unavailable" }),
  );
  await page.goto("");
  await page.evaluate(async (chunk) => {
    const root = document.createElement("section");
    root.id = "viewer-fixture";
    root.innerHTML =
      '<p data-static-fallback>Статичное описание</p><div class="product-canvas"></div><div class="product-controls" hidden><button data-viewer-action="rotate"></button><button data-viewer-action="reset"></button><input data-viewer-angle type="range"></div><p class="viewer-status"></p>';
    document.body.append(root);
    const { createViewer } = await import(`/fencingpskov/assets/${chunk}`);
    const instance = createViewer(root, {
      enabled: true,
      modelPath: "models/not-provided.glb",
      scale: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      cameraPosition: [0, 0, 3],
      mobileCameraPosition: [0, 0, 4],
      rotationSpeed: 0.1,
      lighting: {
        ambient: 1,
        key: 3,
        fill: 2,
        exposure: 1,
        background: "#fff",
      },
    });
    (window as any).disposeFixture = instance.dispose;
  }, chunk);
  await expect(page.locator("#viewer-fixture")).toHaveAttribute(
    "data-viewer-state",
    "fallback",
  );
  await expect(
    page.locator("#viewer-fixture [data-static-fallback]"),
  ).toBeVisible();
  await expect(page.locator("#viewer-fixture .product-controls")).toBeHidden();
  await expect(page.locator("#viewer-fixture canvas")).toHaveCount(0);
  await page.evaluate(() => {
    (window as any).disposeFixture();
    (window as any).disposeFixture();
  });
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
