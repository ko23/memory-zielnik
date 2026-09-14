import { useEffect, useState } from "react";
import { seedDefaultCards } from "../lib/storage/seed";
import { Menu } from "./Menu";
import { CardManager } from "./CardManager";
import { GameSetup, type GameSetupResult } from "./GameSetup";

type Screen = "menu" | "cards" | "play";

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("menu");

  useEffect(() => {
    seedDefaultCards();
  }, []);

  if (screen === "cards") {
    return <CardManager onBack={() => setScreen("menu")} />;
  }

  if (screen === "play") {
    // Temporary stub for Phase 2 manual verification — Phase 4 replaces
    // this with PlayGame.tsx's full setup -> board -> end flow.
    return (
      <GameSetup
        onStart={(result: GameSetupResult) => {
          console.log("Game setup complete:", result);
          setScreen("menu");
        }}
      />
    );
  }

  return <Menu onCreateCards={() => setScreen("cards")} onPlayGame={() => setScreen("play")} />;
}
