import { useState } from "react";
import { appendGameResult, getPlayerHistory, type GameResult } from "../lib/storage";
import { getWinner, type GameState } from "../lib/game";

interface GameEndScreenProps {
  finalState: GameState;
  onBackToMenu: () => void;
}

function bestScore(history: GameResult[]): number {
  return history.reduce((best, result) => Math.max(best, result.pairsCollected), 0);
}

export function GameEndScreen({ finalState, onBackToMenu }: GameEndScreenProps) {
  const winner = getWinner(finalState);

  const [history] = useState<[GameResult[], GameResult[]]>(() => {
    const playedAt = new Date().toISOString();
    ([0, 1] as const).forEach((i) => {
      appendGameResult(finalState.players[i], {
        playedAt,
        pairsCollected: finalState.scores[i],
        tileCount: finalState.tiles.length,
        outcome: winner === "tie" ? "tie" : winner === i ? "win" : "loss",
      });
    });
    return [getPlayerHistory(finalState.players[0]), getPlayerHistory(finalState.players[1])];
  });

  return (
    <div>
      <h2>{winner === "tie" ? "It's a tie!" : `${finalState.players[winner as 0 | 1]} wins!`}</h2>
      {([0, 1] as const).map((i) => (
        <p key={i}>
          {finalState.players[i]}: {finalState.scores[i]} pairs — played {history[i].length} time
          {history[i].length === 1 ? "" : "s"}, best score {bestScore(history[i])} pairs
        </p>
      ))}
      <button type="button" onClick={onBackToMenu}>
        Back to menu
      </button>
    </div>
  );
}
