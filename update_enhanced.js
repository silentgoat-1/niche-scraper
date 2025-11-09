const fs = require('fs');

// Read the content from the enhanced version
const enhancedContent = fs.readFileSync('index_enhanced.js', 'utf8');

// Write it to the original index.js file
fs.writeFileSync('index.js', enhancedContent);

console.log('index.js has been updated with enhanced Telegram messaging!');
