import { useState } from "react";
import { lookupHerbImage } from "../lib/wikipedia";
import { urlToResizedDataUrl } from "../lib/image";
import { createCard } from "../lib/storage";

type FormState =
  | { step: "entry"; name: string; notFound: boolean }
  | { step: "looking-up"; name: string }
  | { step: "approve"; name: string; imageUrl: string; sourceLabel: string };

interface CardFormProps {
  onDone: () => void;
  onCancel: () => void;
}

export function CardForm({ onDone, onCancel }: CardFormProps) {
  const [state, setState] = useState<FormState>({ step: "entry", name: "", notFound: false });

  async function handleSubmit(name: string) {
    setState({ step: "looking-up", name });
    const result = await lookupHerbImage(name);
    if (!result) {
      setState({ step: "entry", name, notFound: true });
      return;
    }
    setState({ step: "approve", name, imageUrl: result.imageUrl, sourceLabel: result.sourceLabel });
  }

  async function handleApprove() {
    if (state.step !== "approve") {
      return;
    }
    const { name, imageUrl, sourceLabel } = state;
    try {
      const imageDataUrl = await urlToResizedDataUrl(imageUrl);
      createCard({ name, imageDataUrl, sourceLabel });
      onDone();
    } catch {
      // Treat an image-fetch/resize failure the same as "no result found" —
      // let the user retry rather than getting stuck on a broken approve step.
      setState({ step: "entry", name, notFound: true });
    }
  }

  function handleReject() {
    if (state.step !== "approve") {
      return;
    }
    setState({ step: "entry", name: state.name, notFound: false });
  }

  if (state.step === "looking-up") {
    return <p>Looking up “{state.name}”…</p>;
  }

  if (state.step === "approve") {
    return (
      <div>
        <img src={state.imageUrl} alt={state.name} width={200} />
        <p>{state.name}</p>
        <p>{state.sourceLabel}</p>
        <button type="button" onClick={handleApprove}>
          Approve
        </button>
        <button type="button" onClick={handleReject}>
          Reject
        </button>
      </div>
    );
  }

  return (
    <div>
      {state.notFound ? <p>No image found for “{state.name}”. Try a different name.</p> : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = state.name.trim();
          if (trimmed.length > 0) {
            handleSubmit(trimmed);
          }
        }}
      >
        <input
          value={state.name}
          onChange={(event) => setState({ step: "entry", name: event.target.value, notFound: false })}
          placeholder="Herb name"
          required
        />
        <button type="submit">Look up image</button>
      </form>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
