const pool = require('./db');

async function runMigration19() {
  try {
    console.log("Starting Migration 19: Adding usuario_id to tb_financas_consolidado...");

    // 1. Check if column exists
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_financas_consolidado' 
        AND COLUMN_NAME = 'usuario_id'
    `);

    if (cols.length === 0) {
      console.log("Adding usuario_id column...");
      await pool.query("ALTER TABLE tb_financas_consolidado ADD COLUMN usuario_id INT DEFAULT NULL");

      // 2. Populate existing rows
      const [rows] = await pool.query("SELECT id, casa_id FROM tb_financas_consolidado");
      for (const row of rows) {
        // Find economist of this house
        const [ecos] = await pool.query(`
          SELECT u.id FROM tb_usuarios u
          JOIN tb_missionario_casas mc ON u.id = mc.usuario_id
          WHERE mc.casa_id = ? AND u.is_oconomo = 1
          LIMIT 1
        `, [row.casa_id]);

        let targetUid = null;
        if (ecos.length > 0) {
          targetUid = ecos[0].id;
        } else {
          // Fallback to first user
          const [firstUser] = await pool.query("SELECT id FROM tb_usuarios ORDER BY id ASC LIMIT 1");
          if (firstUser.length > 0) {
            targetUid = firstUser[0].id;
          }
        }

        if (targetUid) {
          await pool.query("UPDATE tb_financas_consolidado SET usuario_id = ? WHERE id = ?", [targetUid, row.id]);
        }
      }

      // 3. Make column NOT NULL and add foreign key
      await pool.query("ALTER TABLE tb_financas_consolidado MODIFY COLUMN usuario_id INT NOT NULL");
      
      try {
        await pool.query("ALTER TABLE tb_financas_consolidado ADD CONSTRAINT fk_consolidado_usuario FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE");
      } catch (err) {
        console.warn("Could not add foreign key constraint (might exist):", err.message);
      }

      // 4. Drop old index and add new unique index
      try {
        await pool.query("ALTER TABLE tb_financas_consolidado DROP INDEX house_month");
      } catch (err) {
        console.warn("Could not drop index house_month (might not exist):", err.message);
      }

      try {
        await pool.query("ALTER TABLE tb_financas_consolidado ADD UNIQUE KEY house_month_user (casa_id, mes_referencia, usuario_id)");
      } catch (err) {
        console.warn("Could not add unique index house_month_user:", err.message);
      }

      console.log("Migration 19 completed successfully!");
    } else {
      console.log("usuario_id column already exists in tb_financas_consolidado.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Migration 19 failed:", error);
    process.exit(1);
  }
}

runMigration19();
