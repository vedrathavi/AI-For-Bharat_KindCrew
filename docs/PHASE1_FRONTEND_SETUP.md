# Phase 1 Frontend - Quick Setup Guide

## ✅ What's Been Created

### 📄 Pages (7 total)

1. **Entry Point** - `/ideation`
   - 3 path selection cards
   - Routes to Zero/Some/Full flows

2. **Zero Idea Flow** - `/ideation/zero`
   - User profile form
   - Generate 10 AI ideas
   - Score display & selection

3. **Some Idea Flow** - `/ideation/some`
   - Rough idea input
   - Refine to 5 angles
   - Hooks & score display

4. **Full Idea Flow** - `/ideation/full`
   - Complete idea evaluation
   - AI optimization
   - Score breakdown

5. **Research Page** - `/ideation/research`
   - Pain point analysis
   - Competitor patterns
   - Approval workflow

6. **Success Page** - `/ideation/success`
   - Confirmation message
   - Next steps
   - Navigation options

7. **My Ideas Library** - `/ideation/my-ideas`
   - Saved ideas grid
   - Filtering & stats
   - Ready for Phase 2

### 🔌 API Client

**File**: `src/lib/api/ideation.ts`

6 API functions with TypeScript interfaces:

- `generateIdeas()` - Zero flow
- `refineIdea()` - Some flow
- `evaluateIdea()` - Full flow
- `researchIdea()` - Research step
- `selectIdea()` - Approve & save
- `getUserIdeas()` - Fetch library

## 🚀 Running the Frontend

### Prerequisites

- Node.js 18+ installed
- Backend running on http://localhost:3000

### Steps

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:3001**

## 🧪 Testing the Complete Flow

### 1. Zero Idea Path

1. Go to http://localhost:3001/ideation
2. Click "Zero Idea - Start from Scratch"
3. Fill profile form:
   - Niche: "AI productivity"
   - Audience: "startup founders"
   - Platform: "linkedin"
   - Goal: "increase engagement"
4. Click "Generate 10 Ideas"
5. Select an idea with good score
6. Click "Research This Idea"

### 2. Some Idea Path

1. Go to http://localhost:3001/ideation
2. Click "Some Idea - Refine Concept"
3. Enter rough idea: "something about AI tools"
4. Select audience & platform
5. Click "Refine Into 5 Angles"
6. Review angles with hooks
7. Select best angle
8. Click "Research This Angle"

### 3. Full Idea Path

1. Go to http://localhost:3001/ideation
2. Click "Full Idea - Evaluate Complete"
3. Enter complete idea with details
4. Select audience & platform
5. Click "Evaluate Idea"
6. Review score breakdown
7. Click "Proceed to Research"

### 4. Research & Approval (All Paths)

1. Review selected idea summary
2. Click "Start Research"
3. View pain points (red cards)
4. View competitor patterns (green cards)
5. View your angle's strength
6. Click "Approve & Save Idea"
7. Success page appears
8. Click "View My Ideas"

### 5. My Ideas Library

1. See all saved ideas in grid
2. View scores and details
3. Check stats at bottom
4. Click idea card (future: Phase 2)

## 🎨 UI Features

### Color-Coded Scores

- 🟢 **Green** (8.0-10.0): Excellent
- 🟡 **Yellow** (6.0-7.9): Good
- 🔴 **Red** (0.0-5.9): Needs Work

### Gradient Backgrounds

- Zero: Blue gradient
- Some: Purple/Pink gradient
- Full: Green/Teal gradient
- Research: Indigo/Purple gradient

### Session Storage Flow

Ideas passed between pages using sessionStorage:

- Selected on Zero/Some/Full page
- Retrieved on Research page
- Cleared after approval

## 🔧 Configuration

### Backend API URL

Default: `http://localhost:3000/api`

To change, update in `src/lib/api/ideation.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
```

Or add to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Mock User ID

Currently hardcoded: `"user-123"`

Used in all API calls until authentication implemented.

## 🐛 Troubleshooting

### Issue: "Failed to fetch"

**Cause**: Backend not running or wrong URL

**Solution**:

1. Start backend: `cd backend && npm start`
2. Check backend health: http://localhost:3000/health
3. Verify API URL in ideation.ts

### Issue: "User not authorized to perform bedrock:InvokeModel"

**Cause**: AWS IAM permissions issue

**Solution**:

1. Check AWS credentials in backend/.env
2. Add bedrock:InvokeModel to IAM role
3. See backend documentation

### Issue: Page shows "Loading..." forever

**Cause**: Session storage empty on Research page

**Solution**:

1. Always navigate through proper flow
2. Don't directly access /ideation/research
3. Clear browser cache: Ctrl+Shift+Delete

### Issue: Ideas not appearing in My Ideas

**Cause**: DynamoDB table not set up or API error

**Solution**:

1. Run setup: `cd backend && node scripts/setupIdeationTable.js`
2. Check backend logs for errors
3. Verify AWS credentials

## 📊 Score Calculation

Backend calculates scores as:

```
overall = 0.4 × virality
        + 0.3 × audience_relevance
        + 0.2 × clarity
        + 0.1 × (10 - competition)
```

Competition score from Google Trends:

- High trend (>70): Score 8-10
- Medium trend (30-70): Score 5-7
- Low trend (<30): Score 3-4

## 🎯 Next Phase Preview

Phase 2 will add:

- Content Structuring module
- Script Generation with sections
- Editing & refinement tools
- Draft version control
- Export to formats

Ideas from Phase 1 flow directly into Phase 2.

## 📁 File Structure Summary

```
frontend/src/
├── app/
│   └── ideation/
│       ├── page.tsx              ✅ Entry point
│       ├── zero/page.tsx         ✅ Zero flow
│       ├── some/page.tsx         ✅ Some flow
│       ├── full/page.tsx         ✅ Full flow
│       ├── research/page.tsx     ✅ Research
│       ├── success/page.tsx      ✅ Success
│       └── my-ideas/page.tsx     ✅ Library
└── lib/
    └── api/
        └── ideation.ts           ✅ API client
```

## ✨ Tips for Best Experience

1. **Start backend first**: Always run backend before frontend
2. **Use Chrome DevTools**: Check Network tab for API calls
3. **Check console**: Errors logged to browser console
4. **Session storage**: View in DevTools → Application → Session Storage
5. **Responsive design**: Works on mobile, tablet, desktop

## 🎉 You're All Set!

Phase 1 frontend is complete and ready to test.

Start with:

```bash
npm run dev
```

Then visit: http://localhost:3001/ideation

Happy ideating! 🚀
