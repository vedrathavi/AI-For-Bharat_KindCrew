import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  analyzeTrendCompetition,
  getTrendingTopics,
} from "./googleTrendsService.js";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const MODEL_ID = process.env.BEDROCK_DEFAULT_MODEL;

function clamp(value, min = 0, max = 10) {
  return Math.min(max, Math.max(min, value));
}

function toOneDecimal(value) {
  return parseFloat(clamp(value).toFixed(1));
}

function normalizeText(value) {
  return (value || "").toString().toLowerCase();
}

function countKeywordMatches(text, keywords) {
  return keywords.reduce((count, keyword) => {
    if (text.includes(keyword)) return count + 1;
    return count;
  }, 0);
}

function buildProfileContext(creatorProfile) {
  if (!creatorProfile) return "";

  const nichePrimary = creatorProfile?.niche?.primary || "";
  const nicheSecondary = creatorProfile?.niche?.secondary || "";
  const targetAudience = creatorProfile?.targetAudience || "";
  const primaryGoal = creatorProfile?.goals?.primaryGoal || "";
  const creatorLevel = creatorProfile?.goals?.creatorLevel || "";
  const contentStrategy = creatorProfile?.strategy?.contentStrategy || "";
  const postingFrequency = creatorProfile?.strategy?.postingFrequency || "";
  const contentPillars = Array.isArray(creatorProfile?.strategy?.contentPillars)
    ? creatorProfile.strategy.contentPillars.join(", ")
    : "";
  const tones = Array.isArray(creatorProfile?.preferences?.tones)
    ? creatorProfile.preferences.tones.join(", ")
    : "";
  const formats = Array.isArray(creatorProfile?.preferences?.formats)
    ? creatorProfile.preferences.formats.join(", ")
    : "";
  const formality = creatorProfile?.preferences?.constraints?.formality || "";

  return `\n\nSaved Creator Profile Context (highest priority):
- Niche: ${nichePrimary}${nicheSecondary ? ` (${nicheSecondary})` : ""}
- Target audience: ${targetAudience}
- Goal: ${primaryGoal}
- Creator level: ${creatorLevel}
- Strategy: ${contentStrategy}
- Posting frequency: ${postingFrequency}
- Content pillars: ${contentPillars}
- Preferred tones: ${tones}
- Preferred formats: ${formats}
- Formality: ${formality}

Use this context to make ideas consistent with the creator's brand and audience.`;
}

/**
 * Generate ideas from zero (user has no idea)
 */
async function generateZeroIdeas(userProfile, creatorProfile = null) {
  const { niche, audience, platforms, goal } = userProfile;
  const profileContext = buildProfileContext(creatorProfile);

  const prompt = `Generate 10 high-quality content ideas for the following profile:

Niche: ${niche}
Target Audience: ${audience}
Platforms: ${platforms.join(", ")}
Goal: ${goal}

For each idea, return a JSON object with:
- title: content title
- description: short description
- platform: recommended platform
- format: content format (list-post, story, carousel, how-to, etc)
- angle: unique angle

Return as a valid JSON array. ONLY return the JSON array, no other text.`;

  const finalPrompt = `${prompt}${profileContext}`;

  return await callBedrockAI(finalPrompt, "Generate ideas");
}

/**
 * Refine ideas from partial input (Some Idea flow)
 */
async function refineSomeIdea(
  roughIdea,
  audience,
  platform,
  creatorProfile = null,
) {
  const profileContext = buildProfileContext(creatorProfile);

  const prompt = `Refine this rough content idea into multiple strategic angles:

Rough Idea: ${roughIdea}
Target Audience: ${audience}
Platform: ${platform}

Generate 5 refined angles. For each return JSON with:
- title: refined title
- angle: specific angle
- format: content format
- hook: opening hook

Return as valid JSON array. ONLY return JSON, no other text.`;

  const finalPrompt = `${prompt}${profileContext}`;

  return await callBedrockAI(finalPrompt, "Refine idea");
}

/**
 * Evaluate and improve full idea
 */
async function evaluateFullIdea(
  idea,
  audience,
  platform,
  creatorProfile = null,
) {
  const profileContext = buildProfileContext(creatorProfile);

  const prompt = `Evaluate this content idea and suggest improvements:

Idea: ${idea}
Target Audience: ${audience}
Platform: ${platform}

Return a JSON object with:
- viralityScore: 1-10
- clarityScore: 1-10
- competitionScore: 1-10 (how saturated the topic is)
- improvedTitle: suggested improvement
- suggestedHook: opening hook
- format: recommended format

ONLY return valid JSON, no other text.`;

  const finalPrompt = `${prompt}${profileContext}`;

  return await callBedrockAI(finalPrompt, "Evaluate idea");
}

/**
 * Research an idea - get pain points, competitors, structure
 */
async function researchIdea(idea, audience, creatorProfile = null) {
  const profileContext = buildProfileContext(creatorProfile);

  const prompt = `Analyze this content idea for research insights:

Topic: ${idea}
Target Audience: ${audience}

Return JSON with:
- audiencePainPoints: array of 3-5 pain points
- competitorPatterns: array of common competitor approaches
- recommendedStructure: suggested outline
- keyPoints: array of 3-5 key discussion points

ONLY return valid JSON, no other text.`;

  const finalPrompt = `${prompt}${profileContext}`;

  return await callBedrockAI(finalPrompt, "Research idea");
}

/**
 * Score an idea using the formula:
 * overall = 0.4 * virality + 0.3 * audience + 0.2 * clarity + 0.1 * (10 - competition)
 */
function calculateScore(virality, audienceRelevance, clarity, competition) {
  return parseFloat(
    (
      0.4 * virality +
      0.3 * audienceRelevance +
      0.2 * clarity +
      0.1 * (10 - competition)
    ).toFixed(1),
  );
}

/**
 * Extract first balanced JSON object/array from model text.
 */
function extractBalancedJson(text) {
  const start = text.search(/[\[{]/);
  if (start === -1) return null;

  const opener = text[start];
  const closer = opener === "[" ? "]" : "}";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === opener) {
      depth += 1;
    } else if (ch === closer) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * Parse model JSON with a small cleanup fallback for common formatting mistakes.
 */
function parseModelJson(rawText, context = "") {
  const withoutFences = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const extracted = extractBalancedJson(withoutFences) || withoutFences;

  try {
    return JSON.parse(extracted);
  } catch (_firstError) {
    const cleaned = extracted
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error(
        `Failed to parse AI JSON (${context}). Raw content:`,
        rawText,
      );
      throw new Error(
        `AI returned invalid JSON (${context}): ${secondError.message}`,
      );
    }
  }
}

/**
 * Get competition score from Google Trends
 */
async function getCompetitionFromTrends(keyword) {
  try {
    const trendData = await getTrendingTopics(keyword);
    return analyzeTrendCompetition(trendData);
  } catch (error) {
    console.error("Error getting trends:", error);
    return 5; // Default medium competition if trends fail
  }
}

/**
 * Deterministic scoring using text heuristics + Google Trends competition.
 */
async function scoreIdeaWithLogic(idea, options = {}) {
  const title = (idea?.title || "").toString();
  const angle = (idea?.angle || "").toString();
  const hook = (idea?.hook || idea?.hookIdea || "").toString();
  const format = (idea?.format || idea?.contentType || "").toString();
  const audience = (options?.audience || "").toString();
  const goal = (options?.goal || "").toString();
  const niche = (options?.niche || "").toString();

  const combinedText = normalizeText(`${title} ${angle} ${hook}`);
  const titleLength = title.trim().length;

  const viralityKeywords = [
    "how",
    "why",
    "best",
    "mistake",
    "secret",
    "trend",
    "viral",
    "vs",
    "before",
    "after",
  ];
  const clarityKeywords = [
    "step",
    "guide",
    "framework",
    "checklist",
    "example",
    "template",
    "explained",
  ];

  let virality = 6.0;
  virality += countKeywordMatches(combinedText, viralityKeywords) * 0.25;
  if (hook.trim().length > 0) virality += 0.6;
  if (/\d/.test(title)) virality += 0.4;
  if (titleLength >= 35 && titleLength <= 85) virality += 0.5;

  const formatText = normalizeText(format);
  if (
    ["reel", "short", "short-form", "carousel", "list", "how-to", "video"].some(
      (f) => formatText.includes(f),
    )
  ) {
    virality += 0.5;
  }

  const goalText = normalizeText(goal);
  if (["growth", "engagement", "brand"].some((g) => goalText.includes(g))) {
    virality += 0.3;
  }

  let clarity = 5.8;
  clarity += countKeywordMatches(combinedText, clarityKeywords) * 0.3;
  if (angle.trim().length >= 30) clarity += 0.6;
  if (titleLength >= 20 && titleLength <= 90) clarity += 0.5;
  if (hook.trim().length >= 15) clarity += 0.3;

  const audienceWords = normalizeText(audience)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);
  const audienceMatches = audienceWords.reduce((acc, word) => {
    if (combinedText.includes(word)) return acc + 1;
    return acc;
  }, 0);
  let audienceRelevance = 6.2 + audienceMatches * 0.5;

  const nicheText = normalizeText(niche);
  if (nicheText && combinedText.includes(nicheText)) {
    audienceRelevance += 0.6;
  }

  const trendKeyword =
    title ||
    options?.fallbackKeyword ||
    niche ||
    audience ||
    "content strategy";
  const competition = await getCompetitionFromTrends(trendKeyword);

  virality = toOneDecimal(virality);
  clarity = toOneDecimal(clarity);
  audienceRelevance = toOneDecimal(audienceRelevance);
  const normalizedCompetition = toOneDecimal(competition);

  return {
    virality,
    clarity,
    competition: normalizedCompetition,
    overall: calculateScore(
      virality,
      audienceRelevance,
      clarity,
      normalizedCompetition,
    ),
  };
}

/**
 * Call Bedrock AI with a prompt
 */
async function callBedrockAI(prompt, context = "") {
  try {
    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      system: [
        {
          text: "Return ONLY valid JSON. No markdown, no explanation, no extra text.",
        },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.7,
      },
    });

    const response = await client.send(command);

    // Check if response has expected structure
    if (
      !response.output ||
      !response.output.message ||
      !response.output.message.content
    ) {
      console.error("Unexpected response structure:", response);
      throw new Error("Invalid response structure from Bedrock");
    }

    const content = response.output.message.content[0]?.text || "";
    if (!content.trim()) {
      throw new Error(`Empty model response (${context})`);
    }

    return parseModelJson(content, context);
  } catch (error) {
    console.error(`Bedrock AI error (${context}):`, error);
    throw error;
  }
}

export {
  generateZeroIdeas,
  refineSomeIdea,
  evaluateFullIdea,
  researchIdea,
  calculateScore,
  getCompetitionFromTrends,
  scoreIdeaWithLogic,
};
