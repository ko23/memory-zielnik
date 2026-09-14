import { test, expect } from "@playwright/test";

// One critical-path smoke test: menu -> setup -> play a full game to a
// winner -> back to menu. Pairs are matched deterministically via each
// tile's data-card-id attribute (a test-only hook, invisible to players)
// rather than solving the memory puzzle "for real" — that gameplay logic
// is already thoroughly covered by src/lib/game.test.ts's unit tests.
// This test's job is only to prove the UI wiring works end-to-end.

test("play a full game from the menu to a winner and back", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Herbs Masters Duel" })).toBeVisible();
  const playButton = page.getByRole("button", { name: "Play Game" });
  await expect(playButton).toBeEnabled();
  await playButton.click();

  await page.getByLabel(/Player 1 name/).fill("Alice");
  await page.getByLabel(/Player 2 name/).fill("Bob");
  await page.getByRole("button", { name: "Next" }).click();

  // Pair count defaults to the minimum (10) — no need to change it.
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: "Alice", exact: true }).click();

  const tiles = page.getByTestId("tile");
  const tileCount = await tiles.count();
  const cardIds: string[] = [];
  for (let i = 0; i < tileCount; i++) {
    cardIds.push((await tiles.nth(i).getAttribute("data-card-id"))!);
  }

  const firstIndexById = new Map<string, number>();
  const pairs: Array<[number, number]> = [];
  cardIds.forEach((id, index) => {
    const firstIndex = firstIndexById.get(id);
    if (firstIndex === undefined) {
      firstIndexById.set(id, index);
    } else {
      pairs.push([firstIndex, index]);
    }
  });
  expect(pairs).toHaveLength(tileCount / 2);

  for (const [a, b] of pairs) {
    await tiles.nth(a).click();
    await tiles.nth(b).click();
  }

  await expect(page.getByRole("heading", { name: /wins!|tie/i })).toBeVisible();
  await page.getByRole("button", { name: "Back to menu" }).click();
  await expect(page.getByRole("heading", { name: "Herbs Masters Duel" })).toBeVisible();
});
