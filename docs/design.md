# Design Document: AI Content Workspace

## System Overview

The AI Content Workspace is a modular web application that supports content creators through the complete content creation lifecycle. The system operates in both standalone mode (individual stages) and guided pipeline mode (end-to-end workflow), adapting to creator experience levels and improving recommendations through performance feedback loops.

**Core Capabilities:**
- Comprehensive user profile management with content preferences and constraints.
- AI-driven content ideation through three distinct modes (Zero-Idea, Rough-Idea, Ready-Plan).
- Platform-specific content generation with customization options.
- Copy-paste formatted content for all platforms, with optional experimental auto-posting where official APIs are publicly available.
- Automatic Google Calendar integration for content planning.
- Basic manual performance tracking with heuristic feedback into idea and content generation.

**System Architecture:**
The application follows a modular four-stage architecture: Research & Ideation, Creation & Optimization, Publishing & Distribution, and Analysis & Feedback Loop. Each stage can operate independently or as part of a sequential pipeline workflow.

## Technical Architecture

### System Design

The application follows a three-layer architecture with clear separation of concerns and modular stage implementation:

```
[React Frontend] 
       ↓ HTTP/HTTPS
[Node.js API Server]
       ↓ Database Driver
[MongoDB/DynamoDB]
```

**Presentation Layer (React):**
- Component-based UI supporting both pipeline and standalone modes.
- Stage-specific interfaces for Research, Creation, Publishing, and Analysis.
- Client-side state management for cross-stage data flow.
- Real-time status updates for content generation and posting operations.

**Application Layer (Node.js):**
- Stateless REST API server with Express framework.
- Authentication middleware supporting Google OAuth and AWS Cognito.
- AI orchestration service for Google Gemini and Amazon Bedrock integration.
- Modular service architecture for each content stage.
- Optional auto-posting integration for select platforms where official APIs and user authorization allow.

**Data Layer (MongoDB/DynamoDB):**
- Document-based storage optimized for user profiles, ideas, content, and performance data.
- Flexible schema supporting iterative development and feature expansion.
- Query patterns optimized for both standalone and pipeline workflows.

### Request Flow

**Pipeline Mode Content Generation Flow:**
1. Client initiates pipeline workflow from Research stage.
2. Server validates user profile and generates AI prompts with profile context.
3. Server calls AI service (Gemini/Bedrock) for idea generation.
4. Server processes and stores normalized Idea_Objects with scoring.
5. Client transitions to Creation stage with selected idea.
6. Server generates platform-specific content with customization options.
7. Client moves to Publishing stage for scheduling and posting.
8. Server provides formatted copy-paste content and may execute auto-posting where officially supported.
9. Client completes workflow in Analysis stage for performance tracking.

**Standalone Mode Access Flow:**
1. Client accesses individual stage directly.
2. Server applies user profile data and available historical insights.
3. Server processes stage-specific operations independently.
4. Server maintains data consistency for potential cross-stage usage.

**Authentication Flow:**
1. Client initiates Google OAuth or AWS Cognito authentication.
2. Server validates credentials and creates user session.
3. Server issues JWT tokens for subsequent API requests.
4. Client includes JWT in Authorization header for all protected endpoints.

## Data Models

### Database Selection

**MongoDB (Recommended):**
- Document-based storage aligns with JavaScript object structures and flexible schema requirements.
- Simple aggregation queries for user-specific data retrieval and cross-stage analytics.
- Atlas free tier provides 512MB storage with built-in security and backup features.
- Excellent support for nested objects and arrays matching our data patterns.

**DynamoDB (Alternative):**
- Serverless scaling with predictable performance characteristics.
- Strong integration with AWS ecosystem and Cognito authentication.
- Requires careful key design for complex query patterns across stages.
- Free tier offers 25GB storage with on-demand pricing model.

### Core Data Structures

**User Profile:**
```javascript
{
  _id: ObjectId,
  email: String,                    // From OAuth provider
  primaryNiche: String,             // Primary content focus area
  secondaryNiche: String,           // Optional secondary niche
  platforms: [String],              // Target social media platforms
  primaryGoal: String,              // growth, engagement, authority, conversion
  creatorLevel: String,             // beginner, intermediate, advanced
  preferences: {
    tones: [String],                // Preferred content tones
    formats: [String],              // Preferred content formats
    constraints: {
      emojiUsage: Boolean,
      ctaStrength: String,
      formality: String
    },
    timeCommitment: String          // low, medium, high
  },
  competitors: [{
    name: String,
    url: String,
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Content Ideas:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // References user profile
  title: String,                    // Idea headline
  angle: String,                    // Content angle/approach
  targetPlatforms: [String],        // Target platforms for this idea
  contentFormat: String,            // post, thread, story, etc.
  executionOutline: {
    hook: String,
    keyPoints: [String],
    callToAction: String
  },
  scores: {
    virality: Number,               // 0-100 heuristic score
    trendAlignment: Number,         // 0-100 trend relevance
    effort: Number                  // 0-100 effort estimation
  },
  explanation: String,              // Plain-language reasoning
  generationMode: String,           // zero-idea, rough-idea, ready-plan
  sourceInput: String,              // Original user input if applicable
  createdAt: Date
}
```

**Generated Content:**
```javascript
{
  _id: ObjectId,
  ideaId: ObjectId,                 // References source idea
  userId: ObjectId,                 // References user profile
  platform: String,                // Target platform
  contentType: String,              // post, thread, story
  content: {
    text: String,                   // Main content body
    hashtags: [String],             // Generated hashtags
    mentions: [String],             // Suggested mentions
    callToAction: String            // CTA if applicable
  },
  customizations: {
    tone: String,
    length: String,
    hookStyle: String,
    ctaStrength: String,
    includeEmojis: Boolean,
    customInstructions: String
  },
  imageAssets: [{
    type: String,                   // thumbnail, cover, product
    url: String,
    source: String                  // unsplash, pexels, generated
  }],
  versions: [{
    content: Object,
    timestamp: Date,
    changes: String
  }],
  createdAt: Date,
  lastModified: Date
}
```

**Publishing Schedule:**
```javascript
{
  _id: ObjectId,
  contentId: ObjectId,              // References generated content
  userId: ObjectId,                 // References user profile
  platform: String,                // Target platform
  scheduledTime: Date,              // When to post
  status: String,                   // scheduled, posted, failed
  autoPost: Boolean,                // Whether to auto-post or copy-paste
  formattedContent: {
    title: String,
    caption: String,
    hashtags: [String],
    tags: [String]
  },
  postResult: {
    success: Boolean,
    platformPostId: String,
    errorMessage: String,
    postedAt: Date
  },
  calendarEventId: String,          // Google Calendar integration
  createdAt: Date
}
```

**Performance Analytics:**
```javascript
{
  _id: ObjectId,
  contentId: ObjectId,              // References published content
  userId: ObjectId,                 // References user profile
  platform: String,                // Platform where content was posted
  metrics: {
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    engagementRate: Number
  },
  insights: {
    topPerformingElements: [String],
    improvementSuggestions: [String],
    confidenceScore: Number
  },
  recordedAt: Date,
  source: String                    // manual, api
}
```

### Data Relationships

**Ownership Hierarchy:**
- Users own multiple Ideas (1:N relationship).
- Ideas generate multiple Content variations (1:N relationship).
- Content can have multiple Publishing schedules (1:N relationship).
- Published content generates Performance analytics (1:N relationship).

**Cross-Stage Data Flow:**
- Profile data influences all AI prompt generation across stages.
- Performance insights feed back into Research and Creation stages.
- Content versions maintain history for iterative improvements.

**Query Patterns:**
- Retrieve user's ideas: `find({userId: ObjectId}).sort({createdAt: -1})`.
- Get content by idea: `find({ideaId: ObjectId})`.
- User's scheduled posts: `find({userId: ObjectId, status: 'scheduled'})`.
- Performance data for analysis: `find({userId: ObjectId}).populate('contentId')`.

## API Design

### REST Endpoints

**Authentication:**
```
POST /auth/google          - Initiate Google OAuth flow
POST /auth/aws             - Initiate AWS Cognito authentication
GET  /auth/callback        - Handle OAuth callback
POST /auth/refresh         - Refresh JWT token
POST /auth/logout          - Invalidate session
```

**User Profile Management:**
```
GET  /users/profile        - Retrieve current user profile
POST /users/profile        - Create new user profile
PUT  /users/profile        - Update existing profile
```

**Research & Ideation Stage:**
```
POST /ideas/generate       - Generate content ideas (all three modes)
GET  /ideas                - List user's ideas (paginated)
GET  /ideas/:id            - Retrieve specific idea
PUT  /ideas/:id/refine     - Refine existing idea
```

**Creation & Optimization Stage:**
```
POST /content/generate     - Generate content from idea
GET  /content              - List user's content (paginated)
GET  /content/:id          - Retrieve specific content
PUT  /content/:id          - Update content text and customizations
POST /content/:id/variants - Generate multi-platform variants
POST /content/:id/images   - Generate image assets
```

**Publishing & Distribution Stage:**
```
POST /publishing/schedule  - Schedule content for posting
GET  /publishing/scheduled - List scheduled content
PUT  /publishing/:id       - Update scheduled post
POST /publishing/:id/post  - Attempt auto-posting (if supported)
GET  /publishing/:id/format/:platform - Get platform-formatted output
POST /publishing/calendar  - Create automatic calendar plan
```

**Analysis & Feedback Stage:**
```
POST /analytics/performance - Record manual performance data
GET  /analytics/content/:id - Get content performance insights
GET  /analytics/account     - Get account-level insights
POST /analytics/feedback    - Submit feedback for recommendation improvement
```

### Request/Response Patterns

**Authentication Middleware:**
- Validates JWT tokens on protected endpoints.
- Extracts user ID for database queries.
- Returns 401 for invalid/expired tokens.
- Supports both Google OAuth and AWS Cognito tokens.

**Input Validation:**
- JSON schema validation for request bodies.
- Sanitization of user-provided text content.
- Platform-specific content length validation.
- File upload validation for image assets.

**Error Response Format:**
```javascript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Content exceeds platform character limit",
    details: {
      platform: "twitter",
      limit: 280,
      actual: 315
    }
  }
}
```

**Success Response Format:**
```javascript
{
  data: {
    // Response payload
  },
  meta: {
    timestamp: "2024-01-15T10:30:00Z",
    requestId: "req_abc123",
    stage: "creation"
  }
}
```

## AI Integration

### Service Selection

**Google Gemini API:**
- Free tier: 15 requests per minute, 1M tokens monthly.
- Suitable for text generation with reasonable quality.
- JSON response format with structured output support.
- Good performance for idea generation and content creation.

**Amazon Bedrock:**
- Pay-per-use pricing with various model options.
- Better for production scaling and enterprise features.
- Consistent API interface across different models.
- Enhanced security and compliance features.

### Prompt Engineering

**User Profile Context Integration:**
```javascript
const buildProfileContext = (userProfile) => {
  return `Content Creator Profile:
- Primary Niche: ${userProfile.primaryNiche}
- Secondary Niche: ${userProfile.secondaryNiche || 'None'}
- Target Platforms: ${userProfile.platforms.join(', ')}
- Primary Goal: ${userProfile.primaryGoal}
- Creator Level: ${userProfile.creatorLevel}
- Preferred Tones: ${userProfile.preferences.tones.join(', ')}
- Content Constraints: ${JSON.stringify(userProfile.preferences.constraints)}`;
};
```

**Idea Generation Prompts:**
```javascript
const buildIdeaPrompt = (userProfile, mode, input = '') => {
  const context = buildProfileContext(userProfile);
  
  switch(mode) {
    case 'zero-idea':
      return `${context}

Generate 3-5 content ideas that align with this creator's profile.
Include trend signals and competitor analysis where relevant.

Return JSON array with this structure:
[{
  "title": "Engaging headline",
  "angle": "Unique content approach",
  "targetPlatforms": ["platform1", "platform2"],
  "contentFormat": "post|thread|story",
  "executionOutline": {
    "hook": "Opening hook",
    "keyPoints": ["point1", "point2"],
    "callToAction": "CTA text"
  },
  "explanation": "Why this idea works"
}]`;
      
    case 'rough-idea':
      return `${context}

User's rough idea: "${input}"

Expand this into 3 refined angles with detailed execution plans.
Consider different approaches and platform optimizations.`;
      
    case 'ready-plan':
      return `${context}

User's complete plan: "${input}"

Review and suggest targeted optimizations for better performance.
Focus on hook improvement, engagement tactics, and platform-specific enhancements.`;
  }
};
```

**Content Generation Prompts:**
```javascript
const buildContentPrompt = (idea, userProfile, platform, customizations) => {
  const context = buildProfileContext(userProfile);
  
  return `${context}

Generate ${platform} content based on this idea:
Title: ${idea.title}
Angle: ${idea.angle}
Execution Outline: ${JSON.stringify(idea.executionOutline)}

Customizations:
- Tone: ${customizations.tone}
- Length: ${customizations.length}
- Hook Style: ${customizations.hookStyle}
- CTA Strength: ${customizations.ctaStrength}
- Include Emojis: ${customizations.includeEmojis}
- Custom Instructions: ${customizations.customInstructions}

Platform Requirements:
${getPlatformRequirements(platform)}

Return formatted content ready for posting with appropriate hashtags and mentions.`;
};
```

### Response Processing

**Output Validation:**
- JSON schema validation for structured responses.
- Content length verification against platform limits.
- Profanity and content safety filtering.
- Duplicate content detection across user's history.

**Fallback Strategies:**
- Retry with simplified prompts on API errors.
- Use cached example content when service unavailable.
- Graceful degradation with manual input options.
- Alternative AI service failover when configured.

**Rate Limit Handling:**
- Request queuing with exponential backoff.
- User notification for temporary service unavailability.
- Fair usage allocation across users.

## Implementation Structure

### Frontend Architecture (React)

**Component Organization:**
```
src/
  components/
    auth/
      LoginForm.js
      AuthCallback.js
    profile/
      ProfileSetup.js
      ProfileEdit.js
      CompetitorAnalysis.js
    research/
      IdeationModeSelector.js
      IdeaGenerator.js
      IdeaList.js
      IdeaCard.js
      IdeaRefinement.js
    creation/
      ContentGenerator.js
      ContentEditor.js
      CustomizationPanel.js
      ImageAssetManager.js
      MultiPlatformVariants.js
    publishing/
      SchedulingInterface.js
      CalendarIntegration.js
      AutoPostingManager.js
      PlatformFormatter.js
    analytics/
      PerformanceInput.js
      InsightsDashboard.js
      FeedbackLoop.js
  pages/
    Dashboard.js
    Pipeline.js
    Research.js
    Creation.js
    Publishing.js
    Analytics.js
  services/
    api.js              // HTTP client wrapper
    auth.js             // Authentication utilities
    storage.js          // Local storage management
    websocket.js        // Real-time updates
  utils/
    validation.js       // Client-side validation
    formatting.js       // Platform-specific formatting
    dateUtils.js        // Calendar and scheduling utilities
```

**State Management:**
- **React Context** for authentication state and user profile data.
- **Redux Toolkit or Zustand** for complex cross-stage and pipeline data flow.
- **Local component state** for form inputs and UI interactions.
- **Session storage** for temporary content drafts and in-progress pipeline state.


### Backend Architecture (Node.js)

**Service Organization:**
```
src/
  routes/
    auth.js             // Authentication endpoints
    users.js            // User profile management
    research.js         // Research & Ideation endpoints
    creation.js         // Creation & Optimization endpoints
    publishing.js       // Publishing & Distribution endpoints
    analytics.js        // Analysis & Feedback endpoints
  services/
    aiOrchestrator.js   // AI service integration and prompt management
    authService.js      // JWT and OAuth handling (Google + AWS)
    userService.js      // User profile operations
    researchService.js  // Idea generation and refinement
    creationService.js  // Content generation and optimization
    publishingService.js // Scheduling and auto-posting
    analyticsService.js // Performance tracking and insights
    calendarService.js  // Google Calendar integration
  middleware/
    auth.js             // JWT validation middleware
    validation.js       // Request validation
    rateLimiting.js     // API rate limiting
    errorHandler.js     // Global error handling
  utils/
    database.js         // Database connection and utilities
    logger.js           // Logging configuration
    platformAPIs.js     // Social media API integrations
  app.js                // Express application setup
```

**Service Layer Responsibilities:**
- AI Orchestrator: Manages external AI API calls, prompt construction, and response processing.
- Auth Service: Handles OAuth flows for both Google and AWS Cognito, JWT token management.
- Research Service: Implements three ideation modes, trend analysis, and competitor insights.
- Creation Service: Manages content generation, customization, and multi-platform variants.
- Publishing Service: Handles scheduling, auto-posting, and calendar integration.
- Analytics Service: Processes performance data and generates improvement insights.

## Quality and Reliability

### Error Handling Strategy

**Client-Side Error Handling:**
- Network timeout handling with retry mechanisms.
- Form validation with real-time feedback.
- Graceful degradation when AI services are unavailable.
- User-friendly error messages with actionable guidance.
- Offline mode support for content drafting.

**Server-Side Error Handling:**
- Global error middleware for unhandled exceptions.
- Structured error logging with request context.
- Input sanitization to prevent injection attacks.
- Rate limiting to prevent abuse and ensure fair usage.
- Circuit breaker pattern for external service calls.

**AI Service Resilience:**
- Configurable support for multiple AI providers, with manual fallback if needed.
- Exponential backoff for transient failures.
- Fallback content templates when services are down.
- Request timeout configuration (30 seconds).
- Quality validation for AI-generated content.

### Logging and Monitoring

**Application Logging:**
- Structured JSON logs with consistent format.
- Request/response logging for API endpoints.
- Error tracking with stack traces and user context.
- Performance metrics for AI API response times.
- User action tracking for analytics and debugging.

**Log Levels:**
- ERROR: System failures and unhandled exceptions.
- WARN: Rate limit approaches and degraded performance.
- INFO: User actions and successful operations.
- DEBUG: Detailed request/response data (development only).

### Rate Limiting and Performance

**AI API Management:**
- Request queuing to stay within service limits.
- User notification when approaching rate limits.
- Graceful handling of quota exhaustion.
- Usage tracking per user for fair allocation.
- Priority queuing for different user tiers.

**Application Performance:**
- Response caching for frequently accessed content.
- Database connection pooling.
- Asynchronous processing for long-running operations.
- CDN integration for static assets.
- Performance monitoring and alerting.

## Auto-Posting Integration

### Platform API Support

**Implementation Approach:**
- OAuth-based integration where platforms permit third-party publishing.
- Platform-specific content formatting and validation.
- Error handling and retry logic for failed posts.
- Status tracking and user notifications.
- Fallback to copy-paste mode when APIs are unavailable.

**Copy-Paste Fallback:**
- Formatted content generation for all major platforms.
- Platform-specific character limits and formatting rules.
- One-click copy functionality with clipboard integration.
- Visual preview of formatted content.
- Platform-specific posting guidelines and tips.

### Calendar Integration

**Google Calendar Features:**
- Automatic content calendar creation.
- Weekly and monthly planning templates.
- Optimal posting time recommendations.
- Content deadline and reminder notifications.
- Integration with existing user calendars.

**Planning Automation:**
- Heuristic-based scheduling suggestions informed by user goals and basic trends.
- Automatic spacing of content across platforms.
- Conflict detection and resolution.
- Bulk scheduling operations.
- Calendar export and sharing capabilities.

## Future Considerations

### Potential Enhancements

**Advanced AI Features:**
- Multi-model AI integration for improved content quality
- Custom prompt templates and user-defined workflows
- AI-powered trend analysis and content optimization
- Automated A/B testing for content variations

**Enhanced Analytics:**
- Automated performance data collection via platform APIs
- Advanced insights and predictive analytics
- Content performance benchmarking
- ROI tracking and attribution analysis

**Collaboration Features:**
- Multi-user workspaces and team collaboration
- Content approval workflows and review processes
- Shared content libraries and template management
- Team performance analytics and reporting

**Platform Expansion:**
- Additional social media platform integrations
- Video content generation and optimization
- Podcast and audio content support
- E-commerce platform integrations

### Scalability Considerations(Future Oriented)

**Database Optimization:**
- Indexing strategy for complex cross-stage queries
- Data archiving and cleanup for inactive users
- Read replica implementation for improved performance
- Caching layer for frequently accessed data

**API Performance:**
- Microservices architecture for independent scaling
- Load balancing and auto-scaling capabilities
- API versioning and backward compatibility
- Advanced monitoring and observability tools