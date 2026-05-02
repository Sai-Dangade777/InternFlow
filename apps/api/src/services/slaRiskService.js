import OpenAI from "openai";

const SLA_EXPLANATION_PROMPT = `You are an SLA risk assistant. Explain the SLA risk level in one short sentence (max 20 words) based on the provided facts.`;

const buildRuleBasedRisk = ({ ndaSignedAt, referralCreatedAt, hrReviewed }) => {
  if (!ndaSignedAt && referralCreatedAt) {
    const elapsedMs = Date.now() - new Date(referralCreatedAt).getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

    if (elapsedDays > 2) {
      return {
        riskLevel: "HIGH",
        reason: "NDA not signed within 2 days."
      };
    }
  }

  if (!hrReviewed) {
    return {
      riskLevel: "MEDIUM",
      reason: "HR review is pending."
    };
  }

  return {
    riskLevel: "LOW",
    reason: "No SLA breaches detected."
  };
};

export const evaluateSlaRisk = async ({
  ndaSignedAt,
  referralCreatedAt,
  hrReviewed,
  apiKey
}) => {
  const baseRisk = buildRuleBasedRisk({ ndaSignedAt, referralCreatedAt, hrReviewed });
  const client = new OpenAI({ apiKey: apiKey || process.env.CLAUDE_API_KEY });

  if (!client.apiKey) {
    return baseRisk;
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: SLA_EXPLANATION_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            riskLevel: baseRisk.riskLevel,
            facts: {
              ndaSignedAt,
              referralCreatedAt,
              hrReviewed
            }
          })
        }
      ],
      temperature: 0.2,
      max_output_tokens: 60
    });

    const explanation = response.output_text?.trim();

    return {
      riskLevel: baseRisk.riskLevel,
      reason: explanation || baseRisk.reason
    };
  } catch (error) {
    return baseRisk;
  }
};

export { SLA_EXPLANATION_PROMPT };
