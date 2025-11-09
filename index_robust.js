require('dotenv').config();
const snoowrap = require('snoowrap');
const { GoogleGenerativeAI } = require('@google/genai');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Initialize Reddit API client
const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the posts data for analysis
    const postsText = posts.map(post => 
      `Title: ${post.title}\nScore: ${post.score}\nComments: ${post.numComments}\nSubreddit: ${post.subreddit}`
    ).join('\n\n');

    const prompt = `Analyze the following trending Reddit posts and identify patterns, trends, and insights:\n\n${postsText}\n\nPlease provide insights on:\n1. Common themes or topics\n2. Sentiment analysis\n3. Engagement patterns\n4. Potential emerging trends`;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logWithTimestamp("Gemini analysis completed successfully");
    return text;
  } catch (error) {
    logWithTimestamp(`Error analyzing trending data: ${error.message}`);
    await notifyError(new Error(`Gemini API error: ${error.message}`));
    return 'Analysis failed';
  }
}

async function runDailyAnalysis() {
  try {
    logWithTimestamp("🕘 Running scheduled Reddit trend analysis...");

    // List of subreddits to analyze
    const subreddits = ['technology', 'programming', 'gadgets', 'science'];

    logWithTimestamp('Fetching trending posts from Reddit...');

    // Get trending posts from each subreddit
    const allPosts = [];
    for (const subreddit of subreddits) {
      const posts = await getTrendingPosts(subreddit);
      allPosts.push(...posts);
    }

    // Sort by score
    allPosts.sort((a, b) => b.score - a.score);

    logWithTimestamp(`Fetched ${allPosts.length} total posts. Analyzing with Gemini...`);

    // Analyze posts with Gemini
    const analysis = await analyzeTrendingData(allPosts);

    logWithTimestamp('\n--- TRENDING ANALYSIS ---\n');
    console.log(analysis);

    // Save analysis to a file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(`analysis-${timestamp}.txt`, analysis);
    logWithTimestamp(`Analysis saved to analysis-${timestamp}.txt`);

    // Send a daily report to Telegram
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const message = `📊 Daily Trends Report – ${date} #technology #programming #science`;

    try {
      await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
      logWithTimestamp("Daily report sent to Telegram");
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

// Allow manual execution with --now flag
if (process.argv.includes("--now")) {
  logWithTimestamp("Running manual analysis...");
  runDailyAnalysis();
}

// Allow testing error notifications with --test-error flag
if (process.argv.includes("--test-error")) {
  testErrorNotification();
}
