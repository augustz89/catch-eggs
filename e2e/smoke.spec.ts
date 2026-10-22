import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 계란 받기 게임이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("계란 받기");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("계란 받기");
  await expect(page.getByRole("button", { name: "시작하기" })).toBeVisible();
});
