# Deployment Guide for Render.com

## Preparing for Deployment

1. Initialize git if not done:
```bash
git init
git add .
git commit -m "Render deploy setup"
```

2. Create a new repository on GitHub named "niche-scraper"

3. Push everything to GitHub:
```bash
git remote add origin https://github.com/yourusername/niche-scraper.git
git branch -M main
git push -u origin main
```

## Deploying to Render

1. Go to https://render.com
2. Click "New → Web Service"
3. Connect your GitHub repository
4. Render will automatically detect the render.yaml file
5. Set environment variables in the Render dashboard:
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_CHAT_ID
   - GEMINI_API_KEY
   - REDDIT_CLIENT_ID
   - REDDIT_CLIENT_SECRET
   - REDDIT_USER_AGENT

6. Click "Create Web Service" to deploy

## Monitoring

- Check logs in the "Logs" tab on your Render dashboard
- The cron job will run automatically every day at 9:00 AM
- You'll receive daily reports on Telegram

## Manual Execution

If you need to run the analysis manually, you can use the Render shell:
1. Go to your service on Render
2. Click "Shell" tab
3. Run: `node index.js --now`
