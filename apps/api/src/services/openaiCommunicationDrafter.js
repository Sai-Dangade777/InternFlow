import OpenAI from "openai";

const COMMUNICATION_PROMPT = `You are an HR communications drafter. Return strict JSON with:
- subject: string
- body: string (max 120 words)
Tailor the message to the provided type and candidate context.`;

const buildTemplate = ({ type, candidate }) => {
  if (type === "mentor-intro") {
    return {
      subject: `Mentor intro for ${candidate.name}`,
      body: `Hi ${candidate.name},\n\nWelcome to Intern Flow. Your mentor is ${
        candidate.mentor?.name || "your assigned mentor"
      }. Please review the onboarding checklist and reply with any questions.\n\nThanks,\nIntern Flow HR`
    };
  }
  if (type === "nda-reminder") {
    return {
      subject: `NDA reminder for ${candidate.name}`,
      body: `Hi ${candidate.name},\n\nThis is a reminder to sign your NDA before your start date. Please complete it at your earliest convenience.\n\nRegards,\nIntern Flow HR`
    };
  }
  return {
    subject: `Update on ${candidate.name}'s internship`,
    body: `Hi team,\n\nHere is the latest update on ${candidate.name}. Please review the candidate profile for next steps.\n\nThanks,\nIntern Flow`
  };
};

export const draftCommunicationWithAI = async ({ type, candidate, apiKey }) => {
  const isMock =
    process.env.AI_MODE === "mock" ||
    process.env.DEMO_MODE === "true" ||
    !(apiKey || process.env.CLAUDE_API_KEY);

  const template = buildTemplate({ type, candidate });
  if (isMock) {
    return { prompt: COMMUNICATION_PROMPT, data: template };
  }

  const client = new OpenAI({ apiKey: apiKey || process.env.CLAUDE_API_KEY });

  if (!client.apiKey) {
    return { prompt: COMMUNICATION_PROMPT, data: template };
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: COMMUNICATION_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            type,
            candidate
          })
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_output_tokens: 200
    });

    const outputText = response.output_text;
    const parsed = outputText ? JSON.parse(outputText) : null;

    return {
      prompt: COMMUNICATION_PROMPT,
      data: parsed || template
    };
  } catch (error) {
    return { prompt: COMMUNICATION_PROMPT, data: template };
  }
};

export { COMMUNICATION_PROMPT };
