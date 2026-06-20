const router = require('express').Router();
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');
const { provisionAccount, placeTrade } = require('../lib/metaapi');
const { sendTradeEmail } = require('../lib/email');

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

router.post('/connect-mt5', requireAuth, async (req, res) => {
  const { login, password, server, broker } = req.body;
  if (!login || !password || !server) return res.status(400).json({ error: 'Missing fields' });
  try {
    await supabaseAdmin.from('mt5_accounts').delete().eq('user_id', req.user.id);
    const accountId = await provisionAccount(req.user.id, login, password, server, broker);
    await supabaseAdmin.from('mt5_accounts').insert({
      user_id: req.user.id, account_id: accountId, login, server, broker,
      password_encrypted: encrypt(password)
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to connect MT5 account' });
  }
});

router.post('/execute', requireAuth, async (req, res) => {
  const { symbol, lot, sl, tp, direction } = req.body;
  const { data: mt5 } = await supabaseAdmin.from('mt5_accounts').select('account_id').eq('user_id', req.user.id).single();
  if (!mt5) return res.status(400).json({ error: 'Connect your MT5 account first' });
  try {
    const order = await placeTrade(mt5.account_id, symbol, lot, sl, tp, direction);
    await sendTradeEmail(req.user.email, 'Trade Executed', `Your ${direction} trade on ${symbol} is live.\nLot: ${lot}\nSL: ${sl}\nTP: ${tp}`);
    await sendTradeEmail('mentor@enlightquants.com', 'Trade Executed by Client', `Client ${req.user.email} opened a ${direction} trade on ${symbol}.`);
    res.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Trade execution failed' });
  }
});

module.exports = router;