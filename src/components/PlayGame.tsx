import { useState } from "react";
import { GameSetup, type GameSetupResult } from "./GameSetup";
import { GameBoard } from "./GameBoard";
import { GameEndScreen } from "./GameEndScreen";
import type { GameState } from "../lib/game";

interface PlayGameProps {
  onBackToMenu: () => void;
}

type Phase = "setup" | "board" | "end";

export function PlayGame({ onBackToMenu }: PlayGameProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [setupResult, setSetupResult] = useState<GameSetupResult | null>(null);
  const [finalState, setFinalState] = useState<GameState | null>(null);

  if (phase === "board" && setupResult) {
    return (
      <GameBoard
        players={setupResult.players}
        pairCount={setupResult.pairCount}
        startingPlayer={setupResult.startingPlayer}
        onFinished={(state) => {
          setFinalState(state);
          setPhase("end");
        }}
      />
    );
  }

  if (phase === "end" && finalState) {
    return <GameEndScreen finalState={finalState} onBackToMenu={onBackToMenu} />;
  }

  return (
    <GameSetup
      onStart={(result: GameSetupResult) => {
        setSetupResult(result);
        setPhase("board");
      }}
    />
  );
}
