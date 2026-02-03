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

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }

  if (isEnabled()) {
    try {
      const supabase = getClient();
      const { data, error } = await supabase.from('attendance').select('*').order('id', { ascending: true });
      if (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Supabase error' }));
      }
      const items = Array.isArray(data) ? data : [];
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ items }));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Server error' }));
    }
  }

  const list = readJSON(ATTENDANCE_PATH);
  const items = list.map((item, index) => ({ id: index + 1, name: item.name, at: item.at }));
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ items }));
};
