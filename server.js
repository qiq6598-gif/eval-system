const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let records = [];
let id = 1;

app.post('/api/submit', (req, res) => {
  const { uid, imgA, imgB, result } = req.body;
  records.push({
    id: id++,
    uid,
    imgA,
    imgB,
    result,
    time: new Date().toLocaleString()
  });
  res.json({ ok: true });
});

app.get('/api/stats', (req, res) => {
  const map = {};
  records.forEach(r => {
    if (!map[r.imgA]) map[r.imgA] = { win: 0, tie: 0, lose: 0, total: 0 };
    if (!map[r.imgB]) map[r.imgB] = { win: 0, tie: 0, lose: 0, total: 0 };
    map[r.imgA].total++;
    map[r.imgB].total++;
    if (r.result === 'A') map[r.imgA].win++, map[r.imgB].lose++;
    else if (r.result === 'B') map[r.imgB].win++, map[r.imgA].lose++;
    else map[r.imgA].tie++, map[r.imgB].tie++;
  });
  const list = Object.entries(map).map(([k, v]) => ({
    name: k,
    ...v,
    rate: (v.win / v.total * 100).toFixed(1) + '%'
  }));
  res.json(list);
});

app.get('/api/allRecords', (req, res) => res.json(records));

app.delete('/api/delete/:id', (req, res) => {
  records = records.filter(x => x.id !== parseInt(req.params.id));
  res.json({ ok: true });
});

app.delete('/api/deleteUser/:uid', (req, res) => {
  records = records.filter(x => x.uid !== req.params.uid);
  res.json({ ok: true });
});

app.delete('/api/clearAll', (req, res) => {
  records = []; id = 1;
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
