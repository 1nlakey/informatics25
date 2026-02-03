const { isEnabled, getClient } = require('./_supabase');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(process.cwd(), 'db');
const QUIZ_PATH = path.join(DB_DIR, 'quiz_entries.json');

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

  const payload = await readBody(req);
  const name = payload.name && String(payload.name).trim();
  const answer = payload.answer && String(payload.answer).trim();
  if (!name || !answer) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Nama dan jawaban wajib diisi' }));
  }

  if (isEnabled()) {
    try {
      const supabase = getClient();
      const { error } = await supabase.from('quiz_entries').insert([{ name, answer, at: new Date().toISOString() }]);
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

  // fallback to local file (development only)
  try {
    const list = readJSON(QUIZ_PATH);
    list.push({ name, answer, at: new Date().toISOString() });
    writeJSON(QUIZ_PATH, list);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Server error' }));
  }
};
