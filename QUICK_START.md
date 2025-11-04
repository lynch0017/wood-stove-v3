# ⚡ Quick Start - Railway Deployment

## 3 Simple Steps

### 1️⃣ Deploy Backend (15 min)

1. Go to **https://railway.app** → Login with GitHub
2. **New Project** → **Deploy from GitHub repo** → Select your repo
3. **Variables** tab → Add these 5 variables:
   ```
   INFLUXDB_URL=<from your .env>
   INFLUXDB_TOKEN=<from your .env>
   INFLUXDB_ORG=<from your .env>
   INFLUXDB_BUCKET=<from your .env>
   OPENAI_API_KEY=<from your .env>
   ```
4. **Settings** → **Generate Domain** → Copy URL

### 2️⃣ Configure Frontend (2 min)

```bash
# Add Railway URL to .env
python add_production_url.py

# Test locally
npm run dev
# Click chat button and test
```

### 3️⃣ Deploy Frontend (5 min)

```bash
# Build and deploy
npm run build
git add .
git commit -m "Deploy with Railway backend"
git push origin main

# Visit: https://lynch0017.github.io/wood-stove-v3
```

## ✅ Done!

Your app is live! 🎉

**Full guide**: See `RAILWAY_DEPLOY.md` for detailed instructions.

---

**Cost**: ~$0-5/month | **Time**: ~20 minutes | **Difficulty**: Easy 🟢

