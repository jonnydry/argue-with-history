# Deployment Guide: Argue With History

This guide walks you through deploying the API (Railway) and frontend (Vercel).

---

## Part 1: Deploy the API (Railway)

### 1. Create a Railway account and project

1. Go to [railway.app](https://railway.app) and sign in (GitHub recommended).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `argue-with-history` repository.
4. Railway will detect the project. It will use `Procfile` and `requirements.txt` automatically.

### 2. Configure the API service

1. In your Railway project, open the service (or create one if needed).
2. Go to **Variables** and add:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `GROK_API_KEY` | Your xAI API key | Get from [console.x.ai](https://console.x.ai) |
   | `OPENAI_API_KEY` | Your OpenAI API key | Get from [platform.openai.com](https://platform.openai.com) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Use your Vercel URL after deploying (below) |
   | `ENVIRONMENT` | `production` | Disables `/docs` in production |

3. Click **Deploy** (or push to main to trigger a deploy).
4. After deploy, go to **Settings** → **Networking** → **Generate Domain**. Copy the URL (e.g. `https://argue-with-history-api-production.up.railway.app`).

### 3. Persistent storage (recommended)

By default, `data/debates.db` is ephemeral—it resets on redeploy. For persistent debates:

1. In Railway, open your service → **Settings** → **Volumes**.
2. Add a volume and mount it to `/app/data`.
3. This persists the SQLite database and any runtime data under `data/`.

---

## Part 2: Deploy the Frontend (Vercel)

### 1. Create a Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub recommended).
2. Click **Add New** → **Project**.
3. Import your `argue-with-history` repository.
4. **Important:** Set **Root Directory** to `apps/web`:
   - Click **Edit** next to Root Directory.
   - Enter `apps/web` and confirm.
5. Vercel will detect Next.js and use default build settings.

### 2. Add environment variable

1. In your Vercel project, go to **Settings** → **Environment Variables**.
2. Add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_API_URL` | `https://your-api-url.railway.app` | Production, Preview, Development |

   Use the Railway API URL from Part 1, step 2.4.

### 3. Deploy

1. Click **Deploy** (or push to main to trigger a deploy).
2. When it finishes, copy your frontend URL (e.g. `https://argue-with-history.vercel.app`).
3. Go back to Railway and set `FRONTEND_URL` to this URL so CORS works correctly.
4. Redeploy the API if needed.

---

## Part 3: Wire CORS (if needed)

If the frontend uses a custom domain (e.g. `https://arguewithhistory.com`):

1. In Railway, add to Variables:
   - `ALLOWED_ORIGINS` = `https://arguewithhistory.com,https://www.arguewithhistory.com`
2. Redeploy the API.

---

## Quick reference: environment variables

### API (Railway)

| Variable | Required | Default |
|----------|----------|---------|
| `GROK_API_KEY` | Yes | — |
| `OPENAI_API_KEY` | Yes | — |
| `FRONTEND_URL` | Yes (production) | `http://localhost:3000` |
| `ENVIRONMENT` | Yes (production) | `development` |
| `ALLOWED_ORIGINS` | No | (comma-separated extra origins) |
| `GROK_BASE_URL` | No | `https://api.x.ai/v1` |
| `PORT` | Set by Railway | — |

### Frontend (Vercel)

| Variable | Required | Default |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Yes (production) | `http://localhost:8000` |

---

## Post-deploy checklist

- [ ] API `/health` returns `{"status":"healthy"}`.
- [ ] API `/figures` returns a list of figures.
- [ ] Frontend loads and shows the figures list.
- [ ] You can start a debate, submit a turn, and get a response.
- [ ] No CORS errors in the browser console.

---

## Alternative: Render

For Render instead of Railway:

1. Create a **Web Service**.
2. Connect your GitHub repo.
3. Use:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `cd apps/api && gunicorn src.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
4. Add the same environment variables as in the API section above.
5. For persistence, add a **Disk** and mount it to `data/`.

---

## Troubleshooting

| Issue | Possible fix |
|-------|--------------|
| `ModuleNotFoundError` | Ensure `apps/api` has `requirements.txt` and the start command runs from `apps/api`. |
| CORS errors | Check `FRONTEND_URL` and `ALLOWED_ORIGINS`; they must include the frontend origin. |
| Empty figures list | Confirm `data/figures/` is deployed (index.json, embeddings.json) and the app can read it. |
| Debates disappear on redeploy | Add a persistent volume for `data/` as described in Part 1.3. |
