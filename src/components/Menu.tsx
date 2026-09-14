import { useState } from "react";

interface MenuProps {
  onCreateCards: () => void;
}

export function Menu({ onCreateCards }: MenuProps) {
  const [exited, setExited] = useState(false);

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
        <button type="button" disabled title="Coming soon">
          Play Game
        </button>
        <button type="button" onClick={() => setExited(true)}>
          Exit
        </button>
      </nav>
    </div>
  );
}
