import { v4 as uuidv4 } from "uuid";
import ContentIdea from "../../../models/ContentIdea.js";
import creatorProfileService from "../../../services/creatorProfile.service.js";
import { ResearchOrchestrator } from "./research/researchOrchestrator.js";
import { buildStage1To2Contract } from "./contracts/stage1to2.contract.js";
import {
  saveIdea,
  getIdeaById,
  deleteIdea,
  getUserIdeas,
  updateIdeaResearch,
} from "../../../services/ddbIdeationService.js";
import { hasContentForIdea } from "../../../services/ddbContentService.js";
import {
  saveSnapshot,
  getSnapshotByRequestHash,
  getSnapshotById,
  getUserSnapshots,
} from "./research/ddbResearchSnapshot.service.js";

const orchestrator = new ResearchOrchestrator();

async function getCreatorProfile(userId) {
  if (!userId) return null;
  try {
    return await creatorProfileService.getProfileByUserId(userId);
  } catch {
    return null; // Graceful fallback if profile is absent
  }
}

async function getPreviousItems(userId) {
  if (!userId) return [];
  try {
    const ideas = await getUserIdeas(userId);
    return ideas.slice(0, 20); // fetch recent 20 ideas for novelty calculation
  } catch {
    return [];
  }
}

/**
 * Zero Idea Flow: Generate 3-7 evidence-backed opportunities from profile
 */
export async function generateIdeasFlow(userId, payload) {
  const { niche, audience, platforms, goal, enableLiveWebSearch, forceRefresh } = payload;
  const creatorProfile = await getCreatorProfile(userId);
  const previousItems = await getPreviousItems(userId);

  const primaryPlatform = Array.isArray(platforms) && platforms.length > 0
    ? platforms[0]
    : (creatorProfile?.platforms?.[0]?.name || creatorProfile?.platforms?.[0]?.platform || creatorProfile?.platforms?.[0] || "general");
  const topicQuery = `${niche} content strategy`;

  const { snapshot, cached } = await orchestrator.executeResearchSession({
    userId,
    topic: topicQuery,
    audience,
    platform: primaryPlatform,
    creatorProfile,
    previousItems,
    enableLiveWebSearch,
    forceRefresh,
  });

  return {
    success: true,
    ideas: snapshot.opportunities,
    count: snapshot.opportunities.length,
    researchSnapshotId: snapshot.snapshotId,
    requestHash: snapshot.requestHash,
    researchConfidence: snapshot.researchConfidence,
    keywords: snapshot.corpus?.keywords || [],
    snapshotCached: cached,
  };
}

/**
 * Some Idea Flow: Refine rough idea into 5 strategic angles with evidence
 */
export async function refineIdeaFlow(userId, payload) {
  const { roughIdea, audience, platform, enableLiveWebSearch, forceRefresh } = payload;
  const creatorProfile = await getCreatorProfile(userId);
  const previousItems = await getPreviousItems(userId);

  const { snapshot, cached } = await orchestrator.executeResearchSession({
    userId,
    topic: roughIdea,
    audience,
    platform,
    creatorProfile,
    previousItems,
    enableLiveWebSearch,
    forceRefresh,
  });

  return {
    success: true,
    ideas: snapshot.opportunities,
    count: snapshot.opportunities.length,
    researchSnapshotId: snapshot.snapshotId,
    requestHash: snapshot.requestHash,
    researchConfidence: snapshot.researchConfidence,
    keywords: snapshot.corpus?.keywords || [],
    snapshotCached: cached,
  };
}

/**
 * Full Idea Flow: Evaluate idea and return metrics with content hooks
 */
export async function evaluateIdeaFlow(userId, payload) {
  const { idea, audience, platform, enableLiveWebSearch, forceRefresh } = payload;
  const creatorProfile = await getCreatorProfile(userId);
  const previousItems = await getPreviousItems(userId);

  const { snapshot, cached } = await orchestrator.executeResearchSession({
    userId,
    topic: idea,
    audience,
    platform,
    creatorProfile,
    previousItems,
    enableLiveWebSearch,
    forceRefresh,
  });

  const bestOp = snapshot.opportunities[0] || {
    title: idea,
    angle: "Strategic evaluation angle",
    scores: { overall: 8.0, opportunityScore: 8.0, researchConfidence: 0.5, scoringVersion: "2.0", dimensions: {} },
  };

  return {
    success: true,
    evaluation: {
      improvedTitle: bestOp.title,
      suggestedHook: bestOp.hook,
      contentHooks: bestOp.contentHooks || [bestOp.hook].filter(Boolean),
      format: bestOp.format || "post",
      scores: bestOp.scores,
      differentiation: bestOp.differentiation,
      keywords: snapshot.corpus?.keywords || [],
    },
    researchSnapshotId: snapshot.snapshotId,
    requestHash: snapshot.requestHash,
    snapshotCached: cached,
  };
}

/**
 * Research Flow: Get deep research snapshot for a query
 */
export async function researchIdeaFlow(userId, payload) {
  const { idea, audience, platform, enableLiveWebSearch, forceRefresh } = payload;
  const creatorProfile = await getCreatorProfile(userId);
  const previousItems = await getPreviousItems(userId);

  const targetPlatform = platform || (Array.isArray(creatorProfile?.platforms) && creatorProfile.platforms.length > 0
    ? (creatorProfile.platforms[0]?.name || creatorProfile.platforms[0]?.platform || creatorProfile.platforms[0])
    : "general");

  const { snapshot, cached } = await orchestrator.executeResearchSession({
    userId,
    topic: idea,
    audience,
    platform: targetPlatform,
    creatorProfile,
    previousItems,
    enableLiveWebSearch,
    forceRefresh,
  });

  return {
    success: true,
    research: snapshot,
    snapshotId: snapshot.snapshotId,
    requestHash: snapshot.requestHash,
    snapshotCached: cached,
  };
}

/**
 * Explicit Refresh Flow: Perform controlled evolution refresh ($V1 -> V2)
 */
export async function refreshResearchFlow(userId, snapshotId, enableLiveWebSearch = false) {
  const existingSnapshot = await getSnapshotById(userId, snapshotId);
  if (!existingSnapshot) {
    throw new Error("Research snapshot not found or access denied");
  }

  const creatorProfile = await getCreatorProfile(userId);
  const previousItems = await getPreviousItems(userId);

  const { snapshot } = await orchestrator.executeResearchSession({
    userId,
    topic: existingSnapshot.topic,
    audience: existingSnapshot.audience,
    platform: existingSnapshot.platform,
    creatorProfile,
    previousItems,
    enableLiveWebSearch,
    forceRefresh: true,
    parentSnapshotId: snapshotId,
  });

  return {
    success: true,
    newSnapshotId: snapshot.snapshotId,
    requestHash: snapshot.requestHash,
    research: snapshot,
  };
}

/**
 * Select Idea Flow: Save selected idea with Stage1To2Contract (v2.0)
 */
export async function selectIdeaFlow(userId, payload) {
  const creatorProfile = await getCreatorProfile(userId);
  const ideaId = uuidv4();

  let snapshot = null;
  if (payload.researchSnapshotId) {
    snapshot = await getSnapshotById(userId, payload.researchSnapshotId);
  }

  const topic = payload.topic || payload.title || "Untitled Topic";
  const audience = payload.targetAudience || "General Audience";
  const angle = payload.angle || "Strategic perspective";

  const corpus = snapshot?.corpus || payload.research?.corpus || payload.research || {};
  const rawPainPoints = corpus.audiencePainPoints || payload.research?.audiencePainPoints || [];
  const painPoints = rawPainPoints.map((p) => (typeof p === "string" ? p : p.point || p.description || JSON.stringify(p)));

  const rawGaps = corpus.contentGaps || payload.research?.competitorPatterns || [];
  const contentGaps = rawGaps.map((g) => (typeof g === "string" ? g : g.description || g.gap || JSON.stringify(g)));

  const keyPoints = (Array.isArray(payload.keyPoints) && payload.keyPoints.length > 0)
    ? payload.keyPoints
    : (Array.isArray(corpus.keyPoints) && corpus.keyPoints.length > 0)
    ? corpus.keyPoints
    : [
        `Context and core market tension for ${topic}`,
        `Strategic breakdown and actionable insights`,
        `Practical application and high-impact takeaway for ${audience}`,
      ];

  const enrichedResearch = {
    audiencePainPoints: painPoints.length > 0 ? painPoints : [
      `Seeking clear, actionable clarity on ${topic}`,
      `Navigating conflicting information and tactical execution challenges`,
      `Desire for proven frameworks and practical insights`,
    ],
    competitorPatterns: contentGaps.length > 0 ? contentGaps : [
      `Most coverage remains superficial without practical breakdown`,
      `Generic advice fails to address the specific needs of ${audience}`,
    ],
    recommendedStructure: payload.research?.recommendedStructure || `## Strategic Framework for ${topic}\n\n1. **Hook**: Direct engagement with core tension.\n2. **Evidence**: Deep dive with verified context.\n3. **Resolution**: Actionable framework and next steps.`,
    keyPoints: keyPoints,
    yourAngleStrength: angle,
    corpus: corpus,
    verifiedSources: snapshot?.verifiedSources || [],
    keywords: corpus.keywords || payload.keywords || [],
    researchConfidence: snapshot?.researchConfidence || 0.85,
  };

  const opportunity = {
    topic: topic,
    title: topic,
    angle: angle,
    hook: payload.hookIdea || payload.hook || "",
    suggestedHook: payload.hookIdea || payload.hook || "",
    platform: payload.platform || "general",
    format: payload.contentType || "post",
    contentType: payload.contentType || "post",
    targetAudience: audience,
    differentiation: payload.differentiation || angle,
    keyPoints: keyPoints,
    scores: payload.scores || {},
  };

  const contract = buildStage1To2Contract({
    ideaId,
    snapshot,
    opportunity,
    creatorProfile,
  });

  const contentIdea = new ContentIdea({
    ideaId,
    userId,
    topic: topic,
    angle: angle,
    platform: payload.platform || "general",
    contentType: payload.contentType || "post",
    targetAudience: audience,
    hookIdea: payload.hookIdea || "",
    keyPoints: keyPoints,
    scores: payload.scores || contract.scores,
    research: enrichedResearch,
    status: "approved",
    schemaVersion: "1.0",
    researchSnapshotId: payload.researchSnapshotId || null,
    requestHash: payload.requestHash || null,
    contract,
  });

  const contentBrief = contentIdea.toDynamoItem();
  await saveIdea(contentBrief);

  return {
    success: true,
    ideaId,
    contentBrief,
    contract,
    message: "Idea approved and ready for Phase 2 drafting",
  };
}

/**
 * Get User Ideas Flow
 */
export async function getUserIdeasFlow(userId) {
  const ideas = await getUserIdeas(userId);
  const ideasWithContentStatus = await Promise.all(
    ideas.map(async (idea) => {
      const hasContent = await hasContentForIdea(userId, idea.ideaId);
      const topic = idea.topic || idea.title || "Untitled Topic";
      const audience = idea.targetAudience || "General Audience";
      const angle = idea.angle || "Strategic perspective";

      // Ensure research is always populated with rich data
      const existingResearch = idea.research || {};
      const hasPainPoints = Array.isArray(existingResearch.audiencePainPoints) && existingResearch.audiencePainPoints.length > 0;
      const hasKeyPoints = Array.isArray(existingResearch.keyPoints) && existingResearch.keyPoints.length > 0;

      const enrichedResearch = {
        ...existingResearch,
        audiencePainPoints: hasPainPoints
          ? existingResearch.audiencePainPoints
          : [
              `Seeking clear, actionable clarity on ${topic}`,
              `Navigating conflicting information and tactical execution challenges`,
              `Desire for proven frameworks and practical insights for ${audience}`,
            ],
        competitorPatterns: (Array.isArray(existingResearch.competitorPatterns) && existingResearch.competitorPatterns.length > 0)
          ? existingResearch.competitorPatterns
          : [
              `Most coverage remains superficial without practical breakdown`,
              `Generic advice fails to address the specific needs of ${audience}`,
            ],
        recommendedStructure: existingResearch.recommendedStructure || `## Strategic Framework for ${topic}\n\n1. **Hook**: Direct engagement with core tension.\n2. **Evidence**: Deep dive with verified context.\n3. **Resolution**: Actionable framework and next steps.`,
        keyPoints: hasKeyPoints
          ? existingResearch.keyPoints
          : (Array.isArray(idea.keyPoints) && idea.keyPoints.length > 0)
          ? idea.keyPoints
          : [
              `Context and core market tension for ${topic}`,
              `Strategic breakdown and actionable insights`,
              `Practical application and high-impact takeaway for ${audience}`,
            ],
        yourAngleStrength: existingResearch.yourAngleStrength || angle,
      };

      return {
        ...idea,
        research: enrichedResearch,
        hasContent,
      };
    })
  );

  return {
    success: true,
    ideas: ideasWithContentStatus,
    count: ideasWithContentStatus.length,
  };
}

/**
 * Get User Research Snapshots Flow (Research History)
 */
export async function getUserSnapshotsFlow(userId) {
  const snapshots = await getUserSnapshots(userId);
  return {
    success: true,
    history: snapshots,
    count: snapshots.length,
  };
}

/**
 * Enrich Idea Research Flow: Run research on an existing idea and persist enriched data
 */
export async function enrichIdeaResearchFlow(userId, ideaId) {
  if (!userId || !ideaId) {
    throw new Error("userId and ideaId are required");
  }

  const existingIdea = await getIdeaById(userId, ideaId);
  if (!existingIdea) {
    throw new Error("Idea not found or access denied");
  }

  const topic = existingIdea.topic || existingIdea.title;
  const audience = existingIdea.targetAudience || "General Audience";
  const platform = existingIdea.platform || "general";

  // Execute deep research session via orchestrator with live web search enabled
  const researchResult = await researchIdeaFlow(userId, {
    idea: topic,
    audience,
    platform,
    enableLiveWebSearch: true,
  });

  const snapshot = researchResult.research;
  const corpus = snapshot?.corpus || {};
  const painPoints = corpus.audiencePainPoints?.map((p) => (typeof p === "string" ? p : p.point || p.description)) || [];
  const contentGaps = corpus.contentGaps?.map((g) => (typeof g === "string" ? g : g.description || g.gap)) || [];
  const keyPoints = corpus.keyPoints || existingIdea.keyPoints || [];

  const enrichedResearch = {
    audiencePainPoints: painPoints,
    competitorPatterns: contentGaps,
    recommendedStructure: `## Strategic Framework for ${topic}\n\n1. **Hook**: Address key audience tension directly.\n2. **Evidence**: Anchor in verified market context.\n3. **Resolution**: Deliver high-value, actionable solution.`,
    keyPoints: keyPoints,
    yourAngleStrength: existingIdea.angle || "Differentiated perspective",
    corpus: corpus,
    verifiedSources: snapshot?.verifiedSources || [],
    keywords: corpus.keywords || [],
    researchConfidence: snapshot?.researchConfidence || 0.85,
  };

  await updateIdeaResearch(userId, ideaId, enrichedResearch, keyPoints);

  const updatedIdea = await getIdeaById(userId, ideaId);

  return {
    success: true,
    research: enrichedResearch,
    idea: updatedIdea,
    message: "Research enriched and saved successfully",
  };
}

/**
 * Delete Idea Flow (Enforces userId ownership)
 */
export async function deleteIdeaFlow(userId, ideaId) {
  if (!userId || !ideaId) {
    throw new Error("userId and ideaId are required");
  }

  const existing = await getIdeaById(userId, ideaId);
  if (!existing) {
    throw new Error("Idea not found or access denied");
  }

  await deleteIdea(userId, ideaId);
  return {
    success: true,
    message: "Idea deleted successfully",
    ideaId,
  };
}
