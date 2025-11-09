require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');
const TelegramBot = require('node-telegram-bot-api');

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

/**
 * Send Telegram alert for GitHub backup failure
 * @param {string} fileName - Name of the file that failed to upload
 * @param {string} errorMessage - Error message from the upload attempt
 */
async function sendGitHubBackupAlert(fileName, errorMessage) {
  try {
    const alertMessage = `⚠️ GitHub Backup Failed!
Report: ${fileName}
Error: ${errorMessage}`;
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, alertMessage);
    console.log('📬 GitHub backup failure alert sent to Telegram');
  } catch (error) {
    console.log(`❌ Failed to send Telegram alert: ${error.message}`);
  }
}

/**
 * Sleep function for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload a daily report to GitHub with retry mechanism
 * @param {string} filePath - Local path to the JSON report file
 * @returns {Promise<boolean>} - True if upload succeeded or file already exists, false otherwise
 */
async function uploadReportToGitHub(filePath) {
  let lastError = null;

  // Retry up to 2 times with 5s delay
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      // Check if the file exists locally
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Local file not found: ${filePath}`);
        return false;
      }

      // Get file info
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      const githubPath = `data/reports/${fileName}`;

      // Extract date from filename for commit message
      const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

      // Get GitHub API details from environment
      const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env;

      if (!GITHUB_TOKEN || !GITHUB_REPO) {
        console.log('❌ GitHub credentials missing in .env file');
        return false;
      }

      // Check if file already exists on GitHub
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${githubPath}`;
      const headers = {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      };

      try {
        // Try to get the file to see if it exists
        const response = await axios.get(apiUrl, { headers });
        console.log(`⚠️ Report already exists on GitHub: ${githubPath}`);
        return true; // Consider this a success since the file is already backed up
      } catch (error) {
        // If we get a 404, the file doesn't exist yet, which is what we want
        if (error.response && error.response.status === 404) {
          // File doesn't exist, proceed with upload
          console.log(`📤 Uploading new report to GitHub: ${githubPath}`);

          // Prepare the upload request
          const uploadData = {
            message: `🧾 Daily Report Backup - ${date}`,
            content: Buffer.from(fileContent).toString('base64'),
            branch: GITHUB_BRANCH,
          };

          try {
            const uploadResponse = await axios.put(apiUrl, uploadData, { headers });
            console.log(`✅ Report uploaded successfully: ${githubPath}`);
            return true;
          } catch (uploadError) {
            lastError = uploadError;
            console.log(`❌ Upload failed (attempt ${attempt + 1}): ${uploadError.message}`);
            if (uploadError.response && uploadError.response.data) {
              console.log(`GitHub API Error: ${JSON.stringify(uploadError.response.data)}`);
            }

            // If this isn't the last attempt, wait before retrying
            if (attempt < 2) {
              console.log(`⏳ Retrying in 5 seconds...`);
              await sleep(5000);
            }
          }
        } else {
          // Some other error occurred
          lastError = error;
          console.log(`❌ Error checking if file exists (attempt ${attempt + 1}): ${error.message}`);

          // If this isn't the last attempt, wait before retrying
          if (attempt < 2) {
            console.log(`⏳ Retrying in 5 seconds...`);
            await sleep(5000);
          }
        }
      }
    } catch (error) {
      lastError = error;
      console.log(`❌ Error in uploadReportToGitHub (attempt ${attempt + 1}): ${error.message}`);

      // If this isn't the last attempt, wait before retrying
      if (attempt < 2) {
        console.log(`⏳ Retrying in 5 seconds...`);
        await sleep(5000);
      }
    }
  }

  // If we get here, all attempts failed
  if (lastError) {
    const fileName = path.basename(filePath);
    await sendGitHubBackupAlert(fileName, lastError.message);
  }

  return false;
}

module.exports = { uploadReportToGitHub };
