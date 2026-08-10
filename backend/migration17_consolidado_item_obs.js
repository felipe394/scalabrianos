const pool = require('./db');

async function runMigration17() {
  try {
    console.log("Starting Migration 17: adding observacao to tb_financas_consolidado_itens...");

    // Check if observacao column exists in tb_financas_consolidado_itens
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_financas_consolidado_itens' 
        AND COLUMN_NAME = 'observacao'
    `);

    if (columns.length === 0) {
      console.log("Adding observacao column to tb_financas_consolidado_itens...");
      await pool.query(`
        ALTER TABLE tb_financas_consolidado_itens
        ADD COLUMN observacao TEXT DEFAULT NULL
      `);
      console.log("Column observacao added successfully to tb_financas_consolidado_itens.");
    } else {
      console.log("Column observacao already exists in tb_financas_consolidado_itens.");
    }

    console.log("Migration 17 completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 17 failed:", error);
    process.exit(1);
  }
}

runMigration17();
