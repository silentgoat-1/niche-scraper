const fs = require('fs');

// Read the content from the new README file
const newReadmeContent = fs.readFileSync('README_new.md', 'utf8');

// Write the content to the original README.md file
fs.writeFileSync('README.md', newReadmeContent);

console.log('README.md has been updated with scheduler information!');
