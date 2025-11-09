# Niche Scraper

A Node.js script that collects trending data from Reddit and analyzes it using the Gemini API.

## Setup

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your API credentials in `.env` file:
   - Reddit API credentials (client ID, client secret, and user agent)
   - Gemini API key
   - Telegram bot token and chat ID

### Getting Reddit API Credentials

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Select "script" as the type
4. Give it a name (this will be your user agent)
5. Note down the client ID and client secret

### Getting Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy the key to your `.env` file

### Getting Telegram Bot Token and Chat ID

1. Create a bot using @BotFather on Telegram
2. Run `node get_chat_id.js` and send a message to your bot to get your chat ID
3. Add both the bot token and chat ID to your `.env` file

## Usage

### 🔁 Auto Scheduler
- Runs automatically every day at 9:00 AM
- You can also run it manually anytime using:
  ```
  node index.js --now
  ```

The script will:
1. Fetch trending posts from specified subreddits
2. Analyze posts using the Gemini API
3. Display the analysis in the console
4. Save the analysis to a timestamped file
5. Send a daily report to your Telegram bot

## Customization

You can modify the `subreddits` array in the `runDailyAnalysis()` function to analyze different subreddits.

You can also adjust the `limit` parameter in the `getTrendingPosts()` function to fetch more or fewer posts from each subreddit.
