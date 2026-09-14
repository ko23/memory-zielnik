import { useEffect, useState } from "react";
import { listCards } from "../lib/storage";
import {
  createGameState,
  getGridDimensions,
  pickRandomSubset,
  resolveMismatch,
  selectTile,
  type GameState,
} from "../lib/game";
import styles from "./GameBoard.module.css";

const MISMATCH_REVEAL_MS = 1200;

interface GameBoardProps {
  players: [string, string];
  pairCount: number;
  startingPlayer: 0 | 1;
  onFinished: (state: GameState) => void;
}

export function GameBoard({ players, pairCount, startingPlayer, onFinished }: GameBoardProps) {
  const [cardsById] = useState(() => new Map(listCards().map((card) => [card.id, card])));
  const [state, setState] = useState<GameState>(() => {
    const cardIds = pickRandomSubset([...cardsById.keys()], pairCount);
    return createGameState(cardIds, players, startingPlayer);
  });

  useEffect(() => {
    if (state.phase !== "revealing-mismatch") return;
    const timeout = setTimeout(() => {
      setState((current) => resolveMismatch(current));
    }, MISMATCH_REVEAL_MS);
    return () => clearTimeout(timeout);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "finished") {
      onFinished(state);
    }
    // Only re-run when the phase itself transitions to "finished" — not on
    // every onFinished identity change, so this fires exactly once per game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  function handleTileClick(index: number) {
    setState((current) => selectTile(current, index));
  }

  const { columns } = getGridDimensions(state.tiles.length);

  return (
    <div>
      <p>
        {players[0]}: {state.scores[0]} pairs {state.currentPlayer === 0 ? "— current turn" : ""}
      </p>
      <p>
        {players[1]}: {state.scores[1]} pairs {state.currentPlayer === 1 ? "— current turn" : ""}
      </p>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, 150px)` }}>
        {state.tiles.map((tile, index) => {
          const faceUp = tile.matched || state.selected.includes(index);
          const card = cardsById.get(tile.cardId);
          return (
            <button
              key={index}
              type="button"
              className={`${styles.tile}${tile.matched ? ` ${styles.tileMatched}` : ""}`}
              onClick={() => handleTileClick(index)}
              disabled={tile.matched || state.phase !== "selecting" || state.selected.includes(index)}
              data-testid="tile"
              data-card-id={tile.cardId}
            >
              {faceUp && card ? (
                <>
                  <img className={styles.tileImage} src={card.imageDataUrl} alt={card.name} />
                  <span className={styles.tileName}>{card.name}</span>
                </>
              ) : (
                "?"
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
