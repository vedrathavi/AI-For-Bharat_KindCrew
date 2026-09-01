import { normalizeQuery } from "../research/requestHasher.js";

/**
 * Tokenize text into set of distinct non-trivial words.
 */
function extractTokenSet(text) {
  const normalized = normalizeQuery(text);
  const words = normalized.split(/\s+/).filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Calculate Jaccard similarity between two token sets (0.0 to 1.0).
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculate deterministic Novelty Score (0.0 to 10.0) for a candidate opportunity
 * against a list of previous ideas/content items.
 * Higher score = more novel (less overlap with previous work).
 */
const CONTRAST_WORDS = new Set([
  "stop", "never", "avoid", "instead", "myth", "wrong", "versus", "vs",
  "truth", "fail", "dont", "overrated", "flaw", "mistake", "warning", "trap"
]);

/**
 * Calculate deterministic Novelty Score (0.0 to 10.0) for a candidate opportunity
 * against a list of previous ideas/content items.
 * Considers topic, angle, counter-thesis framing, and format.
 */
export function calculateNoveltyScore(candidateTitle, candidateAngle, previousItems = [], candidateFormat = "") {
  if (!Array.isArray(previousItems) || previousItems.length === 0) {
    return {
      score: 9.5,
      explanation: "No previous content found; fresh concept for profile",
      sourceSignals: ["No prior matching items"],
    };
  }

  const candidateTokens = extractTokenSet(`${candidateTitle} ${candidateAngle} ${candidateFormat}`);
  const candidateAngleTokens = extractTokenSet(candidateAngle);

  if (candidateTokens.size === 0) {
    return {
      score: 7.0,
      explanation: "Standard topic framing",
      sourceSignals: ["Baseline topic length"],
    };
  }

  // Check if candidate uses a distinct counter-thesis framing word
  let hasContrastFraming = false;
  for (const token of candidateAngleTokens) {
    if (CONTRAST_WORDS.has(token)) {
      hasContrastFraming = true;
      break;
    }
  }

  let maxSimilarity = 0;
  let mostSimilarTopic = "";

  for (const item of previousItems) {
    const prevText = `${item.topic || item.title || ""} ${item.angle || ""} ${item.contentType || item.format || ""}`;
    const prevTokens = extractTokenSet(prevText);
    let sim = jaccardSimilarity(candidateTokens, prevTokens);

    // If candidate has counter-thesis framing not present in previous item, discount topic overlap by 40%
    if (hasContrastFraming && sim > 0.3) {
      let prevHasContrast = false;
      for (const token of prevTokens) {
        if (CONTRAST_WORDS.has(token)) {
          prevHasContrast = true;
          break;
        }
      }
      if (!prevHasContrast) {
        sim *= 0.6; // thesis shift discount
      }
    }

    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      mostSimilarTopic = item.topic || item.title || "previous item";
    }
  }

  const rawScore = 10 * Math.max(0.1, 1 - maxSimilarity);
  const score = parseFloat(rawScore.toFixed(1));

  let explanation = "Strong differentiation from previous creator content";
  if (maxSimilarity > 0.6) {
    explanation = `High overlap with previous content: "${mostSimilarTopic}"`;
  } else if (maxSimilarity > 0.3) {
    explanation = hasContrastFraming
      ? `Fresh counter-angle on previous topic: "${mostSimilarTopic}"`
      : `Moderate angle overlap with: "${mostSimilarTopic}"`;
  }

  return {
    score,
    explanation,
    sourceSignals: [
      `Similarity index to prior items: ${(maxSimilarity * 100).toFixed(0)}%`,
      hasContrastFraming ? "Counter-thesis angle detected" : "Standard framing",
      mostSimilarTopic ? `Closest prior item: "${mostSimilarTopic}"` : "Distinct topic",
    ],
  };
}
