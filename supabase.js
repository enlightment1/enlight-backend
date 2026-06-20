const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
module.exports = {
  supabaseAdmin: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
};