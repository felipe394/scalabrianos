const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="page-header">
        <h2>Administradores</h2>
        <div className="header-actions">
          <button className="btn-export">Exportar Excel</button>
          <button className="btn-new">+ Novo Admin</button>
        </div>
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>NOME</label>
          <input type="text" placeholder="Filtrar por nome..." />
        </div>
        <div className="filter-group">
          <label>LOGIN</label>
          <input type="text" placeholder="Filtrar por login..." />
        </div>
        <div className="filter-group">
          <label>STATUS</label>
          <select>
            <option>Todos</option>
          </select>
        </div>
        <button className="btn-clear">Limpar Filtros</button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Login</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Roberto Kalili</td>
              <td>roberto.kalili@connectortech.com.br</td>
              <td><span className="status-tag">ATIVO</span></td>
            </tr>
            {/* Mock data */}
            <tr>
              <td>2</td>
              <td>Elias Bernardo</td>
              <td>elias.bernardo@beltis.com.br</td>
              <td><span className="status-tag">ATIVO</span></td>
            </tr>
            <tr>
              <td>3</td>
              <td>Felipe Sousa</td>
              <td>felipe.sousa@connectortech.com.br</td>
              <td><span className="status-tag">ATIVO</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <style>{`
        .home-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          color: var(--text-main);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--primary-light);
        }

        .page-header h2 {
          font-weight: 700;
          color: var(--primary);
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-export {
          padding: 0.6rem 1.2rem;
          border: 1px solid var(--accent);
          background: white;
          color: var(--primary);
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-export:hover {
          background-color: var(--primary-light);
        }

        .btn-new {
          padding: 0.6rem 1.2rem;
          background-color: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-new:hover {
          background-color: var(--header-bg);
        }

        .filters-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          gap: 1.5rem;
          align-items: flex-end;
          border: 1px solid var(--primary-light);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .filter-group label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 0.5px;
        }

        .filter-group input, .filter-group select {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: #f8fafc;
          outline: none;
          transition: border-color 0.2s;
        }

        .filter-group input:focus, .filter-group select:focus {
          border-color: var(--accent);
        }

        .btn-clear {
          padding: 0.75rem 1.5rem;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .data-table {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid var(--primary-light);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 1.25rem 1rem;
          background-color: var(--primary-light);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary);
          border-bottom: 1px solid #e2e8f0;
        }

        td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.95rem;
        }

        .status-tag {
          background-color: #dcfce7;
          color: #166534;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default Home;
