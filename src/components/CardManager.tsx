import { useEffect, useState } from "react";
import { listCards, deleteCard, type HerbCard } from "../lib/storage";
import { CardForm } from "./CardForm";

interface CardManagerProps {
  onBack: () => void;
}

export function CardManager({ onBack }: CardManagerProps) {
  const [cards, setCards] = useState<HerbCard[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingCard, setEditingCard] = useState<HerbCard | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    refreshCards();
  }, []);

  function refreshCards() {
    setCards(listCards());
  }

  function handleFormDone() {
    setAdding(false);
    setEditingCard(null);
    refreshCards();
  }

  function handleFormCancel() {
    setAdding(false);
    setEditingCard(null);
  }

  function handleDelete(id: string) {
    deleteCard(id);
    setConfirmingDeleteId(null);
    refreshCards();
  }

  if (adding || editingCard) {
    return (
      <CardForm
        key={editingCard?.id ?? "new"}
        existingCard={editingCard ?? undefined}
        onDone={handleFormDone}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div>
      <button type="button" onClick={onBack}>
        Back to menu
      </button>
      <h2>Herb Cards</h2>
      <p>Deck cards: {cards.length}</p>
      <button type="button" onClick={() => setAdding(true)}>
        Add card
      </button>
      <ul>
        {cards.map((card) => (
          <li key={card.id}>
            <img src={card.imageDataUrl} alt={card.name} width={80} />
            <span>{card.name}</span>
            {confirmingDeleteId === card.id ? (
              <span>
                {" "}
                Delete “{card.name}”?{" "}
                <button type="button" onClick={() => handleDelete(card.id)}>
                  Yes
                </button>
                <button type="button" onClick={() => setConfirmingDeleteId(null)}>
                  No
                </button>
              </span>
            ) : (
              <span>
                {" "}
                <button type="button" onClick={() => setEditingCard(card)}>
                  Edit
                </button>
                <button type="button" onClick={() => setConfirmingDeleteId(card.id)}>
                  Delete
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
