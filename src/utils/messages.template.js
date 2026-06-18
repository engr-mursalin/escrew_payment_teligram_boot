const welcomeText = () => (
  '🏆 Welcome to CoinXpertBot! 🏆\n\n'
  + '🏅 CoinXpertBot – Your trusted escrow service for secure and hassle-free Telegram transactions.\n\n'
  + '💵 ESCROW FEE\n'
  + '• $5.0 if under $100\n'
  + '• 5.0% if over $100\n\n'
  + '💬 Declare yourself as buyer or seller by dropping your crypto address in the escrow group.\n'
  + '⚙️ Send /menu to browse more options!'
);

const termsText = () => (
  '📜 CoinXpertBot Terms of Service\n\n'
  + '🎟 Escrow Fees:\n'
  + '• 5.0% for transactions over $100\n'
  + '• $5.0 fee for transactions under $100\n\n'
  + '1️⃣ Keep screenshot/video proof while verifying goods.\n'
  + '2️⃣ Understand the product/service before buying.\n'
  + '3️⃣ Release funds only after successful verification.\n'
  + '4️⃣ Deposit must include escrow fee.\n'
  + '5️⃣ Inactive users may trigger admin settlement.\n'
  + '6️⃣ Escrow covers only the current bot-created deal.\n'
  + '7️⃣ High-risk items are restricted.'
);

const transactionInfoText = ({ txnId, buyer, seller, address }) => (
  '📌 TRANSACTION INFORMATION\n'
  + `TXN ID: ${txnId}\n\n`
  + `⚡️ BUYER\n${buyer}\n\n`
  + `⚡️ SELLER\n${seller}\n\n`
  + '✅ ESCROW ADDRESS\n'
  + `${address}\n\n`
  + '🔖 COMMANDS:\n'
  + '• /pay_seller - Release funds to seller.\n'
  + '• /refund_buyer - Return funds to buyer.\n'
  + '• /balance - Check payment status.\n'
  + '• /qr - Get escrow address QR.'
);

module.exports = {
  welcomeText,
  termsText,
  transactionInfoText,
};
