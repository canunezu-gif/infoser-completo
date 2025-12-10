// frontend/src/pages/adminTecnicos.js
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminTecnicos.css';
import { api } from '../utils/api.js';

export default function AdminTecnicos() {
  const navigate = useNavigate();
  const [tecnicos, setTecnicos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cargar desde backend
  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        const res = await api.get('/api/tecnicos'); // protegido por token; admin
        setTecnicos(res?.tecnicos || []);
      } catch (err) {
        setError(err?.message || 'No se pudieron cargar los técnicos.');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return tecnicos;
    return tecnicos.filter(t =>
      [t.nombre, t.email, t.telefono, t.especialidad]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [busqueda, tecnicos]);

  return (
    <div className="admin-tecnicos-container">
      <header className="admin-tecnicos-header">
        <div className="header-content">
          <div className="header-left">
            <button className="btn-volver" onClick={() => navigate('/admin/menu')}>
              <i className="fas fa-arrow-left me-2"></i>
              Volver al Menú
            </button>
            <h1>
              <i className="fas fa-user-cog"></i>
              Gestión de Técnicos - INFOSER & EP SPA
            </h1>
          </div>
          <div className="admin-info">
            <span>Administrador</span>
            <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-tecnicos-layout">
        <nav className="admin-tecnicos-sidebar">
          <button className="sidebar-btn" onClick={() => navigate('/admin/menu')}>
            <i className="fas fa-home"></i>
            Menú Principal
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/solicitudes')}>
            <i className="fas fa-tools"></i>
            📋 Solicitudes
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/clientes')}>
            <i className="fas fa-users"></i>
            👥 Clientes
          </button>
          <button className="sidebar-btn active">
            <i className="fas fa-user-cog"></i>
            👨‍💻 Técnicos
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/metricas')}>
            <i className="fas fa-chart-line"></i>
            📈 Métricas
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/modelo-predictivo')}>
            <i className="fas fa-brain"></i>
            🔮 Modelo Predictivo
          </button>
        </nav>

        <main className="admin-tecnicos-content">
          <div className="content-header">
            <h2>Equipo de Técnicos</h2>
            <div className="header-actions">
              <input
                type="text"
                placeholder="Buscar técnico..."
                className="search-input"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button className="btn-primary" onClick={() => navigate('/admin/usuarios/nuevo')}>
                <i className="fas fa-plus me-2"></i>
                Nuevo Técnico
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

          {cargando ? (
            <div className="text-muted">Cargando técnicos...</div>
          ) : (
            <>
              <div className="tecnicos-stats">
                <div className="stat-card">
                  <h3>Total Técnicos</h3>
                  <p className="stat-number">{filtrados.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Activos</h3>
                  <p className="stat-number">
                    {filtrados.filter(t => t.activo).length}
                  </p>
                </div>
                <div className="stat-card">
                  <h3>Con especialidad</h3>
                  <p className="stat-number">
                    {filtrados.filter(t => (t.especialidad || '').trim() !== '').length}
                  </p>
                </div>
              </div>

              <div className="table-container">
                <table className="tecnicos-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Contacto</th>
                      <th>Especialidad</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className="tecnico-info">
                            <strong>{t.nombre}</strong>
                            <small>ID: {t.id}</small>
                          </div>
                        </td>
                        <td>
                          <div className="contacto-info">
                            <div>{t.email}</div>
                            <div>{t.telefono || '-'}</div>
                          </div>
                        </td>
                        <td>{t.especialidad || '-'}</td>
                        <td>
                          <span className={`badge ${t.activo ? 'activo' : 'inactivo'}`}>
                            {t.activo ? 'activo' : 'inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtrados.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">
                          No hay técnicos que coincidan con la búsqueda.
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
}
