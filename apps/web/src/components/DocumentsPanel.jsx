import { useState } from "react";
import { fetchJson } from "../lib/api.js";

const letterTypes = [
  { id: "offer", label: "Offer letter" },
  { id: "start-confirmation", label: "Start confirmation" },
  { id: "closure", label: "Closure confirmation" }
];

export default function DocumentsPanel({ candidate, onUpdated }) {
  const [activeLetter, setActiveLetter] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const handleGenerate = async (type) => {
    if (!candidate) {
      return;
    }
    setStatusMessage("");
    try {
      const response = await fetchJson(`/candidates/${candidate._id}/letters/${type}`, {
        method: "POST"
      });
      setActiveLetter(response.letter || null);
      if (response.item) {
        onUpdated?.(response.item);
      }
      setStatusMessage("Letter generated.");
    } catch (error) {
      setStatusMessage("Unable to generate letter.");
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Letters & Documents</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {letterTypes.map((letter) => (
          <button
            key={letter.id}
            type="button"
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
            onClick={() => handleGenerate(letter.id)}
            disabled={!candidate}
          >
            Generate {letter.label}
          </button>
        ))}
      </div>
      {activeLetter?.body ? (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300 whitespace-pre-line">
          {activeLetter.body}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">
          Generate a letter to preview the output and log the communication.
        </p>
      )}
      {statusMessage ? <p className="mt-2 text-xs text-slate-400">{statusMessage}</p> : null}
    </div>
  );
}
