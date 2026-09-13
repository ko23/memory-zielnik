export interface HerbCard {
  id: string;
  name: string;
  imageDataUrl: string; // base64 data URL, cached at approval time by the caller
  sourceLabel?: string; // source/species label shown alongside the image (FR-002); absent for starter cards, which aren't looked up
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface GameResult {
  playedAt: string; // ISO 8601
  pairsCollected: number;
  tileCount: number;
  outcome: "win" | "tie" | "loss";
}

export interface PlayerRecord {
  name: string; // identity key, as typed (trim + case-insensitive compare elsewhere)
  history: GameResult[];
}
