require('dotenv').config();
const snoowrap = require('snoowrap');
const { GoogleGenerativeAI } = require('@google/genai');
const TelegramBot = require('node-telegram-bot-api');

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

async function analyzeTrendingData(posts, niche) {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the posts data for analysis
    const postsText = posts.map(post => 
      `Title: ${post.title}\nScore: ${post.score}\nComments: ${post.numComments}\nSubreddit: ${post.subreddit}`
    ).join('\n\n');

    const prompt = `Analyze the following trending Reddit posts from the ${niche} niche and identify patterns, trends, and insights in JSON format with the following structure:
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
        return JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, return a structured object with the raw text
        return {
          new_keywords: [],
          recurring_phrases: [],
          user_problems: [],
          trending_topics: [],
          sentiment_analysis: { positive: 0, neutral: 0, negative: 0 },
          raw_analysis: text
        };
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return {
        new_keywords: [],
        recurring_phrases: [],
        user_problems: [],
        trending_topics: [],
        sentiment_analysis: { positive: 0, neutral: 0, negative: 0 },
        raw_analysis: text
      };
    }
  } catch (error) {
    console.error('Error analyzing trending data:', error);
    return {
      new_keywords: [],
      recurring_phrases: [],
      user_problems: [],
      trending_topics: [],
      sentiment_analysis: { positive: 0, neutral: 0, negative: 0 },
      raw_analysis: "Analysis failed"
    };
  }
}

async function sendTelegramMessage(niche, analysis) {
  try {
    const message = `📊 *${niche.toUpperCase()} Analysis Complete!* 
🪙 *New Keywords:* ${analysis.new_keywords.map(k => k.term).join(', ')} 
🔁 *Recurring Phrases:* ${analysis.recurring_phrases.map(p => p.phrase).join(', ')} 
💭 *User Problems:* ${analysis.user_problems.map(p => p.problem).join(', ')} 
#${niche} #trends`;

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
    console.log(`Telegram message sent for ${niche} niche`);
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

async function main() {
  // List of subreddits to analyze
  const niches = [
    { name: 'technology', subreddits: ['technology', 'gadgets'] },
    { name: 'programming', subreddits: ['programming', 'webdev'] },
    { name: 'science', subreddits: ['science', 'Futurology'] }
  ];

  console.log('Fetching trending posts from Reddit...');

  // Analyze each niche separately
  for (const niche of niches) {
    console.log(`\nAnalyzing ${niche.name} niche...`);

    // Get trending posts from all subreddits in this niche
    const allPosts = [];
    for (const subreddit of niche.subreddits) {
      const posts = await getTrendingPosts(subreddit);
      allPosts.push(...posts);
    }

    // Sort by score
    allPosts.sort((a, b) => b.score - a.score);

    console.log(`Fetched ${allPosts.length} posts for ${niche.name}. Analyzing with Gemini...`);

    // Analyze the posts with Gemini
    const analysis = await analyzeTrendingData(allPosts, niche.name);

    // Save analysis to a file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(`analysis-${niche.name}-${timestamp}.json`, JSON.stringify(analysis, null, 2));
    console.log(`Analysis saved to analysis-${niche.name}-${timestamp}.json`);

    // Send results via Telegram
    await sendTelegramMessage(niche.name, analysis);
  }
}

// Run the main function
main().catch(console.error);
