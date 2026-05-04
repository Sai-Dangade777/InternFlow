import { useState } from "react";
import { fetchJson } from "../lib/api.js";

const initialState = {
  name: "",
  email: "",
  phone: "",
  skills: "",
  availability: "",
  unpaidConsent: false,
  inPersonConsent: false,
  hasIdProof: false,
  joiningLocation: "",
  internshipDurationWeeks: "",
  internshipStartDate: "",
  internshipEndDate: "",
  domain: "",
  relationshipDeclaration: "",
  referrerName: "",
  referrerEmail: "",
  referrerDepartment: "",
  resumeText: "",
  education: [],
  resume: null
};

export default function ReferralForm({ apiUrl = import.meta.env.VITE_API_URL }) {
  const [formState, setFormState] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState("");
  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const resolvedApiUrl = apiUrl || "http://localhost:4000";

  const handleChange = (event) => {
    const { name, value, files, type, checked } = event.target;

    setFormState((previous) => ({
      ...previous,
      [name]: files ? files[0] : type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    const payload = new FormData();
    payload.append("name", formState.name.trim());
    payload.append("email", formState.email.trim());
    payload.append("phone", formState.phone.trim());
    payload.append("skills", formState.skills.trim());
    payload.append("availability", formState.availability.trim());
    payload.append("unpaidConsent", String(formState.unpaidConsent));
    payload.append("inPersonConsent", String(formState.inPersonConsent));
    payload.append("joiningLocation", formState.joiningLocation.trim());
    payload.append("internshipDurationWeeks", formState.internshipDurationWeeks.trim());
    payload.append("internshipStartDate", formState.internshipStartDate);
    payload.append("internshipEndDate", formState.internshipEndDate);
    payload.append("domain", formState.domain.trim());
    payload.append("hasIdProof", String(formState.hasIdProof));
    payload.append("relationshipDeclaration", formState.relationshipDeclaration.trim());
    payload.append("referrerName", formState.referrerName.trim());
    payload.append("referrerEmail", formState.referrerEmail.trim());
    payload.append("referrerDepartment", formState.referrerDepartment.trim());
    payload.append("resumeText", formState.resumeText.trim());
    payload.append("education", JSON.stringify(formState.education || []));

    if (formState.resume) {
      payload.append("resume", formState.resume);
    }

    try {
      const response = await fetch(`${resolvedApiUrl}/referrals`, {
        method: "POST",
        body: payload
      });

      if (!response.ok) {
        throw new Error("Unable to submit referral");
      }

      setStatusMessage("Referral submitted successfully.");
      setFormState(initialState);
    } catch (error) {
      setStatusMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParseResume = async () => {
    if (!formState.resumeText.trim()) {
      setParseMessage("Paste resume text before running AI parsing.");
      return;
    }
    setIsParsing(true);
    setParseMessage("");
    try {
      const response = await fetchJson("/ai/parse-resume", {
        method: "POST",
        body: JSON.stringify({ resumeText: formState.resumeText })
      });
      const parsed = response.data || {};
      setFormState((previous) => ({
        ...previous,
        name: previous.name || parsed.name || previous.name,
        email: previous.email || parsed.email || previous.email,
        phone: previous.phone || parsed.phone || previous.phone,
        skills: previous.skills || (parsed.skills ? parsed.skills.join(", ") : previous.skills),
        education: parsed.education || previous.education
      }));
      setParseMessage("AI resume parsing applied.");
    } catch (error) {
      setParseMessage("Unable to parse resume. Try again or submit manually.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const response = await fetchJson("/ai/validate-referral", {
        method: "POST",
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          joiningLocation: formState.joiningLocation,
          internshipDurationWeeks: formState.internshipDurationWeeks,
          internshipStartDate: formState.internshipStartDate,
          internshipEndDate: formState.internshipEndDate,
          domain: formState.domain,
          hasIdProof: String(formState.hasIdProof),
          relationshipDeclaration: formState.relationshipDeclaration,
          referrerName: formState.referrerName,
          unpaidConsent: String(formState.unpaidConsent),
          inPersonConsent: String(formState.inPersonConsent)
        })
      });
      setValidation(response.data || null);
    } catch (error) {
      setValidation({
        duplicateRisk: "medium",
        missingFields: [],
        summary: "Validation service unavailable."
      });
    } finally {
      setIsValidating(false);
    }
  }; 

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <h2 className="text-lg font-semibold">Referral Form</h2>
      <p className="mt-1 text-sm text-slate-400">
        Upload a resume and capture candidate details.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="name">
            Candidate name
          </label>
          <input
            id="name"
            name="name"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Jane Doe"
            type="text"
            value={formState.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="jane@example.com"
            type="email"
            value={formState.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="+91 90000 00000"
            type="tel"
            value={formState.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="skills">
            Skills
          </label>
          <input
            id="skills"
            name="skills"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="React, Node.js, MongoDB"
            type="text"
            value={formState.skills}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="resumeText">
            Resume text (for AI prefill)
          </label>
          <textarea
            id="resumeText"
            name="resumeText"
            className="min-h-[96px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Paste resume highlights or plain text for AI parsing"
            value={formState.resumeText}
            onChange={handleChange}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200"
              onClick={handleParseResume}
              disabled={isParsing}
            >
              {isParsing ? "Parsing resume..." : "Run AI resume parse"}
            </button>
            {parseMessage ? (
              <span className="text-xs text-slate-400">{parseMessage}</span>
            ) : null}
          </div>
          {formState.education?.length ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Education parsed</p>
              <ul className="mt-2 space-y-1">
                {formState.education.map((entry, index) => (
                  <li key={`${entry.institution || "edu"}-${index}`}>
                    {entry.degree || "Degree"} — {entry.institution || "Institution"} (
                    {entry.year || "Year"})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="availability">
            Availability
          </label>
          <input
            id="availability"
            name="availability"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="June 2026, 12 weeks"
            type="text"
            value={formState.availability}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Eligibility</p>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="unpaidConsent"
              checked={formState.unpaidConsent}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950"
              required
            />
            I confirm this is an unpaid internship.
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="inPersonConsent"
              checked={formState.inPersonConsent}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950"
              required
            />
            Candidate is available for in-person requirements.
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="hasIdProof"
              checked={formState.hasIdProof}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950"
              required
            />
            I have uploaded a PDF resume and Aadhaar card (ID proof).
          </label>
        </div> 
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="joiningLocation">
            Joining location
          </label>
          <input
            id="joiningLocation"
            name="joiningLocation"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Bengaluru"
            type="text"
            value={formState.joiningLocation}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="internshipDurationWeeks">
              Duration (weeks)
            </label>
            <input
              id="internshipDurationWeeks"
              name="internshipDurationWeeks"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="12"
              type="number"
              value={formState.internshipDurationWeeks}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="internshipStartDate">
              Start date
            </label>
            <input
              id="internshipStartDate"
              name="internshipStartDate"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              type="date"
              value={formState.internshipStartDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="internshipEndDate">
              End date
            </label>
            <input
              id="internshipEndDate"
              name="internshipEndDate"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              type="date"
              value={formState.internshipEndDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="domain">
            Domain of internship
          </label>
          <select
            id="domain"
            name="domain"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={formState.domain}
            onChange={handleChange}
            required
          >
            <option value="">Select domain</option>
            <option value="Java Full Stack">Java Full Stack</option>
            <option value="Cloud">Cloud</option>
            <option value="Data Science">Data Science</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Operations (Non-IT)">Operations (Non-IT)</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="relationshipDeclaration">
            Relationship declaration
          </label>
          <textarea
            id="relationshipDeclaration"
            name="relationshipDeclaration"
            className="min-h-[72px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Declare any relationship with the candidate"
            value={formState.relationshipDeclaration}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="grid gap-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Referrer</p>
            <input
              id="referrerName"
              name="referrerName"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Referrer name"
              type="text"
              value={formState.referrerName}
              onChange={handleChange}
              required
            />
            <input
              id="referrerEmail"
              name="referrerEmail"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="referrer@company.com"
              type="email"
              value={formState.referrerEmail}
              onChange={handleChange}
              required
            />
            <input
              id="referrerDepartment"
              name="referrerDepartment"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Department"
              type="text"
              value={formState.referrerDepartment}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="resume">
            Resume
          </label>
          <input
            id="resume"
            name="resume"
            className="rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-3 text-sm"
            type="file"
            onChange={handleChange}
            accept=".pdf,.doc,.docx"
          />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500">AI Validation</p>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300"
              onClick={handleValidate}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Run validation"}
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-300">
            {validation ? (
              <>
                <p>
                  Duplicate risk:{" "}
                  <span className="font-semibold text-emerald-200">{validation.duplicateRisk}</span>
                </p>
                {validation.missingFields?.length ? (
                  <p className="mt-1 text-slate-400">
                    Missing fields: {validation.missingFields.join(", ")}
                  </p>
                ) : (
                  <p className="mt-1 text-slate-400">All required fields present.</p>
                )}
                <p className="mt-1 text-slate-500">{validation.summary}</p>
              </>
            ) : (
              <p className="text-slate-400">Run AI validation to detect gaps or duplicates.</p>
            )}
          </div>
        </div>
        <button
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit referral"}
        </button>
        {statusMessage ? (
          <p className="text-sm text-slate-300">{statusMessage}</p>
        ) : null}
      </form>
    </section>
  );
}
