import OpenAI from "openai";

const CANDIDATE_EVAL_PROMPT = `You are an internship candidate evaluator. Use the input fields to score readiness.
Return strict JSON only with:
- score: number (0-100)
- explanation: string (max 25 words)
Keep it concise and cost-effective.`;

export const evaluateCandidateWithOpenAI = async ({
  skills = [],
  education = [],
  availability = "",
  apiKey
}) => {
  const isMock =
    process.env.AI_MODE === "mock" ||
    process.env.DEMO_MODE === "true" ||
    !(apiKey || process.env.CLAUDE_API_KEY);

  if (isMock) {
    const baseScore = 65 + Math.min(skills.length * 5, 25);
    return {
      prompt: CANDIDATE_EVAL_PROMPT,
      data: {
        score: Math.min(95, baseScore),
        explanation:
          "Strong fundamentals with clear internship availability. Recommend moving to HR review."
      }
    };
  }

  const client = new OpenAI({ apiKey: apiKey || process.env.CLAUDE_API_KEY });

  if (!client.apiKey) {
    throw new Error("CLAUDE_API_KEY is not set");
  }

  const inputPayload = {
    skills,
    education,
    availability
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
    const message = error?.message || "Failed to evaluate candidate";
    const details = error?.response?.data || null;
    const err = new Error(message);
    err.details = details;
    throw err;
  }
};

export { CANDIDATE_EVAL_PROMPT };
