# Phase 2: Content Generation System

## Overview

Phase 2 is the **Content Compiler** that transforms ideas (from Phase 1 or manual input) into complete multi-platform content packages ready for distribution.

```
Idea → Structured Content → Platform Variants → Distribution
```

---

## Architecture

### Entry Points

#### 1. From Phase 1 Ideation

Users can generate content directly from saved ideas by clicking "Generate Content" button in My Ideas page.

#### 2. Manual Content Creation

Users can skip Phase 1 and create content from scratch at `/content/create`.

### Content Generation Pipeline

```
1. Receive Input (Phase 1 OR Manual)
   ↓
2. Normalize Input Format
   ↓
3. Generate Content Outline
   ↓
4. Generate Draft Content
   ↓
5. Generate Platform Variants
   ↓
6. Generate Video Scripts (conditional)
   ↓
7. Save Complete Package
   ↓
8. Ready for Phase 3 Distribution
```

---

## Supported Platforms

### Text-Based Platforms

- **LinkedIn** - Professional networking posts
- **Twitter/X** - Thread-based microblogging
- **Reddit** - Community-focused discussions
- **Medium** - Long-form blog articles

### Video-Enabled Platforms

- **YouTube** - Video metadata + script
- **Instagram** - Carousel/Reel + caption + script

### Platform-Specific Features

#### LinkedIn Package

```json
{
  "platform": "linkedin",
  "postText": "Complete post with formatting",
  "hashtags": ["#AI", "#Tech"],
  "estimatedReadingTime": "45 seconds"
}
```

#### Twitter Package

```json
{
  "platform": "twitter",
  "thread": ["Tweet 1", "Tweet 2", "Tweet 3"],
  "tweetCount": 3,
  "hashtags": ["#AI"]
}
```

#### Instagram Package

```json
{
  "platform": "instagram",
  "caption": "Instagram caption",
  "hashtags": ["#tech", "#ai"],
  "altText": "Image description",
  "coverText": "Slide 1 text",
  "tagSuggestions": ["tech", "ai"]
}
```

#### Reddit Package

```json
{
  "platform": "reddit",
  "title": "Post title",
  "postBody": "Post content",
  "subredditSuggestions": ["Entrepreneur", "Startups"]
}
```

#### YouTube Package

```json
{
  "platform": "youtube",
  "title": "Video title",
  "description": "Video description",
  "tags": ["tag1", "tag2"],
  "chapters": ["Chapter 1", "Chapter 2"],
  "thumbnailText": "Thumbnail text",
  "shortHook": "YouTube Shorts hook"
}
```

#### Medium Package

```json
{
  "platform": "medium",
  "title": "Article title",
  "subtitle": "Article subtitle",
  "body": "Complete article body",
  "tags": ["AI", "Tech"],
  "seoDescription": "SEO description",
  "readingTime": "5 min"
}
```

---

## Database Schema

### DynamoDB Table: `KindCrew-ContentItems`

**Keys:**

- Partition Key: `userId` (String)
- Sort Key: `contentId` (String)

**Global Secondary Index:**

- `CreatedAtIndex`: userId + createdAt

**Complete Schema:**

```javascript
{
  contentId: "uuid",
  userId: "uuid",

  // Metadata
  source: "phase1 | manual",
  ideaId: "uuid",  // if from Phase 1

  // Content Info
  topic: "string",
  angle: "string",
  targetAudience: "string",
  goal: "growth | engagement | authority | conversion",
  contentType: "list-post | story | educational | tutorial",

  // Content Structure
  outline: {
    title: "string",
    hook: "string",
    sections: ["section1", "section2"],
    cta: "string",
    contentFormat: "list | story | educational",
    estimatedWordCount: 150
  },

  // Draft Content
  draft: {
    text: "complete draft text"
  },

  // Platform Variants
  platformVariants: {
    linkedin: {},
    twitter: {},
    instagram: {},
    youtube: {},
    reddit: {},
    medium: {}
  },

  // Video Scripts (conditional)
  scripts: {
    youtube: {
      duration: "45 seconds",
      sections: [
        { type: "hook", text: "..." },
        { type: "point", text: "..." },
        { type: "cta", text: "..." }
      ]
    },
    instagramReel: {}
  },

  // Distribution
  distribution: {
    status: "draft | scheduled | published",
    platformTargets: ["linkedin", "twitter"],
    scheduledAt: "ISO_DATE"
  },

  // Analytics
  analytics: {
    likes: 0,
    comments: 0,
    shares: 0
  },

  // Timestamps
  createdAt: "ISO_DATE",
  updatedAt: "ISO_DATE"
}
```

---

## Backend API Endpoints

### Content Creation

#### `POST /api/content/from-idea`

Create content from Phase 1 idea.

**Request:**

```json
{
  "userId": "uuid",
  "ideaId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "content": {
    "contentId": "uuid",
    "platformVariants": {},
    ...
  }
}
```

---

#### `POST /api/content/from-manual`

Create content from manual input.

**Request:**

```json
{
  "userId": "uuid",
  "topic": "5 AI tools founders use",
  "platforms": ["linkedin", "twitter"],
  "contentType": "list-post",
  "targetAudience": "startup founders",
  "goal": "engagement",
  "hookIdea": "Most founders waste hours...",
  "keyPoints": ["AI meeting assistant", "Automation"],
  "preferences": {
    "tone": "professional",
    "length": "medium",
    "includeCTA": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "content": { ... }
}
```

---

### Content Retrieval

#### `GET /api/content/user?userId=uuid`

Get all content for a user.

**Response:**

```json
{
  "success": true,
  "count": 5,
  "content": [ ... ]
}
```

---

#### `GET /api/content/:contentId?userId=uuid`

Get specific content by ID.

**Response:**

```json
{
  "success": true,
  "content": { ... }
}
```

---

### Content Generation Steps

#### `POST /api/content/generate-outline`

Generate outline only (for preview/refinement).

**Request:**

```json
{
  "topic": "AI tools",
  "platforms": ["linkedin"],
  "contentType": "list-post",
  "targetAudience": "founders",
  "hookIdea": "Most founders waste hours...",
  "keyPoints": ["point1", "point2"]
}
```

**Response:**

```json
{
  "success": true,
  "outline": {
    "title": "...",
    "hook": "...",
    "sections": [],
    "cta": "..."
  }
}
```

---

#### `POST /api/content/generate-draft`

Generate draft from outline.

**Request:**

```json
{
  "outline": { ... },
  "topic": "...",
  "targetAudience": "...",
  "preferences": { ... }
}
```

**Response:**

```json
{
  "success": true,
  "draft": {
    "text": "complete post text"
  }
}
```

---

### Content Management

#### `POST /api/content/regenerate-variant`

Regenerate variant for specific platform.

**Request:**

```json
{
  "userId": "uuid",
  "contentId": "uuid",
  "platform": "linkedin"
}
```

**Response:**

```json
{
  "success": true,
  "variant": { ... },
  "content": { ... }
}
```

---

#### `POST /api/content/update-status`

Update distribution status.

**Request:**

```json
{
  "userId": "uuid",
  "contentId": "uuid",
  "status": "scheduled",
  "scheduledAt": "2026-03-10T09:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "content": { ... }
}
```

---

## Frontend Pages

### `/content/create`

Manual content creation page with form inputs:

- Topic/Idea
- Target Platforms (multi-select)
- Content Type
- Target Audience
- Goal
- Hook Idea
- Key Points (dynamic list)
- Tone
- Content Length
- CTA preference

### `/content/library`

Content library page displaying:

- All generated content items
- Platform variant preview modals
- Status badges (draft/scheduled/published)
- Regenerate variant buttons
- Copy to clipboard functionality
- Navigation to Phase 3 distribution

### `/ideation/my-ideas` (Enhanced)

Added "Generate Content" button to each idea card that:

- Triggers content generation from idea
- Shows loading state
- Redirects to content library on success

---

## Code Organization

### Backend Services

**`services/ddbContentService.js`**

- DynamoDB operations for content_items table
- CRUD operations
- Distribution status updates
- Platform variant updates

**`services/contentGenerationService.js`**

- AI-powered content generation
- Outline generation
- Draft generation
- Platform variant generation
- Video script generation

### Backend Controllers

**`controllers/contentController.js`**

- HTTP request handlers
- Input normalization
- Orchestration of generation pipeline
- Error handling

### Backend Routes

**`routes/contentRoutes.js`**

- Route definitions for all content endpoints
- Registered at `/api/content/*`

### Frontend API

**`lib/api/content.ts`**

- TypeScript client functions
- All API endpoint wrappers

### Frontend Pages

**`app/content/create/page.tsx`**

- Manual content creation form
- Form validation
- Platform selection

**`app/content/library/page.tsx`**

- Content list display
- Platform variant modals
- Status management
- Regenerate functionality

---

## Setup Instructions

### 1. Create DynamoDB Table

```bash
cd backend
node scripts/setupContentTable.js
```

This creates the `KindCrew-ContentItems` table with proper schema.

### 2. Environment Variables

Ensure `.env` file has:

```
AWS_REGION=us-east-1
BEDROCK_DEFAULT_MODEL=anthropic.claude-3-5-sonnet-20240620-v1:0
```

### 3. Install Dependencies

Backend already has required AWS SDK packages.

Frontend already has required dependencies.

### 4. Start Services

**Backend:**

```bash
cd backend
npm run dev
```

**Frontend:**

```bash
cd frontend
npm run dev
```

---

## Testing

### Test Flow 1: From Phase 1

1. Go to `/ideation` and generate ideas
2. Save an idea to My Ideas
3. Click "Generate Content" button on saved idea
4. Wait for generation (30-60 seconds)
5. View generated content in library
6. Preview platform variants
7. Copy content or schedule for distribution

### Test Flow 2: Manual Creation

1. Go to `/content/create`
2. Fill out the form
3. Select multiple platforms
4. Submit form
5. Wait for generation
6. View in library

### Test Flow 3: Regenerate Variant

1. Open content library
2. Click "View LinkedIn" on any content
3. Click "Regenerate" button
4. Wait for new variant
5. Compare with previous version

---

## Phase 2 → Phase 3 Contract

Phase 3 (Distribution) will consume:

```javascript
{
  contentId: "uuid",
  platformVariants: {
    linkedin: {
      postText: "...",
      hashtags: [],
      estimatedReadingTime: "45 seconds"
    },
    twitter: {
      thread: ["tweet1", "tweet2"],
      hashtags: []
    }
  },
  distribution: {
    status: "draft",
    platformTargets: ["linkedin", "twitter"],
    scheduledAt: null
  }
}
```

No transformation needed - Phase 3 reads directly from stored data.

---

## AI Prompts Strategy

### Outline Generation

- Focuses on structure and flow
- Returns JSON with title, hook, sections, CTA
- Platform-optimized recommendations

### Draft Generation

- Converts outline to full post text
- Platform-appropriate tone and length
- Includes formatting and line breaks

### Platform Variants

- Each platform has dedicated prompt
- Platform-specific best practices
- Optimized hashtags and metadata

### Video Scripts

- Only generated for video platforms
- Timed sections for pacing
- Hook-based opening

---

## Error Handling

All endpoints return:

```json
{
  "success": false,
  "error": "Error message"
}
```

Frontend displays errors in UI and allows retry.

---

## Future Enhancements

### Phase 2.1 (Planned)

- Content templates library
- A/B testing variants
- Brand voice consistency checker
- Content calendar integration

### Phase 2.2 (Planned)

- Image generation integration
- Video thumbnail generation
- Carousel slide generator
- SEO optimization tools

---

## Performance Considerations

- **Generation Time**: 30-60 seconds per content package
- **Database**: O(1) reads using partition key
- **Caching**: Consider caching platform variants
- **Rate Limiting**: AWS Bedrock has throughput limits

---

## Support

For issues or questions about Phase 2:

1. Check backend logs for AI errors
2. Verify DynamoDB table schema
3. Test endpoints individually
4. Check AWS Bedrock API limits

---

## Summary

Phase 2 successfully transforms ideas into production-ready multi-platform content packages with:

- ✅ Dual entry points (Phase 1 + Manual)
- ✅ 6 platform variants per content
- ✅ Video script generation
- ✅ Complete DynamoDB persistence
- ✅ Easy regeneration and editing
- ✅ Clean Phase 3 handoff

**Status:** Production Ready
