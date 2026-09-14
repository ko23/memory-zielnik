import { useEffect, useState } from "react";
import { seedDefaultCards } from "../lib/storage/seed";
import { Menu } from "./Menu";
import { CardManager } from "./CardManager";
import { PlayGame } from "./PlayGame";

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
    return <PlayGame onBackToMenu={() => setScreen("menu")} />;
  }

  return <Menu onCreateCards={() => setScreen("cards")} onPlayGame={() => setScreen("play")} />;
}
