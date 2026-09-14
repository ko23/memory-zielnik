import { useEffect, useState } from "react";
import { listCards, type HerbCard } from "../lib/storage";
import { CardForm } from "./CardForm";

interface CardManagerProps {
  onBack: () => void;
}

export function CardManager({ onBack }: CardManagerProps) {
  const [cards, setCards] = useState<HerbCard[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    refreshCards();
  }, []);

  function refreshCards() {
    setCards(listCards());
  }

  if (adding) {
    return (
      <CardForm
        onDone={() => {
          setAdding(false);
          refreshCards();
        }}
        onCancel={() => setAdding(false)}
      />
    );
  }

  return (
    <div>
      <button type="button" onClick={onBack}>
        Back to menu
      </button>
      <h2>Herb Cards</h2>
      <button type="button" onClick={() => setAdding(true)}>
        Add card
      </button>
      <ul>
        {cards.map((card) => (
          <li key={card.id}>
            <img src={card.imageDataUrl} alt={card.name} width={80} />
            <span>{card.name}</span>
            {card.sourceLabel ? <span> — {card.sourceLabel}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
