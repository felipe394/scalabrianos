const pool = require('./db');
async function run() {
  try {
    const [rows] = await pool.query("SELECT id, usuario_id, mes_referencia, status FROM tb_financas_mensais ORDER BY id DESC LIMIT 10");
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
