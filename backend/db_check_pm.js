const db = require('./db');

async function run() {
  try {
    const [rows] = await db.query('SELECT id, usuario_id, casa_id, data_inicio, funcao, pm, tipo, pais FROM tb_missionario_casas ORDER BY id DESC LIMIT 20');
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
