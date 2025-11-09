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

async function getTrendingPosts(subreddit, limit = 10) {
  try {
    const subredditObj = await reddit.getSubreddit(subreddit);
    const hotPosts = await subredditObj.getHot({ limit });

    return hotPosts.map(post => ({
      title: post.title,
      url: post.url,
      score: post.score,
      numComments: post.num_comments,
      subreddit: post.subreddit_name_prefixed
    }));
  } catch (error) {
    console.error(`Error fetching posts from r/${subreddit}:`, error);
    return [];
  }
}

async function analyzeTrendingData(posts) {
  try {
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

    return text;
  } catch (error) {
    console.error('Error analyzing trending data:', error);
    return 'Analysis failed';
  }
}

async function runDailyAnalysis() {
  console.log("🕘 Running scheduled Reddit trend analysis...");

  // List of subreddits to analyze
  const subreddits = ['technology', 'programming', 'gadgets', 'science'];

  console.log('Fetching trending posts from Reddit...');

  // Get trending posts from each subreddit
  const allPosts = [];
  for (const subreddit of subreddits) {
    const posts = await getTrendingPosts(subreddit);
    allPosts.push(...posts);
  }

  // Sort by score
  allPosts.sort((a, b) => b.score - a.score);

  console.log(`Fetched ${allPosts.length} posts. Analyzing with Gemini...`);

  // Analyze posts with Gemini
  const analysis = await analyzeTrendingData(allPosts);

  console.log('\n--- TRENDING ANALYSIS ---\n');
  console.log(analysis);

  // Save analysis to a file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(`analysis-${timestamp}.txt`, analysis);
  console.log(`\nAnalysis saved to analysis-${timestamp}.txt`);

  // Send a daily report to Telegram
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const message = `📊 Daily Trends Report – ${date} #technology #programming #science`;

  try {
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
    console.log("Daily report sent to Telegram");
  } catch (error) {
    console.error("Error sending daily report:", error);
  }

  console.log("✅ Daily analysis completed");
}

// Schedule the analysis to run every day at 9:00 AM
cron.schedule("0 9 * * *", () => {
  console.log("⏰ Scheduled task started: 9:00 AM");
  runDailyAnalysis().catch(console.error);
});

// Allow manual execution with --now flag
if (process.argv.includes("--now")) {
  console.log("Running manual analysis...");
  runDailyAnalysis().catch(console.error);
}
