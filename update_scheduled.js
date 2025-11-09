const fs = require('fs');

// Read the content from the new scheduled file
const scheduledContent = fs.readFileSync('index_scheduled.js', 'utf8');

// Write the content to the original index.js file
fs.writeFileSync('index.js', scheduledContent);

console.log('index.js has been updated with scheduler functionality!');
