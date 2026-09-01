# KindCrew — Engineering & Architecture Context

## 1. Product Overview
KindCrew is an AI-powered content workflow platform built for digital creators. It unifies research, ideation, drafting, and distribution across YouTube, LinkedIn, Twitter/X, Instagram, and other major social platforms.

---

## 2. End-to-End Architecture Flow

```text
USER IDEA / QUERY
       ↓
Stage I: Research Orchestrator
       ↓
Signal Collection: Tavily Live Search + Google Trends (Fallback: Null Provider)
       ↓
AI Synthesis: Google Gemma 3 12B on AWS Bedrock (ap-south-1)
       ↓
Multi-Factor Candidate Generation (Distinctness & Hard Platform Constraints)
       ↓
Deterministic Scoring & Ranking (Opportunity, Evidence, Novelty, Demand)
       ↓
Stage I → Stage II Contract (v2.0 with Full Corpus & Citations)
       ↓
Research Enrichment & Persistence (Saved with Idea in DynamoDB)
       ↓
Stage II: Content Generation (Master Hook, Sections, Platform Variants)
       ↓
Content Studio (25% Blueprint, 75% Platform Copy, Full-Width Draft)
       ↓
Content Library (Multi-Platform Cards, Modal Previews, Verified Icons)
```

---

## 3. Active Providers & Infrastructure

### Web Search Provider
- **Active Primary**: **Tavily Web Search** (`TavilyWebSearchProvider`).
  - Supports recency-aware news intent (`topic: "news"`) for breaking current events and general queries (`topic: "general"`).
  - Normalizes and deduplicates external sources with deterministic IDs (`src_1`, `src_2`, `src_3`).
- **Graceful Fallback**: **Null Provider** (`NullWebSearchProvider`).
  - Activated when live search is disabled or unavailable; guarantees graceful fallback synthesis without system crashes.

### AI Synthesis Engine
- **Active Model**: **Google Gemma 3 12B** (`google.gemma-3-12b-it`).
- **Inference Runtime**: **AWS Bedrock** via Converse API.
- **Bedrock Region**: `ap-south-1` (Mumbai).
- **Prompt Defense**: Robust context isolation (`<untrusted_search_evidence>`) preventing external prompt injection from web sources.

### Market Trend Provider
- **Active Provider**: **Google Trends API** (`google-trends-api`).
- Measures 12-month interest index, trajectory direction, and search momentum.

### AWS & Identity Stack
- **Authentication**: AWS Cognito User Pools (OAuth 2.0 / Hosted UI + Google Social Login & Email/Password).
- **Database**: AWS DynamoDB (Single-table design with Document Client SDK).
- **AWS Bedrock Web Search / Mantle**: *Disabled / Inactive* (Not part of the production pipeline).

---

## 4. Key Implemented & Verified Behaviors

1. **Deterministic Source IDs**:
   - Web search results are indexed deterministically as `src_1`, `src_2`, `src_3`.
   - Candidate citations (`evidencedBySourceIds`) strictly map to actual discovered evidence, avoiding fabricated citations.

2. **Entity & Context Disambiguation**:
   - Contextual entity resolution uses query phrasing and search evidence to identify specific organizations, locations, and events.

3. **Multi-Factor Candidate Differentiation**:
   - Evaluates pairwise token overlap on `angle`, `targetPainPoint`, `contentGap`, and `hook` to reject duplicate ideas.
   - Generates 6 distinct, high-impact candidate opportunities.

4. **Deterministic Score Calibration**:
   - Calibrated 10-point scoring algorithm combining Evidence Strength (25%), Novelty (25%), Audience Fit (25%), and Market Demand (25%).
   - Preserves score variance across candidates without artificial homogenization.

5. **Stage I → Stage II Contract (v2.0)**:
   - Carries structured `corpus` (entities, events, audience pain points, content gaps, keywords) and `enrichedResearch` directly into Stage II content generation.

6. **Automatic Research Enrichment & Persistence**:
   - Ideas saved or selected in My Ideas automatically carry rich audience pain points, competitor gaps, key insights, and recommended structure.
   - All research and draft states survive page refreshes and browser restarts.

7. **Responsive Content Studio & Library Layout**:
   - Top 2-column grid with matching heights: 25% Left Content Blueprint and 75% Right Multi-Platform Copy (neutral platform tabs, warm amber headings, clean markdown).
   - 100% Full-Width Master Draft positioned below the top grid.
   - Content Library with verified platform branding and icons (YouTube, LinkedIn, Twitter, Instagram, Reddit).

8. **Frontend Telemetry & Session Management**:
   - Transparent development API logging (`[API] GET/POST ...`).
   - Strict `useRef` session guards preventing infinite profile fetch loops.
   - Automatic setup banner auto-hide at 100% completion.

---

## 5. Verification & Test Coverage

- **Backend Unit & Integration Tests**: **102 / 102 passing** (`npm test` in `/backend`).
  - `auth-session.test.js`: Session lifecycle, token verification, CSRF, provider state endpoints.
  - `cognito-linking.test.js`: Full bidirectional state machines, conflict checks, and idempotency.
  - `creator-profile.test.js`: Profile CRUD, IDOR authorization barriers, context extraction.
  - `stage1-hardening.test.js`: Concurrent promise deduplication, prompt injection defenses, IDOR snapshot protection, novelty scoring, fallback chains, trend signal resilience.
  - `stage1-quality.test.js`: Deterministic source IDs, citation resolution, news vs evergreen queries, candidate distinctness, platform constraints.
  - `users.identity.test.js`: Provider-first identity resolution, same-email conflict rejection, name attribute preservation.
- **Frontend Production Build**: **20 / 20 routes passing** (`npm run build` in `/frontend`) with 0 TypeScript or lint errors.

---

## 6. Known Limitations

1. **In-Memory Express Session**:
   - Express session tokens use an in-memory session store; backend server restarts clear active server-side sessions. (Planned production enhancement: DynamoDB-backed session store).
2. **Social Media Auto-Publishing**:
   - Currently provides copy-ready, platform-optimized formatted drafts and calendar export; native OAuth write-publishing integrations to third-party social APIs are queued for future phases.
