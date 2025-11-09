import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define types for our data
interface Keyword {
  term: string;
  relevance?: string;
}

interface Problem {
  problem: string;
  mentions?: number;
}

interface Phrase {
  phrase: string;
  frequency?: number;
}

interface RedditPost {
  title: string;
  url: string;
  score: number;
  numComments: number;
  subreddit: string;
}

interface Report {
  date: string;
  niches: string[];
  gemini: {
    new_keywords: Keyword[];
    user_problems: Problem[];
    recurring_phrases: Phrase[];
  };
  top_reddit_posts: RedditPost[];
}

interface KeywordFrequency {
  keyword: string;
  count: number;
}

const Dashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [keywordFrequencies, setKeywordFrequencies] = useState<KeywordFrequency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mock data for development (replace with actual data fetching)
  useEffect(() => {
    // In a real implementation, you would fetch the data from your backend
    // For now, we'll use mock data
    const mockReports: Report[] = [
      {
        date: '2025-11-09',
        niches: ['CrochetHelp', 'crochet', 'crochetpatterns'],
        gemini: {
          new_keywords: [
            { term: 'AI crochet patterns', relevance: 'high' },
            { term: 'eco-friendly yarn', relevance: 'medium' }
          ],
          user_problems: [
            { problem: 'Finding time for crochet', mentions: 15 },
            { problem: 'Expensive materials', mentions: 8 }
          ],
          recurring_phrases: [
            { phrase: 'beginner friendly', frequency: 12 },
            { phrase: 'quick projects', frequency: 9 }
          ]
        },
        top_reddit_posts: [
          {
            title: 'My first amigurumi attempt!',
            url: 'https://reddit.com/r/crochet/abc123',
            score: 523,
            numComments: 112,
            subreddit: 'r/crochet'
          },
          {
            title: 'Tips for selling crochet items online',
            url: 'https://reddit.com/r/CrochetHelp/def456',
            score: 310,
            numComments: 89,
            subreddit: 'r/CrochetHelp'
          },
          {
            title: 'Free pattern: Cozy winter blanket',
            url: 'https://reddit.com/r/crochetpatterns/ghi789',
            score: 197,
            numComments: 64,
            subreddit: 'r/crochetpatterns'
          }
        ]
      },
      {
        date: '2025-11-08',
        niches: ['crochet', 'crocheting', 'knitting'],
        gemini: {
          new_keywords: [
            { term: 'sustainable crafting', relevance: 'high' },
            { term: 'crochet for therapy', relevance: 'medium' }
          ],
          user_problems: [
            { problem: 'Hand pain from crocheting', mentions: 12 },
            { problem: 'Understanding complex patterns', mentions: 10 }
          ],
          recurring_phrases: [
            { phrase: 'stress relief', frequency: 15 },
            { phrase: 'gift ideas', frequency: 11 }
          ]
        },
        top_reddit_posts: [
          {
            title: 'How I started a crochet business',
            url: 'https://reddit.com/r/crochet/jkl012',
            score: 445,
            numComments: 98,
            subreddit: 'r/crochet'
          },
          {
            title: 'My grandmother's vintage pattern collection',
            url: 'https://reddit.com/r/crocheting/mno345',
            score: 367,
            numComments: 76,
            subreddit: 'r/crocheting'
          },
          {
            title: 'Knitting vs Crochet: Pros and Cons',
            url: 'https://reddit.com/r/knitting/pqr678',
            score: 289,
            numComments: 87,
            subreddit: 'r/knitting'
          }
        ]
      }
    ];

    // Sort reports by date (newest first)
    const sortedReports = mockReports.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setReports(sortedReports);

    // Calculate keyword frequencies
    const keywordMap = new Map<string, number>();
    mockReports.forEach(report => {
      report.gemini.new_keywords.forEach(keyword => {
        const count = keywordMap.get(keyword.term) || 0;
        keywordMap.set(keyword.term, count + 1);
      });
    });

    const frequencies: KeywordFrequency[] = Array.from(keywordMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 keywords

    setKeywordFrequencies(frequencies);
    setLoading(false);
  }, []);

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
  };

  const filteredReports = reports.filter(report => 
    report.date.includes(searchTerm) ||
    report.niches.some(niche => niche.toLowerCase().includes(searchTerm.toLowerCase())) ||
    report.gemini.new_keywords.some(keyword => 
      keyword.term.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
        <p className="font-medium">Error loading data:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search by date, keyword, or subreddit..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Keyword Frequency Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Top Keywords (All Time)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={keywordFrequencies}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="keyword" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Daily Reports</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredReports.map(report => (
            <div key={report.date} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-lg font-medium mr-2">📅 {report.date}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>🧠 Keywords: {report.gemini.new_keywords.map(k => k.term).slice(0, 2).join(', ')}</div>
                    <div>🔥 Top Posts: {report.top_reddit_posts.length} | 🧩 Niche: {report.niches.slice(0, 2).join(', ')}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleReportClick(report)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">📊 Report Details: {selectedReport.date}</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-6">
                {/* Gemini Insights */}
                <div>
                  <h3 className="text-lg font-medium mb-3">🧠 Gemini Insights</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-700">New Keywords:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {selectedReport.gemini.new_keywords.map((keyword, index) => (
                          <li key={index}>{keyword.term} {keyword.relevance && `(${keyword.relevance})`}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">User Problems:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {selectedReport.gemini.user_problems.map((problem, index) => (
                          <li key={index}>{problem.problem} {problem.mentions && `(${problem.mentions} mentions)`}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Recurring Phrases:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {selectedReport.gemini.recurring_phrases.map((phrase, index) => (
                          <li key={index}>{phrase.phrase} {phrase.frequency && `(${phrase.frequency} times)`}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Top Reddit Posts */}
                <div>
                  <h3 className="text-lg font-medium mb-3">🔥 Top Reddit Posts</h3>
                  <div className="space-y-3">
                    {selectedReport.top_reddit_posts.map((post, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3">
                        <h4 className="font-medium text-blue-600">
                          <a href={post.url} target="_blank" rel="noopener noreferrer">
                            {post.title}
                          </a>
                        </h4>
                        <div className="text-sm text-gray-600 mt-1">
                          {post.subreddit} | 👍 {post.score} | 💬 {post.numComments}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Niches Analyzed */}
                <div>
                  <h3 className="text-lg font-medium mb-3">🧩 Niches Analyzed</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.niches.map((niche, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
