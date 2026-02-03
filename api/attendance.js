const fs = require('fs');
const path = require('path');
const { isEnabled, getClient } = require('./_supabase');

// When SUPABASE_URL and SUPABASE_KEY are set, this function will use Supabase
// for persistence. If not set, it falls back to local JSON files (development only).

const DB_DIR = path.join(process.cwd(), 'db');
const ATTENDANCE_PATH = path.join(DB_DIR, 'attendance.json');

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
    if (!name) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Nama wajib diisi' }));
    }

    if (isEnabled()) {
      try {
        const supabase = getClient();
        const { error } = await supabase.from('attendance').insert([{ name, at: new Date().toISOString() }]);
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

    // fallback to file storage (development only)
    try {
      const list = readJSON(ATTENDANCE_PATH);
      list.push({ name, at: new Date().toISOString() });
      writeJSON(ATTENDANCE_PATH, list);
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
        const { data, error } = await supabase.from('attendance').select('*').order('id', { ascending: true });
        if (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Supabase error' }));
        }
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ items: data }));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Server error' }));
      }
    }

    const list = readJSON(ATTENDANCE_PATH);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ items: list }));
  }

  res.statusCode = 405;
  res.end();
};
