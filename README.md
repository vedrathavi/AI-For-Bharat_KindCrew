# ?? AI-For-Bharat KindCrew

**An intelligent content creation platform powered by AI** - helping creators generate, refine, and distribute high-quality content across multiple platforms.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-blue)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-DynamoDB%20%7C%20Cognito%20%7C%20Bedrock-orange)](https://aws.amazon.com/)
## 🎬 Try It Out

**Live Demo:** [https://kindcrew-one.vercel.app/](https://kindcrew-one.vercel.app/)
## ?? Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## ? Features

### Phase 1: Ideation & Research
- **Zero Idea Flow**: Generate content ideas from scratch based on niche and audience
- **Some Idea Flow**: Refine rough ideas into polished content concepts  
- **Full Idea Flow**: Evaluate and score ideas based on virality, clarity, and competition
- **AI Research**: Leverage Google Trends and market research data

### Phase 2: Content Generation
- **Multi-Platform Support**: Instagram, Twitter, LinkedIn, YouTube, TikTok
- **Smart Variants**: Auto-generate platform-specific content variations
- **Content Scheduling**: Schedule posts across multiple platforms
- **Draft Management**: Save, edit, organize content drafts

### Authentication & Analytics
- **AWS Cognito**: Secure OAuth login with Google
- **Dashboard Analytics**: Track content performance
- **Creator Profiles**: Manage multiple creator accounts

## ??? Tech Stack

### Frontend
- Next.js 16 + TypeScript 5 + Tailwind CSS 4
- Zustand state management, Recharts visualization
- Axios HTTP client, Sonner notifications

### Backend
- Node.js 18+ with Express 5 (ES6 modules)
- AWS SDK, DynamoDB, Cognito, Bedrock

### Infrastructure
- **Backend**: Render (free tier, Node.js)
- **Frontend**: AWS Amplify / Vercel (free tier, Next.js)
- **Database**: AWS DynamoDB
- **Auth**: AWS Cognito
- **AI**: AWS Bedrock (Gemma 3)
- **Region**: ap-south-1 (Mumbai)

## ?? Prerequisites

- Node.js 18.0.0+, npm 9.0.0+
- AWS Account with DynamoDB, Cognito, Bedrock access
- GitHub Account

## ?? Quick Start

```bash
# Clone
git clone https://github.com/navyajain7105/AI-For-Bharat_KindCrew.git
cd AI-For-Bharat_KindCrew

# Backend (http://localhost:5000)
cd backend && npm install && npm run dev

# Frontend (http://localhost:3000)
cd ../frontend && npm install && npm run dev
```



## ?? Project Structure

```
+-- backend/
�   +-- config/app.js          # Express setup
�   +-- controllers/           # Request handlers
�   +-- services/              # Business logic
�   +-- utils/                 # Utilities
�   +-- routes/
�   +-- middleware/
�   +-- server.js
�   +-- package.json
�
+-- frontend/
�   +-- src/
�   �   +-- app/               # Next.js App Router
�   �   +-- lib/api/           # API clients
�   �   +-- store/             # Zustand state
�   �   +-- components/
�   +-- amplify.yml            # Build config
�   +-- package.json
�
+-- docs/
�   +-- design.md
�   +-- requirements.md
�
+-- DEPLOY_RENDER.md / DEPLOY_AMPLIFY.md
```

## ?? API Endpoints

**Auth:**
- GET /api/auth/login - Start OAuth
- GET /api/auth/callback - OAuth callback
- GET /api/auth/logout - Logout

**Profiles:**
- POST /api/creator-profiles - Create/update profile
- GET /api/creator-profiles/:userId - Get profile

**Ideation:**
- POST /api/ideation/generate - Generate ideas
- POST /api/ideation/refine - Refine ideas
- POST /api/ideation/evaluate - Score ideas
- POST /api/ideation/research - Research idea

**Content:**
- POST /api/content/from-idea - Create content
- GET /api/content/user - List content
- POST /api/content/update-status - Change status

## ?? Troubleshooting

**OAuth `invalid_state` error:**
- Ensure `app.set("trust proxy", 1)` in backend production config
- Clear cookies + test in incognito mode
- Verify HTTPS in production

**Amplify build fails:**
- Check `frontend/amplify.yml` uses `applications:` key
- Verify `appRoot: frontend` is set

**CORS errors:**
- Set `FRONTEND_URL` on backend
- Verify URL matches exactly

**DynamoDB errors:**
- Check table names and region
- Verify IAM permissions

## ?? Security

- Never commit `.env` with credentials
- Use AWS IAM roles in production
- Rotate secrets regularly
- Enable MFA on AWS accounts
- Use HTTPS (enforced by Render/Amplify)

See [SECURITY_NOTICE.md](SECURITY_NOTICE.md)

## ?? Contributing

1. `git checkout -b feature/your-feature`
2. `git commit -m "feat: Add feature"`
3. `git push origin feature/your-feature`
4. Open PR

## ?? Support

- [GitHub Issues](https://github.com/navyajain7105/AI-For-Bharat_KindCrew/issues)

- Review `/docs` folder

---

**Version:** 1.0.0 | **Updated:** March 8, 2026 | **Maintained by:** KindCrew - AI-For-Bharat Team
