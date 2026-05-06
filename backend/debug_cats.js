const db = require('./db');
const fs = require('fs');

async function check() {
  const [rows] = await db.query('SELECT id, codigo, nome, perfil FROM tb_categorias_financas WHERE perfil = "PERFIL_1"');
  fs.writeFileSync('cats_debug.json', JSON.stringify(rows, null, 2));
  console.log('Categories saved to cats_debug.json');
  process.exit(0);
}

check();
