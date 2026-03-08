# Comprehensive Testing Checklist - KindCrew Platform

## Test Environment Setup

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] DynamoDB accessible and configured
- [ ] AWS Bedrock credentials configured
- [ ] Browser DevTools Console open for debugging
- [ ] Clear browser localStorage before starting tests

---

## 1. AUTHENTICATION & PROFILE FLOW

### User Authentication

- [ ] Register new user account
- [ ] Login with credentials
- [ ] Verify JWT token stored in localStorage
- [ ] Verify userInfo in Zustand store
- [ ] Reload page - verify auth state persists
- [ ] Logout - verify token cleared

### Creator Profile

- [ ] Create creator profile (first login)
- [ ] Fill all profile fields (niche, audience, platforms, goals)
- [ ] Save profile successfully
- [ ] Reload page - verify profile persists in store
- [ ] Edit profile - verify updates saved
- [ ] View profile in DynamoDB (backend)

**Expected State After:**

```javascript
// localStorage: kindcrew-app-storage
{
  token: "jwt_token_string",
  userInfo: { userId: "...", email: "..." },
  authReady: true,
  creatorProfile: { ... },
  hasProfile: true,
  profileChecked: true
}
```

---

## 2. IDEATION FLOW - ZERO IDEA (Generate from Profile)

### Generate Ideas

- [ ] Navigate to `/ideation` → Click "Zero Idea"
- [ ] Form auto-fills from creator profile
- [ ] Edit: niche, audience, platforms (multiple), goal
- [ ] Click "Generate 10 Ideas"
- [ ] Loading state shows during generation
- [ ] 10 ideas appear with scores (virality, clarity, competition, overall)
- [ ] Ideas sorted by overall score (highest first)

### Select & Navigate to Research

- [ ] Click on an idea card to select it
- [ ] Click "Select This Idea" button
- [ ] Redirects to `/ideation/research`
- [ ] Selected idea data visible on research page
- [ ] Idea details preserved (topic, angle, platform, audience, scores)

### Research Phase

- [ ] Verify idea details display correctly
- [ ] Click "Generate Research"
- [ ] Loading state during research generation
- [ ] Research appears:
  - Audience Pain Points (3-5 items)
  - Competitor Patterns (3-5 items)
  - Recommended Structure
  - Key Points
  - Your Angle Strength
- [ ] Reload page - verify research persists in sessionStorage

### Approve & Save Idea

- [ ] Click "Approve & Save Idea"
- [ ] Success message appears
- [ ] Redirects to success page with ideaId
- [ ] Navigate to `/ideation/my-ideas`
- [ ] Verify idea appears in saved ideas list
- [ ] Verify `hasContent: false` on idea

### Verify Backend Storage

- [ ] Check DynamoDB `KindCrew-ContentIdeas` table
- [ ] Verify idea record exists with:
  - userId, ideaId, topic, angle, platform
  - targetAudience, scores, research (with all fields)
  - status: "approved"
  - createdAt timestamp
  - NO hasContent field yet (added on query)

**Expected State After:**

```javascript
// localStorage: kindcrew-app-storage
{
  ideas: [], // cleared after navigation
  selectedIdea: null,
  profile: { niche: "...", audience: "...", ... }
}

// sessionStorage (cleared after save)
{
  selectedIdea: null // cleared after approval
}

// DynamoDB: KindCrew-ContentIdeas
{
  userId: "user_xxx",
  ideaId: "uuid",
  topic: "...",
  angle: "...",
  scores: { overall: 8.5, ... },
  research: { audiencePainPoints: [...], ... },
  status: "approved",
  createdAt: "2026-03-08T..."
}
```

---

## 3. IDEATION FLOW - SOME IDEA (Refine Rough Idea)

### Generate Refined Ideas

- [ ] Navigate to `/ideation` → Click "Some Idea"
- [ ] Enter rough idea (e.g., "AI productivity tools")
- [ ] Enter target audience
- [ ] Select platform
- [ ] Click "Refine into 5 Angles"
- [ ] 5 refined idea angles appear with scores
- [ ] Each has unique angle/hook

### Research & Save

- [ ] Select one refined idea
- [ ] Proceed to research page
- [ ] Generate research (same as Zero Idea flow)
- [ ] Approve and save
- [ ] Verify appears in my-ideas with `hasContent: false`

**Expected State:** Same as Zero Idea, but with rough idea as source

---

## 4. IDEATION FLOW - FULL IDEA (Evaluate Existing Idea)

### Evaluate Idea

- [ ] Navigate to `/ideation` → Click "Full Idea"
- [ ] Enter complete idea
- [ ] Enter target audience
- [ ] Select platform
- [ ] Click "Evaluate Idea"
- [ ] Evaluation appears with:
  - Improved Title
  - Suggested Hook
  - Scores (virality, clarity, competition, overall)

### Research & Save

- [ ] Proceed to research page
- [ ] Generate research
- [ ] Approve and save
- [ ] Verify in my-ideas with `hasContent: false`

**Expected State:** Same as other flows

---

## 5. MY IDEAS PAGE - View & Manage

### Display Saved Ideas

- [ ] Navigate to `/ideation/my-ideas`
- [ ] All saved ideas display as cards
- [ ] Each card shows:
  - Score badge (overall score)
  - Topic/title
  - Hook/description
  - Platform, content type, target audience tags
  - Score breakdown (virality, clarity, competition)
  - Created date

### Expand Idea Details

- [ ] Click "View" button on an idea
- [ ] Expanded section shows:
  - Full angle/description
  - Research insights (if available)
- [ ] Click "Hide" to collapse

### Generate Research (for ideas without research)

- [ ] Find idea without research
- [ ] Click "Generate Research" button
- [ ] Loading state shows
- [ ] Research populates
- [ ] Reload page - research persists

### Copy Idea

- [ ] Click copy button
- [ ] Check clipboard has full idea text
- [ ] Button shows checkmark briefly

### Reload Test

- [ ] Reload `/ideation/my-ideas` page
- [ ] All ideas reload from backend
- [ ] hasContent flags correctly set

**Expected Behavior:**

- Ideas with content show "Content Generated" badge
- Generate Content button disabled if `hasContent: true`
- Generate Content button enabled if `hasContent: false`

---

## 6. CONTENT GENERATION - From Saved Idea

### Generate Content

- [ ] On `/ideation/my-ideas`, find idea with `hasContent: false`
- [ ] Click "Generate Content" button
- [ ] Loading state shows "Generating..."
- [ ] Wait for content generation (30-60 seconds)
- [ ] Success: redirects to `/content/library`

### Verify Content Created

- [ ] Content appears in library with:
  - Topic from idea
  - Created timestamp
  - Platform variants
- [ ] Click on content card
- [ ] Redirects to `/content/[contentId]` detail page
- [ ] Verify outline, draft, platform variants display

### Verify hasContent Flag Updated

- [ ] Return to `/ideation/my-ideas`
- [ ] Find the same idea used for content
- [ ] Verify badge shows "Content Generated"
- [ ] Verify "Generate Content" button disabled
- [ ] Reload page - flag persists

### Verify Backend Storage

- [ ] Check DynamoDB `KindCrew-ContentItems` table
- [ ] Verify content record with:
  - contentId, userId, ideaId (linked!)
  - source: "phase1"
  - topic, angle, targetAudience
  - outline: { title, hook, sections, cta }
  - draft: { text }
  - platformVariants: { linkedin: {...}, twitter: {...} }
  - distribution: { status: "draft", platformTargets: [...] }
  - createdAt, updatedAt

**Expected State After:**

```javascript
// localStorage: kindcrew-app-storage
{
  contentList: [{ contentId: "...", topic: "...", ... }]
}

// DynamoDB: KindCrew-ContentItems
{
  contentId: "uuid",
  userId: "user_xxx",
  ideaId: "idea_uuid", // IMPORTANT: Links to KindCrew-ContentIdeas
  source: "phase1",
  topic: "...",
  outline: { ... },
  draft: { text: "..." },
  platformVariants: { linkedin: {...}, twitter: {...} },
  createdAt: "2026-03-08T..."
}

// When querying my-ideas again, API adds:
{
  hasContent: true // Computed by backend in getUserIdeasHandler
}
```

---

## 7. CONTENT GENERATION - Manual Entry

### Create Manual Content

- [ ] Navigate to `/content/create`
- [ ] Form displays with all fields empty
- [ ] Fill in:
  - Topic/Idea (required)
  - Select platforms (multiple)
  - Content type dropdown
  - Target audience
  - Goal dropdown
  - Hook idea (optional)
  - Key points (add at least 2)
  - Tone dropdown
  - Length dropdown
  - Include CTA checkbox
- [ ] All fields editable

### Submit & Generate

- [ ] Click "Generate Content" button
- [ ] Loading state shows
- [ ] Content generates successfully
- [ ] Redirects to `/content/library`
- [ ] New content appears

### Verify Backend Storage

- [ ] Check DynamoDB `KindCrew-ContentItems` table
- [ ] Verify:
  - source: "manual"
  - ideaId: null or undefined (no linked idea)
  - All manual input fields saved

**Expected State:**

```javascript
// DynamoDB: KindCrew-ContentItems
{
  contentId: "uuid",
  userId: "user_xxx",
  ideaId: null, // NO idea link
  source: "manual",
  topic: "User entered topic",
  // ... rest of content structure same as phase1
}
```

---

## 8. CONTENT LIBRARY PAGE

### Display All Content

- [ ] Navigate to `/content/library`
- [ ] All generated content displays
- [ ] Content from ideas AND manual entry both shown
- [ ] Each card shows:
  - Topic
  - Source badge ("From Idea" or "Manual")
  - Created date
  - Platform tags
  - Status (draft/scheduled/published)

### View Content Details

- [ ] Click on any content card
- [ ] Redirects to `/content/[contentId]`
- [ ] Detail page shows:
  - Full outline (hook, sections, CTA)
  - Metadata (audience, angle, source, ideaId if linked)
  - Platform tabs (LinkedIn, Twitter, etc.)
  - Platform-specific content (posts, threads, captions, hashtags)

### Copy Platform Content

- [ ] Select a platform tab
- [ ] Click copy button on post text
- [ ] Verify copied to clipboard
- [ ] Copy icon changes to checkmark briefly
- [ ] Try different sections (threads, hashtags)

### Reload Test

- [ ] Reload `/content/library`
- [ ] All content reloads from backend
- [ ] Reload `/content/[contentId]`
- [ ] Content details persist

---

## 9. STATE MANAGEMENT - Zustand Store

### Verify Store Persistence

- [ ] Generate ideas → Check store: `ideas: Array[10]`
- [ ] Navigate away → Return → Ideas cleared (not persisted)
- [ ] Select idea → Check sessionStorage: `selectedIdea: {...}`
- [ ] Save idea → Check store: `ideas: []` (cleared)
- [ ] Generate content → Check store: `contentList: Array[n]`
- [ ] Reload page → Check store: `contentList` persists

### Clear State Test

- [ ] Generate ideas in Zero Idea flow
- [ ] Click "Generate New Ideas" button
- [ ] Verify `ideas` array cleared
- [ ] Verify form resets

### Logout Test

- [ ] Logout from app
- [ ] Verify localStorage cleared of token
- [ ] Verify store resets to initial state
- [ ] Login again - verify data reloads

---

## 10. PROFILE CONTEXT IN CONTENT GENERATION

### Verify Profile Used in Prompts

- [ ] Create creator profile with:
  - Niche: "SaaS Marketing"
  - Voice Tone: "Conversational"
  - Content Style: "Educational"
  - Primary Goal: "Lead Generation"
  - Topics to Avoid: ["Politics", "Religion"]

### Generate Content and Verify

- [ ] Generate content (from idea or manual)
- [ ] Check backend logs for prompt content
- [ ] Verify profile context included:
  ```
  Creator Profile Context:
  - Niche: SaaS Marketing
  - Content Style: Educational
  - Primary Goal: Lead Generation
  - Voice Tone: Conversational
  - Avoid: Politics, Religion
  ```
- [ ] Review generated content - verify tone matches profile

---

## 11. NAVIGATION & ROUTING

### All Routes Accessible

- [ ] `/` - Landing page
- [ ] `/ideation` - Ideation hub
- [ ] `/ideation/zero` - Zero idea generator
- [ ] `/ideation/some` - Some idea refiner
- [ ] `/ideation/full` - Full idea evaluator
- [ ] `/ideation/research` - Research page (with selected idea)
- [ ] `/ideation/my-ideas` - Saved ideas list
- [ ] `/content` - Content creation page
- [ ] `/content/create` - Manual content creation
- [ ] `/content/library` - Content library
- [ ] `/content/[contentId]` - Content detail (dynamic)
- [ ] `/profile` - Creator profile (if exists)

### Navigation Flow

- [ ] Back buttons work on all pages
- [ ] Redirects work after form submissions
- [ ] Unauthorized users redirect to login
- [ ] Deep links work: `/content/abc123` loads correct content
- [ ] 404 page for invalid contentId

---

## 12. ERROR HANDLING

### Network Errors

- [ ] Stop backend server
- [ ] Try generating ideas
- [ ] Verify error message displays
- [ ] Verify graceful degradation (no crashes)

### Invalid Data

- [ ] Submit empty form (should show validation errors)
- [ ] Try accessing non-existent contentId
- [ ] Verify 404 or error message

### API Timeout

- [ ] Monitor long-running Bedrock API calls
- [ ] Verify loading states persist
- [ ] Verify timeout handling if applicable

---

## 13. EDGE CASES & SPECIAL SCENARIOS

### Multiple Ideas to Same Content

- [ ] Generate 3 different ideas
- [ ] Generate content from idea #1 → Success
- [ ] Try generating content from idea #1 again → Button disabled
- [ ] Generate content from idea #2 → Success (new content)
- [ ] Verify 2 separate content items in library
- [ ] Verify both ideas show `hasContent: true`

### Delete Idea with Linked Content

- [ ] (If delete functionality exists)
- [ ] Verify content still accessible
- [ ] Verify orphaned content handling

### Large Dataset Test

- [ ] Generate and save 10+ ideas
- [ ] Generate content for multiple ideas
- [ ] Verify pagination or list performance
- [ ] Verify all data loads correctly

### Concurrent Users

- [ ] Test with 2 different user accounts
- [ ] Verify data isolation (User A doesn't see User B's ideas)

---

## 14. PERFORMANCE & OPTIMIZATION

### Loading Performance

- [ ] Measure idea generation time (expect 5-15 seconds)
- [ ] Measure content generation time (expect 30-60 seconds)
- [ ] Check for unnecessary re-renders in React DevTools
- [ ] Verify no memory leaks on page reload

### Data Caching

- [ ] Navigate to my-ideas → Note load time
- [ ] Navigate away and return → Should be faster (from store)
- [ ] Reload page → Should load from backend

---

## 15. FINAL INTEGRATION TEST - Complete User Journey

### Scenario: New user creates content from scratch

1. [ ] Register/Login new user
2. [ ] Create creator profile (full details)
3. [ ] Generate 10 ideas (Zero Idea flow)
4. [ ] Select top-scored idea
5. [ ] Generate research
6. [ ] Approve and save idea
7. [ ] Verify in my-ideas with `hasContent: false`
8. [ ] Generate content from saved idea
9. [ ] Wait for completion, redirect to library
10. [ ] Return to my-ideas - verify `hasContent: true` and button disabled
11. [ ] View content detail page
12. [ ] Copy platform content to clipboard
13. [ ] Create additional manual content
14. [ ] Verify both contents in library
15. [ ] Logout and login - verify all data persists
16. [ ] Generate content from another saved idea
17. [ ] Verify cannot regenerate content for same idea

### Scenario: User with existing data

1. [ ] Login with account that has data
2. [ ] Verify profile loads
3. [ ] Verify my-ideas shows all saved ideas with correct flags
4. [ ] Verify content library shows all content
5. [ ] Verify content links back to originating ideas (if phase1)

---

## VALIDATION CHECKLIST SUMMARY

### Backend Validation

- [ ] All API endpoints respond correctly
- [ ] Authentication middleware working
- [ ] DynamoDB tables populated correctly:
  - `KindCrew-Users` (user accounts)
  - `KindCrew-CreatorProfiles` (user profiles)
  - `KindCrew-ContentIdeas` (saved ideas, status="approved")
  - `KindCrew-ContentItems` (content with ideaId link or source="manual")
- [ ] `hasContent` flag computed correctly in API response
- [ ] Profile context used in AI prompts

### Frontend Validation

- [ ] Zustand store persists correctly to localStorage
- [ ] SessionStorage used for temporary data (selectedIdea)
- [ ] All forms validate input
- [ ] Loading states on all async operations
- [ ] Error states display user-friendly messages
- [ ] Navigation breadcrumbs work
- [ ] All buttons disabled during operations
- [ ] Content renders properly (Markdown support)

### State Synchronization

- [ ] Frontend store matches backend data after reload
- [ ] `hasContent` flag prevents duplicate content generation
- [ ] Multiple tabs/windows sync (if applicable)
- [ ] Logout clears all sensitive data

---

## BUGS TO CHECK FOR

Common issues to verify are fixed:

- [ ] Generate button not disabled after content created → SHOULD BE DISABLED
- [ ] hasContent flag not updating → SHOULD UPDATE
- [ ] Profile context not in content prompts → SHOULD BE INCLUDED
- [ ] Manual content creation form not submitting → SHOULD WORK
- [ ] Content detail page 404 → SHOULD LOAD
- [ ] State lost on reload → SHOULD PERSIST
- [ ] Ideas showing after navigation → SHOULD CLEAR (except in my-ideas)
- [ ] Research lost on reload → SHOULD PERSIST (sessionStorage)
- [ ] Multiple content generation from same idea → SHOULD PREVENT

---

## TEST EXECUTION NOTES

**Date:** ****\_\_\_****  
**Tester:** ****\_\_\_****  
**Environment:** Dev / Staging / Prod

**Results:**

- Total Tests: **\_** / **\_**
- Passed: **\_**
- Failed: **\_**
- Blocked: **\_**

**Critical Issues Found:**

1.
2.
3.

**Nice-to-Have Improvements:**

1.
2.
3.

**Sign-off:** ****\_\_\_****
