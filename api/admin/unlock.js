const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(process.cwd(), 'db');
const CONFIG_PATH = path.join(DB_DIR, 'config.json');

function readJSON(filePath) {
  try {
    const s = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(s || '{}');
  } catch (e) {
    return { unlock_messages: false };
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
  const unlock = body.unlock === 'true' || body.unlock === true;
  const cfg = readJSON(CONFIG_PATH);
  cfg.unlock_messages = Boolean(unlock);
  writeJSON(CONFIG_PATH, cfg);
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true, unlock_messages: cfg.unlock_messages }));
};
