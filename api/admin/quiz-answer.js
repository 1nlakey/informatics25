const fs = require('fs');
const path = require('path');
const { isEnabled, getClient } = require('../_supabase');

const DB_DIR = path.join(process.cwd(), 'db');
const CONFIG_PATH = path.join(DB_DIR, 'config.json');

function readJSON(filePath) {
  try {
    const s = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(s || '{}');
  } catch (e) {
    return { unlock_messages: false, quiz_answer: '' };
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
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
  const answer = String(body.answer || '').trim();
  const cfg = readJSON(CONFIG_PATH);
  cfg.quiz_answer = answer;
  writeJSON(CONFIG_PATH, cfg);
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true, quiz_answer: cfg.quiz_answer }));
};
