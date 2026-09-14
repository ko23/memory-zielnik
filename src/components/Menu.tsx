import { useState } from "react";
import { listCards } from "../lib/storage";

const MIN_CARDS_TO_PLAY = 10;

interface MenuProps {
  onCreateCards: () => void;
  onPlayGame: () => void;
}

export function Menu({ onCreateCards, onPlayGame }: MenuProps) {
  const [exited, setExited] = useState(false);
  const deckSize = listCards().length;
  const canPlay = deckSize >= MIN_CARDS_TO_PLAY;

  if (exited) {
    return (
      <div>
        <p>Thanks for playing! You can close this tab now.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Herbs Masters Duel</h1>
      <nav>
        <button type="button" onClick={onCreateCards}>
          Create Cards
        </button>
        <button
          type="button"
          onClick={onPlayGame}
          disabled={!canPlay}
          title={canPlay ? undefined : `Add at least ${MIN_CARDS_TO_PLAY} cards to play (${deckSize} so far)`}
        >
          Play Game
        </button>
        <button type="button" onClick={() => setExited(true)}>
          Exit
        </button>
      </nav>
    </div>
  );
}
