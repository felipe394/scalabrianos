const pool = require('./db');

async function runPerfMigration() {
  const tables = [
    'tb_dados_religiosos',
    'tb_itinerario_formativo',
    'tb_formacao_academica',
    'tb_atividade_missionaria',
    'tb_obras_realizadas',
    'tb_observacoes_gerais',
    'tb_missionario_casas',
    'tb_documentos'
  ];

  try {
    console.log("Starting performance optimization migration...");
    for (const table of tables) {
      console.log(`Adding index to ${table}(usuario_id)...`);
      try {
        await pool.query(`CREATE INDEX idx_usuario_id ON ${table}(usuario_id)`);
        console.log(`SUCCESS: Index added to ${table}`);
      } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') {
          console.log(`SKIP: Index already exists on ${table}`);
        } else {
          console.error(`ERROR on ${table}:`, e.message);
        }
      }
    }
    console.log("Migration finished!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runPerfMigration();
