const fs = require('fs');
const path = require('path');
const { isEnabled, getClient } = require('./_supabase');

const DB_DIR = path.join(process.cwd(), 'db');
const CONFIG_PATH = path.join(DB_DIR, 'config.json');
const QUIZ_PATH = path.join(DB_DIR, 'quiz_entries.json');

function readJSON(filePath) {
  try {
    const s = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(s || '[]');
  } catch (e) {
    return [];
  }
}

function readConfig(filePath) {
  try {
    const s = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(s || '{}');
  } catch (e) {
    return { unlock_messages: false, quiz_answer: '' };
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }

  const cfg = readConfig(CONFIG_PATH);

  if (isEnabled()) {
    try {
      const supabase = getClient();
      const { data, error } = await supabase.from('quiz_entries').select('*');
      if (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Supabase error' }));
      }
      const list = Array.isArray(data) ? data : [];
      const correct = cfg.quiz_answer
        ? list.filter((e) => String(e.answer || '').toLowerCase().trim() === String(cfg.quiz_answer).toLowerCase().trim())
        : [];
      const winner = correct.length > 0 ? correct[Math.floor(Math.random() * correct.length)] : null;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ correct, winner }));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Server error' }));
    }
  }

  const list = readJSON(QUIZ_PATH);
  const correct = cfg.quiz_answer
    ? list.filter((e) => String(e.answer || '').toLowerCase().trim() === String(cfg.quiz_answer).toLowerCase().trim())
    : [];
  const winner = correct.length > 0 ? correct[Math.floor(Math.random() * correct.length)] : null;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ correct, winner }));
};
