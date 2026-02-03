const fs = require('fs');
const path = require('path');

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

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const cfg = readJSON(CONFIG_PATH);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(cfg));
};
