import { Stage1To2ContractSchema } from "../schemas/ideation.schemas.js";

/**
 * Stage1To2Contract Builder
 * Constructs an immutable, Zod-validated contract v2.0 for handoff to Stage II content drafting.
 */
export function buildStage1To2Contract({
  ideaId,
  snapshot,
  opportunity,
  creatorProfile = null,
}) {
  const verifiedSources = (snapshot?.verifiedSources || []).map((s) => ({
    title: s.title || "Web Source",
    url: s.url || "#",
    snippet: s.snippet || "",
  }));

  const audiencePainPoints = (snapshot?.corpus?.audiencePainPoints || []).map(
    (p) => (typeof p === "string" ? p : p.point || "")
  ).filter(Boolean);

  const contentGaps = (snapshot?.corpus?.contentGaps || []).map(
    (g) => (typeof g === "string" ? g : g.description || "")
  ).filter(Boolean);

  const rawKeywords = snapshot?.corpus?.keywords || [];
  const topicName = opportunity.topic || opportunity.title || snapshot?.topic || "topic";
  const keywords = rawKeywords.map((k) => {
    if (typeof k === "string") {
      return {
        term: k,
        relevance: 0.8,
        importance: "medium",
        definition: `Key terminology for ${topicName}: ${k}`,
        whyItMatters: `Essential context for understanding ${topicName}`,
        relatedTerms: [],
      };
    }
    return {
      term: k.term || "Keyword",
      relevance: typeof k.relevance === "number" ? k.relevance : 0.8,
      importance: ["high", "medium", "low"].includes(k.importance) ? k.importance : "medium",
      definition: k.definition && !k.definition.includes("Key topic term") ? k.definition : `Key terminology for ${topicName}: ${k.term || ""}`,
      whyItMatters: k.whyItMatters && k.whyItMatters !== "Relevant to audience interest" ? k.whyItMatters : `Essential context for understanding ${topicName}`,
      relatedTerms: Array.isArray(k.relatedTerms) ? k.relatedTerms : [],
    };
  });

  const rawContract = {
    contractVersion: "2.0",
    ideaId,
    researchSnapshotId: snapshot?.snapshotId || null,
    requestHash: snapshot?.requestHash || null,
    topic: opportunity.topic || opportunity.title || "Untitled Topic",
    angle: opportunity.angle || "Strategic audience angle",
    hook: opportunity.hook || opportunity.suggestedHook || "",
    platform: opportunity.platform || snapshot?.platform || "general",
    format: opportunity.format || "post",
    contentType: opportunity.contentType || opportunity.format || "post",
    targetAudience: opportunity.targetAudience || snapshot?.audience || "General Audience",
    differentiation: opportunity.differentiation || "Unique audience framing",
    keyPoints: Array.isArray(opportunity.keyPoints) ? opportunity.keyPoints : [],
    keywords,
    researchEvidence: {
      audiencePainPoints,
      contentGaps,
      candidatePainPoint: opportunity.targetPainPoint || "",
      candidateContentGap: opportunity.contentGap || "",
      entities: snapshot?.corpus?.entities || [],
      events: snapshot?.corpus?.events || [],
      verifiedSources,
      researchConfidence: snapshot?.researchConfidence || 0.5,
      webResearch: snapshot?.webResearch || null,
    },
    scores: (opportunity.scores && opportunity.scores.dimensions)
      ? opportunity.scores
      : {
          overall: 8.0,
          opportunityScore: 8.0,
          researchConfidence: snapshot?.researchConfidence || 0.5,
          scoringVersion: "2.0",
          dimensions: {
            audienceDemand: { score: 8, explanation: "High demand", sourceSignals: [] },
            trendMomentum: { score: 7, explanation: "Stable momentum", sourceSignals: [] },
            creatorFit: { score: 8, explanation: "Aligned with niche", sourceSignals: [] },
            contentGap: { score: 8, explanation: "Fills content gap", sourceSignals: [] },
            differentiation: { score: 8, explanation: "Distinct angle", sourceSignals: [] },
            novelty: { score: 9, explanation: "Fresh idea", sourceSignals: [] },
            competition: { score: 6, explanation: "Moderate competition", sourceSignals: [] },
            platformFit: { score: 9, explanation: "Matches platform norms", sourceSignals: [] },
            feasibility: { score: 8, explanation: "Feasible format", sourceSignals: [] },
            evidenceStrength: { score: 7, explanation: "Backed by web sources", sourceSignals: [] },
          },
        },
    creatorContextSnapshot: {
      niche: creatorProfile?.niche?.primary || "General",
      audience: creatorProfile?.targetAudience || "General Audience",
      goal: creatorProfile?.goals?.primaryGoal || "growth",
      tone: Array.isArray(creatorProfile?.preferences?.tones)
        ? creatorProfile.preferences.tones[0]
        : "Professional",
      style: creatorProfile?.preferences?.contentStyle || "Standard",
    },
  };

  const parseResult = Stage1To2ContractSchema.safeParse(rawContract);
  if (!parseResult.success) {
    console.error("❌ [ContractBuilder] Zod Error:", JSON.stringify(parseResult.error.format(), null, 2));
    throw new Error("Contract validation failed: " + JSON.stringify(parseResult.error.issues));
  }
  return parseResult.data;
}
