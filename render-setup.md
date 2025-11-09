# Render Deployment Guide

This guide explains how to deploy the Niche Scraper project to Render.

## 1. Create a New Web Service

1. Go to your Render dashboard: https://dashboard.render.com/
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository (silentgoat-1/niche-scraper)
4. Configure the service settings:
   - **Name**: niche-scraper
   - **Region**: Choose the region closest to your target audience
   - **Branch**: main
   - **Root Directory**: Leave empty (root of repository)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

## 2. Environment Variables

Add the following environment variables in the "Environment" section:

```
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_app_user_agent
GEMINI_API_KEY=your_gemini_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=silentgoat-1/niche-scraper
GITHUB_BRANCH=main
```

## 3. Cron Job Setup

The application includes a built-in scheduler that runs the scraper every 24 hours. No additional cron job setup is required on Render.

## 4. Health Check

The application includes a health check endpoint at the root URL:
- URL: `https://your-app-name.onrender.com/`
- Returns: `{ status: "running", lastReport: <latest report date> }`

You can use this endpoint to verify that your application is running correctly.

## 5. Deployment Process

1. After configuring all settings, click "Create Web Service"
2. Render will automatically build and deploy your application
3. The deployment process typically takes 2-5 minutes
4. Once deployed, your application will start running automatically

## 6. Logs and Monitoring

To monitor your application:

1. Go to your service dashboard on Render
2. Click the "Logs" tab to view real-time logs
3. Look for the "🚀 Render deployment active" message to confirm startup
4. Check for daily analysis logs to verify the scraper is working

## 7. Troubleshooting

### Application Not Starting

1. Check the "Logs" tab for error messages
2. Verify all environment variables are correctly set
3. Make sure your GitHub token has the correct permissions

### Scraper Not Running

1. Check if the "🚀 Render deployment active" message appears in logs
2. Verify the cron job is initialized (look for "Cron job scheduled" message)
3. Check for any error messages during the scraping process

### GitHub Backup Failures

1. Check for Telegram alerts with error messages
2. Verify your GitHub token hasn't expired
3. Ensure your repository has the correct permissions

### Telegram Alerts Not Working

1. Verify your Telegram bot token and chat ID are correct
2. Check if your bot is still active and hasn't been restricted

## 8. Scaling and Performance

The free tier of Render includes:
- 750 hours/month of runtime
- Automatic restarts if the application crashes
- 512MB of RAM

For production use, consider upgrading to a paid plan for:
- More RAM and CPU
- Longer uptime
- Faster response times

## 9. Security Considerations

1. Never commit your .env file to version control
2. Use strong, unique API tokens
3. Regularly rotate your tokens
4. Monitor your logs for any unauthorized access attempts

## 10. Updating Your Application

To update your application:

1. Push changes to your GitHub repository
2. Render will automatically detect the changes and redeploy
3. Monitor the logs during the deployment process
4. Verify the new version is working correctly

## 11. Backup and Recovery

Your reports are automatically backed up to:
1. Local storage on the Render instance
2. GitHub repository (data/reports folder)

For additional safety:
1. Regularly export your Telegram chat history
2. Consider setting up additional backup locations
