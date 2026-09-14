import { useEffect, useState } from "react";
import { listCards } from "../lib/storage";
import {
  createGameState,
  pickRandomSubset,
  resolveMismatch,
  selectTile,
  type GameState,
} from "../lib/game";

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

  return (
    <div>
      <p>
        {players[0]}: {state.scores[0]} pairs {state.currentPlayer === 0 ? "— current turn" : ""}
      </p>
      <p>
        {players[1]}: {state.scores[1]} pairs {state.currentPlayer === 1 ? "— current turn" : ""}
      </p>
      <div>
        {state.tiles.map((tile, index) => {
          const faceUp = tile.matched || state.selected.includes(index);
          const card = cardsById.get(tile.cardId);
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleTileClick(index)}
              disabled={tile.matched || state.phase !== "selecting" || state.selected.includes(index)}
            >
              {faceUp && card ? (
                <span>
                  <img src={card.imageDataUrl} alt={card.name} width={60} />
                  <br />
                  {card.name}
                </span>
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
