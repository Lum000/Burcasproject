// teste-bcrypt.js — rode com: node teste-bcrypt.js
const bcrypt = require('bcrypt');

async function teste() {
  const hash = await bcrypt.hash('senha123', 10);
  console.log('Hash gerado:', hash);
}

teste();