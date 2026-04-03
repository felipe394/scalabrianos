const pool = require('./db');

async function runMigration() {
  try {
    // Modify tb_usuarios enum
    console.log("Altering tb_usuarios role ENUM...");
    await pool.query(`ALTER TABLE tb_usuarios MODIFY COLUMN role ENUM('ADMIN_GERAL', 'ADMINISTRADOR', 'COLABORADOR', 'INTERMITENTE', 'PADRE') DEFAULT 'COLABORADOR'`);
    
    // Add is_oconomo column if not exists
    console.log("Adding is_oconomo to tb_usuarios...");
    try {
      await pool.query(`ALTER TABLE tb_usuarios ADD COLUMN is_oconomo BOOLEAN DEFAULT FALSE`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("is_oconomo already exists");
      else throw e;
    }

    // Create tb_logs
    console.log("Creating tb_logs...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        acao VARCHAR(255) NOT NULL,
        entidade VARCHAR(100),
        detalhes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE SET NULL
      )
    `);

    // Create tb_missionario_casas
    console.log("Creating tb_missionario_casas...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_missionario_casas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        casa_id INT NOT NULL,
        data_inicio DATE,
        data_fim DATE,
        funcao VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (casa_id) REFERENCES tb_casas_religiosas(id) ON DELETE CASCADE
      )
    `);

    // Create tb_financas_casa
    console.log("Creating tb_financas_casa...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_financas_casa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        casa_id INT NOT NULL,
        registrado_por INT,
        descricao VARCHAR(500) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        tipo_transacao ENUM('CREDITO', 'DEBITO') NOT NULL,
        data DATE NOT NULL,
        status ENUM('PENDENTE', 'VERIFICADO', 'APONTAMENTO') DEFAULT 'PENDENTE',
        apontamento_texto TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (casa_id) REFERENCES tb_casas_religiosas(id) ON DELETE CASCADE,
        FOREIGN KEY (registrado_por) REFERENCES tb_usuarios(id) ON DELETE SET NULL
      )
    `);

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
