const db = require('./db');

async function run() {
  try {
    const usuario_id = 9999; // do not assume user exists; we'll find an existing user
    // find an existing user id
    const [users] = await db.query('SELECT id FROM tb_usuarios LIMIT 1');
    const userId = users.length ? users[0].id : 1;
    const [houses] = await db.query('SELECT id FROM tb_casas_religiosas LIMIT 1');
    const casaId = houses.length ? houses[0].id : 1;

    const [res] = await db.query('INSERT INTO tb_missionario_casas (usuario_id, casa_id, data_inicio, funcao, pm, tipo, pais, is_superior) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, casaId, new Date().toISOString().slice(0,10), 'TesteRole', 'CR 13', 'CR', 'Brasil', 0]);
    console.log('Inserted id', res.insertId);

    const [rows] = await db.query('SELECT id, usuario_id, casa_id, data_inicio, funcao, pm, tipo, pais FROM tb_missionario_casas WHERE id = ?', [res.insertId]);
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
