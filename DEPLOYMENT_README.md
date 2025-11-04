# 🔥 Wood Stove Chat - Deployment

AI-powered chat interface for your wood stove temperature monitoring.

## 📚 Documentation

- **`QUICK_START.md`** - 3-step deployment guide (start here!)
- **`RAILWAY_DEPLOY.md`** - Complete Railway deployment guide
- **`CHAT_SETUP.md`** - Local development setup

## 🚀 Quick Deploy

```bash
# 1. Deploy backend to Railway (https://railway.app)
# 2. Add backend URL to .env
python add_production_url.py

# 3. Build and deploy
npm run build
git push origin main
```

**Time**: ~20 minutes | **Cost**: ~$0-5/month

## 📦 Files for Deployment

### Required
- ✅ `railway.json` - Railway configuration
- ✅ `requirements.txt` - Python dependencies
- ✅ `stove_chat_app.py` - Flask backend
- ✅ `src/ChatWidget.jsx` - React chat component

### Helpers
- ✅ `add_production_url.py` - Script to add backend URL
- ✅ `env.production.template` - Environment variable template

## 🏗️ Architecture

```
GitHub Pages (React)
    ↓
Railway (Flask API)
    ↓
├─→ InfluxDB (Temperature Data)
└─→ OpenAI (AI Chat)
```

## 🎯 Features

- 💬 Chat with AI about your wood stove data
- 📊 Real-time temperature monitoring
- 🔥 Fire detection and history
- 📈 Statistical analysis
- 🎨 Beautiful, responsive UI

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| Railway | $5 free/month |
| GitHub Pages | Free |
| InfluxDB | Free tier |
| OpenAI (gpt-5-mini) | ~$0.15-0.60/1M tokens |
| **Total** | **~$0-5/month** |

## 🆘 Need Help?

1. Check `RAILWAY_DEPLOY.md` for detailed instructions
2. Check Railway logs for backend errors
3. Check browser console for frontend errors

## ✨ Ready to Deploy?

Start with **`QUICK_START.md`** for the fastest path to production!

---

Built with ❤️ using Flask, React, Railway, and OpenAI

