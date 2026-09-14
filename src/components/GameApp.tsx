import { useEffect, useState } from "react";
import { seedDefaultCards } from "../lib/storage/seed";
import { Menu } from "./Menu";
import { CardManager } from "./CardManager";

type Screen = "menu" | "cards";

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("menu");

  useEffect(() => {
    seedDefaultCards();
  }, []);

  if (screen === "cards") {
    return <CardManager onBack={() => setScreen("menu")} />;
  }

  return <Menu onCreateCards={() => setScreen("cards")} />;
}
