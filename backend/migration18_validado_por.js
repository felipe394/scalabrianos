const pool = require('./db');

async function runMigration18() {
  try {
    console.log("Starting Migration 18: Adding validado_por to tb_financas_mensais and tb_financas_consolidado...");
    
    // Check if validado_por exists in tb_financas_mensais
    const [colsMensais] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_financas_mensais' 
        AND COLUMN_NAME = 'validado_por'
    `);
    
    if (colsMensais.length === 0) {
      console.log("Adding validado_por to tb_financas_mensais...");
      await pool.query("ALTER TABLE tb_financas_mensais ADD COLUMN validado_por INT DEFAULT NULL");
    } else {
      console.log("validado_por already exists in tb_financas_mensais.");
    }

    // Check if validado_por exists in tb_financas_consolidado
    const [colsConsolidado] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_financas_consolidado' 
        AND COLUMN_NAME = 'validado_por'
    `);
    
    if (colsConsolidado.length === 0) {
      console.log("Adding validado_por to tb_financas_consolidado...");
      await pool.query("ALTER TABLE tb_financas_consolidado ADD COLUMN validado_por INT DEFAULT NULL");
    } else {
      console.log("validado_por already exists in tb_financas_consolidado.");
    }
    
    console.log("Migration 18 completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 18 failed:", error);
    process.exit(1);
  }
}

runMigration18();
