# 🚀 Paper Trading App - Free Deployment Guide

## Quick Deploy on Render (Recommended)

### Prerequisites
- GitHub account
- Credit card for Render verification (free tier, no charges)

### Steps:
1. **Push to GitHub** (if not done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New" → "Blueprint"
   - Connect your repository: `https://github.com/saurabh2732006/paper-trading-app`
   - Render will detect your `render.yaml` automatically
   - Click "Apply"

3. **Access Your App**:
   - Frontend: `https://paper-trading-frontend.onrender.com`
   - Backend: `https://paper-trading-backend.onrender.com`

### Expected Costs: $0/month (free tier)

---

## Alternative: Vercel + PlanetScale (No Backend Sleep)

### Frontend (Vercel - No Card Required)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set build command: `cd frontend && yarn build`
4. Set output directory: `frontend/dist`

### Backend (Railway - $5 Trial)
1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub
3. Add PostgreSQL database
4. Set environment variables

### Database (PlanetScale - Card Required, Free Tier)
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Update your backend env vars

---

## Budget Comparison

| Platform | Monthly Cost | Payment Required | Sleep Policy |
|----------|-------------|------------------|--------------|
| Render | $0 | Credit card (verification) | 15min inactive |
| Railway | $5 trial → usage | Credit card | No sleep |
| Vercel + PlanetScale | $0 | PlanetScale needs card | Frontend: No sleep |
| Netlify + Railway | $5 trial → usage | Railway needs card | Mixed |
| Cyclic | $0 | No card needed | No sleep |

---

## Recommendation
**Start with Render** - you're already configured and it's the simplest path to deployment!