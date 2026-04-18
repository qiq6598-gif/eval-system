const express = require('express');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 简单内存 + 文件数据库
const fs = require('fs');
const dbPath = path.join('/tmp', 'records.json');

// 初始化数据
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

function getRecords() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveRecords(records) {
  fs.writeFileSync(dbPath, JSON.stringify(records, null, 2));
}

// 生成二维码
app.get('/api/qrcode', async (req, res) => {
  const url = `https://${req.headers.host}`;
  const qr = await QRCode.toDataURL(url);
  res.json({ qrcode: qr });
});

// 提交评估
app.post('/api/submit', (req, res) => {
  const { uid, imgA, imgB, result } = req.body;
  const records = getRecords();
  records.push({
    id: Date.now(),
    uid,
    imgA,
    imgB,
    result,
    time: new Date().toLocaleString()
  });
  saveRecords(records);
  res.sendStatus(200);
});

// 统计
app.get('/api/stats', (req, res) => {
  const records = getRecords();
  const imgMap = {};

  for (const r of records) {
    const a = r.imgA;
    const b = r.imgB;
    if (!imgMap[a]) imgMap[a] = { win: 0, tie: 0, lose: 0 };
    if (!imgMap[b]) imgMap[b] = { win: 0, tie: 0, lose: 0 };

    if (r.result === 'A更接近真实') {
      imgMap[a].win++;
      imgMap[b].lose++;
    } else if (r.result === 'B更接近真实') {
      imgMap[b].win++;
      imgMap[a].lose++;
    } else {
      imgMap[a].tie++;
      imgMap[b].tie++;
    }
  }

  const list = Object.entries(imgMap).map(([name, o]) => {
    const total = o.win + o.tie + o.lose;
    const rate = total ? (o.win / total).toFixed(2) : '0';
    return { name, win: o.win, tie: o.tie, lose: o.lose, total, rate };
  }).sort((a, b) => b.rate - a.rate);

  res.json({ list });
});

// 所有记录
app.get('/api/allRecords', (req, res) => {
  res.json(getRecords());
});

// 删除单条
app.delete('/api/delete/:id', (req, res) => {
  const id = Number(req.params.id);
  const records = getRecords().filter(r => r.id !== id);
  saveRecords(records);
  res.sendStatus(200);
});

// 删除用户
app.delete('/api/deleteUser/:uid', (req, res) => {
  const uid = req.params.uid;
  const records = getRecords().filter(r => r.uid !== uid);
  saveRecords(records);
  res.sendStatus(200);
});

// 清空所有
app.delete('/api/clearAll', (req, res) => {
  saveRecords([]);
  res.sendStatus(200);
});

// 前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Vercel 要求
module.exports = app;
