# 🚀 AI-For-Bharat KindCrew

Full-stack application with Next.js (TypeScript) frontend and Express (ES6) backend.

## 📁 Project Structure

```
AI-For-Bharat_KindCrew/
├── backend/              # Express Server (ES6 Modules)
│   ├── config/
│   │   └── app.js       # Express configuration
│   ├── controllers/     # Request handlers (empty - ready for use)
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/          # API routes (empty - ready for use)
│   ├── utils/
│   │   └── response.js  # Response formatters
│   ├── .env
│   ├── .gitignore
│   ├── server.js        # Entry point
│   └── package.json
│
└── frontend/             # Next.js 16 (TypeScript)
    ├── src/
    │   ├── app/         # Next.js App Router
    │   │   ├── page.tsx
    │   │   ├── layout.tsx
    │   │   └── globals.css
    │   ├── lib/
    │   │   ├── apiClient.ts    # Axios instance
    │   │   └── constants.ts    # API configuration
    │   └── store/
    │       └── useAppStore.ts  # Zustand store
    ├── .env.local
    └── package.json
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Zustand** - State management

### Backend

- **Express.js** - Web framework
- **ES6 Modules** - Modern JavaScript
- **CORS** - Cross-origin support
- **Nodemon** - Auto-reload in development

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd AI-For-Bharat_KindCrew
   ```

2. **Setup Backend**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   Backend runs on: http://localhost:5000

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install    # ensures new packages including react-calendar are installed
   npm run dev
   ```
   Frontend runs on: http://localhost:3000

## 📡 API Connection

### Simple Usage

```typescript
import apiClient from "@/lib/apiClient";

// GET request
const { data } = await apiClient.get("/health");

// POST request
const { data } = await apiClient.post("/api/endpoint", { key: "value" });
```

### Configuration

Be **very careful** with the frontend API URL. If `NEXT_PUBLIC_API_URL` is missing or points to the frontend origin (e.g. `http://localhost:3000`), all calls in `src/lib/api/*` will hit the Next.js server instead of the Express backend and you’ll see

```
Requested resource not found
```

errors on the planning page or anywhere else.

Frontend `.env.local` (must point at backend):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Backend `.env`:

```env
PORT=5000
NODE_ENV=development
```

## 📚 Documentation

- [API Connection Guide](./docs/api-connection.md) - Detailed usage
- [Design Document](./docs/design.md)
- [Requirements](./docs/requirements.md)

## 🎯 Available Scripts

### Backend

```bash
npm run dev    # Start with nodemon (auto-reload)
npm start      # Start production server
```

### Frontend

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Start production server
```

## ✅ API Endpoints

| Method | Endpoint                    | Description                      |
| ------ | --------------------------- | -------------------------------- |
| GET    | `/`                         | Welcome message                  |
| GET    | `/health`                   | Health check                     |
| POST   | `/api/publishing/schedule`  | Schedule content for posting     |
| GET    | `/api/publishing/scheduled` | List user's scheduled posts      |
| PUT    | `/api/publishing/:id`       | Update a scheduled post          |
| POST   | `/api/publishing/:id/post`  | Trigger immediate posting (stub) |

## 🔐 Environment Variables

### Backend (.env)

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DYNAMODB_USERS_TABLE` - (optional) users table name
- `DYNAMODB_PUBLISHING_TABLE` - (optional) schedules table name

### Google Calendar Integration (optional)

- `GOOGLE_CLIENT_ID` – OAuth client ID
- `GOOGLE_CLIENT_SECRET` – OAuth client secret
- `GOOGLE_REDIRECT_URI` – Callback URI used during auth

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🚀 Deployment

### 🎯 Recommended Deployment (Free Tier)

**Deploy your full stack in 30 minutes - completely free!**

```
Backend  → Render (Free)
Frontend → AWS Amplify (Free)
Database → DynamoDB (Pay per use)
Auth     → Cognito (Free tier)
AI       → Bedrock (Pay per token)
```

### ⚡ Quick Start Guides

#### Complete Deployment (Start Here!):

**[📖 FULL_DEPLOYMENT_CHECKLIST.md](./FULL_DEPLOYMENT_CHECKLIST.md)** - Complete 30-minute checklist with all steps

#### Backend Deployment:

**[📖 DEPLOY_RENDER.md](./DEPLOY_RENDER.md)** - Deploy backend to Render (5 minutes, free tier)

#### Frontend Deployment:

**[📖 DEPLOY_AMPLIFY.md](./DEPLOY_AMPLIFY.md)** - Deploy frontend to AWS Amplify (10 minutes, free tier)

### 🏗️ Why This Stack?

**Backend on Render:**

- ✅ **$0/month** - Free tier (750 hours)
- ✅ **5-minute setup** - No CLI tools needed
- ✅ **Auto-deploy** - Push to GitHub = Auto deploy
- ✅ **SSL included** - Automatic HTTPS

**Frontend on AWS Amplify:**

- ✅ **Free tier** - 1000 build minutes/month
- ✅ **Global CDN** - CloudFront distribution
- ✅ **Perfect for Next.js** - SSR support
- ✅ **Auto HTTPS** - Free SSL certificate

**Total Cost: ~₹150-700/month (~$2-8/month)** for low-medium traffic

### 📖 Alternative Deployment Options

**For Production Scale:**

- **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** - Deploy backend to AWS Elastic Beanstalk
- **[YOUR_DEPLOYMENT_COMMANDS.md](./YOUR_DEPLOYMENT_COMMANDS.md)** - Detailed AWS guide with pre-filled credentials

**Comparison:**

- **[RENDER_VS_AWS.md](./RENDER_VS_AWS.md)** - Detailed comparison to help you choose

**Additional Resources:**

- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - 30-minute AWS deployment guide
- **[DEPLOY_BACKEND_FROM_GITHUB.md](./DEPLOY_BACKEND_FROM_GITHUB.md)** - GitHub CI/CD options
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment documentation
- **[SECURITY_NOTICE.md](./SECURITY_NOTICE.md)** - Important security best practices

### Auto-configured files:

- ✅ `frontend/amplify.yml` - Amplify build configuration
- ✅ `backend/.ebignore` - Elastic Beanstalk ignore rules
- ✅ `.github/workflows/deploy-backend.yml` - CI/CD pipeline

### Deployment Architecture:

```
Users → AWS Route 53 (DNS)
         ↓
    AWS CloudFront (CDN)
         ↓
    AWS Amplify (Frontend)
         ↓
    AWS Elastic Beanstalk (Backend API)
         ↓
    ┌─────────────────────────┐
    │ DynamoDB (Database)     │
    │ Cognito (Auth)          │
    │ Bedrock (AI)            │
    └─────────────────────────┘
```

See the guides above for detailed step-by-step instructions!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

---

**Happy Coding! 🎉**
