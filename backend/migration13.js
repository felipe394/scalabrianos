const pool = require('./db');

async function runMigration13() {
  const cols = [
    { name: 'data_batismo',          sql: `ALTER TABLE tb_dados_religiosos ADD COLUMN IF NOT EXISTS data_batismo DATE` },
    { name: 'doc_batismo',           sql: `ALTER TABLE tb_dados_religiosos ADD COLUMN IF NOT EXISTS doc_batismo VARCHAR(500)` },
    { name: 'data_primeira_comunhao',sql: `ALTER TABLE tb_dados_religiosos ADD COLUMN IF NOT EXISTS data_primeira_comunhao DATE` },
    { name: 'doc_primeira_comunhao', sql: `ALTER TABLE tb_dados_religiosos ADD COLUMN IF NOT EXISTS doc_primeira_comunhao VARCHAR(500)` },
    { name: 'data_crisma',           sql: `ALTER TABLE tb_dados_religiosos ADD COLUMN IF NOT EXISTS data_crisma DATE` },
    { name: 'doc_crisma',            sql: `ALTER TABLE tb_dados_religiosos ADD COLUMN IF NOT EXISTS doc_crisma VARCHAR(500)` },
  ];

  try {
    console.log('Starting Migration v13 — Sacramentos (Batismo, 1ª Comunhão, Crisma)...');
    for (const col of cols) {
      try {
        await pool.query(col.sql);
        console.log(`SUCCESS: ${col.name} added`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log(`SKIP: ${col.name} already exists`);
        else throw e;
      }
    }
    console.log('Migration v13 completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration v13 failed:', error);
    process.exit(1);
  }
}

runMigration13();
