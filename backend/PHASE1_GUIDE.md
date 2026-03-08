# Phase 1: Ideation & Research - Implementation Guide

## Overview

Phase 1 transforms user context + idea clarity into a **validated content brief** ready for Phase 2.

**Three paths:**
- **Zero Idea**: Generate 10 ideas from user profile
- **Some Idea**: Refine rough idea into 5 strategic angles
- **Full Idea**: Evaluate and improve existing idea

**Output**: Content brief with scores, research, and trends data

---

## Architecture

```
Frontend (Next.js)
    ↓
Ideation API (Express)
    ↓
Bedrock AI (Gemini 3.12B)
    ↓
Google Trends API
    ↓
DynamoDB (ContentIdeas table)
```

---

## Setup

### 1. Install Dependencies

```bash
npm install google-trends-api uuid
```

### 2. Create DynamoDB Table

```bash
node scripts/setupIdeationTable.js
```

This creates `KindCrew-ContentIdeas` table with:
- Partition Key: `userId`
- Sort Key: `ideaId`
- Billing: On-demand

---

## API Endpoints

### Zero Idea Flow - Generate Ideas

**POST** `/api/ideation/generate`

```json
{
  "userId": "user-123",
  "niche": "AI productivity",
  "audience": "startup founders",
  "platforms": ["linkedin", "twitter"],
  "goal": "growth"
}
```

**Response:**

```json
{
  "success": true,
  "ideas": [
    {
      "title": "5 AI tools every startup founder should try",
      "angle": "tool recommendations",
      "platform": "linkedin",
      "format": "list-post",
      "description": "A practical list...",
      "scores": {
        "virality": 8.2,
        "clarity": 8.9,
        "competition": 5.1,
        "overall": 8.1
      }
    }
  ],
  "count": 10
}
```

---

### Some Idea Flow - Refine Idea

**POST** `/api/ideation/refine`

```json
{
  "userId": "user-123",
  "roughIdea": "AI productivity tools",
  "audience": "startup founders",
  "platform": "linkedin"
}
```

**Response:**

```json
{
  "success": true,
  "ideas": [
    {
      "title": "5 AI tools founders use to save 10 hours/week",
      "angle": "tool productivity list",
      "format": "list-post",
      "hook": "Founders waste hours doing repetitive tasks.",
      "scores": {
        "virality": 8.5,
        "clarity": 9.0,
        "competition": 5.2,
        "overall": 8.5
      }
    }
  ]
}
```

---

### Full Idea Flow - Evaluate Idea

**POST** `/api/ideation/evaluate`

```json
{
  "userId": "user-123",
  "idea": "Top AI tools founders can use to automate repetitive work",
  "audience": "startup founders",
  "platform": "linkedin"
}
```

**Response:**

```json
{
  "success": true,
  "evaluation": {
    "improvedTitle": "5 AI tools founders use to save 10 hours/week",
    "suggestedHook": "Most founders waste hours doing repetitive work.",
    "format": "list-post",
    "scores": {
      "virality": 8.7,
      "clarity": 9.1,
      "competition": 6,
      "overall": 8.4
    }
  }
}
```

---

### Research an Idea

**POST** `/api/ideation/research`

```json
{
  "userId": "user-123",
  "idea": "5 AI tools founders use to save 10 hours/week",
  "audience": "startup founders"
}
```

**Response:**

```json
{
  "success": true,
  "research": {
    "audiencePainPoints": [
      "too many tools",
      "lack of time",
      "analysis paralysis"
    ],
    "competitorPatterns": [
      "list posts",
      "framework posts",
      "comparison posts"
    ],
    "recommendedStructure": "hook → tools list → actionable tips",
    "keyPoints": [
      "AI meeting assistant",
      "AI research tool",
      "automation workflow"
    ]
  }
}
```

---

### Select & Approve Idea

**POST** `/api/ideation/select`

```json
{
  "userId": "user-123",
  "topic": "5 AI tools founders use to save 10 hours/week",
  "angle": "practical productivity tool list",
  "platform": "linkedin",
  "contentType": "list-post",
  "targetAudience": "startup founders",
  "hookIdea": "Most founders waste hours doing repetitive work.",
  "keyPoints": [
    "AI meeting assistant",
    "AI automation workflow",
    "AI research assistant"
  ],
  "scores": {
    "virality": 8.9,
    "clarity": 8.5,
    "competition": 6.2,
    "overall": 8.4
  },
  "research": {
    "audiencePainPoints": ["too many tools", "lack of time"],
    "competitorPatterns": ["list posts"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "ideaId": "uuid-here",
  "contentBrief": {
    "ideaId": "uuid",
    "userId": "user-123",
    "topic": "5 AI tools founders use to save 10 hours/week",
    "angle": "practical productivity tool list",
    "platform": "linkedin",
    "contentType": "list-post",
    "status": "approved"
  },
  "message": "Idea approved and ready for Phase 2"
}
```

---

### Get User's Ideas

**GET** `/api/ideation/my-ideas?userId=user-123`

**Response:**

```json
{
  "success": true,
  "ideas": [
    {
      "ideaId": "uuid",
      "userId": "user-123",
      "topic": "5 AI tools founders use to save 10 hours/week",
      "status": "approved",
      "createdAt": "2024-03-07T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

## Scoring Formula

```
overall = 
  0.4 * virality +
  0.3 * audienceRelevance +
  0.2 * clarity +
  0.1 * (10 - competition)
```

**Scoring Ranges:**
- **Virality** (1-10): Hook strength, relatability, shareability
- **Clarity** (1-10): Idea clarity and focus
- **Audience Relevance** (1-10): Match with niche and audience
- **Competition** (1-10): Google Trends data (higher = more saturated)

---

## Database Schema

**Table**: `KindCrew-ContentIdeas`

```json
{
  "userId": "string (PK)",
  "ideaId": "string (SK)",
  
  "ideaLevel": "zero | some | full",
  "originalIdea": "string",
  "topic": "string",
  "angle": "string",
  
  "platform": "string",
  "contentType": "string",
  "hookIdea": "string",
  
  "keyPoints": ["string"],
  
  "scores": {
    "virality": "number",
    "clarity": "number",
    "competition": "number",
    "overall": "number"
  },
  
  "research": {
    "audiencePainPoints": ["string"],
    "competitorPatterns": ["string"]
  },
  
  "status": "approved | draft",
  "createdAt": "ISO_DATE"
}
```

---

## File Structure

```
backend/
├── services/
│   ├── ideationService.js           # Core AI logic
│   ├── googleTrendsService.js        # Google Trends integration
│   └── ddbIdeationService.js        # DynamoDB operations
├── controllers/
│   └── ideationController.js         # API handlers
├── routes/
│   └── ideationRoutes.js             # Route definitions
├── scripts/
│   └── setupIdeationTable.js        # DynamoDB setup
└── config/
    └── app.js                        # Updated with ideation routes
```

---

## Key Features

### ✅ Google Trends Integration
- Real-time competition analysis
- Trend momentum data
- Related search patterns

### ✅ Bedrock AI
- Consistent AI model (Gemini 3.12B)
- JSON-only responses
- Fallback scoring if AI fails

### ✅ Dynamic Scoring
- 40% virality, 30% audience, 20% clarity, 10% competition
- Google Trends-based competition
- Sorted by score

### ✅ Future-Proof Design
- Modular service architecture
- Easy to swap AI models
- Minimal dependencies

---

## Example Workflows

### Workflow 1: Zero Idea → Approved

```
1. POST /ideation/generate
   ↓
2. User selects top idea
   ↓
3. POST /ideation/research (for selected idea)
   ↓
4. POST /ideation/select (save to DB)
   ↓
5. Ready for Phase 2
```

### Workflow 2: Some Idea → Approved

```
1. POST /ideation/refine
   ↓
2. User selects best angle
   ↓
3. POST /ideation/research
   ↓
4. POST /ideation/select
   ↓
5. Ready for Phase 2
```

### Workflow 3: Full Idea → Approved

```
1. POST /ideation/evaluate
   ↓
2. User reviews evaluation
   ↓
3. POST /ideation/research
   ↓
4. POST /ideation/select
   ↓
5. Ready for Phase 2
```

---

## Phase 2 Input Contract

Phase 2 expects this exact structure:

```json
{
  "ideaId": "uuid",
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

---

## Error Handling

All endpoints return:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common errors:
- Missing required fields (400)
- AI processing error (500)
- DynamoDB error (500)

---

## Testing

### Test Zero Idea Flow

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

### Test Full Idea Flow

```bash
curl -X POST http://localhost:5000/api/ideation/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "idea": "5 AI tools for startup founders",
    "audience": "startup founders",
    "platform": "linkedin"
  }'
```

---

## Next Steps

✅ Phase 1 complete
→ Pass contentBrief to Phase 2
→ Phase 2 generates full content (post, captions, images)

---

## Notes

- Google Trends has rate limits (~5 req/min)
- Bedrock calls cost money - monitor usage
- DynamoDB on-demand billing (no setup costs)
- AI responses are parsed for JSON only
- Scores are calculated deterministically
