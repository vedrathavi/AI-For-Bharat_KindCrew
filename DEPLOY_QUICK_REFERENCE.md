# 🎯 Deployment Quick Reference

One-page reference for deploying your full stack!

---

## 📝 Your Deployed URLs

Fill these in as you deploy:

```
Backend (Render):   https://_____________________.onrender.com
Frontend (Amplify): https://main._____________________.amplifyapp.com
GitHub Repo:        https://github.com/navyajain7105/AI-For-Bharat_KindCrew
```

---

## ⚡ Deploy Backend to Render (5 mins)

### Step 1: Create Service
1. Go to: https://render.com/
2. Sign up with GitHub
3. New Web Service → Connect repo: `navyajain7105/AI-For-Bharat_KindCrew`
4. Settings:
   ```
   Name:         kindcrew-api
   Branch:       main
   Root Dir:     backend
   Build:        npm install
   Start:        npm start
   Plan:         Free
   ```

### Step 2: Environment Variables
```bash
NODE_ENV=production
PORT=10000
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
COGNITO_USER_POOL_ID=ap-south-1_AVgAOJlyL
COGNITO_CLIENT_ID=6sf5ji9pqp4bqgg8i009jtgti3
COGNITO_DOMAIN=https://ap-south-1avgaojlyl.auth.ap-south-1.amazoncognito.com
COGNITO_REGION=ap-south-1
COGNITO_REDIRECT_URI=https://YOUR-RENDER-URL/api/auth/callback
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-hey-navya-rishabh-ved
DYNAMODB_USERS_TABLE=KindCrew-Users
DYNAMODB_CREATOR_PROFILES_TABLE=KindCrew-CreatorProfiles
CONTENT_IDEAS_TABLE=KindCrew-ContentIdeas
CONTENT_TABLE=KindCrew-ContentItems
BEDROCK_DEFAULT_MODEL=google.gemma-3-12b-it
FRONTEND_URL=http://localhost:3000
```

### Step 3: Deploy & Test
```powershell
# Deploy happens automatically!
# Test: Open your Render URL
curl https://YOUR-RENDER-URL/health
```

---

## ⚡ Deploy Frontend to AWS Amplify (10 mins)

### Step 1: Create App
1. Go to: https://ap-south-1.console.aws.amazon.com/amplify/
2. New app → Host web app → GitHub
3. Authorize AWS Amplify
4. Select repo: `navyajain7105/AI-For-Bharat_KindCrew`
5. Branch: `main`
6. App name: `kindcrew-frontend`
7. Root directory: `frontend`

### Step 2: Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-BACKEND-URL
NEXT_PUBLIC_COGNITO_DOMAIN=https://ap-south-1avgaojlyl.auth.ap-south-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=6sf5ji9pqp4bqgg8i009jtgti3
NEXT_PUBLIC_COGNITO_REGION=ap-south-1
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://YOUR-RENDER-BACKEND-URL/api/auth/callback
```

### Step 3: Deploy & Test
```powershell
# Deploy happens automatically! (5-10 mins)
# Test: Open your Amplify URL in browser
```

---

## 🔄 Update Cross-References

### Update Render (Backend):
```bash
FRONTEND_URL=https://main.XXXXX.amplifyapp.com
COGNITO_REDIRECT_URI=https://kindcrew-api-XXXXX.onrender.com/api/auth/callback
```

### Update Amplify (Frontend):
```bash
NEXT_PUBLIC_API_URL=https://kindcrew-api-XXXXX.onrender.com
```

### Update Cognito:
1. Go to: https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools
2. Select: `ap-south-1_AVgAOJlyL`
3. App client: `6sf5ji9pqp4bqgg8i009jtgti3`
4. Add Callback URLs:
   ```
   https://main.XXXXX.amplifyapp.com/
   https://kindcrew-api-XXXXX.onrender.com/api/auth/callback
   http://localhost:3000/
   http://localhost:5000/api/auth/callback
   ```
5. Add Sign out URLs:
   ```
   https://main.XXXXX.amplifyapp.com/
   https://kindcrew-api-XXXXX.onrender.com/
   http://localhost:3000/
   ```

---

## ✅ Test Everything

```powershell
# 1. Test backend health
curl https://YOUR-RENDER-URL/health

# 2. Open frontend in browser
# URL: https://main.XXXXX.amplifyapp.com

# 3. Test login flow
# Click login → Redirects to Cognito → Login → Redirects back

# 4. Test API calls
# Create content idea, view dashboard, etc.
```

---

## 🔍 Useful Commands

### Git Commands
```powershell
# Push changes (triggers auto-deploy)
git add .
git commit -m "Update app"
git push origin main

# Check what branch you're on
git branch

# Switch to main branch
git checkout main
```

### View Logs
```
Render:   Dashboard → Logs tab
Amplify:  Console → Build history → Click build → View logs
```

### Manual Deploy
```
Render:   Dashboard → Manual Deploy → Deploy latest commit
Amplify:  Console → Redeploy this version
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend sleeps | Expected on free tier (30s wake time) |
| CORS errors | Update `FRONTEND_URL` in Render |
| API 404 errors | Check `NEXT_PUBLIC_API_URL` in Amplify |
| Login redirect fails | Update Cognito callback URLs |
| Build fails | Check logs, verify dependencies |

---

## 💰 Cost Summary

```
Backend (Render):         $0/month (free tier)
Frontend (Amplify):       $0/month (free tier)
DynamoDB:                 ~₹50-200/month ($0.50-2)
Cognito:                  $0/month (free tier)
Bedrock:                  ~₹100-500/month ($1-6)
Total:                    ~₹150-700/month ($2-8)
```

---

## 📚 Full Documentation

- **Complete Checklist:** [FULL_DEPLOYMENT_CHECKLIST.md](./FULL_DEPLOYMENT_CHECKLIST.md)
- **Render Guide:** [DEPLOY_RENDER.md](./DEPLOY_RENDER.md)
- **Amplify Guide:** [DEPLOY_AMPLIFY.md](./DEPLOY_AMPLIFY.md)
- **Comparison:** [RENDER_VS_AWS.md](./RENDER_VS_AWS.md)
- **Security:** [SECURITY_NOTICE.md](./SECURITY_NOTICE.md)

---

## 🎉 You're Done!

Your app is live at:
- **Frontend:** https://main.XXXXX.amplifyapp.com
- **Backend:** https://kindcrew-api-XXXXX.onrender.com

Push to `main` branch = Auto deploy! 🚀
