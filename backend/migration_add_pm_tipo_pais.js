const pool = require('./db');

async function run() {
  try {
    console.log('Adding pm, tipo, pais to tb_missionario_casas if missing...');

    try {
      await pool.query("ALTER TABLE tb_missionario_casas ADD COLUMN pm VARCHAR(100) DEFAULT NULL");
      console.log('Added column pm');
    } catch (e) {
      if (e && e.code === 'ER_DUP_FIELDNAME') console.log('pm already exists'); else if (e && e.errno === 1060) console.log('pm already exists'); else console.error('pm add error (ignored):', e.message || e);
    }

    try {
      await pool.query("ALTER TABLE tb_missionario_casas ADD COLUMN tipo VARCHAR(20) DEFAULT NULL");
      console.log('Added column tipo');
    } catch (e) {
      if (e && e.code === 'ER_DUP_FIELDNAME') console.log('tipo already exists'); else if (e && e.errno === 1060) console.log('tipo already exists'); else console.error('tipo add error (ignored):', e.message || e);
    }

    try {
      await pool.query("ALTER TABLE tb_missionario_casas ADD COLUMN pais VARCHAR(100) DEFAULT NULL");
      console.log('Added column pais');
    } catch (e) {
      if (e && e.code === 'ER_DUP_FIELDNAME') console.log('pais already exists'); else if (e && e.errno === 1060) console.log('pais already exists'); else console.error('pais add error (ignored):', e.message || e);
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
