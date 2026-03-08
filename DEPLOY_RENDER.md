# 🚀 Deploy Backend to Render (5 Minutes)

Render is **free** and much simpler than AWS for testing! Deploy in 5 minutes.

## Why Render First?
- ✅ **Free tier** - Perfect for testing
- ✅ **Auto-deploy** from GitHub (push to deploy)
- ✅ **Simple setup** - No CLI tools needed
- ✅ **SSL included** - Automatic HTTPS
- ✅ **Easy to migrate** to AWS later

---

## 🎯 Your Pre-Filled Configuration

All details extracted from your `.env` files - ready to use!

**Region:** ap-south-1 (Mumbai, India)
**Stack:** Node.js 18, Express, DynamoDB, Cognito, Bedrock

---

## 📋 Deployment Steps

### Step 1: Push Your Code to GitHub

```powershell
# Make sure all changes are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Sign Up on Render

1. Go to: https://render.com/
2. Click **"Get Started for Free"**
3. Sign up with your GitHub account (easiest)
4. Authorize Render to access your repositories

### Step 3: Create New Web Service

1. **Click "New +"** → **"Web Service"**
2. **Connect your repository:** `navyajain7105/AI-For-Bharat_KindCrew`
3. **Configure the service:**

```
Name: kindcrew-api
Region: Singapore (closest to ap-south-1 Mumbai)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

4. **Select Free Plan** (for testing)

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Copy-paste these **one at a time** (click "Add" for each):

```bash
# Node Configuration
NODE_ENV=production
PORT=10000

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY

# Cognito Configuration
COGNITO_USER_POOL_ID=ap-south-1_AVgAOJlyL
COGNITO_CLIENT_ID=6sf5ji9pqp4bqgg8i009jtgti3
COGNITO_DOMAIN=https://ap-south-1avgaojlyl.auth.ap-south-1.amazoncognito.com
COGNITO_REGION=ap-south-1
COGNITO_REDIRECT_URI=https://kindcrew-api.onrender.com/api/auth/callback

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-hey-navya-rishabh-ved

# DynamoDB Tables
DYNAMODB_USERS_TABLE=KindCrew-Users
DYNAMODB_CREATOR_PROFILES_TABLE=KindCrew-CreatorProfiles
CONTENT_IDEAS_TABLE=KindCrew-ContentIdeas
CONTENT_TABLE=KindCrew-ContentItems

# AWS Bedrock
BEDROCK_DEFAULT_MODEL=google.gemma-3-12b-it

# Frontend URL (update after deploying frontend)
FRONTEND_URL=http://localhost:3000
```

**Important:** Update `COGNITO_REDIRECT_URI` with your actual Render URL after deployment!

### Step 5: Deploy!

Click **"Create Web Service"**

⏳ **Wait 3-5 minutes** for deployment to complete.

You'll see:
```
Your service is live at https://kindcrew-api.onrender.com 🎉
```

---

## 🔧 After Deployment

### 1. Test Your API

```powershell
# Test health endpoint
curl https://kindcrew-api.onrender.com/health

# Should return: {"status":"OK","timestamp":"..."}
```

### 2. Get Your Render URL

Your URL will be: `https://kindcrew-api-XXXXX.onrender.com`

📝 **Save it here:** `_________________________________`

### 3. Update Environment Variables

In Render dashboard → **Environment** tab:

Update these with your actual URL:

```bash
COGNITO_REDIRECT_URI=https://YOUR-RENDER-URL.onrender.com/api/auth/callback
```

Click **"Save Changes"** (this will restart your service)

### 4. Update Cognito Callback URLs

1. Go to: https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools
2. Select pool: `ap-south-1_AVgAOJlyL`
3. **App integration** → **App client settings**
4. **Add Callback URLs:**
   ```
   https://YOUR-RENDER-URL.onrender.com/api/auth/callback
   http://localhost:5000/api/auth/callback
   ```
5. **Add Sign out URLs:**
   ```
   https://YOUR-RENDER-URL.onrender.com/
   http://localhost:3000/
   ```

### 5. Update Frontend to Use Render Backend

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-URL.onrender.com
```

Restart your frontend:
```powershell
cd frontend
npm run dev
```

---

## 🎉 Done! Your Backend is Live!

Every push to `main` branch will **automatically deploy** to Render!

---

## 🔍 Useful Features

### View Logs
Dashboard → **Logs** tab → Real-time logs

### Check Metrics
Dashboard → **Metrics** tab → CPU, Memory, Response times

### Manual Deploy
Dashboard → **Manual Deploy** → Pick branch → **Deploy**

### Shell Access
Dashboard → **Shell** tab → Access your container

### Custom Domain
Dashboard → **Settings** → **Custom Domain** → Add your domain

---

## 💰 Cost Comparison

### Render Free Tier:
- ✅ **$0/month**
- 750 hours/month (enough for testing)
- 512 MB RAM
- Sleeps after 15 mins of inactivity
- Auto-wakes on request (30 seconds delay)

### Render Paid ($7/month):
- 24/7 uptime (no sleeping)
- 512 MB RAM
- Unlimited hours
- Better for production

### AWS Elastic Beanstalk:
- ~₹2000-2500/month (~$24-30)
- t3.small instance
- Full control
- Better for high traffic

**Recommendation:** Use Render free tier for testing, then upgrade to Render $7/month or AWS when ready for production.

---

## ⚠️ Free Tier Limitations

- **Sleeps after 15 mins** of inactivity
- **First request takes ~30 seconds** to wake up
- **Next requests are instant**

To prevent sleeping (optional):
- Upgrade to paid plan ($7/month)
- Or use an uptime monitor (e.g., UptimeRobot) to ping every 10 minutes

---

## 🚨 Common Issues

### Issue: "Build failed"

**Solution:** Check `backend/package.json` has:
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Issue: "Port already in use"

**Solution:** Render automatically sets `PORT=10000`. Your code should use:
```javascript
const PORT = process.env.PORT || 5000;
```
✅ You already have this in `server.js`!

### Issue: "Cannot connect to DynamoDB"

**Solution:** Double-check environment variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION=ap-south-1`

### Issue: "CORS errors from frontend"

**Solution:** Update `FRONTEND_URL` in Render environment to your actual frontend URL.

---

## 🔄 Auto-Deploy Workflow

```
You push to GitHub → Render detects push → 
Builds backend → Runs npm install → 
Starts with npm start → Live in 3-5 mins! ✅
```

No GitHub Actions needed - Render handles everything!

---

## 📝 When to Migrate to AWS

Migrate to AWS Elastic Beanstalk when:
- ✅ You need 24/7 uptime with no cold starts
- ✅ You need more than 512 MB RAM
- ✅ You expect high traffic (>10,000 requests/day)
- ✅ You need auto-scaling
- ✅ You need VPC or advanced networking

For now, **Render is perfect for testing!**

---

## 🎯 Next Steps After Backend Deploy

1. ✅ Backend deployed on Render
2. → Test all API endpoints
3. → Deploy frontend (Vercel or Render)
4. → Connect frontend to Render backend
5. → Test end-to-end flow
6. → Consider upgrading to paid plan or AWS

---

## 🆘 Need Help?

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com/
- **Check Logs:** Dashboard → Logs tab

---

## 🚀 Deploy Frontend to Render (Optional)

Want to deploy frontend on Render too?

1. **New Web Service** → Select repository
2. **Configure:**
   ```
   Name: kindcrew-frontend
   Root Directory: frontend
   Build Command: npm install && npm run build
   Start Command: npm start
   ```
3. **Add Environment Variable:**
   ```bash
   NEXT_PUBLIC_API_URL=https://YOUR-RENDER-BACKEND-URL.onrender.com
   ```

**OR use Vercel** (better for Next.js):
- Connect GitHub → Vercel auto-detects Next.js
- Add `NEXT_PUBLIC_API_URL` in Vercel dashboard
- Deploy! (2 minutes)

---

**Ready? Go to https://render.com and follow the steps above! 🎉**
