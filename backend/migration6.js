const pool = require('./db');

async function runMigration6() {
  try {
    console.log("Adding arquivo_conteudo (LONGBLOB) to tb_documentos...");
    try {
      await pool.query(`ALTER TABLE tb_documentos ADD COLUMN arquivo_conteudo LONGBLOB`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("arquivo_conteudo already exists");
      else throw e;
    }

    console.log("Migration 6 completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 6 failed:", error);
    process.exit(1);
  }
}

runMigration6();
