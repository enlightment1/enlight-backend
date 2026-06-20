const router = require('express').Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

const FREE_EMAILS = ['zwanelwazi04@gmail.com'];

router.post('/', requireAuth, async (req, res) => {
  const { data: profile } = await supabaseAdmin.from('profiles').select('is_pro, email').eq('id', req.user.id).single();
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  if (!FREE_EMAILS.includes(profile.email?.toLowerCase()) && !profile.is_pro) {
    return res.status(403).json({ error: 'Pro required. Upgrade for $37 once.' });
  }

  const { imageBase64, pair, timeframe } = req.body;
  if (!imageBase64 || !pair) return res.status(400).json({ error: 'Missing image or pair' });

  const prompt = `You are an elite SMC/ICT trader analyzing a chart screenshot.\nPair: ${pair}\nTimeframe: ${timeframe || 'M5'}\n\nOutput valid JSON only, with exactly these fields:\n{\n  "bias": "BULLISH" or "BEARISH",\n  "quality": "A" or "B" or "C" or "D",\n  "confidence": number 0-100,\n  "support": "price level",\n  "resistance": "price level",\n  "pivot": "price level",\n  "invalidation": "price level",\n  "target1": "price level",\n  "target2": "price level",\n  "smcStructure": "e.g. Bullish BOS",\n  "smcOB": "Order block description",\n  "smcFVG": "Fair Value Gap description",\n  "smcLiquidity": "Liquidity sweep",\n  "inducement": "Inducement or trick zone",\n  "breaker": "Breaker block info",\n  "mitigation": "Mitigation detail",\n  "volumeImbalance": "Volume imbalance area",\n  "choch": "CHoCH / MSS detail",\n  "orderFlow": "Order flow insight",\n  "smcTrend": "e.g. Higher Highs",\n  "reasoning": "Short paragraph explaining the trade rationale"\n}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.2-11b-vision-preview',
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: 'text', text: prompt }
        ]}],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const analysis = JSON.parse(response.data.choices[0].message.content);
    res.json(analysis);
  } catch (err) {
    console.error('Groq error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

module.exports = router;