const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

router.post('/validate', requireAuth, async (req, res) => {
  const { licenseKey } = req.body;
  if (!licenseKey) return res.status(400).json({ error: 'License key required' });

  const { data: lic } = await supabaseAdmin.from('licenses').select('*, bots(*)').eq('key', licenseKey).single();
  if (lic) return res.json({ success: true, botConfig: lic.bots });

  return res.status(404).json({ error: 'Invalid license key' });
});

module.exports = router;