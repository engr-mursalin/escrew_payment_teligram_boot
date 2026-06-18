const messages = {
  bn: {
    welcome: 'স্বাগতম! Escrow Bot প্রস্তুত। /new দিয়ে নতুন ডিল শুরু করুন।',
    unknown: 'দুঃখিত, কমান্ডটি বুঝতে পারিনি। /help ব্যবহার করুন।',
  },
  en: {
    welcome: 'Welcome! Escrow Bot is ready. Use /new to create a deal.',
    unknown: 'Sorry, I did not understand that command. Use /help.',
  },
};

const t = (language, key) => messages[language]?.[key] || messages.en[key] || key;

module.exports = { t };
