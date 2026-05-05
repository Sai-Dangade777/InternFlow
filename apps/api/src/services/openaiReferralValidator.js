import OpenAI from "openai";

const REFERRAL_VALIDATE_PROMPT = `You are a referral QA assistant. Review the payload and return strict JSON with:
- duplicateRisk: "low" | "medium" | "high"
- missingFields: array of strings
- summary: string (max 20 words)
Base your response on provided required fields and possible duplicate matches.`;

const requiredFields = [
  "name",
  "email",
  "phone",
  "joiningLocation",
  "internshipDurationWeeks",
  "internshipStartDate",
  "internshipEndDate",
  "domain",
  "relationshipDeclaration",
  "referrerName",
  "hasIdProof",
  "unpaidConsent",
  "inPersonConsent"
];

const buildBaseValidation = ({ payload, duplicateMatches }) => {
  const missingFields = requiredFields.filter((field) => {
    const value = payload?.[field];
    if (
      field === "unpaidConsent" ||
      field === "inPersonConsent" ||
      field === "hasIdProof"
    ) {
      return String(value) !== "true";
    }
    return value === undefined || value === null || String(value).trim() === "";
  });

  const duplicateRisk = duplicateMatches?.length ? "high" : missingFields.length ? "medium" : "low";
  const summary =
    duplicateRisk === "high"
      ? "Potential duplicate detected."
      : missingFields.length
      ? "Missing required fields."
      : "Referral payload looks complete.";

  return { duplicateRisk, missingFields, summary };
};

export const validateReferralWithAI = async ({
  payload,
  duplicateMatches = [],
  apiKey
}) => {
  const baseValidation = buildBaseValidation({ payload, duplicateMatches });
  const isMock =
    process.env.AI_MODE === "mock" ||
    process.env.DEMO_MODE === "true" ||
    !(apiKey || process.env.CLAUDE_API_KEY);

  if (isMock) {
    return { prompt: REFERRAL_VALIDATE_PROMPT, data: baseValidation };
  }

  const client = new OpenAI({ apiKey: apiKey || process.env.CLAUDE_API_KEY });

  if (!client.apiKey) {
    return { prompt: REFERRAL_VALIDATE_PROMPT, data: baseValidation };
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: REFERRAL_VALIDATE_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            payload,
            requiredFields,
            duplicateMatches
          })
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_output_tokens: 120
    });

    const outputText = response.output_text;
    const parsed = outputText ? JSON.parse(outputText) : null;

    return {
      prompt: REFERRAL_VALIDATE_PROMPT,
      data: parsed || baseValidation
    };
  } catch (error) {
    return { prompt: REFERRAL_VALIDATE_PROMPT, data: baseValidation };
  }
};

export { REFERRAL_VALIDATE_PROMPT };
