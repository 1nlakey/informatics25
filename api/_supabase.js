const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

let supabase = null;
function isEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function getClient() {
  if (!isEnabled()) return null;
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
}

module.exports = { isEnabled, getClient };
