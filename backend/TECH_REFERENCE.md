// PHASE 1: IDEATION SERVICE - TECHNICAL REFERENCE

/**
 * ============================================================================
 * FLOW 1: ZERO IDEA (Generate from nothing)
 * ============================================================================
 */

// User: "I have no idea what to write"
//
// Input: { niche, audience, platforms, goal }
//   ↓
// AI Prompt: "Generate 10 high-quality content ideas for..."
//   ↓
// Bedrock Response: [ { title, angle, format, platform, description }, ... ]
//   ↓
// Score Each: 0.4 * virality + 0.3 * audience + 0.2 * clarity + 0.1 * (10 - competition)
//   ↓
// Sort by Score (descending)
//   ↓
// Return: [10 scored ideas]

// Example Output:
// [
//   {
//     title: "5 AI tools every startup founder should try",
//     angle: "tool recommendations",
//     platform: "linkedin",
//     format: "list-post",
//     scores: { virality: 8.2, clarity: 8.9, competition: 5.1, overall: 8.1 }
//   },
//   ...
// ]

/**
 * ============================================================================
 * FLOW 2: SOME IDEA (Refine rough idea)
 * ============================================================================
 */

// User: "I want to write about AI productivity tools"
//
// Input: { roughIdea, audience, platform }
//   ↓
// AI Prompt: "Refine this idea into 5 strategic angles for..."
//   ↓
// Bedrock Response: [ { title, angle, format, hook }, ... ]
//   ↓
// Score Each: Same formula
//   ↓
// Sort by Score
//   ↓
// Return: [5 refined angles]

/**
 * ============================================================================
 * FLOW 3: FULL IDEA (Evaluate existing idea)
 * ============================================================================
 */

// User: "I want to write: 'Top 5 AI tools founders can use to automate work'"
//
// Input: { idea, audience, platform }
//   ↓
// AI Prompt: "Evaluate this idea and suggest improvements..."
//   ↓
// Bedrock Response: { viralityScore, clarityScore, competitionScore, ... }
//   ↓
// Get Real Competition: Google Trends API for the keyword
//   ↓
// Calculate Overall Score
//   ↓
// Return: Evaluated idea with all scores

/**
 * ============================================================================
 * ALL FLOWS: COMMON STEPS
 * ============================================================================
 */

// After user selects an idea:
//
// Step 1: Research
//   POST /ideation/research
//   ↓
//   AI Prompt: "What are pain points for this idea?"
//   ↓
//   Returns: { audiencePainPoints, competitorPatterns, keyPoints }
//
// Step 2: Save
//   POST /ideation/select
//   ↓
//   Save to DynamoDB KindCrew-ContentIdeas
//   ↓
//   Generate ideaId (UUID)
//   ↓
//   status: "approved"
//
// Step 3: Pass to Phase 2
//   Return ideaId to frontend
//   ↓
//   Frontend passes contentBrief to Phase 2
//   ↓
//   Phase 2 generates full post content

/**
 * ============================================================================
 * SCORING FORMULA BREAKDOWN
 * ============================================================================
 */

// overall = 0.4 * virality + 0.3 * audience + 0.2 * clarity + 0.1 * (10 - competition)
//
// Why these weights?
// - 40% Virality: Most important for social success
// - 30% Audience Relevance: Must match your niche
// - 20% Clarity: Idea must be understandable  
// - 10% Competition Inverse: Avoid over-saturated topics
//
// Example:
// virality: 9.0   → 0.4 * 9.0 = 3.6
// audience: 8.5   → 0.3 * 8.5 = 2.55
// clarity: 8.7    → 0.2 * 8.7 = 1.74
// competition: 6  → 0.1 * (10-6) = 0.4
//                  ───────────────
//                  overall = 8.29

/**
 * ============================================================================
 * GOOGLE TRENDS INTEGRATION
 * ============================================================================
 */

// For each idea keyword, we call Google Trends API:
//
// getTrendingTopics("5 AI tools for founders")
// ↓
// Returns: timelineData for last 30 days
// ↓
// Calculate average interest
// ↓
// Map to competition score (1-10)
//
// Competition Score Calculation:
// avgValue > 70  → competition = 8 (very high)
// avgValue > 50  → competition = 7 (high)
// avgValue > 30  → competition = 5 (medium)
// avgValue > 10  → competition = 4 (low)
// else           → competition = 3 (very low)

/**
 * ============================================================================
 * DATABASE: CONTENT_IDEAS TABLE
 * ============================================================================
 */

// Partition Key: userId
// Sort Key: ideaId
// Billing: On-demand (no setup cost)
//
// Example Item:
// {
//   userId: "user-123",
//   ideaId: "550e8400-e29b-41d4-a716-446655440000",
//   ideaLevel: "zero",
//   topic: "5 AI tools founders use to save 10 hours/week",
//   angle: "practical productivity tool list",
//   platform: "linkedin",
//   contentType: "list-post",
//   hookIdea: "Most founders waste hours doing repetitive work.",
//   keyPoints: [
//     "AI meeting assistant",
//     "AI automation workflow",
//     "AI research assistant"
//   ],
//   scores: {
//     virality: 8.9,
//     clarity: 8.5,
//     competition: 6.2,
//     overall: 8.4
//   },
//   research: {
//     audiencePainPoints: ["too many tools", "lack of time"],
//     competitorPatterns: ["list posts", "framework posts"]
//   },
//   status: "approved",
//   createdAt: "2024-03-07T10:30:00.000Z"
// }

/**
 * ============================================================================
 * API ENDPOINTS (6 Total)
 * ============================================================================
 */

// 1. Generate Ideas (Zero path)
//    POST /api/ideation/generate
//    Body: { userId, niche, audience, platforms, goal }
//    Response: { ideas: [...], count: 10 }
//
// 2. Refine Ideas (Some path)
//    POST /api/ideation/refine
//    Body: { userId, roughIdea, audience, platform }
//    Response: { ideas: [...], count: 5 }
//
// 3. Evaluate Idea (Full path)
//    POST /api/ideation/evaluate
//    Body: { userId, idea, audience, platform }
//    Response: { evaluation: {...} }
//
// 4. Research Idea
//    POST /api/ideation/research
//    Body: { userId, idea, audience }
//    Response: { research: {...} }
//
// 5. Select & Save Idea
//    POST /api/ideation/select
//    Body: { userId, topic, angle, platform, contentType, ... }
//    Response: { ideaId, contentBrief, message }
//
// 6. Get User Ideas
//    GET /api/ideation/my-ideas?userId=user-123
//    Response: { ideas: [...], count: n }

/**
 * ============================================================================
 * ERROR HANDLING
 * ============================================================================
 */

// All errors return: { success: false, error: "message" }
//
// Common errors:
// - 400: Missing required fields
// - 500: AI processing error
// - 500: DynamoDB error
// - 500: Google Trends error (graceful fallback to default score)

/**
 * ============================================================================
 * SERVICE LAYER ARCHITECTURE
 * ============================================================================
 */

// services/ideationService.js
// ├── generateZeroIdeas(profile)
// ├── refineSomeIdea(roughIdea, audience, platform)
// ├── evaluateFullIdea(idea, audience, platform)
// ├── researchIdea(idea, audience)
// ├── calculateScore(v, a, c, comp)
// ├── getCompetitionFromTrends(keyword)
// └── callBedrockAI(prompt, context)
//
// services/googleTrendsService.js
// ├── getTrendingTopics(keyword, timeframe)
// ├── getRelatedQueries(keyword)
// └── analyzeTrendCompetition(trendData)
//
// services/ddbIdeationService.js
// ├── saveIdea(idea)
// ├── getIdeaById(userId, ideaId)
// └── getUserIdeas(userId)

/**
 * ============================================================================
 * FUTURE EXTENSIONS (Easy to add)
 * ============================================================================
 */

// 1. Swap AI Model
//    - Change BEDROCK_DEFAULT_MODEL in .env
//    - Update callBedrockAI() if needed
//
// 2. Add More Scoring Factors
//    - Keyword search volume
//    - Competitor sentiment
//    - Seasonal trends
//
// 3. Integrate Different Trends API
//    - Swap google-trends-api in googleTrendsService.js
//    - Keep same interface
//
// 4. Add Idea Templates
//    - Pre-defined angles by niche
//    - Cached research data
//
// 5. Collaborative Ideation
//    - Add teamId to schema
//    - Multiple users working on same idea
//    - Vote/comment system

/**
 * ============================================================================
 * PERFORMANCE NOTES
 * ============================================================================
 */

// - Bedrock calls: ~2-5 seconds per call
// - Google Trends: ~1-2 seconds per call
// - DynamoDB: <100ms per operation
// - Total flow time: ~7-10 seconds
//
// Optimization opportunities:
// - Cache Google Trends data (1 hour)
// - Parallel API calls (generate + research together)
// - Batch DynamoDB writes

/**
 * ============================================================================
 * SECURITY NOTES
 * ============================================================================
 */

// - AWS credentials: From .env file
// - User validation: Add auth middleware (soon)
// - API rate limiting: Recommended (not implemented yet)
// - Google Trends: No authentication needed
// - Bedrock: IAM role-based access control

/**
 * ============================================================================
 * NEXT: PHASE 2
 * ============================================================================
 */

// Input from Phase 1:
// {
//   ideaId: "uuid",
//   userId: "uuid",
//   topic: "5 AI tools founders use to save 10 hours/week",
//   angle: "practical productivity tool list",
//   platform: "linkedin",
//   contentType: "list-post",
//   targetAudience: "startup founders",
//   hookIdea: "Most founders waste hours doing repetitive work.",
//   keyPoints: [...]
// }
//
// Phase 2 outputs:
// - Full post content (700-1000 words)
// - LinkedIn-native version
// - Twitter thread version
// - Suggested hashtags
// - Image briefs for designer
