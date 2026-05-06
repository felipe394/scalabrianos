const db = require('./db');

async function fix() {
  const categories = [
    ['11.11', 'Saldo anterior', 'CREDITO', 'PERFIL_2'],
    ['11.11', 'Recebido pela Dir. Reg.', 'CREDITO', 'PERFIL_2'],
    ['11.11', 'Entregue à Dir. Reg.', 'DEBITO', 'PERFIL_2']
  ];

  for (const [codigo, nome, tipo, perfil] of categories) {
    const [exists] = await db.query('SELECT id FROM tb_categorias_financas WHERE nome = ? AND perfil = ?', [nome, perfil]);
    if (exists.length === 0) {
      console.log(`Adding ${nome} to ${perfil}`);
      await db.query('INSERT INTO tb_categorias_financas (codigo, nome, tipo, perfil) VALUES (?, ?, ?, ?)', [codigo, nome, tipo, perfil]);
    }
  }
  console.log('Done');
  process.exit(0);
}

fix();
