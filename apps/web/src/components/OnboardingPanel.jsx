import { useEffect, useState } from "react";
import { fetchJson } from "../lib/api.js";

export default function OnboardingPanel({ candidate, onUpdated }) {
  const [formState, setFormState] = useState({
    phone: candidate?.joiningForm?.phone || "",
    address: candidate?.joiningForm?.address || "",
    emergencyContact: candidate?.joiningForm?.emergencyContact || "",
    aadhaarNumber: candidate?.joiningForm?.aadhaarNumber || "",
    panCardNumber: candidate?.joiningForm?.panCardNumber || "",
    nonWorkerId: candidate?.joiningForm?.nonWorkerId || "",
    governmentId: candidate?.joiningForm?.governmentId || "",
    declarationAccepted: candidate?.joiningForm?.declarationAccepted || false
  });
  const [statusMessage, setStatusMessage] = useState("");
  const isLocked = Boolean(candidate?.joiningForm?.lockedAt);

  useEffect(() => {
    setFormState({
      phone: candidate?.joiningForm?.phone || "",
      address: candidate?.joiningForm?.address || "",
      emergencyContact: candidate?.joiningForm?.emergencyContact || "",
      aadhaarNumber: candidate?.joiningForm?.aadhaarNumber || "",
      panCardNumber: candidate?.joiningForm?.panCardNumber || "",
      nonWorkerId: candidate?.joiningForm?.nonWorkerId || "",
      governmentId: candidate?.joiningForm?.governmentId || "",
      declarationAccepted: candidate?.joiningForm?.declarationAccepted || false
    });
  }, [candidate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (status, recipient) => {
    if (!candidate) {
      return;
    }

    setStatusMessage("");
    try {
      const response = await fetchJson(`/candidates/${candidate._id}/joining-form`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          submittedTo: recipient || undefined,
          ...formState
        })
      });
      onUpdated?.(response.item);
      setStatusMessage(status === "submitted" ? "Joining form submitted." : "Draft saved.");
    } catch (error) {
      setStatusMessage("Unable to save joining form.");
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500">Joining Form</p>
        <span className="text-xs text-slate-400">{candidate?.name || "Select a candidate"}</span>
      </div>
      <div className="mt-4 grid gap-3">
        <input
          name="phone"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Phone"
          value={formState.phone}
          onChange={handleChange}
          disabled={isLocked}
        />
        <input
          name="address"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Address"
          value={formState.address}
          onChange={handleChange}
          disabled={isLocked}
        />
        <input
          name="emergencyContact"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Emergency contact"
          value={formState.emergencyContact}
          onChange={handleChange}
          disabled={isLocked}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="aadhaarNumber"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Aadhaar number"
            value={formState.aadhaarNumber}
            onChange={handleChange}
            disabled={isLocked}
          />
          <input
            name="panCardNumber"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="PAN card number"
            value={formState.panCardNumber}
            onChange={handleChange}
            disabled={isLocked}
          />
          <input
            name="nonWorkerId"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Non-Worker ID"
            value={formState.nonWorkerId}
            onChange={handleChange}
            readOnly
          />
          <input
            name="governmentId"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Government ID"
            value={formState.governmentId}
            onChange={handleChange}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="declarationAccepted"
            checked={formState.declarationAccepted}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-700 bg-slate-950"
            disabled={isLocked}
          />
          Declaration accepted by candidate.
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300"
          onClick={() => handleSubmit("draft")}
          disabled={!candidate || isLocked}
        >
          Save draft
        </button>
        <button
          type="button"
          className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200"
          onClick={() => handleSubmit("submitted", "admin")}
          disabled={!candidate || isLocked}
        >
          Submit to Admin
        </button>
      </div>
      {isLocked ? (
        <p className="mt-3 text-xs text-amber-300">
          Form locked after submission. Non-Worker ID is generated automatically.
        </p>
      ) : null}
      {statusMessage ? <p className="mt-3 text-xs text-slate-400">{statusMessage}</p> : null}
    </div>
  );
}
