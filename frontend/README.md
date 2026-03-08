# KindCrew Frontend - Phase 1: Ideation & Research

Next.js 14 frontend for the KindCrew content creation platform.

## 🎯 Phase 1 Features

Three entry points for content ideation:

1. **Zero Idea** - Generate 10 AI-powered ideas from user profile
2. **Some Idea** - Refine rough concept into 5 polished angles
3. **Full Idea** - Evaluate and optimize complete content idea

Plus shared research and approval workflow.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Session Storage (for multi-step flows)
- **API**: REST (backend at http://localhost:3000)

## 📦 Installation

```bash
npm install
```

## 🏃 Development

```bash
npm run dev
```

Frontend runs on: http://localhost:3001

Backend API should run on: http://localhost:3000

## 📁 Project Structure

```
src/
├── app/
│   ├── ideation/
│   │   ├── page.tsx           # Entry point (3 path selection)
│   │   ├── zero/page.tsx      # Zero Idea flow
│   │   ├── some/page.tsx      # Some Idea flow
│   │   ├── full/page.tsx      # Full Idea flow
│   │   ├── research/page.tsx  # Research step (shared)
│   │   ├── success/page.tsx   # Approval success
│   │   └── my-ideas/page.tsx  # Saved ideas library
│   └── layout.tsx
├── lib/
│   └── api/
│       └── ideation.ts        # API client with TypeScript types
└── ...
```

## 🔄 User Flows

### Zero Idea Flow

1. User fills profile (niche, audience, platform, goal)
2. AI generates 10 scored ideas
3. User selects best idea → Research

### Some Idea Flow

1. User enters rough idea + audience/platform
2. AI refines into 5 angles with hooks
3. User selects angle → Research

### Full Idea Flow

1. User submits complete idea + audience/platform
2. AI scores and optimizes idea
3. User reviews → Research

### Shared Research & Approval

1. Research: AI identifies pain points & competitor patterns
2. Approval: Save idea to library for Phase 2

## 🎨 UI Components

### Consistent Design Patterns

- **Gradient Backgrounds**: Different colors per flow (blue/purple/green/teal)
- **Score Badges**: Color-coded (green ≥8, yellow 6-8, red <6)
- **Card Layouts**: Shadow hover effects, responsive grids
- **Form Inputs**: Tailwind styled with focus states
- **Loading States**: Disabled buttons with opacity

### Score Visualization

```typescript
const getScoreColor = (score: number) => {
  if (score >= 8) return "text-green-600 bg-green-50";
  if (score >= 6) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};
```

Score displayed as: `8.5/10` with color-coded badge

## 🔌 API Integration

### TypeScript Interfaces

```typescript
interface ContentIdea {
  topic: string;
  angle: string;
  platform: string;
  contentType: string;
  targetAudience: string;
  hookIdea: string;
  scores: {
    overall: number;
    virality: number;
    audienceRelevance?: number;
    clarity: number;
    competition: number;
  };
}
```

### API Functions

```typescript
// Generate ideas (Zero flow)
generateIdeas(userId, userProfile);

// Refine idea (Some flow)
refineIdea(userId, { roughIdea, audience, platform });

// Evaluate idea (Full flow)
evaluateIdea(userId, { idea, audience, platform });

// Research step
researchIdea(userId, { idea, audience });

// Save/approve idea
selectIdea(userId, ideaData);

// Get user's ideas
getUserIdeas(userId);
```

## 🔐 Authentication

Currently uses **mock userId**: `"user-123"`

Real authentication will be added in future phases.

## 💾 State Management

### Session Storage

Used for passing data between pages:

```typescript
// Store selected idea
sessionStorage.setItem("selectedIdea", JSON.stringify(idea));

// Retrieve in next page
const idea = JSON.parse(sessionStorage.getItem("selectedIdea"));

// Clear after approval
sessionStorage.removeItem("selectedIdea");
```

## 🎯 Scoring System

Ideas scored 0-10 based on:

- **Virality** (40%): Shareability potential
- **Audience** (30%): Target relevance
- **Clarity** (20%): Message clarity
- **Competition** (10%): Market saturation

Formula: `0.4*virality + 0.3*audience + 0.2*clarity + 0.1*(10-competition)`

## 📊 API Responses

All API responses follow this structure:

```typescript
{
  success: boolean;
  error?: string;
  ideas?: ContentIdea[];      // For generate/refine
  evaluation?: {...};          // For evaluate
  research?: {...};            // For research
  ideaId?: string;            // For select
}
```

## 🐛 Error Handling

All pages include:

- Try-catch blocks around API calls
- Error state display in red banner
- Loading states with disabled buttons
- Input validation before API calls

## 🚀 Next Steps

Phase 2 features planned:

- Content Structuring (hook, body, CTA)
- Script Generation with AI
- Editing & refinement tools
- Export to various formats

## 📝 Development Notes

### Backend API URL

Update in `lib/api/ideation.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
```

### Platform Options

Supported platforms:

- LinkedIn
- Twitter
- Instagram
- YouTube

### Content Types

Generated by AI:

- Post
- Thread
- Story
- Video script
- Carousel

## 🧪 Testing Checklist

- [ ] Zero flow: Profile form → Generate 10 ideas → Select → Research
- [ ] Some flow: Rough idea → Refine to 5 angles → Select → Research
- [ ] Full flow: Complete idea → Evaluate & score → Research
- [ ] Research: Pain points + competitor patterns displayed
- [ ] Approval: Save idea → Success page → My Ideas
- [ ] My Ideas: Display all saved ideas with scores
- [ ] Error handling: API failures show error messages
- [ ] Loading states: Buttons disabled during API calls

## 🎨 Customization

### Change color schemes

Update Tailwind classes in each page:

- Zero: `from-blue-50 to-blue-100`
- Some: `from-purple-50 to-pink-100`
- Full: `from-green-50 to-teal-100`
- Research: `from-indigo-50 to-purple-100`

### Adjust scoring thresholds

Modify `getScoreColor()` function in each page.

## 📚 Additional Documentation

See backend docs for:

- API endpoint details
- Scoring algorithm
- Google Trends integration
- DynamoDB schema

## 🤝 Contributing

Keep code:

- **Minimal**: No over-engineering
- **Consistent**: Follow existing patterns
- **Typed**: Use TypeScript interfaces
- **Responsive**: Mobile-first design

---

**Status**: Phase 1 Complete ✅  
**Version**: 1.0.0  
**Last Updated**: 2024
