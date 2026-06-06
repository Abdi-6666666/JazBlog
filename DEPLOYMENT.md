# 🚀 JazBlog Deployment Guide

## Frontend Deployment (GitHub Pages)

### Step 1: Configure GitHub Pages

1. Go to your JazBlog repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: Select "Deploy from a branch"
   - Branch: Select `gh-pages` and `/root` folder
4. Save

### Step 2: Deploy Frontend

Option A: **Automatic (GitHub Actions)**
- Push to `main` branch - automatically deploys via GitHub Actions

Option B: **Manual Deploy**
```bash
cd frontend
npm run deploy
```

Your blog will be available at: `https://Abdi-6666666.github.io/JazBlog`

---

## Backend Deployment

Choose one of the following services:

### Option 1: Railway (Recommended) ⭐

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway**
   ```bash
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   railway variable add JWT_SECRET your-secret-key
   railway variable add NODE_ENV production
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get your URL**
   ```bash
   railway deployment logs
   ```

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `jazblog-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `JWT_SECRET`: your-secret-key
   - `NODE_ENV`: production
6. Click "Create Web Service"

### Option 3: Heroku (Limited Free Tier)

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create jazblog-api`
4. Set environment variables:
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set NODE_ENV=production
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```

### Option 4: Vercel (Serverless)

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
5. Add environment variables
6. Click "Deploy"

---

## Update Frontend to Use Deployed Backend

After deploying backend, update your frontend:

### Option A: Using Environment Variable

1. Create `.env.production` in `frontend/`:
```
REACT_APP_API_URL=https://your-backend-url.com/api
```

2. Rebuild and deploy:
```bash
npm run build
npm run deploy
```

### Option B: Update API URL in Code

Edit `frontend/src/App.js`:
```javascript
const API_URL = 'https://your-backend-url.com/api';
```

---

## Final Configuration

### Update Backend CORS

In `backend/server.js`, update CORS for your deployed frontend:

```javascript
const corsOptions = {
  origin: 'https://Abdi-6666666.github.io',
  credentials: true
};

app.use(cors(corsOptions));
```

### Test the Deployment

1. Visit your GitHub Pages URL
2. Try registering a new account
3. Create a test post
4. Add a comment
5. Verify everything works

---

## Troubleshooting

### Frontend not loading
- Check GitHub Pages settings
- Verify `homepage` in `frontend/package.json`
- Check browser console for errors

### Backend connection fails
- Verify API URL in frontend `.env` file
- Check backend is running and accessible
- Verify CORS settings in backend
- Check network tab in browser dev tools

### Data not persisting
- Check backend `/backend/data/` directory
- Ensure write permissions on the server
- Check server logs for errors

### LaTeX not rendering
- Verify KaTeX CSS is loaded
- Check browser console for errors
- Ensure `rehype-katex` is installed

---

## Monitoring & Logs

### View Backend Logs

**Railway**:
```bash
railway logs
```

**Render**:
- Dashboard → Select service → Logs tab

**Heroku**:
```bash
heroku logs --tail
```

### Monitor Performance

- Use browser DevTools Network tab
- Check backend response times
- Monitor server resource usage

---

## Backup & Data Management

### Backup Your Data

```bash
# Download data files
cp -r backend/data/ backup/data-$(date +%Y%m%d)/
```

### Export Posts to JSON

```bash
cd backend
cat data/posts.json > exports/posts-backup.json
```

---

## Cost Estimates

| Service | Cost | Notes |
|---------|------|-------|
| GitHub Pages | Free | Frontend only |
| Railway | Free ($5/month after) | Good free tier |
| Render | Free tier available | Limited resources |
| Heroku | Paid only | No free tier |
| Vercel | Free (Hobby) | Generous free tier |

---

## Production Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV to production
- [ ] Configure proper CORS
- [ ] Set up database backups
- [ ] Monitor error logs
- [ ] Test all features thoroughly
- [ ] Add rate limiting (optional)
- [ ] Set up email notifications (optional)
- [ ] Document admin password

---

## Next Steps

1. Deploy your blog
2. Share the link with friends
3. Create amazing content
4. Customize the design
5. Add more features!

Need help? Create an issue on GitHub!
