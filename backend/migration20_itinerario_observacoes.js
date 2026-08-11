const pool = require('./db');

async function poolMigration20() {
  try {
    console.log("Starting Migration 20: Adding observacoes to tb_itinerario_formativo...");

    // 1. Check if column exists
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_itinerario_formativo' 
        AND COLUMN_NAME = 'observacoes'
    `);

    if (cols.length === 0) {
      console.log("Adding observacoes column...");
      await pool.query("ALTER TABLE tb_itinerario_formativo ADD COLUMN observacoes TEXT DEFAULT NULL");
      console.log("Migration 20 completed successfully!");
    } else {
      console.log("observacoes column already exists in tb_itinerario_formativo.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Migration 20 failed:", error);
    process.exit(1);
  }
}

poolMigration20();
