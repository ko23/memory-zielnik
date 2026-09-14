import { useEffect, useState } from "react";
import { seedDefaultCards } from "../lib/storage/seed";
import { Menu } from "./Menu";
import { CardManager } from "./CardManager";
import { GameSetup, type GameSetupResult } from "./GameSetup";
import { GameBoard } from "./GameBoard";
import type { GameState } from "../lib/game";

type Screen = "menu" | "cards" | "play";

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [setupResult, setSetupResult] = useState<GameSetupResult | null>(null);

  useEffect(() => {
    seedDefaultCards();
  }, []);

  if (screen === "cards") {
    return <CardManager onBack={() => setScreen("menu")} />;
  }

  if (screen === "play") {
    // Temporary stub for Phase 2/3 manual verification — Phase 4 replaces
    // this with PlayGame.tsx's full setup -> board -> end flow.
    if (!setupResult) {
      return <GameSetup onStart={(result: GameSetupResult) => setSetupResult(result)} />;
    }
    return (
      <GameBoard
        players={setupResult.players}
        pairCount={setupResult.pairCount}
        startingPlayer={setupResult.startingPlayer}
        onFinished={(finalState: GameState) => {
          console.log("Game finished:", finalState);
          setSetupResult(null);
          setScreen("menu");
        }}
      />
    );
  }

  return <Menu onCreateCards={() => setScreen("cards")} onPlayGame={() => setScreen("play")} />;
}
