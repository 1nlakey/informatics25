const fs = require('fs');
const path = require('path');
const { isEnabled, getClient } = require('./_supabase');

const DB_DIR = path.join(process.cwd(), 'db');
const MESSAGES_PATH = path.join(DB_DIR, 'messages.json');
const CONFIG_PATH = path.join(DB_DIR, 'config.json');

function readJSON(filePath) {
  try {
    const s = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(s || '[]');
  } catch (e) {
    return [];
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const payload = await readBody(req);
    const name = payload.name && String(payload.name).trim();
    const message = payload.message && String(payload.message).trim();
    if (!name || !message) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Nama dan pesan wajib diisi' }));
    }

    // Check config unlock flag (file-based). For production, consider moving
    // this flag into your external DB.
    const cfg = fs.existsSync(CONFIG_PATH) ? readJSON(CONFIG_PATH) : { unlock_messages: false };
    if (!cfg.unlock_messages) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Form pesan & kesan belum dibuka' }));
    }

    if (isEnabled()) {
      try {
        const supabase = getClient();
        const { error } = await supabase.from('messages').insert([{ name, message, at: new Date().toISOString() }]);
        if (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Supabase error' }));
        }
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Server error' }));
      }
    }

    // fallback to file
    try {
      const list = readJSON(MESSAGES_PATH);
      list.push({ name, message, at: new Date().toISOString() });
      writeJSON(MESSAGES_PATH, list);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Server error' }));
    }
  }

  if (req.method === 'GET') {
    if (isEnabled()) {
      try {
        const supabase = getClient();
        const { data, error } = await supabase.from('messages').select('*').order('id', { ascending: true });
        if (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Supabase error' }));
        }
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ messages: data }));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Server error' }));
      }
    }
    const list = readJSON(MESSAGES_PATH);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ messages: list }));
  }

  res.statusCode = 405;
  res.end();
};
