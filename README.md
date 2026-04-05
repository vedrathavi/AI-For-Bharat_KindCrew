# 🤍 KindCrew - AI Content Creation Platform

An AI-powered content creation platform that helps creators ideate, generate, and manage content across multiple platforms.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-blue)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-DynamoDB%20%7C%20Cognito%20%7C%20Bedrock-orange)](https://aws.amazon.com/)

## 🌐 Live Demo

**Demo:** [https://main.d2bnn3uoz2jafb.amplifyapp.com/](https://main.d2bnn3uoz2jafb.amplifyapp.com/)


## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## ✨ Features

### Content Ideation

- **AI Idea Generation**: Generate content ideas based on your niche and target audience
- **Idea Refinement**: Polish rough concepts into structured content ideas
- **Google Trends Integration**: Research trending topics in your niche
- **Idea Evaluation**: Score ideas based on virality potential and clarity

### Content Creation

- **Multi-Platform Support**: Create content for Instagram, Twitter, LinkedIn, YouTube, and TikTok
- **AI Content Generation**: Generate platform-specific content with customizable tones
- **Draft Management**: Save and organize your content ideas
- **Content Library**: Manage all your created content in one place

### Planning & Analytics

- **Calendar View**: Visualize your content schedule
- **Publishing Scheduler**: Plan when to publish your content (scheduling features in development)
- **Performance Tracking**: Track basic content metrics
- **AI Insights**: Get suggestions to improve your content (in development)

### User Management

- **Secure Authentication**: OAuth login via AWS Cognito
- **Creator Profiles**: Set up and manage your creator profile with niche, audience, and preferences
- **Multi-Platform Integration**: Connect and manage multiple social media platforms

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS 4 with custom theme tokens
- **State Management**: Zustand
- **UI Components**: Custom components with React Icons
- **Charts**: Recharts for analytics visualization
- **Calendar**: React Calendar for scheduling

### Backend

- **Runtime**: Node.js 18+ with Express 5
- **Database**: AWS DynamoDB
- **Authentication**: AWS Cognito
- **AI**: AWS Bedrock (Claude/other models)
- **APIs**: Google Trends integration

### Deployment

- **Frontend**: AWS Amplify
- **Backend**: Render (free tier)
- **Region**: ap-south-1 (Mumbai for low latency)

## 📦 Prerequisites

Before you begin, ensure you have:

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- AWS Account with access to DynamoDB, Cognito, and Bedrock
- GitHub Account

## 🚀 Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/navyajain7105/AI-For-Bharat_KindCrew.git
cd AI-For-Bharat_KindCrew
```

2. **Set up the backend**

```bash
cd backend
npm install
# Create .env file with required AWS credentials
npm run dev  # Runs on http://localhost:5000
```

3. **Set up the frontend**

```bash
cd ../frontend
npm install
# Create .env.local with backend API URL
npm run dev  # Runs on http://localhost:3000
```

> **Security Note:** Never commit `.env` files. Required environment variables must be configured separately for each deployment.

## 📁 Project Structure

```
AI-For-Bharat_KindCrew/
├── backend/
│   ├── config/          # App configuration
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── middleware/      # Auth & error handlers
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js pages (App Router)
│   │   │   ├── dashboard/
│   │   │   ├── ideation/
│   │   │   ├── content/
│   │   │   ├── profile/
│   │   │   └── analytics/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # API clients & utilities
│   │   └── store/       # Zustand state management
│   └── public/          # Static assets
│
├── docs/                # Documentation
└── README.md
```

## 🔌 API Overview

### Authentication

- `GET /api/auth/login` - Initiate OAuth flow
- `GET /api/auth/callback` - Handle OAuth callback
- `POST /api/auth/logout` - Logout user

### Creator Profiles

- `POST /api/creator-profiles` - Create/update profile
- `GET /api/creator-profiles/:userId` - Get profile

### Ideation

- `POST /api/ideation/generate` - Generate content ideas
- `POST /api/ideation/refine` - Refine existing ideas
- `POST /api/ideation/evaluate` - Score and evaluate ideas
- `POST /api/ideation/research` - Research trends for ideas

### Content Management

- `POST /api/content/from-idea` - Create content from idea
- `GET /api/content/user` - List user's content
- `POST /api/content/update-status` - Update content status

### Publishing (In Development)

- `POST /api/publishing/schedule` - Schedule content
- `GET /api/publishing/schedules` - Get scheduled content

## 🚢 Deployment

### Backend (Render)

1. Connect your GitHub repository to Render
2. Configure environment variables in Render dashboard
3. Deploy from `main` branch

See [DEPLOY_RENDER.md](DEPLOY_RENDER.md) for detailed instructions.

### Frontend (AWS Amplify)

1. Connect your GitHub repository to AWS Amplify
2. Configure build settings using `amplify.yml`
3. Set environment variables in Amplify console
4. Deploy from `main` branch

See [DEPLOY_AMPLIFY.md](DEPLOY_AMPLIFY.md) for detailed instructions.

## 🐛 Troubleshooting

### OAuth Issues

- Ensure callback URLs match exactly in AWS Cognito settings
- Clear browser cookies and cache
- Verify HTTPS is used in production
- Check `trust proxy` setting in Express config

### Build Failures

- Verify Node.js version matches requirements
- Check all environment variables are set
- Review build logs for specific errors
- Ensure `amplify.yml` is properly configured

### API Connection Issues

- Verify CORS settings in backend
- Check that frontend `NEXT_PUBLIC_API_URL` points to correct backend
- Ensure backend is running and accessible

### DynamoDB Errors

- Verify AWS credentials and permissions
- Check table names and region configuration
- Ensure tables exist with correct schema

## 🔒 Security

- **Never** commit `.env` files or credentials in code
- Use environment variables for all sensitive data
- Rotate AWS access keys regularly
- Enable MFA on AWS accounts
- Use HTTPS in production (enforced by hosting platforms)
- Implement proper CORS policies
- Review [SECURITY_NOTICE.md](SECURITY_NOTICE.md) for more details

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📝 License

This project is part of the AI-For-Bharat initiative.

## 🙏 Acknowledgments

- Built with AWS services (DynamoDB, Cognito, Bedrock)
- Google Trends API for trend research
- Next.js and React ecosystem
- Tailwind CSS for styling

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/navyajain7105/AI-For-Bharat_KindCrew/issues)
- **Documentation**: Check `/docs` folder for detailed guides

---

**Version:** 1.0.0-beta | **Last Updated:** March 2026 | **Built for AI-For-Bharat**
