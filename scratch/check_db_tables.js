const pool = require('./backend/db');

async function check() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM tb_formacao_academica");
    console.log("Columns in tb_formacao_academica:", cols.map(c => c.Field));
    
    const [cols2] = await pool.query("SHOW COLUMNS FROM tb_contas_bancarias");
    console.log("Columns in tb_contas_bancarias:", cols2.map(c => c.Field));
  } catch (e) {
    console.error("Error checking tables:", e.message);
  } finally {
    process.exit();
  }
}
check();
