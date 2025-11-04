# 🚂 Deploy to Railway - Complete Guide

Simple guide to deploy your wood stove chat app using Railway.

## 📋 What You Need

- ✅ GitHub account (you have this)
- ✅ Railway account (free - we'll create this)
- ✅ Your environment variables (from your `.env` file)

## 🚀 Step 1: Deploy Backend to Railway (15 minutes)

### 1.1 Create Railway Account

1. Go to **https://railway.app**
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### 1.2 Deploy Your Repository

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **`lynch0017/wood-stove-v3`** (or your repo name)
4. Railway will automatically:
   - Detect Python
   - Install dependencies from `requirements.txt`
   - Use `railway.json` for configuration
   - Start your Flask app with gunicorn

### 1.3 Add Environment Variables

1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these 5 variables (get values from your `.env` file):

```
INFLUXDB_URL=<your_influxdb_url>
INFLUXDB_TOKEN=<your_influxdb_token>
INFLUXDB_ORG=<your_org>
INFLUXDB_BUCKET=<your_bucket>
OPENAI_API_KEY=<your_openai_key>
```

5. Railway will automatically redeploy with the new variables

### 1.4 Get Your Backend URL

1. Go to **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Copy your URL (looks like: `https://wood-stove-v3-production.up.railway.app`)

### 1.5 Test Your Backend

```bash
# Replace YOUR-URL with your actual Railway URL
curl -X POST https://YOUR-URL.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the current temperature?","history":[]}'
```

You should get a JSON response with temperature data!

## 🎨 Step 2: Configure Frontend (2 minutes)

### 2.1 Add Backend URL to .env

**Option A: Use the helper script (easiest)**
```bash
python add_production_url.py
# Enter your Railway URL when prompted
```

**Option B: Manual**
```bash
# Add this line to your .env file:
VITE_API_URL=https://YOUR-URL.railway.app
```

### 2.2 Test Locally First

```bash
# Start your React app
npm run dev

# Open in browser (usually http://localhost:5173)
# Click the chat button (💬)
# Ask: "What is the current temperature?"
# Should work! ✅
```

## 📦 Step 3: Deploy to GitHub Pages (5 minutes)

### 3.1 Build Production Version

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

### 3.2 Commit and Push

```bash
git add .
git commit -m "Deploy with Railway backend"
git push origin main
```

### 3.3 Wait for GitHub Actions

- GitHub will automatically build and deploy to Pages
- Takes about 2-3 minutes
- Check the "Actions" tab on GitHub to see progress

### 3.4 Visit Your Live Site!

Your app will be live at:
```
https://lynch0017.github.io/wood-stove-v3
```

## ✅ Verify Everything Works

1. **Visit your GitHub Pages URL**
2. **Check temperature dashboard** - Should show real data
3. **Click chat button (💬)** - Should open chat widget
4. **Ask questions:**
   - "What is the current temperature?"
   - "When was the last fire?"
   - "Show me stats for the last 24 hours"
5. **Check browser console** - Should have no errors

## 💰 Cost

- **Railway**: $5 free credit per month
  - Enough for ~500 hours of runtime
  - Perfect for hobby projects
  - Backend sleeps after inactivity (free tier)
  
- **OpenAI (gpt-5-mini)**: ~$0.15-0.60 per 1M tokens
  - Very cheap for personal use
  - Typical chat: ~500-2000 tokens
  - 1000 chats ≈ $0.15-1.20

- **GitHub Pages**: Free forever

- **InfluxDB**: Free tier (you're already using)

**Total: ~$0-5/month** 🎉

## 🔧 Railway Configuration Files

Your repo has these files for Railway:

- **`railway.json`** - Tells Railway how to run your app
- **`requirements.txt`** - Python dependencies (includes gunicorn)

Railway automatically detects these and configures everything!

## 🐛 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Railway logs: Click your service → "Deployments" → Latest deployment → "View Logs"
- Verify all 5 environment variables are set
- Make sure InfluxDB credentials are correct

**"502 Bad Gateway"**
- Backend is starting up (wait 30 seconds)
- Or backend crashed (check logs)

### Frontend Issues

**"Failed to connect to chat service"**
- Check browser console (F12)
- Verify `VITE_API_URL` is in your `.env`
- Make sure you ran `npm run build` after adding the URL
- Test backend URL directly in browser

**Chat button not appearing**
- Clear browser cache (Ctrl+Shift+R)
- Check console for JavaScript errors
- Verify build succeeded

**CORS errors**
- Backend already has CORS enabled
- Double-check backend URL is correct
- Make sure URL doesn't have trailing slash

## 📊 Monitoring

### Railway Dashboard
- **Metrics**: View CPU, memory, and request stats
- **Logs**: See real-time application logs
- **Usage**: Track your $5 free credit

### OpenAI Dashboard
- Go to https://platform.openai.com/usage
- Monitor token usage and costs
- Set up usage alerts

## 🔄 Making Updates

### Update Backend
```bash
# Make changes to stove_chat_app.py
git add .
git commit -m "Update backend"
git push origin main

# Railway auto-deploys! (takes ~2 minutes)
```

### Update Frontend
```bash
# Make changes to React components
npm run build
git add .
git commit -m "Update frontend"
git push origin main

# GitHub Pages auto-deploys! (takes ~2-3 minutes)
```

## 🎉 You're Done!

Your wood stove monitoring app with AI chat is now live on the internet!

**Backend**: Railway (Flask API)  
**Frontend**: GitHub Pages (React App)  
**Cost**: ~$0-5/month  
**Coolness**: 🔥🔥🔥

### Share Your App
- Send friends your GitHub Pages URL
- Show off your temperature data
- Let them chat with your wood stove! 😄

---

**Need help?** Check Railway logs and browser console for errors.

