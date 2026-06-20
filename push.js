const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

router.post('/subscribe', requireAuth, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  const { error } = await supabaseAdmin.from('push_subscriptions').upsert({ user_id: req.user.id, subscription }, { onConflict: 'user_id' });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;