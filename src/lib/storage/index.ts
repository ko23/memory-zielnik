import { readEnvelope, writeEnvelope } from "./adapter";
import type { HerbCard, GameResult, PlayerRecord } from "./types";

export type { HerbCard, GameResult, PlayerRecord } from "./types";

const SCHEMA_VERSION = 1;
const DECK_KEY = "hmd:deck";
const PLAYERS_KEY = "hmd:players";

// In-memory cache is the source of truth for the current session — reads
// are lazy-loaded once, writes update the cache first and persist best-effort
// (fail-soft: a storage write failure never blocks in-memory use).
let deckCache: HerbCard[] | null = null;
let playersCache: PlayerRecord[] | null = null;

function loadDeck(): HerbCard[] {
  if (deckCache === null) {
    deckCache = readEnvelope<HerbCard[]>(DECK_KEY, SCHEMA_VERSION, []);
  }
  return deckCache;
}

function persistDeck(): void {
  if (deckCache !== null) {
    writeEnvelope(DECK_KEY, SCHEMA_VERSION, deckCache);
  }
}

function loadPlayers(): PlayerRecord[] {
  if (playersCache === null) {
    playersCache = readEnvelope<PlayerRecord[]>(PLAYERS_KEY, SCHEMA_VERSION, []);
  }
  return playersCache;
}

function persistPlayers(): void {
  if (playersCache !== null) {
    writeEnvelope(PLAYERS_KEY, SCHEMA_VERSION, playersCache);
  }
}

function samePlayerName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function listCards(): HerbCard[] {
  return [...loadDeck()];
}

export function createCard(input: {
  name: string;
  imageDataUrl: string;
  sourceLabel: string;
}): HerbCard {
  const now = new Date().toISOString();
  const card: HerbCard = {
    id: crypto.randomUUID(),
    name: input.name,
    imageDataUrl: input.imageDataUrl,
    sourceLabel: input.sourceLabel,
    createdAt: now,
    updatedAt: now,
  };
  loadDeck().push(card);
  persistDeck();
  return card;
}

export function updateCard(
  id: string,
  patch: Partial<Pick<HerbCard, "name" | "imageDataUrl" | "sourceLabel">>,
): HerbCard | null {
  const deck = loadDeck();
  const index = deck.findIndex((card) => card.id === id);
  if (index === -1) {
    return null;
  }
  const updated: HerbCard = {
    ...deck[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  deck[index] = updated;
  persistDeck();
  return updated;
}

export function deleteCard(id: string): boolean {
  const deck = loadDeck();
  const index = deck.findIndex((card) => card.id === id);
  if (index === -1) {
    return false;
  }
  deck.splice(index, 1);
  persistDeck();
  return true;
}

export function getPlayerHistory(name: string): GameResult[] {
  const record = loadPlayers().find((player) => samePlayerName(player.name, name));
  return record ? [...record.history] : [];
}

export function appendGameResult(name: string, result: GameResult): void {
  const players = loadPlayers();
  const record = players.find((player) => samePlayerName(player.name, name));
  if (record) {
    record.history.push(result);
  } else {
    players.push({ name, history: [result] });
  }
  persistPlayers();
}
