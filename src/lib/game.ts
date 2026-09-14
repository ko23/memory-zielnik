import { samePlayerName } from "./identity";

export interface Tile {
  cardId: string;
  matched: boolean;
}

export type GamePhase = "selecting" | "revealing-mismatch" | "finished";

export interface GameState {
  tiles: Tile[];
  selected: number[]; // 0, 1, or 2 tile indices currently face-up this turn
  players: [string, string];
  scores: [number, number]; // pairs collected, indexed by player
  currentPlayer: 0 | 1;
  phase: GamePhase;
}

export function resolvePlayerNames(name1: string, name2: string): [string, string] {
  const trimmed1 = name1.trim();
  const trimmed2 = name2.trim();
  if (samePlayerName(trimmed1, trimmed2)) {
    return [`${trimmed1} (1)`, `${trimmed2} (2)`];
  }
  return [trimmed1, trimmed2];
}

export function pickRandomSubset<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function allMatched(tiles: Tile[]): boolean {
  return tiles.every((tile) => tile.matched);
}

export function createGameState(
  cardIds: string[],
  players: [string, string],
  startingPlayer: 0 | 1,
): GameState {
  const tiles = shuffle(
    cardIds.flatMap((cardId) => [
      { cardId, matched: false },
      { cardId, matched: false },
    ]),
  );
  return {
    tiles,
    selected: [],
    players,
    scores: [0, 0],
    currentPlayer: startingPlayer,
    phase: "selecting",
  };
}

export function selectTile(state: GameState, tileIndex: number): GameState {
  if (state.phase !== "selecting") {
    return state;
  }
  const tile = state.tiles[tileIndex];
  if (!tile || tile.matched || state.selected.includes(tileIndex)) {
    return state;
  }

  const selected = [...state.selected, tileIndex];

  if (selected.length < 2) {
    return { ...state, selected };
  }

  const [firstIndex, secondIndex] = selected;
  const isMatch = state.tiles[firstIndex].cardId === state.tiles[secondIndex].cardId;

  if (isMatch) {
    const tiles = state.tiles.map((t, i) =>
      i === firstIndex || i === secondIndex ? { ...t, matched: true } : t,
    );
    const scores: [number, number] = [...state.scores];
    scores[state.currentPlayer] += 1;
    return {
      ...state,
      tiles,
      selected: [],
      scores,
      phase: allMatched(tiles) ? "finished" : "selecting",
    };
  }

  return { ...state, selected, phase: "revealing-mismatch" };
}

export function resolveMismatch(state: GameState): GameState {
  if (state.phase !== "revealing-mismatch") {
    return state;
  }
  return {
    ...state,
    selected: [],
    currentPlayer: state.currentPlayer === 0 ? 1 : 0,
    phase: allMatched(state.tiles) ? "finished" : "selecting",
  };
}

export function getWinner(state: GameState): 0 | 1 | "tie" | null {
  if (state.phase !== "finished") {
    return null;
  }
  if (state.scores[0] === state.scores[1]) {
    return "tie";
  }
  return state.scores[0] > state.scores[1] ? 0 : 1;
}

export function flipCoin(): 0 | 1 {
  return Math.random() < 0.5 ? 0 : 1;
}

export interface GridDimensions {
  rows: number;
  columns: number;
}

export function getGridDimensions(tileCount: number): GridDimensions {
  const rows = tileCount % 3 === 0 ? 3 : 4;
  const columns = Math.ceil(tileCount / rows);
  return { rows, columns };
}
