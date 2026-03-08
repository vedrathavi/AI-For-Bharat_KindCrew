# 🚀 Deploy Frontend to AWS Amplify (10 Minutes)

Deploy your Next.js frontend to AWS Amplify with automatic HTTPS and global CDN!

## Why AWS Amplify?

- ✅ **Optimized for Next.js** - Built-in SSR support
- ✅ **Global CDN** - Fast worldwide with CloudFront
- ✅ **Auto HTTPS** - Free SSL certificate
- ✅ **Auto-deploy** from GitHub
- ✅ **Generous free tier** - 1000 build minutes/month free
- ✅ **Easy custom domains**

---

## 🎯 Your Pre-Filled Configuration

**Backend API (Render):** Update after deploying backend  
**Cognito Configuration:**

- Pool ID: `ap-south-1_AVgAOJlyL`
- Client ID: `6sf5ji9pqp4bqgg8i009jtgti3`
- Domain: `https://ap-south-1avgaojlyl.auth.ap-south-1.amazoncognito.com`
- Region: `ap-south-1`

---

## 📋 Deployment Steps

### Step 1: Push Frontend Code to GitHub

Make sure all changes are committed:

```powershell
# If you're on feature branch, merge to main first
git checkout main
git merge feat/ideation-ui-research-fixes
git push origin main

# Or if deploying from feature branch
git add .
git commit -m "Prepare frontend for Amplify deployment"
git push origin feat/ideation-ui-research-fixes
```

### Step 2: Log into AWS Amplify Console

1. **Go to AWS Amplify Console:**
   - https://ap-south-1.console.aws.amazon.com/amplify/home?region=ap-south-1

2. **Click "Get started"** under "Amplify Hosting"

3. **Or if you have existing apps, click "New app" → "Host web app"**

### Step 3: Connect GitHub Repository

1. **Select:** "GitHub"
2. **Authorize AWS Amplify** to access your GitHub
3. **Select repository:** `navyajain7105/AI-For-Bharat_KindCrew`
4. **Select branch:** `main` (or `feat/ideation-ui-research-fixes` for testing)
5. **Click "Next"**

### Step 4: Configure Build Settings

Amplify should **auto-detect Next.js**. Verify the settings:

**App name:** `kindcrew-frontend`

**Build settings** should show:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

**✅ This is already configured in your `frontend/amplify.yml`!**

**Advanced settings:**

- Monorepo root directory: `frontend`
- Build command: `npm run build`
- Output directory: `.next` (auto-detected)

Click **"Next"**

### Step 5: Add Environment Variables

**CRITICAL:** Add these environment variables before deploying:

Click **"Advanced settings"** → **"Add environment variable"**

Add these **one by one**:

```bash
# Backend API URL (update with your Render URL)
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com

# Cognito Configuration
NEXT_PUBLIC_COGNITO_DOMAIN=https://ap-south-1avgaojlyl.auth.ap-south-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=6sf5ji9pqp4bqgg8i009jtgti3
NEXT_PUBLIC_COGNITO_REGION=ap-south-1
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://your-render-backend-url.onrender.com/api/auth/callback
```

**⚠️ Important:** Replace `your-render-backend-url` with your actual Render backend URL!

If you don't have the Render backend URL yet:

- Deploy backend to Render first (see [DEPLOY_RENDER.md](./DEPLOY_RENDER.md))
- Or use `http://localhost:5000` for now (update later)

### Step 6: Review and Deploy

1. **Review all settings**
2. **Click "Save and deploy"**

⏳ **Wait 5-10 minutes** for the first deployment.

You'll see:

```
Provision → Build → Deploy → Verify
```

### Step 7: Get Your Frontend URL

After deployment completes, you'll see:

```
✅ Your app is successfully deployed!
https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

📝 **Save your Amplify URL here:** `_________________________________`

---

## 🔧 After First Deployment

### 1. Test Your Frontend

Open your Amplify URL in a browser:

```
https://main.XXXXX.amplifyapp.com
```

### 2. Update Backend URL (If Needed)

If you deployed with `localhost:5000`, update it now:

1. **Amplify Console** → Your app → **Environment variables**
2. **Edit** `NEXT_PUBLIC_API_URL`
3. **Set to:** `https://your-render-backend-url.onrender.com`
4. **Save** (this triggers a redeploy - takes 3-5 minutes)

### 3. Update Backend FRONTEND_URL

Update your Render backend environment variable:

1. **Render Dashboard** → Your backend service
2. **Environment** tab
3. **Add/Update:** `FRONTEND_URL`
4. **Set to:** `https://main.XXXXX.amplifyapp.com`
5. **Save** (this restarts your backend)

### 4. Update Cognito Callback URLs

1. **Go to AWS Cognito Console:**
   - https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools

2. **Select your User Pool:** `ap-south-1_AVgAOJlyL`

3. **App integration** → **App client: 6sf5ji9pqp4bqgg8i009jtgti3** → **Edit**

4. **Update Callback URLs** (add your Amplify URL):

   ```
   https://main.XXXXX.amplifyapp.com/
   https://your-render-backend-url.onrender.com/api/auth/callback
   http://localhost:3000/ (keep for local dev)
   http://localhost:5000/api/auth/callback (keep for local dev)
   ```

5. **Update Sign out URLs** (add your Amplify URL):

   ```
   https://main.XXXXX.amplifyapp.com/
   https://your-render-backend-url.onrender.com/
   http://localhost:3000/ (keep for local dev)
   ```

6. **Save changes**

### 5. Test End-to-End Flow

1. Open your Amplify URL
2. Try logging in
3. Test all features
4. Check browser console for errors

---

## 🎨 Custom Domain (Optional)

### Add Your Own Domain

1. **Amplify Console** → Your app → **Domain management**
2. **Add domain** → Enter your domain (e.g., `kindcrew.com`)
3. **Configure DNS** (Amplify provides instructions)
4. **Wait for SSL certificate** (5-30 minutes)

**Example:**

```
www.kindcrew.com → Your frontend
api.kindcrew.com → Your backend (configure in Render)
```

---

## 📊 Monitoring Your App

### View Build Logs

- **Amplify Console** → Your app → **Build history**
- Click any build to see detailed logs

### View Real-Time Logs

- **Amplify Console** → Your app → **Monitoring** → **Logs**

### View Metrics

- **Amplify Console** → Your app → **Monitoring**
- See: Requests, Data transfer, Errors, Latency

### Performance Monitoring

- Amplify includes CloudFront CDN
- Global edge locations for fast loading
- Automatic image optimization

---

## 🔄 Auto-Deploy Setup

**Already configured!** Every push to your selected branch auto-deploys.

```
You push to GitHub → Amplify detects push →
Builds frontend → Deploys to CDN → Live in 5 mins! ✅
```

### Disable Auto-Deploy (Optional)

If you want manual control:

1. **Amplify Console** → Your app → **Build settings**
2. **Edit** → Uncheck "Automatically deploy updates"

### Deploy Manually

**Amplify Console** → Your app → **Redeploy this version**

---

## 💰 Cost Estimate (AWS Amplify)

### Free Tier (12 months):

- ✅ **1000 build minutes/month** - Free
- ✅ **15 GB data transfer out/month** - Free
- ✅ **5 GB storage** - Free

### After Free Tier:

- **Build minutes:** $0.01/minute (~₹0.83/minute)
- **Hosting:** $0.15/GB data transfer out (~₹12.45/GB)
- **Storage:** $0.023/GB/month (~₹1.90/GB/month)

### Typical Monthly Cost:

- **Low traffic:** $0-5/month (₹0-415/month)
- **Medium traffic:** $5-20/month (₹415-1660/month)
- **High traffic:** $20-100/month (₹1660-8300/month)

**Much cheaper than running a server!**

---

## 🆚 Amplify vs Vercel

| Feature             | AWS Amplify      | Vercel           |
| ------------------- | ---------------- | ---------------- |
| **Free Tier**       | 1000 build mins  | 100 GB bandwidth |
| **Cost**            | Pay per use      | Free for hobby   |
| **Next.js Support** | ✅ Good          | ✅ Excellent     |
| **AWS Integration** | ✅✅ Native      | ❌ External      |
| **Setup Time**      | 10 minutes       | 5 minutes        |
| **Custom Domain**   | ✅ Free SSL      | ✅ Free SSL      |
| **Global CDN**      | CloudFront       | Vercel Edge      |
| **Region Control**  | ✅ Choose region | ❌ Auto          |

**For your project:** Amplify is better because:

- Your backend is on AWS (Cognito, DynamoDB, Bedrock)
- Easy integration with AWS services
- More control over region (ap-south-1)

---

## 🚨 Common Issues

### Issue: "Build failed - Module not found"

**Solution:** Make sure `frontend/package.json` has all dependencies:

```powershell
cd frontend
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue: "API calls failing with CORS error"

**Solution:** Update backend `FRONTEND_URL` environment variable in Render:

```bash
FRONTEND_URL=https://main.XXXXX.amplifyapp.com
```

### Issue: "Environment variables not updating"

**Solution:** After changing variables in Amplify:

1. **Amplify Console** → Your app
2. Click **"Redeploy this version"**
3. Wait 3-5 minutes

### Issue: "Cognito login redirects to localhost"

**Solution:** Update `NEXT_PUBLIC_COGNITO_REDIRECT_URI` in Amplify:

```bash
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://your-render-backend-url.onrender.com/api/auth/callback
```

### Issue: "Slow build times"

**Solution:** Amplify caches `node_modules` and `.next/cache` automatically.
First build: 5-10 minutes
Subsequent builds: 2-4 minutes

---

## 🔐 Security Best Practices

### 1. Environment Variables

- ✅ All `NEXT_PUBLIC_*` variables are safe to expose
- ⚠️ Never put secrets in `NEXT_PUBLIC_*` variables
- ✅ Amplify encrypts environment variables

### 2. HTTPS

- ✅ Automatic HTTPS with free SSL certificate
- ✅ Redirects HTTP → HTTPS automatically

### 3. Headers

Add security headers in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};
```

---

## 📈 Scaling Your Frontend

As your traffic grows:

### Use Amplify's Built-in Features:

1. **CloudFront CDN** - Automatically enabled
2. **Image Optimization** - Automatic
3. **Caching** - Configured via headers
4. **Rate Limiting** - Configure in AWS WAF

### Add AWS WAF (Optional):

- Protect against DDoS
- Rate limiting per IP
- Geographic restrictions
- Cost: ~$5-10/month

---

## 🎯 Complete Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Frontend pushed to GitHub
- [ ] Amplify app created and connected
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] Backend URL updated in Amplify
- [ ] Frontend URL updated in Render backend
- [ ] Cognito callback URLs updated
- [ ] Login flow tested
- [ ] All features tested
- [ ] Custom domain added (optional)

---

## 🔄 Local Development After Deployment

Your local setup still works! Update `frontend/.env.local`:

```env
# For local development
NEXT_PUBLIC_API_URL=http://localhost:5000

# Or test with production backend
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com

# Cognito stays the same
NEXT_PUBLIC_COGNITO_DOMAIN=https://ap-south-1avgaojlyl.auth.ap-south-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=6sf5ji9pqp4bqgg8i009jtgti3
NEXT_PUBLIC_COGNITO_REGION=ap-south-1
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:5000/api/auth/callback
```

---

## 📖 Additional Resources

- **Amplify Docs:** https://docs.amplify.aws/
- **Next.js on Amplify:** https://docs.amplify.aws/guides/hosting/nextjs/
- **CloudFront CDN:** https://aws.amazon.com/cloudfront/
- **AWS Free Tier:** https://aws.amazon.com/free/

---

## 🎉 You're Done!

Your full-stack app is now deployed:

```
Frontend: AWS Amplify (Next.js + CloudFront CDN)
    ↓
Backend: Render (Express API)
    ↓
AWS Services: DynamoDB + Cognito + Bedrock
```

**Production-ready architecture!** ✨

---

## 🚀 Quick Commands Reference

```powershell
# Push changes (auto-deploys to Amplify)
git add .
git commit -m "Update frontend"
git push origin main

# Test locally
cd frontend
npm run dev

# Build locally (test before pushing)
npm run build
npm start
```

---

**Next Steps:**

1. Deploy backend to Render: [DEPLOY_RENDER.md](./DEPLOY_RENDER.md)
2. Deploy frontend to Amplify: Follow this guide
3. Test everything!
4. Consider custom domain
5. Monitor usage and costs

**Need help?** Check the Common Issues section or AWS Amplify docs!
