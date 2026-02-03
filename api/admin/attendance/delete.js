const fs = require('fs');
const path = require('path');
const { isEnabled, getClient } = require('../../_supabase');

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
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end();
    return;
  }

  const body = await readBody(req);
  const ids = Array.isArray(body.ids) ? body.ids.map((v) => Number(v)).filter(Boolean) : [];
  if (ids.length === 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'IDs tidak valid' }));
  }

  if (isEnabled()) {
    try {
      const supabase = getClient();
      const { error } = await supabase.from('attendance').delete().in('id', ids);
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

  const list = readJSON(ATTENDANCE_PATH);
  const kept = list.filter((_, index) => !ids.includes(index + 1));
  writeJSON(ATTENDANCE_PATH, kept);
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true }));
};
