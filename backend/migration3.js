const pool = require('./db');

async function runMigration3() {
  try {
    console.log("Starting Migration v3...");

    // 1. Add permissoes to tb_usuarios
    console.log("Adding permissoes to tb_usuarios...");
    try {
      await pool.query(`ALTER TABLE tb_usuarios ADD COLUMN permissoes JSON DEFAULT NULL`);
      console.log("SUCCESS: permissoes added");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("SKIP: permissoes already exists");
      else throw e;
    }

    // 2. Add tipo to tb_casas_religiosas
    console.log("Adding tipo to tb_casas_religiosas...");
    try {
      await pool.query(`ALTER TABLE tb_casas_religiosas ADD COLUMN tipo ENUM('CR', 'CI', 'M', 'P', 'PV', 'CS') DEFAULT 'CR'`);
      console.log("SUCCESS: tipo added");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("SKIP: tipo already exists");
      else throw e;
    }

    // 3. Add obs_receita and obs_despesa to tb_financas_mensais
    console.log("Adding obs_receita and obs_despesa to tb_financas_mensais...");
    try {
      await pool.query(`ALTER TABLE tb_financas_mensais ADD COLUMN obs_receita TEXT, ADD COLUMN obs_despesa TEXT`);
      console.log("SUCCESS: obs columns added");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("SKIP: obs columns already exist");
      else throw e;
    }

    // 4. Add performance indexes (trying again)
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

    for (const table of tables) {
      console.log(`Adding index to ${table}(usuario_id)...`);
      try {
        await pool.query(`CREATE INDEX idx_usuario_id ON ${table}(usuario_id)`);
        console.log(`SUCCESS: Index added to ${table}`);
      } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') console.log(`SKIP: Index already exists on ${table}`);
        else console.error(`ERROR on ${table}:`, e.message);
      }
    }

    console.log("Migration v3 completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration3();
