const pool = require('./db');

async function runMigration8() {
  try {
    console.log("Adding proximos_passos to tb_usuarios...");
    try {
      await pool.query(`ALTER TABLE tb_usuarios ADD COLUMN proximos_passos TEXT`);
      console.log("Column proximos_passos added successfully");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("proximos_passos already exists");
      else throw e;
    }

    console.log("Migration 8 completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 8 failed:", error);
    process.exit(1);
  }
}

runMigration8();
