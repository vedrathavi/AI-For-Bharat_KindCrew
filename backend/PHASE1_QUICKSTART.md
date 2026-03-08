# Phase 1: Ideation & Research - Quick Start

## 🚀 What Was Built

A complete Phase 1 system that transforms user ideas into validated content briefs.

### Three Entry Points:

1. **Zero Idea** → System generates 10 ideas from profile
2. **Some Idea** → System refines rough idea into 5 angles  
3. **Full Idea** → System evaluates and improves existing idea

### Output: Validated Content Brief

```json
{
  "ideaId": "uuid",
  "userId": "uuid",
  "topic": "5 AI tools founders use to save 10 hours/week",
  "angle": "practical productivity tool list",
  "platform": "linkedin",
  "contentType": "list-post",
  "targetAudience": "startup founders",
  "hookIdea": "Most founders waste hours...",
  "keyPoints": ["AI meeting assistant", "AI automation", "AI research"],
  "scores": {
    "virality": 8.9,
    "clarity": 8.5,
    "competition": 6.2,
    "overall": 8.4
  },
  "research": {
    "audiencePainPoints": ["too many tools", "lack of time"],
    "competitorPatterns": ["list posts"]
  },
  "status": "approved"
}
```

---

## 📁 File Structure

```
backend/
├── services/
│   ├── ideationService.js          # AI logic (generate/refine/evaluate)
│   ├── googleTrendsService.js       # Google Trends integration  
│   ├── ddbIdeationService.js        # DynamoDB CRUD operations
│   └── bedrock.service.js           # ✓ (existing - reused)
│
├── controllers/
│   ├── ideationController.js        # 6 HTTP handlers
│   └── bedrockController.js         # ✓ (existing)
│
├── routes/
│   ├── ideationRoutes.js            # 6 endpoints
│   └── bedrockRoutes.js             # ✓ (existing)
│
├── scripts/
│   ├── setupIdeationTable.js        # Create DynamoDB table
│   └── testBedrock.js               # ✓ (existing)
│
└── config/
    └── app.js                       # ✓ Updated with ideation routes
```

---

## 🔌 Six API Endpoints

### 1. Generate Ideas (Zero Start)
```
POST /api/ideation/generate
Body: { userId, niche, audience, platforms, goal }
Returns: 10 scored ideas sorted by overall score
```

### 2. Refine Ideas (Some Start)
```
POST /api/ideation/refine
Body: { userId, roughIdea, audience, platform }
Returns: 5 refined angles with scores
```

### 3. Evaluate Idea (Full Start)
```
POST /api/ideation/evaluate
Body: { userId, idea, audience, platform }
Returns: Evaluated idea with scores + Google Trends data
```

### 4. Research Idea
```
POST /api/ideation/research
Body: { userId, idea, audience }
Returns: Pain points, competitor patterns, key points
```

### 5. Select & Save Idea
```
POST /api/ideation/select
Body: { userId, topic, angle, platform, contentType, ... }
Returns: Saves to DynamoDB, returns ideaId
```

### 6. Get User Ideas
```
GET /api/ideation/my-ideas?userId=user-123
Returns: All ideas for user
```

---

## 💾 Database Schema

**Table**: `KindCrew-ContentIdeas`

| Field | Type | Notes |
|-------|------|-------|
| userId | string | Partition Key |
| ideaId | string | Sort Key |
| topic | string | Content idea title |
| angle | string | Unique angle |
| platform | string | linkedin, twitter, etc |
| contentType | string | list-post, story, carousel |
| targetAudience | string | Who it's for |
| hookIdea | string | Opening hook |
| keyPoints | array | Discussion points |
| scores | object | virality, clarity, competition, overall |
| research | object | painPoints, competitorPatterns |
| status | string | approved, draft |
| createdAt | ISO date | When created |

---

## 🤖 AI Integration

**Model**: Google Gemini 3.12B (via Bedrock)
**Framework**: Promise-based, error handling built-in
**Prompts**: Extracted from spec, optimized for JSON output

Three AI calls:
1. **generateZeroIdeas** → 10 ideas
2. **refineSomeIdea** → 5 angles
3. **evaluateFullIdea** → Scores + improvements

---

## 📊 Scoring System

```
overall = 
  0.4 * virality +
  0.3 * audience_relevance +
  0.2 * clarity +
  0.1 * (10 - competition)
```

**Competition data**: Real-time from Google Trends
- Higher trending = higher competition
- Auto-calculated from search volume

---

## 🔗 Google Trends Integration

```javascript
// Get trending topics
getTrendingTopics("AI productivity tools")

// Get related queries
getRelatedQueries("AI productivity tools")

// Analyze competition level
analyzeTrendCompetition(trendData)
```

Returns: Real-time competition score (1-10)

---

## ⚙️ Setup Instructions

### 1. Create DynamoDB Table

```bash
node scripts/setupIdeationTable.js
```

Creates `KindCrew-ContentIdeas` with on-demand billing.

### 2. Start Server

```bash
npm start
```

Server runs on port 5000.

### 3. Test Endpoint

```bash
curl -X POST http://localhost:5000/api/ideation/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "niche": "AI productivity",
    "audience": "startup founders",
    "platforms": ["linkedin"],
    "goal": "growth"
  }'
```

---

## 🔄 User Journey

```
Dashboard
   ↓
"How clear is your idea?"
   ↓
Zero / Some / Full
   ↓
[API Call: generate/refine/evaluate]
   ↓
"Here are scored ideas..."
   ↓
User selects one
   ↓
[API Call: research]
   ↓
"Here's what we found..."
   ↓
User confirms
   ↓
[API Call: select]
   ↓
Saved to DB ✓
   ↓
Ready for Phase 2
```

---

## 📋 Phase 2 Contract

Phase 2 receives this from Phase 1:

```json
{
  "ideaId": "uuid (from Phase 1)",
  "userId": "uuid",
  "topic": "string",
  "angle": "string",
  "platform": "string",
  "contentType": "string",
  "targetAudience": "string",
  "hookIdea": "string",
  "keyPoints": ["string"]
}
```

Phase 2 uses it to generate:
- Full post content
- Captions
- Images (via DALL-E or similar)
- Social media versions

---

## 🔒 AWS Permissions Needed

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/KindCrew-ContentIdeas"
    }
  ]
}
```

---

## ✅ Features

- ✅ Three entry points (zero/some/full idea)
- ✅ Bedrock AI integration (Gemini 3.12B)
- ✅ Google Trends for competition analysis
- ✅ DynamoDB persistence
- ✅ Scoring formula (weighted)
- ✅ Research layer (pain points, competitors)
- ✅ JSON-only responses
- ✅ Error handling
- ✅ Minimal, clean code
- ✅ Future-proof architecture

---

## 🚀 Next Steps

1. ✅ Phase 1 complete
2. → Build Phase 2 (Content Generation)
3. → Build Phase 3 (Image Generation)
4. → Build Phase 4 (Publishing)

---

## 📝 Notes

- **Minimal**: ~400 lines of core logic
- **Simple**: No complex abstractions
- **Future-Proof**: Easy to swap AI models or data sources
- **Production-Ready**: Error handling, environment vars, DynamoDB on-demand
- **Documented**: 100% API spec + examples

---

**Phase 1 transforms uncertainty into validated ideas. Ready for Phase 2!** 🎯
