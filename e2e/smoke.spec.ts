import { expect, test, type Page } from "@playwright/test";

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(
    overflow.scrollWidth,
    `page should not horizontally overflow (scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth})`
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

async function loginAsStudent(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("student@veolms.com");
  await page.getByLabel("Password").fill("Student@12345");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/dashboard|courses|learn|profile/, {
    timeout: 20_000,
  });
}

test.describe("public UI + APIs", () => {
  test("home and courses render; APIs respond", async ({ page, request }) => {
    const home = await page.goto("/");
    expect(home?.ok()).toBeTruthy();
    await expect(page.locator("main").getByRole("heading").first()).toBeVisible();
    await noHorizontalOverflow(page);

    const courses = await page.goto("/courses");
    expect(courses?.ok()).toBeTruthy();
    await expect(page.locator("main").getByRole("heading").first()).toBeVisible();
    await noHorizontalOverflow(page);

    const csrf = await request.get("/api/auth/csrf");
    expect(csrf.ok()).toBeTruthy();
    const csrfJson = await csrf.json();
    expect(csrfJson.csrfToken).toBeTruthy();

    const lockedLesson = await request.get(
      "/api/content/lessons/cm_does_not_exist"
    );
    expect([404, 403, 400]).toContain(lockedLesson.status());
  });

  test("mobile menu opens without overflowing", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile menu only");
    await page.goto("/");
    await page.getByRole("button", { name: /Open menu/i }).click();
    await expect(
      page.locator("#site-mobile-menu").getByRole("link", { name: "Courses" })
    ).toBeVisible();
    await noHorizontalOverflow(page);
  });

  test("HLS demo preview course page loads", async ({ page }) => {
    const res = await page.goto("/courses/hls-streaming-demo");
    expect(res?.status()).toBeLessThan(500);
    if (res?.ok()) {
      await expect(page.locator("main").getByRole("heading").first()).toBeVisible();
      await noHorizontalOverflow(page);
    }
  });

  test("header search suggests courses and search API works", async ({
    page,
    request,
    isMobile,
  }) => {
    const api = await request.get("/api/courses/search?q=web");
    expect(api.ok()).toBeTruthy();
    const json = await api.json();
    expect(Array.isArray(json.courses)).toBeTruthy();
    expect(json.courses.length).toBeGreaterThan(0);

    await page.goto("/");
    const search = isMobile
      ? page.getByRole("combobox", { name: /Search courses/i }).last()
      : page.getByRole("combobox", { name: /Search courses/i }).first();
    await search.fill("web");
    await expect(page.getByRole("listbox", { name: /Course suggestions/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("option").or(page.locator('[role="listbox"] a')).first()
    ).toBeVisible({ timeout: 10_000 });
    await noHorizontalOverflow(page);
  });

  test("guest footer shows Login link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer").getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.locator("footer").getByRole("link", { name: "Courses" })).toBeVisible();
  });
});

test.describe("auth + protected flows", () => {
  test("student can log in and open dashboard/profile", async ({ page, isMobile }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator("main").getByRole("heading").first()).toBeVisible();
    await noHorizontalOverflow(page);

    await page.goto("/profile");
    await expect(page).toHaveURL(/profile/);
    await expect(page.locator("main").getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByLabel("Photo URL")).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await noHorizontalOverflow(page);

    // Logged-in footer should not offer Login.
    await expect(page.locator("footer").getByRole("link", { name: "Login" })).toHaveCount(0);
    await expect(page.locator("footer").getByRole("link", { name: "Dashboard" })).toBeVisible();

    if (!isMobile) {
      await page.getByRole("button", { name: /Account menu/i }).click();
      await expect(page.getByRole("menuitem", { name: /Profile/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /Dashboard/i })).toBeVisible();
    }
  });

  test("admin can open admin shell on mobile drawer", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@veolms.com");
    await page.getByLabel("Password").fill("Admin@12345");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/dashboard|admin|courses/, { timeout: 20_000 });

    await page.goto("/admin/courses");
    await expect(page).toHaveURL(/admin\/courses/);
    await expect(page.locator("main").getByRole("heading").first()).toBeVisible({
      timeout: 15_000,
    });
    await noHorizontalOverflow(page);

    if (isMobile) {
      await page.getByRole("button", { name: /Open admin menu/i }).click();
      await expect(page.getByRole("link", { name: "Lessons" }).first()).toBeVisible();
    }
  });

  test("signed media route rejects forged tokens", async ({ request }) => {
    const res = await request.get("/api/media?t=not-a-token&sig=forged");
    expect([403, 410, 503]).toContain(res.status());
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
