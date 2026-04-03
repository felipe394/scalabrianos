const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration2() {
  try {
    // Add is_superior to tb_missionario_casas
    console.log("Adding is_superior to tb_missionario_casas...");
    try {
      await pool.query(`ALTER TABLE tb_missionario_casas ADD COLUMN is_superior BOOLEAN DEFAULT FALSE`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("is_superior already exists");
      else throw e;
    }

    // Create tb_documentos
    console.log("Creating tb_documentos...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        descricao VARCHAR(255) NOT NULL,
        arquivo_path VARCHAR(500) NOT NULL,
        arquivo_nome VARCHAR(255) NOT NULL,
        tipo_arquivo VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads', 'documentos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("Created uploads/documentos directory");
    }

    console.log("Migration 2 completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 2 failed:", error);
    process.exit(1);
  }
}

runMigration2();
