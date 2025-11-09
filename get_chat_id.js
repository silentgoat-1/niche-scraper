require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { saveChatId } = require('./save_chat_id');

// Initialize Telegram Bot with polling enabled
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('Bot started. Please send a message to @NicheVelocity_bot to get your chat ID.');

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `✅ Your chat ID is: ${chatId}`);
  console.log("Chat ID:", chatId);
  
  // Automatically save the chat ID to the .env file
  saveChatId(chatId);
  
  // Exit after saving
  process.exit(0);
});
