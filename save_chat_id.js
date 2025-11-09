const fs = require('fs');

// Function to add or update the TELEGRAM_CHAT_ID in the .env file
function saveChatId(chatId) {
  try {
    // Read the current .env file
    let envContent = fs.readFileSync('.env', 'utf8');

    // Check if TELEGRAM_CHAT_ID already exists
    if (envContent.includes('TELEGRAM_CHAT_ID=')) {
      // Replace the existing value
      envContent = envContent.replace(/TELEGRAM_CHAT_ID=.*/, `TELEGRAM_CHAT_ID=${chatId}`);
    } else {
      // Add a new line at the end
      envContent += `\nTELEGRAM_CHAT_ID=${chatId}`;
    }

    // Write the updated content back to the file
    fs.writeFileSync('.env', envContent);
    console.log(`✅ Chat ID ${chatId} has been saved to your .env file.`);
  } catch (error) {
    console.error('Error saving chat ID:', error);
  }
}

// Export the function to be used by the main script
module.exports = { saveChatId };
