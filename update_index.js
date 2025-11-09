const fs = require('fs');

// Read the content from the temporary file
const tempContent = fs.readFileSync('index_temp.js', 'utf8');

// Write the content to the original index.js file
fs.writeFileSync('index.js', tempContent);

console.log('index.js has been updated with the new content!');
