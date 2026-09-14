import { describe, expect, it } from "vitest";
import {
  createGameState,
  flipCoin,
  getGridDimensions,
  getWinner,
  pickRandomSubset,
  resolveMismatch,
  resolvePlayerNames,
  selectTile,
  type GameState,
} from "./game";

describe("resolvePlayerNames", () => {
  it("suffixes identical names to distinguish the two players", () => {
    expect(resolvePlayerNames("Alex", "Alex")).toEqual(["Alex (1)", "Alex (2)"]);
  });

  it("suffixes names that only differ by case or surrounding whitespace", () => {
    expect(resolvePlayerNames("  Alex ", "alex")).toEqual(["Alex (1)", "alex (2)"]);
  });

  it("passes distinct names through trimmed and unsuffixed", () => {
    expect(resolvePlayerNames(" Alex ", " Sam ")).toEqual(["Alex", "Sam"]);
  });
});

describe("pickRandomSubset / createGameState invariants", () => {
  it("pickRandomSubset returns exactly count items, all drawn from the input", () => {
    const items = ["a", "b", "c", "d", "e"];
    const subset = pickRandomSubset(items, 3);
    expect(subset).toHaveLength(3);
    subset.forEach((item) => expect(items).toContain(item));
  });

  it("createGameState produces exactly 2x tiles, each card appearing exactly twice", () => {
    const cardIds = ["c1", "c2", "c3"];
    const state = createGameState(cardIds, ["Alex", "Sam"], 0);
    expect(state.tiles).toHaveLength(6);
    for (const cardId of cardIds) {
      expect(state.tiles.filter((tile) => tile.cardId === cardId)).toHaveLength(2);
    }
    expect(state.selected).toEqual([]);
    expect(state.scores).toEqual([0, 0]);
    expect(state.phase).toBe("selecting");
  });
});

// Helpers below are shuffle-order-independent: they locate tiles by cardId
// rather than by position, since createGameState shuffles tile order.

function unmatchedIndicesForCard(state: GameState, cardId: string): number[] {
  return state.tiles
    .map((tile, index) => ({ tile, index }))
    .filter(({ tile }) => tile.cardId === cardId && !tile.matched)
    .map(({ index }) => index);
}

function matchCard(state: GameState, cardId: string): GameState {
  const [i, j] = unmatchedIndicesForCard(state, cardId);
  return selectTile(selectTile(state, i), j);
}

function triggerMismatch(state: GameState, cardIdA: string, cardIdB: string): GameState {
  const [i] = unmatchedIndicesForCard(state, cardIdA);
  const [j] = unmatchedIndicesForCard(state, cardIdB);
  return selectTile(selectTile(state, i), j);
}

describe("selectTile — match path", () => {
  it("credits the current player, keeps their turn, and clears selection", () => {
    const state = createGameState(["c1", "c2", "c3"], ["Alex", "Sam"], 0);
    const afterMatch = matchCard(state, "c1");

    expect(afterMatch.scores).toEqual([1, 0]);
    expect(afterMatch.currentPlayer).toBe(0);
    expect(afterMatch.selected).toEqual([]);
    expect(afterMatch.tiles.filter((t) => t.cardId === "c1").every((t) => t.matched)).toBe(true);
  });
});

describe("selectTile — mismatch path", () => {
  it("enters revealing-mismatch, keeps tiles selected, does not switch player yet", () => {
    const state = createGameState(["c1", "c2", "c3"], ["Alex", "Sam"], 0);
    const mismatchState = triggerMismatch(state, "c1", "c2");

    expect(mismatchState.phase).toBe("revealing-mismatch");
    expect(mismatchState.selected).toHaveLength(2);
    expect(mismatchState.currentPlayer).toBe(0);
    expect(mismatchState.scores).toEqual([0, 0]);
  });

  it("selectTile is a no-op while phase is revealing-mismatch (input lock)", () => {
    const state = createGameState(["c1", "c2", "c3"], ["Alex", "Sam"], 0);
    const mismatchState = triggerMismatch(state, "c1", "c2");
    const [thirdIndex] = unmatchedIndicesForCard(mismatchState, "c3");

    const afterThirdClick = selectTile(mismatchState, thirdIndex);

    expect(afterThirdClick).toBe(mismatchState);
  });
});

describe("resolveMismatch", () => {
  it("clears selection, switches player, and returns to selecting", () => {
    const state = createGameState(["c1", "c2", "c3"], ["Alex", "Sam"], 0);
    const mismatchState = triggerMismatch(state, "c1", "c2");

    const resolved = resolveMismatch(mismatchState);

    expect(resolved.selected).toEqual([]);
    expect(resolved.currentPlayer).toBe(1);
    expect(resolved.phase).toBe("selecting");
  });
});

describe("getWinner", () => {
  it("returns null while the game is not finished", () => {
    const state = createGameState(["c1", "c2"], ["Alex", "Sam"], 0);
    expect(getWinner(state)).toBeNull();
  });

  it("declares the higher-scoring player the winner once finished", () => {
    let state = createGameState(["c1", "c2"], ["Alex", "Sam"], 0);
    state = matchCard(state, "c1");
    state = matchCard(state, "c2");

    expect(state.phase).toBe("finished");
    expect(getWinner(state)).toBe(0);
  });

  it("declares a tie when both players end with equal scores", () => {
    let state = createGameState(["c1", "c2", "c3", "c4"], ["Alex", "Sam"], 0);
    state = matchCard(state, "c1"); // player 0: 1-0, keeps turn
    state = matchCard(state, "c2"); // player 0: 2-0, keeps turn
    state = resolveMismatch(triggerMismatch(state, "c3", "c4")); // passes turn to player 1
    state = matchCard(state, "c3"); // player 1: 2-1, keeps turn
    state = matchCard(state, "c4"); // player 1: 2-2, keeps turn

    expect(state.phase).toBe("finished");
    expect(state.scores).toEqual([2, 2]);
    expect(getWinner(state)).toBe("tie");
  });
});

describe("flipCoin", () => {
  it("returns only 0 or 1, with both values occurring across many runs", () => {
    const results = new Set(Array.from({ length: 100 }, () => flipCoin()));
    expect([...results].every((value) => value === 0 || value === 1)).toBe(true);
    expect(results.size).toBe(2);
  });
});

describe("getGridDimensions", () => {
  it("uses 4 rows and a clean column count when tile count isn't divisible by 3 (10 pairs -> 20 tiles)", () => {
    expect(getGridDimensions(20)).toEqual({ rows: 4, columns: 5 });
  });

  it("uses 3 rows and a clean column count when tile count is divisible by 3 (12 pairs -> 24 tiles)", () => {
    expect(getGridDimensions(24)).toEqual({ rows: 3, columns: 8 });
  });

  it("uses 4 rows with a ragged last row when tile count isn't divisible by 3 (17 pairs -> 34 tiles)", () => {
    const { rows, columns } = getGridDimensions(34);
    expect(rows).toBe(4);
    expect(columns).toBe(9);
    expect(rows * columns).toBeGreaterThan(34); // confirms the last row is ragged, not exact
  });

  it("uses 3 rows and a clean column count at the widest case (24 pairs -> 48 tiles)", () => {
    expect(getGridDimensions(48)).toEqual({ rows: 3, columns: 16 });
  });
});
