const pool = require('./db');

async function runMigration5() {
  try {
    console.log("Adding is_superior to tb_usuarios...");
    try {
      await pool.query(`ALTER TABLE tb_usuarios ADD COLUMN is_superior BOOLEAN DEFAULT FALSE`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("is_superior already exists");
      else throw e;
    }

    console.log("Migration 5 completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 5 failed:", error);
    process.exit(1);
  }
}

runMigration5();
