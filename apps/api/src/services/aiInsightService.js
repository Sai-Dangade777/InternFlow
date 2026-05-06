import OpenAI from "openai";

const CANDIDATE_READINESS_PROMPT = `You are an internship candidate readiness evaluator. Analyze the candidate data and provide:

1. Overall readiness score (0-100)
2. A brief readiness explanation (max 25 words)
3. Specific next steps for the workflow
4. Potential risks or concerns
5. Recommendations for the mentor

Return ONLY valid JSON with these exact keys:
{
  "score": number,
  "explanation": string,
  "nextSteps": array of strings,
  "risks": array of strings,
  "mentorRecommendations": string
}`;

const buildMockReadinessInsight = (candidateData) => {
  const { skills = [], education = [], status = "", domain = "" } = candidateData;
  
  let score = 65;
  if (skills.length > 3) score += 15;
  if (education.length > 0) score += 10;
  if (domain) score += 5;
  
  score = Math.min(95, score);

  return {
    score,
    explanation: "Strong technical foundation with clear domain focus and availability.",
    nextSteps: [
      "Complete NDA signing process",
      "Submit joining form with required documents",
      "Schedule mentor onboarding call"
    ],
    risks: [
      status !== "Active" ? "Still in approval workflow" : null,
      !domain ? "Domain needs clarification" : null
    ].filter(Boolean),
    mentorRecommendations: "Candidate shows promising fundamentals. Schedule onboarding to assess learning pace and project fit."
  };
};

/**
 * Generate comprehensive readiness insight using AI
 */
export const generateCandidateReadinessInsight = async (candidateData) => {
  const isMock = process.env.AI_MODE === "mock" || process.env.DEMO_MODE === "true";
  
  if (isMock) {
    return buildMockReadinessInsight(candidateData);
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.CLAUDE_API_KEY
    });

    if (!client.apiKey) {
      return buildMockReadinessInsight(candidateData);
    }

    const payload = {
      name: candidateData.name,
      skills: candidateData.skills || [],
      education: candidateData.education || [],
      domain: candidateData.domain || "",
      status: candidateData.status || "",
      availability: candidateData.availability || "",
      yearsOfExperience: candidateData.yearsOfExperience || 0
    };

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${CANDIDATE_READINESS_PROMPT}\n\nCandidate data:\n${JSON.stringify(payload, null, 2)}`
        }
      ]
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "";
    
    try {
      const parsed = JSON.parse(content);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 65)),
        explanation: parsed.explanation || "Ready for next workflow step",
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        mentorRecommendations: parsed.mentorRecommendations || ""
      };
    } catch (parseError) {
      console.warn("Failed to parse AI response:", parseError.message);
      return buildMockReadinessInsight(candidateData);
    }
  } catch (error) {
    console.warn("AI insight generation failed, returning mock:", error.message);
    return buildMockReadinessInsight(candidateData);
  }
};

/**
 * Generate NDA readiness assessment
 */
export const assessNdaReadiness = (candidateData) => {
  const { joiningForm, nda } = candidateData;

  const requiredFields = {
    phone: !!joiningForm?.phone,
    address: !!joiningForm?.address,
    emergencyContact: !!joiningForm?.emergencyContact,
    governmentId: !!joiningForm?.governmentId
  };

  const allFieldsComplete = Object.values(requiredFields).every((field) => field);
  const canSignNda = allFieldsComplete || nda?.status === "Not Issued";

  return {
    canSignNda,
    completeFields: Object.keys(requiredFields).filter((key) => requiredFields[key]),
    missingFields: Object.keys(requiredFields).filter((key) => !requiredFields[key]),
    readinessPercentage: Math.round((Object.values(requiredFields).filter(Boolean).length / Object.keys(requiredFields).length) * 100)
  };
};

/**
 * Generate workflow risk assessment
 */
export const assessWorkflowRisk = (candidateData) => {
  const risks = [];
  const warnings = [];

  // Check timeline risks
  if (candidateData.createdAt) {
    const createdDate = new Date(candidateData.createdAt);
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation > 7 && candidateData.status === "Referral") {
      risks.push("Referral pending for more than 7 days");
    }
  }

  // Check NDA status
  if (candidateData.status === "NDA" && !candidateData.nda?.signedAt) {
    const ndaIssuedDate = candidateData.nda?.issuedAt ? new Date(candidateData.nda.issuedAt) : null;
    if (ndaIssuedDate) {
      const daysSinceIssued = (Date.now() - ndaIssuedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceIssued > 3) {
        risks.push("NDA pending for more than 3 days after issuance");
      }
    }
  }

  // Check joining form completeness
  if (candidateData.joiningForm?.status === "draft") {
    const missingFields = [];
    if (!candidateData.joiningForm.phone) missingFields.push("phone");
    if (!candidateData.joiningForm.address) missingFields.push("address");
    if (!candidateData.joiningForm.emergencyContact) missingFields.push("emergency contact");
    
    if (missingFields.length > 0) {
      warnings.push(`Joining form missing: ${missingFields.join(", ")}`);
    }
  }

  // Check document status
  if (!candidateData.joiningForm?.nonWorkerId && candidateData.status === "Active") {
    warnings.push("Non-Worker ID not generated");
  }

  const riskLevel = risks.length > 0 ? "HIGH" : warnings.length > 0 ? "MEDIUM" : "LOW";

  return {
    riskLevel,
    risks,
    warnings,
    recommendedActions: risks.length > 0 ? [
      "Escalate to HR team for immediate action",
      "Follow up with candidate"
    ] : warnings.length > 0 ? [
      "Monitor progress",
      "Send reminder to candidate if needed"
    ] : [
      "Continue normal workflow"
    ]
  };
};

/**
 * Generate onboarding readiness checklist
 */
export const generateOnboardingChecklist = (candidateData) => {
  return {
    resumeReview: {
      completed: !!candidateData.resumePath,
      label: "Resume Review",
      description: "HR has reviewed the candidate resume"
    },
    ndaSigning: {
      completed: candidateData.nda?.status === "Signed",
      label: "NDA Signing",
      description: "Candidate has signed the NDA"
    },
    joiningFormSubmission: {
      completed: candidateData.joiningForm?.status === "submitted",
      label: "Joining Form Submission",
      description: "Candidate has submitted required personal and professional information"
    },
    nonWorkerIdGeneration: {
      completed: !!candidateData.joiningForm?.nonWorkerId,
      label: "Non-Worker ID Generation",
      description: "System has generated the Non-Worker ID"
    },
    accessProvisioning: {
      completed: candidateData.accessProvisioning?.status === "Provisioned",
      label: "Access Provisioning",
      description: "IT has provisioned system access"
    },
    mentorAssignment: {
      completed: !!candidateData.mentor?.name,
      label: "Mentor Assignment",
      description: "Mentor has been assigned and notified"
    },
    internshipStart: {
      completed: candidateData.lifecycle?.startDate !== null,
      label: "Internship Start",
      description: "Internship has officially started"
    }
  };
};
