const pool = require('./db');

async function runMigration15() {
  try {
    console.log("Starting Migration 15: adding observacao to items and updating consolidado status...");

    // Check if observacao column exists in tb_financas_mensais_itens
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_financas_mensais_itens' 
        AND COLUMN_NAME = 'observacao'
    `);

    if (columns.length === 0) {
      console.log("Adding observacao column to tb_financas_mensais_itens...");
      await pool.query(`
        ALTER TABLE tb_financas_mensais_itens
        ADD COLUMN observacao TEXT DEFAULT NULL
      `);
      console.log("Column observacao added successfully.");
    } else {
      console.log("Column observacao already exists in tb_financas_mensais_itens.");
    }

    // Modify status enum in tb_financas_consolidado
    console.log("Modifying status enum in tb_financas_consolidado...");
    await pool.query(`
      ALTER TABLE tb_financas_consolidado 
      MODIFY COLUMN status ENUM('PENDENTE_ECONOMO', 'PENDENTE_SUPERIOR', 'APROVADO', 'DEVOLVIDO_SUPERIOR', 'ENVIADO_REGIONAL') DEFAULT 'PENDENTE_ECONOMO'
    `);
    console.log("Status enum updated successfully.");

    console.log("Migration 15 completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 15 failed:", error);
    process.exit(1);
  }
}

runMigration15();
