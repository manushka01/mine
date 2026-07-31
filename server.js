// server.js
// Minimal Express static server so the frontend can be started
// independently on http://localhost:3000 with `npm install && npm start`,
// while the backend API runs separately on http://localhost:5000.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend running at http://localhost:${PORT}`);
});