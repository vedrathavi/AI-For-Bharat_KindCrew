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
   npm install
   npm run dev
   ```
   Frontend runs on: http://localhost:3000

## 📡 API Connection

### Simple Usage

```typescript
import apiClient from '@/lib/apiClient';

// GET request
const { data } = await apiClient.get('/health');

// POST request
const { data } = await apiClient.post('/api/endpoint', { key: 'value' });
```

### Configuration

Frontend `.env.local`:
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/health` | Health check |

## 🔐 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

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
