import { createCard, listCards } from "./index";
import { HERB_SEED_CARDS } from "./seed-data";

/**
 * Populates the deck with the bundled starter herb cards, but only when
 * the deck is currently empty — never overwrites or duplicates a deck the
 * user has already started authoring.
 */
export function seedDefaultCards(): void {
  if (listCards().length > 0) {
    return;
  }

  for (const seedCard of HERB_SEED_CARDS) {
    try {
      createCard({ name: seedCard.name, imageDataUrl: seedCard.imageDataUrl });
    } catch (error) {
      console.error(`seedDefaultCards: failed to create seed card "${seedCard.name}"`, error);
    }
  }
}
