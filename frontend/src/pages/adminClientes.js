// frontend/src/pages/adminClientes.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminClientes.css';
import { api } from '../utils/api.js';

const AdminClientes = () => {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cargar clientes desde el backend
  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        setError('');

        // Idealmente el backend expone: GET /api/clientes (solo admin)
        const res = await api.get('/api/clientes');
        // Soporta tanto { clientes: [...] } como un array directo
        const list = Array.isArray(res) ? res : res?.clientes || [];
        setClientes(list);
      } catch (err) {
        console.error('Error cargando clientes:', err);
        setError(err?.message || 'No se pudieron cargar los clientes.');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Filtrado por búsqueda (nombre, email, teléfono)
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;

    return clientes.filter((c) =>
      [
        c.nombre,
        c.email,
        c.telefono,
        c.razon_social,
        c.rut,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [busqueda, clientes]);

  // Derivar algunas métricas básicas
  const totalClientes = filtrados.length;
  // Si el backend algún día manda solicitudes_activas, la usamos; si no, 0
  const clientesConSolicitudesActivas = filtrados.filter(
    (c) => Number(c.solicitudes_activas ?? c.solicitudesActivas ?? 0) > 0
  ).length;

  return (
    <div className="admin-clientes-container">
      <header className="admin-clientes-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="btn-volver"
              onClick={() => navigate('/admin/menu')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Volver al Menú
            </button>
            <h1>
              <i className="fas fa-users"></i>
              Gestión de Clientes - INFOSER & EP SPA
            </h1>
          </div>
          <div className="admin-info">
            <span>Administrador</span>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-clientes-layout">
        <nav className="admin-clientes-sidebar">
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/menu')}
          >
            <i className="fas fa-home"></i>
            Menú Principal
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/solicitudes')}
          >
            <i className="fas fa-tools"></i>
            📋 Solicitudes
          </button>
          <button className="sidebar-btn active">
            <i className="fas fa-users"></i>
            👥 Clientes
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/tecnicos')}
          >
            <i className="fas fa-user-cog"></i>
            👨‍💻 Técnicos
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/metricas')}
          >
            <i className="fas fa-chart-line"></i>
            📈 Métricas
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/modelo-predictivo')}
          >
            <i className="fas fa-brain"></i>
            🔮 Modelo Predictivo
          </button>
        </nav>

        <main className="admin-clientes-content">
          <div className="content-header">
            <h2>Lista de Clientes Registrados</h2>
            <div className="header-actions">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="search-input"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button className="btn-primary">
                Exportar Lista
              </button>
            </div>
          </div>

          {error && (
            <div
              className="alert alert-danger"
              style={{ marginBottom: 12 }}
            >
              {error}
            </div>
          )}

          {cargando ? (
            <div className="text-muted">Cargando clientes...</div>
          ) : (
            <>
              <div className="clientes-stats">
                <div className="stat-card">
                  <h3>Total Clientes</h3>
                  <p className="stat-number">{totalClientes}</p>
                </div>
                <div className="stat-card">
                  <h3>Clientes con solicitudes activas</h3>
                  <p className="stat-number">
                    {clientesConSolicitudesActivas}
                  </p>
                </div>
              </div>

              <div className="table-container">
                <table className="clientes-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Contacto</th>
                      <th>Fecha Registro</th>
                      <th>Solicitudes Activas</th>
                      <th>Última Solicitud</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((cliente) => {
                      const solicitudesActivas =
                        cliente.solicitudes_activas ??
                        cliente.solicitudesActivas ??
                        0;

                      const fechaRegistro =
                        cliente.fechaRegistro ||
                        cliente.fecha_registro ||
                        '-';

                      const ultimaSolicitud =
                        cliente.ultima_solicitud ||
                        cliente.ultimaSolicitud ||
                        '-';

                      return (
                        <tr key={cliente.id}>
                          <td>
                            <div className="cliente-info">
                              <strong>{cliente.nombre}</strong>
                              <small>ID: {cliente.id}</small>
                            </div>
                          </td>
                          <td>
                            <div className="contacto-info">
                              <div>{cliente.email}</div>
                              <div>{cliente.telefono || '-'}</div>
                            </div>
                          </td>
                          <td>{fechaRegistro}</td>
                          <td>
                            <span
                              className={`badge ${solicitudesActivas > 0
                                ? 'active'
                                : 'inactive'
                                }`}
                            >
                              {solicitudesActivas}
                            </span>
                          </td>
                          <td>{ultimaSolicitud}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-small btn-info">
                                Ver
                              </button>
                              <button className="btn-small btn-warning">
                                Editar
                              </button>
                              <button className="btn-small btn-danger">
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtrados.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center text-muted py-4"
                        >
                          No hay clientes que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminClientes;
