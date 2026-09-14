import { useEffect, useRef, useState } from "react";
import { listCards } from "../lib/storage";
import { flipCoin, resolvePlayerNames } from "../lib/game";

const MIN_PAIRS = 10;
const MAX_PAIRS = 24;
const COIN_FLIP_ANIMATION_MS = 800;

export interface GameSetupResult {
  players: [string, string];
  pairCount: number;
  startingPlayer: 0 | 1;
}

interface GameSetupProps {
  onStart: (result: GameSetupResult) => void;
}

type Step = "names" | "count" | "start";

export function GameSetup({ onStart }: GameSetupProps) {
  const deckSize = listCards().length;
  const maxPairs = Math.min(MAX_PAIRS, deckSize);

  const [step, setStep] = useState<Step>("names");
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [players, setPlayers] = useState<[string, string]>(["", ""]);
  const [pairCount, setPairCount] = useState(Math.min(MIN_PAIRS, maxPairs));
  const [flipping, setFlipping] = useState(false);
  const [flipDisplayIndex, setFlipDisplayIndex] = useState<0 | 1>(0);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      if (flipIntervalRef.current) clearInterval(flipIntervalRef.current);
    };
  }, []);

  function handleNamesSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name1.trim() || !name2.trim()) return;
    setPlayers(resolvePlayerNames(name1, name2));
    setStep("count");
  }

  function handleCountSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStep("start");
  }

  function handleChooseStarter(startingPlayer: 0 | 1) {
    onStart({ players, pairCount, startingPlayer });
  }

  function handleFlipCoin() {
    if (flipping) return;
    setFlipping(true);
    flipIntervalRef.current = setInterval(() => {
      setFlipDisplayIndex((current) => (current === 0 ? 1 : 0));
    }, 100);
    flipTimeoutRef.current = setTimeout(() => {
      if (flipIntervalRef.current) clearInterval(flipIntervalRef.current);
      const result = flipCoin();
      setFlipDisplayIndex(result);
      setFlipping(false);
      onStart({ players, pairCount, startingPlayer: result });
    }, COIN_FLIP_ANIMATION_MS);
  }

  if (step === "names") {
    return (
      <form onSubmit={handleNamesSubmit}>
        <h2>Who's playing?</h2>
        <div>
          <label>
            Player 1 name:{" "}
            <input value={name1} onChange={(e) => setName1(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>
            Player 2 name:{" "}
            <input value={name2} onChange={(e) => setName2(e.target.value)} required />
          </label>
        </div>
        <button type="submit">Next</button>
      </form>
    );
  }

  if (step === "count") {
    return (
      <form onSubmit={handleCountSubmit}>
        <h2>How many pairs?</h2>
        <label>
          Tile pairs:{" "}
          <input
            type="number"
            min={MIN_PAIRS}
            max={maxPairs}
            value={pairCount}
            onChange={(e) => setPairCount(Number(e.target.value))}
          />
        </label>
        <p>
          (between {MIN_PAIRS} and {maxPairs}, based on your deck of {deckSize} cards)
        </p>
        <button type="submit">Next</button>
      </form>
    );
  }

  return (
    <div>
      <h2>Who goes first?</h2>
      <button type="button" onClick={() => handleChooseStarter(0)} disabled={flipping}>
        {players[0]}
      </button>
      <button type="button" onClick={() => handleChooseStarter(1)} disabled={flipping}>
        {players[1]}
      </button>
      <div>
        <button type="button" onClick={handleFlipCoin} disabled={flipping}>
          {flipping ? `Flipping... ${players[flipDisplayIndex]}` : "Flip a coin instead"}
        </button>
      </div>
    </div>
  );
}
