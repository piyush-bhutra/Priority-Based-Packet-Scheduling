import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Run experiment" }),
  ).toBeEnabled();
  await expect(page.getByText("Engine connected")).toBeVisible();
}
async function load(page: Page, id: string) {
  await page.getByLabel("Experiment scenario").selectOption(id);
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/simulate") && r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Run experiment" }).click(),
  ]);
  expect(response.status()).toBe(200);
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeEnabled();
  return (await response.json()).results;
}

const schedules: Record<string, string[][]> = {
  balanced: [
    ["A", "B", "C", "D", "E"],
    ["A", "C", "E", "B", "D"],
    ["A", "C", "E", "B", "D"],
  ],
  burst: [
    ["A", "B", "U1", "U2", "U3"],
    ["A", "U1", "U2", "U3", "B"],
    ["A", "U1", "U2", "U3", "B"],
  ],
  "aging-benefit": [
    ["A", "L", "H1", "H2", "H3"],
    ["A", "H1", "H2", "H3", "L"],
    ["A", "L", "H1", "H2", "H3"],
  ],
  idle: [
    ["A", "B", "C"],
    ["A", "B", "C"],
    ["A", "B", "C"],
  ],
  ties: [
    ["L", "H1", "H2", "M1", "M2"],
    ["H1", "H2", "M1", "M2", "L"],
    ["H1", "H2", "M1", "M2", "L"],
  ],
};
for (const [scenario, expected] of Object.entries(schedules)) {
  test(`${scenario}: all policies use real API schedules and comparison values`, async ({
    page,
  }) => {
    await ready(page);
    const results = await load(page, scenario);
    await page
      .getByRole("button", { name: "Seek to end", exact: true })
      .click();
    await expect(page.getByTestId("completed-count")).toHaveText(
      `${expected[0].length} / ${expected[0].length}`,
    );
    await expect(page.getByTestId("waiting-count")).toHaveText("00");
    await page.getByRole("button", { name: "Compare policies" }).click();
    for (const [i, policy] of ["fcfs", "priority", "aging"].entries()) {
      await expect(page.getByTestId(`order-${policy}`).locator("b")).toHaveText(
        expected[i],
      );
      expect(
        results[policy].schedule.map((r: { packet_id: string }) => r.packet_id),
      ).toEqual(expected[i]);
    }
    if (scenario === "burst") {
      await expect(page.locator(".observations")).toContainText("5 ms");
      await expect(page.locator(".observations")).toContainText("2 ms");
      await expect(page.locator(".observations")).toContainText(
        "1.5 ms to 3 ms",
      );
      await expect(page.locator(".observations")).toContainText(
        "Throughput is unchanged",
      );
    }
    if (scenario === "aging-benefit") {
      await expect(page.locator(".observations")).toContainText(
        "L starts 6 ms earlier with Aging",
      );
      await expect(page.locator(".observations")).toContainText(
        "Original P3, effective P1",
      );
    }
  });
}

test("play, pause, resume, speed, seek backwards and reset", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect
    .poll(async () => Number(await page.getByTestId("clock").innerText()))
    .toBeGreaterThan(0.1);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await page.getByTestId("clock").innerText();
  await page.waitForTimeout(200);
  await expect(page.getByTestId("clock")).toHaveText(paused);
  await page.getByLabel("Playback speed").selectOption("5");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect
    .poll(async () => Number(await page.getByTestId("clock").innerText()))
    .toBeGreaterThan(Number(paused) + 0.2);
  await page.getByRole("button", { name: "Seek to end", exact: true }).click();
  await expect(page.getByTestId("clock")).toHaveText("10");
  await page.getByRole("slider", { name: "Simulation time" }).fill("2");
  await expect(page.getByTestId("clock")).toHaveText("2");
  await expect(page.getByTestId("active-packet")).toHaveText("A");
  await expect(page.getByTestId("waiting-count")).toHaveText("02");
  await expect(page.getByTestId("waiting-packets")).not.toContainText("A");
  await page
    .getByRole("button", { name: "Reset playback", exact: true })
    .click();
  await expect(page.getByTestId("waiting-count")).toHaveText("00");
  await expect(page.getByTestId("completed-count")).toHaveText("0 / 5");
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeVisible();
});

test("same-time stepping shows arrival, selection and start distinctly", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(page.getByTestId("waiting-count")).toHaveText("01");
  await expect(page.locator(".event-title")).toHaveText("arrival");
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(page.locator(".event-title")).toHaveText("selection");
  await expect(page.getByTestId("waiting-count")).toHaveText("01");
  await expect(page.getByTestId("active-packet")).toHaveCount(0);
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(page.getByTestId("waiting-count")).toHaveText("00");
  await expect(page.getByTestId("active-packet")).toHaveText("A");
});

test("edit, add, remove and aging changes invalidate prior results", async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel("Packet 1 duration", { exact: true }).fill("6");
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Add packet" }).click();
  await expect(page.getByTestId("packet-editor-row")).toHaveCount(6);
  await page.getByLabel("Packet 6 ID", { exact: true }).fill("NEW");
  await page.getByLabel("Packet 6 priority", { exact: true }).selectOption("1");
  await page
    .getByRole("button", { name: "Remove packet 2", exact: true })
    .click();
  await expect(page.getByTestId("packet-editor-row")).toHaveCount(5);
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/simulate")),
    page.getByRole("button", { name: "Run experiment" }).click(),
  ]);
  const payload = response.request().postDataJSON();
  expect(payload.packets[0].duration).toBe(6);
  expect(payload.packets.map((p: { id: string }) => p.id)).toEqual([
    "A",
    "C",
    "D",
    "E",
    "NEW",
  ]);
  await page
    .getByRole("button", { name: "Priority + Aging", exact: true })
    .click();
  await page.getByLabel("Aging interval", { exact: true }).fill("2");
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeDisabled();
  const [changed] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/simulate")),
    page.getByRole("button", { name: "Run experiment" }).click(),
  ]);
  expect((await changed.json()).results.aging.aging_interval).toBe(2);
});

test("blank, duplicate and excess precision inputs block submission with errors", async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel("Packet 1 duration", { exact: true }).fill("");
  await expect(
    page.getByRole("button", { name: "Run experiment" }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("decimal number");
  await page
    .getByLabel("Packet 1 duration", { exact: true })
    .fill("1.00000000000000001");
  await expect(
    page.getByRole("button", { name: "Run experiment" }),
  ).toBeDisabled();
  await page.getByLabel("Packet 1 duration", { exact: true }).fill("4");
  await page.getByLabel("Packet 2 ID", { exact: true }).fill("A");
  await expect(page.getByRole("alert")).toContainText("unique");
});

test("unavailable API produces actionable error and retry recovers", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "text/plain",
      body: "Unavailable",
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Flask on port 5000");
  await page.unroute("**/api/**");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Run experiment" }),
  ).toBeEnabled();
  await expect(page.getByText("Engine connected")).toBeVisible();
});

test("desktop and laptop layout, no horizontal overflow or browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await ready(page);
  for (const width of [1920, 1366]) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 768 });
    await expect(
      page.getByRole("button", { name: "Run experiment" }),
    ).toBeVisible();
    const controls = await page.locator(".transport").boundingBox();
    expect(controls!.y + controls!.height).toBeLessThanOrEqual(
      width === 1920 ? 1080 : 768,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Compare policies" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Simulator", exact: true }).click();
  }
  expect(errors).toEqual([]);
});

test("absent priority classes show N/A and fractional utilization displays as percent", async ({
  page,
}) => {
  await ready(page);
  for (let count = 5; count > 1; count--)
    await page
      .getByRole("button", { name: `Remove packet ${count}`, exact: true })
      .click();
  await page.getByLabel("Packet 1 priority", { exact: true }).selectOption("3");
  await page.getByLabel("Packet 1 arrival", { exact: true }).fill("1");
  await page.getByLabel("Packet 1 duration", { exact: true }).fill("1");
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/simulate")),
    page.getByRole("button", { name: "Run experiment" }).click(),
  ]);
  expect((await response.json()).results.fcfs.metrics.link_utilization).toBe(
    0.5,
  );
  await expect(
    page.locator(".metric").filter({ hasText: "Link utilization" }),
  ).toContainText("50");
  await expect(
    page.locator(".class-summary>div").filter({ hasText: "High priority" }),
  ).toContainText("N/A");
  await expect(
    page.locator(".class-summary>div").filter({ hasText: "Medium priority" }),
  ).toContainText("N/A");
});

test("aging inspection uses original and returned effective priority; policy switch resets playback", async ({
  page,
}) => {
  await ready(page);
  await load(page, "aging-benefit");
  await page
    .getByRole("button", { name: "Priority + Aging", exact: true })
    .click();
  await page.getByRole("slider", { name: "Simulation time" }).fill("10");
  await expect(page.getByTestId("active-packet")).toHaveText("L");
  await expect(page.locator(".aging-chip")).toContainText("Original P3");
  await expect(page.locator(".aging-chip")).toContainText("Effective P1");
  await page.getByTestId("active-packet").click();
  await expect(page.getByTestId("packet-detail")).toContainText(
    "Original P3 → effective P1 at selection",
  );
  await page
    .getByRole("button", { name: "Strict Priority", exact: true })
    .click();
  await expect(page.getByTestId("clock")).toHaveText("0");
  await expect(page.getByTestId("waiting-count")).toHaveText("00");
});
