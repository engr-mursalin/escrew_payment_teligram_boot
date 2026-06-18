const { Markup } = require('telegraf');
const config = require('../../config');
const { detectWalletType } = require('../../utils/wallet.util');
const { termsText, transactionInfoText } = require('../../utils/messages.template');

const isGroupChat = (ctx) => ['group', 'supergroup'].includes(ctx.chat?.type);

const ensureGroup = async (ctx) => {
  if (!isGroupChat(ctx)) {
    await ctx.reply('This command work only in escrow group , use /create to create one');
    return false;
  }
  return true;
};

const createModeCache = new Map();

module.exports = (bot, {
  escrowService,
  escrowRepository,
  escrowRoomService,
  paymentService,
}) => {
  bot.command('menu', async (ctx) => {
    await ctx.reply(
      '📋 Available Commands\n'
      + '/create, /verify, /instructions, /terms, /support, /video, /whatisescrow\n'
      + 'Group: /buyer /seller /network /description /qr /balance /pay_seller /refund_buyer /force_release /force_refund /dispute /checkadmin',
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply('Use /menu to browse all available commands.');
  });

  bot.command('create', async (ctx) => {
    if (isGroupChat(ctx)) {
      const mode = createModeCache.get(ctx.from.id) || 'bot_only';
      const room = await escrowRoomService.createOrResetRoom({
        chatId: ctx.chat.id,
        chatTitle: ctx.chat.title,
        creatorTelegramId: ctx.from.id,
        createMode: mode,
      });
      createModeCache.delete(ctx.from.id);

      await ctx.reply(
        `💬 Escrow Group Created\n\nGroup Name: ${ctx.chat.title}\nCreator: @${ctx.from.username || ctx.from.first_name}\n\n`
        + 'Now declare roles:\n'
        + '• Buyer sends /buyer\n'
        + '• Seller sends /seller\n\n'
        + `Group Mode: ${room.createMode === 'with_admins' ? 'With Admins' : 'Bot Only'}`,
      );

      if (room.createMode === 'with_admins' && config.adminUsernames.length) {
        const mentionList = config.adminUsernames.map((u) => `@${u.replace('@', '')}`).join(', ');
        await ctx.reply(`👮 Admin assistance enabled.\nConfigured admins: ${mentionList}\nPlease add/mention admins if needed.`);
      }
      return;
    }

    const botUsername = ctx.botInfo?.username || 'your_bot';
    await ctx.reply(
      'Choose one of those options:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔒 With Admins', 'create_mode:with_admins')],
        [Markup.button.callback('🤖 Bot Only', 'create_mode:bot_only')],
      ]),
    );
    await ctx.reply(`Create group and add bot using: https://t.me/${botUsername}?startgroup=true\nThen send /create inside that group.`);
  });

  bot.action(/^create_mode:(with_admins|bot_only)$/i, async (ctx) => {
    const mode = ctx.match[1];
    createModeCache.set(ctx.from.id, mode);
    await ctx.answerCbQuery(`Selected: ${mode === 'with_admins' ? 'With Admins' : 'Bot Only'}`);
    await ctx.reply(`✅ Mode selected: ${mode === 'with_admins' ? 'With Admins' : 'Bot Only'}.\nNow create/add bot in a group and send /create there.`);
  });

  bot.command('verify', async (ctx) => {
    const [, rawLink] = (ctx.message.text || '').split(' ');
    if (!rawLink) {
      await ctx.reply('Send /verify [link] (replace [link] with the group link you want to check).');
      return;
    }
    const safe = /t\.me\//i.test(rawLink);
    await ctx.reply(safe ? '✅ Link format looks valid. Verify group members before depositing.' : '❌ Invalid Telegram link format.');
  });

  bot.command('instructions', async (ctx) => {
    await ctx.reply(
      '💭 INSTRUCTIONS\n\nTutorials & Safety Tips:\n⚠️ https://t.me/coinxpertupdates/16\n\n'
      + "Buyer's Safety Guide:\n⚠️ https://t.me/coinxpertupdates/20\n\n"
      + "Seller's Safety Guide:\n⚠️ https://t.me/coinxpertupdates/22",
    );
  });

  bot.command('terms', async (ctx) => {
    await ctx.reply(termsText());
  });

  bot.command('whatisescrow', async (ctx) => {
    await ctx.reply(
      '💡 Escrow is a secure arrangement where funds are held until deal conditions are met.\n'
      + 'Flow: Buyer deposits → Seller delivers → Buyer approves → Funds released.',
    );
  });

  bot.command('video', async (ctx) => {
    await ctx.reply('📝 How to use escrow bot:\nhttps://t.me/aboutescrow');
  });

  bot.command('support', async (ctx) => {
    await ctx.reply('👨🏻‍💼 Customer Support Assistance\nContact: @CoinXpertSupport\nUse /dispute in escrow group to request admin review.');
  });

  bot.command('buyer', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    await escrowRoomService.setWaitingRole(ctx.chat.id, 'buyer');
    await ctx.reply('⚡️ Buyer: Send your crypto address here and choose your role.\n\n➡️ Supported: BTC, LTC, ETH, XMR, USDT.');
  });

  bot.command('seller', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    await escrowRoomService.setWaitingRole(ctx.chat.id, 'seller');
    await ctx.reply('⚡️ Seller: Send your crypto address here and choose your role.\n\n➡️ Supported: BTC, LTC, ETH, XMR, USDT.');
  });

  bot.command('description', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const value = (ctx.message.text || '').replace(/^\/description(@\w+)?\s*/i, '').trim();
    if (!value) {
      await ctx.reply('Usage: /description <deal details>');
      return;
    }
    await escrowRoomService.createRoom({
      chatId: ctx.chat.id,
      chatTitle: ctx.chat.title,
      creatorTelegramId: ctx.from.id,
    });
    await escrowRoomService.updateDescription(ctx.chat.id, value);
    await ctx.reply(`✅ Description updated:\n${value}`);
  });

  bot.command('network', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const [, networkRaw] = (ctx.message.text || '').split(' ');
    const network = String(networkRaw || '').toLowerCase();
    const allowed = ['auto', 'usdt_trc20', 'usdt_erc20', 'usdt_bep20', 'eth', 'btc', 'ltc'];
    if (!allowed.includes(network)) {
      await ctx.reply('Usage: /network auto|usdt_trc20|usdt_erc20|usdt_bep20|eth|btc|ltc');
      return;
    }
    await escrowRoomService.setPaymentNetwork(ctx.chat.id, network);
    await ctx.reply(`✅ Payment network set to: ${network}`);
  });

  bot.command('qr', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const room = await escrowRoomService.getByChatId(ctx.chat.id);
    if (!room?.escrowAddress) {
      await ctx.reply('Escrow address not generated yet. Complete /buyer and /seller first.');
      return;
    }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(room.escrowAddress)}`;
    await ctx.reply(`📷 QR Code:\n${qrUrl}`);
  });

  bot.command('balance', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const room = await escrowRoomService.getByChatId(ctx.chat.id);
    if (!room?.escrowAddress) {
      await ctx.reply('💬 Escrow address not generated yet. Complete buyer/seller setup first.');
      return;
    }
    const baseWalletType = room.buyer?.walletType || room.seller?.walletType || 'ETH_USDT_EVM';
    try {
      const state = await paymentService.getAddressStateForNetwork(
        room.escrowAddress,
        baseWalletType,
        room.paymentNetwork || 'auto',
      );
      const updated = await escrowRoomService.syncBalance(ctx.chat.id, state);
      if (!updated?.depositDetected) {
        await ctx.reply(
          `💬 Payment not confirmed yet.\nBalance: ${updated?.lastKnownBalance || '0'}\n`
          + `Confirmations: ${updated?.lastConfirmations || 0}/${config.minDepositConfirmations}`,
        );
        return;
      }
      await ctx.reply(
        `✅ Payment detected and confirmed.\nBalance: ${updated.lastKnownBalance}\nTx count: ${updated.txCount}\n`
        + `Confirmations: ${updated.lastConfirmations}/${config.minDepositConfirmations}\n`
        + `${state.explorer ? `Explorer: ${state.explorer}` : ''}`,
      );
    } catch (e) {
      await ctx.reply('💬 No payment received at the escrow address. You will be notified once deposit is detected and confirmed.');
    }
  });

  bot.command('blockchain', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const room = await escrowRoomService.getByChatId(ctx.chat.id);
    if (!room?.escrowAddress) {
      await ctx.reply('Escrow address not available yet.');
      return;
    }
    await ctx.reply(`🔎 Track wallet activity for escrow address:\n${room.escrowAddress}`);
  });

  bot.command('pay_seller', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const room = await escrowRoomService.getByChatId(ctx.chat.id);
    if (!room) {
      await ctx.reply('🚫 You can use this command only in group where the deal is running!');
      return;
    }
    const isBuyer = room.buyer?.telegramId === ctx.from.id;
    const isConfiguredAdmin = config.adminUsernames.map((u) => u.replace('@', '').toLowerCase()).includes((ctx.from.username || '').toLowerCase());
    if (!isBuyer && !isConfiguredAdmin) {
      await ctx.reply('🚫 Only the buyer or configured admin can release funds.');
      return;
    }
    if (!room.depositDetected) {
      await ctx.reply('🚫 No confirmed deposit found yet.');
      return;
    }
    await escrowRoomService.markReleased(ctx.chat.id);
    await ctx.reply(`✅ Funds released to seller wallet: ${room.seller?.walletAddress || 'N/A'}`);
  });

  bot.command('refund_buyer', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const room = await escrowRoomService.getByChatId(ctx.chat.id);
    if (!room) {
      await ctx.reply('🚫 You can use this command only in group where the deal is running!');
      return;
    }
    const isBuyer = room.buyer?.telegramId === ctx.from.id;
    const isConfiguredAdmin = config.adminUsernames.map((u) => u.replace('@', '').toLowerCase()).includes((ctx.from.username || '').toLowerCase());
    if (!isBuyer && !isConfiguredAdmin) {
      await ctx.reply('🚫 Only the buyer or configured admin can refund.');
      return;
    }
    await escrowRoomService.markRefunded(ctx.chat.id);
    await ctx.reply(`✅ Funds marked for buyer refund: ${room.buyer?.walletAddress || 'N/A'}`);
  });

  bot.command('force_release', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const room = await escrowRoomService.getByChatId(ctx.chat.id);
    if (!room) {
      await ctx.reply('🚫 No active deal in this group.');
      return;
    }
    const isConfiguredAdmin = config.adminUsernames
      .map((u) => u.replace('@', '').toLowerCase())
      .includes((ctx.from.username || '').toLowerCase());
    if (!isConfiguredAdmin) {
      await ctx.reply('🚫 Admin only command.');
      return;
    }
    await escrowRoomService.markReleased(ctx.chat.id);
    await servicesAuditLog(ctx, 'escrow.force_release', room);
    await ctx.reply(`✅ Admin forced release to seller: ${room.seller?.walletAddress || 'N/A'}`);
  });

  bot.command('force_refund', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const room = await escrowRoomService.getByChatId(ctx.chat.id);
    if (!room) {
      await ctx.reply('🚫 No active deal in this group.');
      return;
    }
    const isConfiguredAdmin = config.adminUsernames
      .map((u) => u.replace('@', '').toLowerCase())
      .includes((ctx.from.username || '').toLowerCase());
    if (!isConfiguredAdmin) {
      await ctx.reply('🚫 Admin only command.');
      return;
    }
    await escrowRoomService.markRefunded(ctx.chat.id);
    await servicesAuditLog(ctx, 'escrow.force_refund', room);
    await ctx.reply(`✅ Admin forced refund to buyer: ${room.buyer?.walletAddress || 'N/A'}`);
  });

  bot.command('checkadmin', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    const me = await ctx.telegram.getMe();
    const member = await ctx.telegram.getChatMember(ctx.chat.id, me.id);
    const isAdmin = ['administrator', 'creator'].includes(member.status);
    await ctx.reply(isAdmin ? '✅ Bot has admin privileges in this group.' : '⚠️ Bot is not admin in this group.');
  });

  bot.command('real', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    await ctx.reply('✅ Escrow session exists. Use /verify in private chat to validate shared links.');
  });

  bot.command('dispute', async (ctx) => {
    if (!(await ensureGroup(ctx))) return;
    await escrowRoomService.markDisputed(ctx.chat.id);
    const mentionList = config.adminUsernames.length
      ? config.adminUsernames.map((u) => `@${u.replace('@', '')}`).join(' ')
      : '@CoinXpertSupport';
    await ctx.reply(`⚠️ Dispute opened. Admin has been notified for review.\n${mentionList}`);
  });

  bot.command('convert', async (ctx) => {
    const parts = (ctx.message.text || '').trim().split(/\s+/);
    if (parts.length !== 4) {
      await ctx.reply(
        '━━━━ ⚡️ CoinXpertBot ━━━━\n\n'
        + '❌ INVALID FORMAT\n\n'
        + '📝 FORMAT: /convert amount from_coin to_coin\n'
        + 'EXAMPLES:\n• /convert 0.00009 btc usd\n• /convert 1000 usd btc',
      );
      return;
    }
    const [, amount, fromCoin, toCoin] = parts;
    await ctx.reply(`📈 Estimated conversion request accepted:\n${amount} ${fromCoin.toUpperCase()} → ${toCoin.toUpperCase()}`);
  });

  bot.command('new', async (ctx) => {
    const text = ctx.message.text || '';
    const parts = text.split('|').map((p) => p.trim());
    if (parts.length < 6) {
      await ctx.reply('Usage: /new title | type | amount | currency | sellerTelegramId | deadline(YYYY-MM-DD)');
      return;
    }

    const [, title, type, amount, currency, sellerTelegramId, deadline] = ['cmd', ...parts];
    const escrow = await escrowService.createEscrow({
      buyerId: ctx.state.user._id,
      title,
      description: '',
      type,
      amount,
      currency,
      sellerTelegramId: Number(sellerTelegramId),
      deadline: new Date(deadline),
    });

    await ctx.reply(`Escrow created: ${escrow.escrowId}\nInvite token: ${escrow.inviteToken}`);
  });

  bot.command('escrows', async (ctx) => {
    const rows = await escrowRepository.listByUser(ctx.state.user._id);
    if (!rows.length) {
      await ctx.reply('No escrows found');
      return;
    }
    const lines = rows.slice(0, 20).map((e) => `${e.escrowId} - ${e.status} - ${e.amount}`);
    await ctx.reply(lines.join('\n'));
  });

  bot.command('approve', async (ctx) => {
    const [, escrowId, sellerWalletAddress] = (ctx.message.text || '').split(' ');
    if (!escrowId || !sellerWalletAddress) {
      await ctx.reply('Usage: /approve ESC-XXXX seller_wallet_address');
      return;
    }
    const updated = await escrowService.release({ escrowId, sellerWalletAddress });
    await ctx.reply(`Released: ${updated.escrowId} tx=${updated.releaseTxHash}`);
  });

  bot.on('text', async (ctx, next) => {
    if (!isGroupChat(ctx)) return next();
    const text = (ctx.message.text || '').trim();
    if (!text || text.startsWith('/')) return next();

    const room = await escrowRoomService.getByChatId(ctx.chat.id);
    if (!room?.waitingRole) return next();
    if (!detectWalletType(text)) {
      await ctx.reply('❌ Invalid wallet format. Send valid BTC/LTC/ETH/XMR/USDT address.');
      return null;
    }

    const updated = await escrowRoomService.saveRoleAddress(ctx.chat.id, room.waitingRole, ctx.from, text);
    const roleUpper = room.waitingRole.toUpperCase();

    await ctx.reply(
      `🔒 ESCROW ROLE DECLARATION\n\n⚡️ ${roleUpper} ${ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name}\n`
      + `✅ ${roleUpper} WALLET\n${text}`,
    );

    if (updated.buyer?.walletAddress && updated.seller?.walletAddress && updated.escrowAddress) {
      await ctx.reply(
        transactionInfoText({
          txnId: escrowRoomService.generateTxnId(),
          buyer: `${updated.buyer.username}\n[${updated.buyer.telegramId}]`,
          seller: `${updated.seller.username}\n[${updated.seller.telegramId}]`,
          address: `${updated.escrowAddress} [Tap to Copy]`,
        }),
      );
      await ctx.reply('💬 Buyer, after verifying address, send agreed amount.\nUse /qr, /balance, /blockchain.');
    } else if (room.waitingRole === 'buyer') {
      await ctx.reply('💬 Seller, send your wallet address using /seller');
    } else {
      await ctx.reply('💬 Buyer, send your wallet address using /buyer');
    }
    return null;
  });
};

async function servicesAuditLog(ctx, action, room) {
  if (!ctx.state?.services?.auditLogRepository || !ctx.state?.user?._id) return;
  await ctx.state.services.auditLogRepository.log({
    actor: ctx.state.user._id,
    action,
    targetType: 'escrow',
    targetId: room._id,
    metadata: {
      chatId: room.chatId,
      roomCode: room.roomCode,
      buyerTelegramId: room.buyer?.telegramId,
      sellerTelegramId: room.seller?.telegramId,
      status: room.status,
    },
    ipAddress: null,
  });
}
