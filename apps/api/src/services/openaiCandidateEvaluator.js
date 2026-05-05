import OpenAI from "openai";

const CANDIDATE_EVAL_PROMPT = `You are an internship candidate evaluator. Use the input fields to score readiness.
Return strict JSON only with:
- score: number (0-100)
- explanation: string (max 25 words)
- candidateReadiness: string (one short sentence)
- riskInsights: array of strings
- nextSteps: array of strings
Keep it concise and cost-effective.`;

const buildMockInsight = ({ skills = [], availability = "", domain = "", status = "" }) => {
  const baseScore = 65 + Math.min(skills.length * 5, 25);
  const readiness = status === "Active" ? "Already active in the workflow." : "Ready for the next workflow step.";
  return {
    score: Math.min(95, baseScore),
    explanation: "Strong fundamentals with clear internship availability.",
    candidateReadiness: readiness,
    riskInsights: [
      domain ? `${domain} track selected.` : "Domain selection needs review.",
      availability ? `Availability noted: ${availability}.` : "Availability should be confirmed."
    ].filter(Boolean),
    nextSteps: ["Advance the candidate to NDA and confirm document readiness."]
  };
};

export const evaluateCandidateWithOpenAI = async ({
  skills = [],
  education = [],
  availability = "",
  domain = "",
  status = "",
  readinessExplanation = "",
  apiKey
}) => {
  const isMock =
    process.env.AI_MODE === "mock" ||
    process.env.DEMO_MODE === "true" ||
    !(apiKey || process.env.CLAUDE_API_KEY);

  if (isMock) {
    return {
      prompt: CANDIDATE_EVAL_PROMPT,
      data: buildMockInsight({ skills, availability, domain, status })
    };
  }

  const client = new OpenAI({ apiKey: apiKey || process.env.CLAUDE_API_KEY });

  if (!client.apiKey) {
    throw new Error("CLAUDE_API_KEY is not set");
  }

  const inputPayload = {
    skills,
    education,
    availability,
    domain,
    status,
    readinessExplanation
  };

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: CANDIDATE_EVAL_PROMPT },
        { role: "user", content: JSON.stringify(inputPayload) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_output_tokens: 120
    });

    const outputText = response.output_text;
    const parsed = outputText ? JSON.parse(outputText) : null;

    return {
      prompt: CANDIDATE_EVAL_PROMPT,
      data: parsed
    };
  } catch (error) {
    return {
      prompt: CANDIDATE_EVAL_PROMPT,
      data: buildMockInsight({ skills, availability, domain, status })
    };
  }
};

export { CANDIDATE_EVAL_PROMPT };
