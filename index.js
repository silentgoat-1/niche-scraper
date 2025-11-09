require('dotenv').config();
const snoowrap = require('snoowrap');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const TelegramBot = require('node-telegram-bot-api');

// Debug environment variables
console.log('Environment variables loaded:');
console.log('REDDIT_CLIENT_ID:', process.env.REDDIT_CLIENT_ID ? '***' + process.env.REDDIT_CLIENT_ID.slice(-4) : 'undefined');
console.log('REDDIT_CLIENT_SECRET:', process.env.REDDIT_CLIENT_SECRET ? '***' + process.env.REDDIT_CLIENT_SECRET.slice(-4) : 'undefined');
console.log('REDDIT_USER_AGENT:', process.env.REDDIT_USER_AGENT || 'undefined');
console.log('REDDIT_USERNAME:', process.env.REDDIT_USERNAME || 'undefined');
console.log('REDDIT_PASSWORD:', process.env.REDDIT_PASSWORD ? '***' + process.env.REDDIT_PASSWORD.slice(-4) : 'undefined');
const cron = require('node-cron');
const express = require('express');
const fs = require('fs');
const path = require('path');
import { uploadReportToGitHub } from './githubBackup.js';

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Initialize Reddit API client
const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});

// Configure OAuth2
reddit.config({
  accessToken: 'manual',
  refreshToken: 'manual'
});

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to send error notifications to Telegram
async function notifyError(error) {
  const now = new Date().toLocaleString();
  const message = `🚨 Niche-Scraper Error Alert (${now}):

${error.message || error}`;

  try {
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
    console.log("Error notification sent to Telegram");
  } catch (telegramError) {
    console.error("⚠️ Failed to send Telegram error alert:", telegramError);
  }
}

// Function to log with timestamps
function logWithTimestamp(message) {
  const now = new Date().toLocaleString();
  console.log(`[${now}] ${message}`);
}

async function getTrendingPosts(subreddit, limit = 10) {
  try {
    logWithTimestamp(`Fetching posts from r/${subreddit}...`);
    const subredditObj = await reddit.getSubreddit(subreddit);
    const hotPosts = await subredditObj.getHot({ limit });

    logWithTimestamp(`Successfully fetched ${hotPosts.length} posts from r/${subreddit}`);
    return hotPosts.map(post => ({
      title: post.title,
      url: post.url,
      score: post.score,
      numComments: post.num_comments,
      subreddit: post.subreddit_name_prefixed
    }));
  } catch (error) {
    logWithTimestamp(`Error fetching posts from r/${subreddit}: ${error.message}`);
    await notifyError(new Error(`Reddit API error for r/${subreddit}: ${error.message}`));
    return [];
  }
}

async function analyzeTrendingData(posts) {
  try {
    logWithTimestamp("Starting Gemini analysis...");
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare the posts data for analysis
    const postsText = posts.map(post => 
      `Title: ${post.title}\nScore: ${post.score}\nComments: ${post.numComments}\nSubreddit: ${post.subreddit}`
    ).join('\n\n');

    const prompt = `Analyze the following trending Reddit posts and identify patterns, trends, and insights in JSON format with the following structure:
{
  "new_keywords": [{"term": "keyword", "relevance": "high/medium/low"}],
  "recurring_phrases": [{"phrase": "example phrase", "frequency": 5}],
  "user_problems": [{"problem": "user pain point", "mentions": 3}],
  "trending_topics": [{"topic": "topic name", "growth": "increasing/stable/decreasing"}],
  "sentiment_analysis": {"positive": 0.6, "neutral": 0.3, "negative": 0.1}
}

Here are the posts to analyze:\n\n${postsText}`;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the response as JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        logWithTimestamp("Gemini analysis completed successfully");
        return { analysis, rawText: text };
      } else {
        // If no JSON found, return a structured object with the raw text
        return {
          analysis: {
            new_keywords: [],
            recurring_phrases: [],
            user_problems: [],
            trending_topics: [],
            sentiment_analysis: { positive: 0, neutral: 0, negative: 0 },
            raw_analysis: text
          },
          rawText: text
        };
      }
    } catch (parseError) {
      logWithTimestamp(`Error parsing JSON response: ${parseError.message}`);
      await notifyError(new Error(`JSON parsing error: ${parseError.message}`));
      return {
        analysis: {
          new_keywords: [],
          recurring_phrases: [],
          user_problems: [],
          trending_topics: [],
          sentiment_analysis: { positive: 0, neutral: 0, negative: 0 },
          raw_analysis: text
        },
        rawText: text
      };
    }
  } catch (error) {
    logWithTimestamp(`Error analyzing trending data: ${error.message}`);
    await notifyError(new Error(`Gemini API error: ${error.message}`));
    return {
      analysis: {
        new_keywords: [],
        recurring_phrases: [],
        user_problems: [],
        trending_topics: [],
        sentiment_analysis: { positive: 0, neutral: 0, negative: 0 },
        raw_analysis: "Analysis failed"
      },
      rawText: "Analysis failed"
    };
  }
}

async function runDailyAnalysis() {
  try {
    logWithTimestamp("🕘 Running scheduled Reddit trend analysis...");

    // List of subreddits to analyze
    const niches = [
      "CrochetHelp",
      "crochet",
      "crochetpatterns",
      "crocheting",
      "CrochetBlankets",
      "Brochet",
      "knitting"
    ];

    logWithTimestamp('Fetching trending posts from Reddit...');

    // Get trending posts from each subreddit
    const allPosts = [];
    for (const niche of niches) {
      const posts = await getTrendingPosts(niche);
      allPosts.push(...posts);
    }

    // Sort by score
    allPosts.sort((a, b) => b.score - a.score);

    logWithTimestamp(`Fetched ${allPosts.length} total posts. Analyzing with Gemini...`);

    // Analyze posts with Gemini
    const { analysis, rawText } = await analyzeTrendingData(allPosts);

    logWithTimestamp('\n--- TRENDING ANALYSIS ---\n');
    console.log(rawText);

    // Save analysis to a file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(`analysis-${timestamp}.json`, JSON.stringify(analysis, null, 2));
    logWithTimestamp(`Analysis saved to analysis-${timestamp}.json`);

    // Get top 3 posts for Telegram
    const topPosts = allPosts.slice(0, 3);

    // Send a daily report to Telegram
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    // Format keywords
    const keywords = analysis.new_keywords.map(k => k.term).slice(0, 3).join('", "');

    // Format problems
    const problems = analysis.user_problems.map(p => p.problem).slice(0, 2).join('", "');

    // Format phrases
    const phrases = analysis.recurring_phrases.map(p => p.phrase).slice(0, 2).join('", "');

    // Build the Telegram message
    let message = `📊 Daily Trends Report – ${date} #crochet #knitting #crafts

🧠 Gemini Insights:
• New Keywords: "${keywords}"
• User Problems: "${problems}"
• Recurring Phrases: "${phrases}"

🔥 Top Reddit Posts:`;

    // Add top posts to message
    topPosts.forEach((post, index) => {
      message += `\n${index + 1}️⃣ [${post.title}](${post.url})
👍 ${post.score} | 💬 ${post.numComments}`;
    });

    try {
      await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
      logWithTimestamp("Daily report sent to Telegram");
      
      // Save daily report to JSON file
      const fs = require('fs');
      const path = require('path');
      
      // Create data/reports directory if it doesn't exist
      const reportsDir = path.join(__dirname, 'data', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
        logWithTimestamp("Created data/reports directory");
      }
      
      // Format date as YYYY-MM-DD
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const reportPath = path.join(reportsDir, `${dateStr}.json`);
      
      // Create the report object
      const report = {
        date: dateStr,
        niches: niches,
        gemini: {
          new_keywords: analysis.new_keywords,
          user_problems: analysis.user_problems,
          recurring_phrases: analysis.recurring_phrases
        },
        top_reddit_posts: topPosts
      };
      
      // Save the report
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      logWithTimestamp(`Daily report saved to ${reportPath}`);
      
      // Upload to GitHub
      try {
        await uploadReportToGitHub(reportPath);
      } catch (error) {
        logWithTimestamp(`GitHub backup failed: ${error.message}`);
        // Continue execution even if GitHub backup fails
      }
    } catch (error) {
      logWithTimestamp(`Error sending daily report: ${error.message}`);
      await notifyError(new Error(`Telegram notification error: ${error.message}`));
    }

    logWithTimestamp("✅ Daily analysis completed successfully");
  } catch (error) {
    logWithTimestamp(`Unexpected error in runDailyAnalysis: ${error.message}`);
    await notifyError(error);
  }
}

// Test function for error notifications
async function testErrorNotification() {
  logWithTimestamp("Testing error notification system...");
  await notifyError(new Error("This is a test error notification from Niche-Scraper"));
  logWithTimestamp("Test error notification sent");
}

// Schedule analysis to run every day at 9:00 AM
cron.schedule("0 9 * * *", () => {
  logWithTimestamp("⏰ Scheduled task started: 9:00 AM");
  runDailyAnalysis();
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Health check route
app.get('/', (req, res) => {
  try {
    // Find the latest report date
    const reportsDir = path.join(__dirname, 'data', 'reports');
    let lastReport = "No reports yet";
    
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          // Extract dates from filenames
          const dateA = a.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
          const dateB = b.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
          return dateB.localeCompare(dateA); // Sort in descending order
        });
      
      if (files.length > 0) {
        const latestFile = files[0];
        const dateMatch = latestFile.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          lastReport = dateMatch[1];
        }
      }
    }
    
    res.json({ status: "running", lastReport });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Allow manual execution with --now flag
if (process.argv.includes("--now")) {
  logWithTimestamp("Running manual analysis...");
  runDailyAnalysis();
} else {
  // Start Express server only when not using --now flag
  app.listen(PORT, () => {
    logWithTimestamp(`🚀 Render deployment active - Server running on port ${PORT}`);
    logWithTimestamp(`Health check available at http://localhost:${PORT}`);
  });
}

// Allow testing error notifications with --test-error flag
if (process.argv.includes("--test-error")) {
  testErrorNotification();
}
