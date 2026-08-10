const pool = require('./db');

async function runMigration16() {
  try {
    console.log("Starting Migration 16: adding EM_VALIDACAO to tb_financas_mensais status enum...");

    await pool.query(`
      ALTER TABLE tb_financas_mensais 
      MODIFY COLUMN status ENUM('PENDENTE', 'EM_VALIDACAO', 'VALIDADO', 'DEVOLVIDO') DEFAULT 'PENDENTE'
    `);
    console.log("Status enum updated successfully in tb_financas_mensais.");
    process.exit(0);
  } catch (error) {
    console.error("Migration 16 failed:", error);
    process.exit(1);
  }
}

runMigration16();
