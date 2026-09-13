import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

// index.ts keeps its deck/player cache as module-level state, so each test
// needs a fresh module instance (not just a cleared localStorage) to be
// isolated from the others.
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe("seedDefaultCards", () => {
  it("populates all 14 seed cards into an empty deck", async () => {
    const { seedDefaultCards } = await import("./seed");
    const { listCards } = await import("./index");
    const { HERB_SEED_CARDS } = await import("./seed-data");

    seedDefaultCards();
    const cards = listCards();

    expect(cards).toHaveLength(HERB_SEED_CARDS.length);
    expect(cards.map((card) => card.name).sort()).toEqual(
      HERB_SEED_CARDS.map((card) => card.name).sort(),
    );
    for (const card of cards) {
      expect(card.imageDataUrl).toEqual(expect.stringMatching(/^data:image\//));
      expect(card.sourceLabel).toBeUndefined();
    }
  });

  it("every HERB_SEED_CARDS entry has a path under assets/herb-seed-sources/", async () => {
    const { HERB_SEED_CARDS } = await import("./seed-data");

    for (const seedCard of HERB_SEED_CARDS) {
      expect(seedCard.path).toEqual(expect.stringMatching(/^assets\/herb-seed-sources\//));
    }
  });

  it("does nothing when the deck already has a card", async () => {
    const { createCard, listCards } = await import("./index");
    createCard({
      name: "existing card",
      imageDataUrl: "data:image/jpeg;base64,Zm9v",
      sourceLabel: "test",
    });

    const { seedDefaultCards } = await import("./seed");
    seedDefaultCards();

    const cards = listCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("existing card");
  });
});
