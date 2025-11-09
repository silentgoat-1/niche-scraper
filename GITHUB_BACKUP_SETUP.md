# GitHub Backup Setup Guide

This guide explains how to set up the automatic GitHub backup feature for your daily reports.

## 1. Create a GitHub Personal Access Token

1. Go to your GitHub account settings: https://github.com/settings/tokens
2. Click "Generate new token" (or "Generate new token (classic)")
3. Give it a descriptive name like "Niche Scraper Backup"
4. Set an expiration period (recommended: 90 days)
5. Select the following scopes:
   - `repo` (Full control of private repositories)
6. Click "Generate token"
7. Copy the token immediately (you won't be able to see it again)

## 2. Update Your .env File

Add the following variables to your .env file:

```
# GitHub Backup Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=silentgoat-1/niche-scraper
GITHUB_BRANCH=main
```

Replace `your_github_personal_access_token` with the token you just created.

## 3. How It Works

The backup system works as follows:

1. After each daily report is generated and saved locally
2. The system checks if the report already exists on GitHub
3. If it doesn't exist, it uploads the report to the `/data/reports/` folder in your repository
4. If it already exists, it skips the upload to avoid duplicates

## 4. Testing the Backup

You can test the backup system by running:

```bash
node index.js --now
```

This will generate a new report and attempt to upload it to GitHub.

## 5. Telegram Alerts for Backup Failures

The system now includes automatic Telegram alerts when GitHub backup fails:
- If the upload fails after all retry attempts, you'll receive a Telegram notification
- The alert includes the report name and error message
- This helps you quickly identify and resolve backup issues

## 6. Troubleshooting

### Error: "GitHub credentials missing in .env file"
- Make sure you've added the GITHUB_TOKEN and GITHUB_REPO variables to your .env file

### Error: "Repository not found"
- Verify that the GITHUB_REPO value is correct (format: username/repository-name)
- Make sure your token has the correct permissions

### Error: "Upload failed"
- Check that your token hasn't expired
- Verify you have the correct permissions on the repository
- Check your Telegram for detailed error messages
