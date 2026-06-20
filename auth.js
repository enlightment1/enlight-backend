const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;