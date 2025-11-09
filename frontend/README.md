# Niche Scraper Dashboard

A React dashboard for visualizing daily Reddit analysis reports from the niche-scraper project.

## Features

- 📊 Visualize keyword frequencies across all reports
- 📅 Browse daily reports sorted by date
- 🔍 Search and filter reports by date, keyword, or subreddit
- 📱 Responsive design for desktop and mobile
- 🧠 View detailed Gemini insights for each report
- 🔥 Explore top Reddit posts with engagement metrics

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard in your browser.

### Build for Production

```bash
npm run build
```

## Data Structure

The dashboard expects JSON report files in the following format:

```json
{
  "date": "2025-11-09",
  "niches": ["CrochetHelp", "crochet", "crochetpatterns"],
  "gemini": {
    "new_keywords": [{"term": "AI crochet patterns", "relevance": "high"}],
    "user_problems": [{"problem": "Finding time for crochet", "mentions": 15}],
    "recurring_phrases": [{"phrase": "beginner friendly", "frequency": 12}]
  },
  "top_reddit_posts": [
    {
      "title": "My first amigurumi attempt!",
      "url": "https://reddit.com/r/crochet/abc123",
      "score": 523,
      "numComments": 112,
      "subreddit": "r/crochet"
    }
  ]
}
```

## Technology Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
