const db = require('./db');

async function run() {
  try {
    const [rows] = await db.query("SHOW COLUMNS FROM tb_missionario_casas");
    console.log(rows.map(r => ({Field: r.Field, Type: r.Type, Null: r.Null, Default: r.Default}))); 
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
