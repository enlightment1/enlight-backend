const router = require('express').Router();
const cron = require('node-cron');
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');
const { getCurrentPrice } = require('../lib/priceApi');
const { sendPush } = require('../lib/pushNotifications');

router.post('/', requireAuth, async (req, res) => {
  const { symbol, price, direction, alert_type } = req.body;
  const { data, error } = await supabaseAdmin.from('alerts').insert({
    user_id: req.user.id, symbol, price, direction, alert_type, triggered: false
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('alerts').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin.from('alerts').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

cron.schedule('*/5 * * * *', async () => {
  console.log('Checking price alerts...');
  const { data: alerts } = await supabaseAdmin.from('alerts').select('*').eq('triggered', false);
  if (!alerts) return;
  for (const alert of alerts) {
    const currentPrice = await getCurrentPrice(alert.symbol);
    if (!currentPrice) continue;
    const conditionMet = (alert.direction === 'above' && currentPrice >= alert.price) ||
                         (alert.direction === 'below' && currentPrice <= alert.price);
    if (conditionMet) {
      await supabaseAdmin.from('alerts').update({ triggered: true }).eq('id', alert.id);
      if (alert.alert_type === 'push') {
        const { data: sub } = await supabaseAdmin.from('push_subscriptions').select('subscription').eq('user_id', alert.user_id).single();
        if (sub) await sendPush(sub.subscription, {
          title: `Price Alert: ${alert.symbol}`,
          body: `${alert.symbol} is now ${alert.direction} ${alert.price} (currently ${currentPrice})`,
          icon: '/icon-192.png'
        });
      }
    }
  }
});

module.exports = router;