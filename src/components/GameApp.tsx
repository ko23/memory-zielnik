import { useState } from "react";
import { seedDefaultCards } from "../lib/storage/seed";
import { Menu } from "./Menu";
import { CardManager } from "./CardManager";
import { PlayGame } from "./PlayGame";

type Screen = "menu" | "cards" | "play";

// Runs once, at module evaluation — before any component's first render.
// Must NOT live in a useEffect: effects fire bottom-up (children before
// parents), so a useEffect here would run AFTER Menu's own first render,
// leaving Menu's listCards()-based deck-size check permanently reading a
// pre-seed empty deck on a fresh browser (nothing re-renders Menu afterward).
seedDefaultCards();

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("menu");

  if (screen === "cards") {
    return <CardManager onBack={() => setScreen("menu")} />;
  }

  if (screen === "play") {
    return <PlayGame onBackToMenu={() => setScreen("menu")} />;
  }

  return <Menu onCreateCards={() => setScreen("cards")} onPlayGame={() => setScreen("play")} />;
}
