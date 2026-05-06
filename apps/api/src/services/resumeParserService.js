import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.CLAUDE_API_KEY || "sk-test"
});

/**
 * Extract candidate info from resume text using AI
 * Falls back to regex patterns if AI fails
 */
export const parseResumeWithAI = async (resumeText) => {
  if (!resumeText) {
    return getEmptyParsedData();
  }

  // Try AI parsing first if enabled
  if (process.env.AI_MODE !== "mock") {
    try {
      return await parseResumeWithOpenAI(resumeText);
    } catch (error) {
      console.warn("AI parsing failed, falling back to regex patterns:", error.message);
    }
  }

  // Fallback to regex patterns
  return parseResumeWithRegex(resumeText);
};

/**
 * Parse resume using OpenAI API
 */
const parseResumeWithOpenAI = async (resumeText) => {
  const prompt = `Extract the following information from the resume text below. Return a JSON object with these fields:
- name: Candidate's full name
- email: Email address
- phone: Phone number
- skills: Array of technical/professional skills
- education: Array of {degree, institution, year}
- college: Primary college/university name
- graduationYear: Expected or past graduation year
- yearsOfExperience: Years of professional experience

Resume text:
${resumeText}

Return ONLY valid JSON, no markdown formatting.`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(content);
    return {
      success: true,
      name: parsed.name || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      college: parsed.college || "",
      graduationYear: parsed.graduationYear || "",
      yearsOfExperience: parsed.yearsOfExperience || 0
    };
  } catch (parseError) {
    console.warn("Failed to parse AI response as JSON:", parseError.message);
    return parseResumeWithRegex(resumeText);
  }
};

/**
 * Parse resume using regex patterns (fallback)
 */
const parseResumeWithRegex = (resumeText) => {
  const lowerText = resumeText.toLowerCase();

  // Extract email
  const emailMatch = resumeText.match(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
  );
  const email = emailMatch ? emailMatch[1] : "";

  // Extract phone (multiple formats)
  const phoneMatch = resumeText.match(
    /(?:(\+\d{1,3})?[-.\s]?)?(?:\(\d{3}\)|(\d{3}))[-.\s]?(\d{3})[-.\s]?(\d{4})/
  );
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Extract name (first line or header)
  const nameMatch = resumeText.split("\n")[0].trim();
  const name = nameMatch.length < 100 ? nameMatch : "";

  // Extract skills using common keywords
  const skillsKeywords = [
    "javascript",
    "python",
    "java",
    "react",
    "node",
    "express",
    "mongodb",
    "sql",
    "html",
    "css",
    "typescript",
    "vue",
    "angular",
    "aws",
    "docker",
    "kubernetes",
    "git",
    "api",
    "rest",
    "graphql",
    "c++",
    "c#",
    "php",
    "ruby",
    "golang",
    "rust",
    "machine learning",
    "data science",
    "ai",
    "cloud",
    "linux",
    "windows"
  ];

  const skills = [];
  for (const keyword of skillsKeywords) {
    if (lowerText.includes(keyword)) {
      skills.push(capitalizeWord(keyword));
    }
  }

  // Extract education using common patterns
  const educationPatterns = [
    /(?:bachelor|b\.s\.|b\.a\.|bsc|ba)[^.\n]*/gi,
    /(?:master|m\.s\.|m\.a\.|msc|ma)[^.\n]*/gi,
    /(?:phd|doctorate)[^.\n]*/gi
  ];

  const education = [];
  for (const pattern of educationPatterns) {
    const matches = resumeText.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        education.push({
          degree: match.trim(),
          institution: extractInstitution(resumeText),
          year: extractYearFromText(resumeText)
        });
      });
    }
  }

  // Extract college
  const collegeMatch = resumeText.match(
    /(?:university|college|institute|iit|nit)[^,\n]*/i
  );
  const college = collegeMatch ? collegeMatch[0].trim() : "";

  // Extract graduation year
  const yearMatch = resumeText.match(/(?:20\d{2}|19\d{2})/);
  const graduationYear = yearMatch ? yearMatch[0] : "";

  // Estimate years of experience
  const yearsOfExperience = extractYearsOfExperience(resumeText);

  return {
    success: true,
    name: name || "Unknown",
    email,
    phone,
    skills: Array.from(new Set(skills)),
    education: education.length > 0 ? education : [],
    college,
    graduationYear,
    yearsOfExperience
  };
};

/**
 * Extract institution name from resume
 */
const extractInstitution = (text) => {
  const institutionPattern = /(?:at|from)\s+([^,\n]+(?:university|college|institute|iit|nit)[^,\n]*)/i;
  const match = text.match(institutionPattern);
  return match ? match[1].trim() : "";
};

/**
 * Extract year from text
 */
const extractYearFromText = (text) => {
  const match = text.match(/(?:20\d{2}|19\d{2})/);
  return match ? match[0] : "";
};

/**
 * Extract years of experience from resume
 */
const extractYearsOfExperience = (text) => {
  const experiencePattern = /(\d+)\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp|work)/i;
  const match = text.match(experiencePattern);
  return match ? parseInt(match[1]) : 0;
};

/**
 * Capitalize first letter of word
 */
const capitalizeWord = (word) => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

/**
 * Return empty parsed data structure
 */
const getEmptyParsedData = () => ({
  success: false,
  name: "",
  email: "",
  phone: "",
  skills: [],
  education: [],
  college: "",
  graduationYear: "",
  yearsOfExperience: 0
});

/**
 * Extract skills from parsed data
 */
export const extractSkills = (resumeText) => {
  const lowerText = resumeText.toLowerCase();
  const commonSkills = [
    "javascript",
    "python",
    "java",
    "react",
    "node.js",
    "express",
    "mongodb",
    "sql",
    "html5",
    "css3",
    "typescript",
    "vue.js",
    "angular",
    "aws",
    "docker",
    "kubernetes",
    "git",
    "rest api",
    "graphql",
    "c++",
    "c#",
    "php",
    "ruby on rails",
    "golang",
    "rust",
    "machine learning",
    "data science",
    "artificial intelligence",
    "cloud computing",
    "linux",
    "agile",
    "scrum",
    "communication",
    "leadership",
    "project management"
  ];

  const foundSkills = commonSkills.filter((skill) => lowerText.includes(skill.toLowerCase()));
  return Array.from(new Set(foundSkills));
};

/**
 * Calculate candidate readiness score based on parsed data
 */
export const calculateCandidateReadiness = (parsedData) => {
  let score = 50; // Base score

  if (parsedData.email) score += 10;
  if (parsedData.phone) score += 10;
  if (parsedData.skills && parsedData.skills.length > 0) score += 15;
  if (parsedData.education && parsedData.education.length > 0) score += 10;
  if (parsedData.yearsOfExperience > 0) score += 5;

  return Math.min(score, 100);
};
