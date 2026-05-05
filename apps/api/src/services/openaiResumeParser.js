import OpenAI from "openai";

const RESUME_PARSE_PROMPT = `You are a resume parser. Extract structured data from the provided resume text.
Return a strict JSON object with keys:
- name: string
- email: string
- phone: string
- skills: array of strings
- education: array of objects with { degree, institution, year }
If a field is missing, use an empty string or empty array.`;

const computeParseConfidence = (data = {}) => {
  let score = 0;
  if (data.name) {
    score += 0.2;
  }
  if (data.email) {
    score += 0.25;
  }
  if (data.phone) {
    score += 0.2;
  }
  if (Array.isArray(data.skills) && data.skills.length > 0) {
    score += 0.2;
  }
  if (Array.isArray(data.education) && data.education.length > 0) {
    score += 0.15;
  }
  return Number(Math.min(1, score).toFixed(2));
};

export const parseResumeWithOpenAI = async ({ resumeText, apiKey }) => {
  if (!resumeText) {
    throw new Error("resumeText is required");
  }

  const isMock =
    process.env.AI_MODE === "mock" ||
    process.env.DEMO_MODE === "true" ||
    !(apiKey || process.env.CLAUDE_API_KEY);

  if (isMock) {
    const mockData = {
      name: "Demo Candidate",
      email: "demo.candidate@internflow.demo",
      phone: "+1 555 0100",
      skills: ["React", "Node.js", "MongoDB"],
      education: [{ degree: "B.Tech", institution: "Demo University", year: "2025" }]
    };
    return {
      prompt: RESUME_PARSE_PROMPT,
      data: mockData,
      meta: {
        confidence: computeParseConfidence(mockData)
      }
    };
  }

  const client = new OpenAI({ apiKey: apiKey || process.env.CLAUDE_API_KEY });

  if (!client.apiKey) {
    throw new Error("CLAUDE_API_KEY is not set");
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: RESUME_PARSE_PROMPT
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      response_format: { type: "json_object" }
    });

    const outputText = response.output_text;
    const parsed = outputText ? JSON.parse(outputText) : null;

    return {
      prompt: RESUME_PARSE_PROMPT,
      data: parsed,
      meta: {
        confidence: computeParseConfidence(parsed || {})
      }
    };
  } catch (error) {
    const message = error?.message || "Failed to parse resume";
    const details = error?.response?.data || null;
    const err = new Error(message);
    err.details = details;
    throw err;
  }
};

export { RESUME_PARSE_PROMPT };
