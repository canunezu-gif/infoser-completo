// frontend/src/pages/adminSolicitudes.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminSolicitudes.css';
import { api } from '../utils/api.js';

// Estados base; el resto se sumará dinámicamente desde la BD
const ESTADOS_BASE = [
  'pendiente',
  'en_revision',
  'asignada',
  'en_proceso',
  'completada',
  'cancelada',
];

// Normalizador de estados: siempre minúscula y con _
const normalizarEstado = (s) =>
  (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

// Cómo mostrar el estado en texto bonito
const labelEstado = (s) => {
  const norm = normalizarEstado(s);
  if (!norm) return '-';
  const texto = norm.replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export default function AdminSolicitudes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Mostrar 20 por página

  // Guard de ruta (solo admin)
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('userData') || 'null');
    const token = localStorage.getItem('authToken');
    if (!u || !token || (u.rol !== 'administrador' && u.rol !== 'admin')) {
      navigate('/login');
      return;
    }
    setUser(u);
  }, [navigate]);

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [sol, tec] = await Promise.all([
        api.get('/api/solicitudes'),
        api.get('/api/tecnicos'),
      ]);
      setSolicitudes(sol.solicitudes || []);
      setTecnicos(tec.tecnicos || []);
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // Estados disponibles: base + lo que exista en la BD, todos normalizados y sin duplicados
  const estadosDisponibles = useMemo(() => {
    const base = ESTADOS_BASE.map(normalizarEstado);
    const fromData = solicitudes
      .map((s) => normalizarEstado(s.estado_actual))
      .filter(Boolean);
    return Array.from(new Set([...base, ...fromData]));
  }, [solicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return solicitudes;
    return solicitudes.filter((s) =>
      [
        s.titulo,
        s.descripcion,
        s.comuna,
        s.region,
        s.tipo_servicio,
        s.estado_actual,
        s?.cliente_nombre,
        s?.cliente_email,
        s?.tecnico_nombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [filtro, solicitudes]);

  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro]);

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = solicitudesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(solicitudesFiltradas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const actualizarSolicitud = async (id, payload) => {
    try {
      if (!id || Number.isNaN(Number(id))) {
        alert('ID de solicitud inválido');
        return;
      }

      const body = {
        ...payload,
        tecnico_id:
          payload.tecnico_id === '' || payload.tecnico_id === undefined
            ? null
            : Number(payload.tecnico_id),
      };

      setGuardando(id);
      const res = await api.put(`/api/solicitudes/${id}`, body);
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...res.solicitud } : s))
      );
    } catch (err) {
      console.error('Error PUT /api/solicitudes/:id', err);
      alert(err.message || 'Error al actualizar la solicitud');
    } finally {
      setGuardando(null);
    }
  };

  const handleCambioEstado = (sol, nuevoEstadoRaw) => {
    const nuevoEstado = normalizarEstado(nuevoEstadoRaw);
    const estadoActualNorm = normalizarEstado(sol.estado_actual);

    if (nuevoEstado === estadoActualNorm) return;

    actualizarSolicitud(sol.id, {
      estado_actual: nuevoEstado,
      tecnico_id: sol.tecnico_id ?? null,
    });
  };

  // Enviar/Asignar a técnico (ruta nueva PATCH)
  const enviarATecnico = async (solicitudId, tecnicoId) => {
    try {
      setGuardando(solicitudId);
      const res = await api.patch(
        `/api/solicitudes/${solicitudId}/enviar-a-tecnico`,
        { tecnico_id: Number(tecnicoId) }
      );
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === solicitudId ? { ...s, ...res.solicitud } : s
        )
      );
    } catch (e) {
      console.error('Error PATCH enviar-a-tecnico', e);
      alert(e.message || 'Error al enviar al técnico');
    } finally {
      setGuardando(null);
    }
  };

  const handleAsignarTecnico = (sol, tecnicoId) => {
    if (!tecnicoId) {
      return actualizarSolicitud(sol.id, { tecnico_id: null });
    }
    enviarATecnico(sol.id, tecnicoId);
  };

  const fmtFecha = (iso) => {
    try {
      return new Date(iso).toLocaleString('es-CL');
    } catch {
      return iso || '';
    }
  };

  // Stats (usamos las filtradas)
  const total = solicitudesFiltradas.length;
  const pendientes = solicitudesFiltradas.filter(
    (s) => normalizarEstado(s.estado_actual || 'pendiente') === 'pendiente'
  ).length;
  const enProceso = solicitudesFiltradas.filter(
    (s) => normalizarEstado(s.estado_actual) === 'en_proceso'
  ).length;
  const completadas = solicitudesFiltradas.filter(
    (s) => normalizarEstado(s.estado_actual) === 'completada'
  ).length;

  if (!user) return null;

  return (
    <div className="admin-solicitudes-container">
      <header className="admin-solicitudes-header">
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
              <i className="fas fa-list-check"></i>
              Gestión de Solicitudes - INFOSER & EP SPA
            </h1>
          </div>
          <div className="admin-info">
            <span>Admin: {user?.nombre || user?.email}</span>
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

      <div className="admin-solicitudes-layout">
        <nav className="admin-solicitudes-sidebar">
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/menu')}
          >
            <i className="fas fa-home"></i>
            Menú Principal
          </button>
          <button className="sidebar-btn active">
            <i className="fas fa-tools"></i>
            📋 Solicitudes
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/clientes')}
          >
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

        <main className="admin-solicitudes-content">
          {/* Header del contenido */}
          <div className="content-header">
            <h2>Gestión de Solicitudes</h2>
            <div className="header-actions">
              <input
                className="search-input"
                placeholder="Buscar por título, cliente, comuna, estado..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={cargarTodo}
                disabled={cargando}
              >
                <i className="fas fa-sync-alt me-2"></i>
                {cargando ? 'Actualizando...' : 'Actualizar'}
              </button>
              <span className="text-muted small-resumen">
                {total} de {solicitudes.length}
              </span>
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
            <div className="text-muted">Cargando solicitudes...</div>
          ) : (
            <>
              {/* Tarjetas de estadísticas */}
              <div className="solicitudes-stats">
                <div className="stat-card">
                  <h3>Total Solicitudes</h3>
                  <p className="stat-number">{total}</p>
                </div>
                <div className="stat-card">
                  <h3>Pendientes</h3>
                  <p className="stat-number warning">{pendientes}</p>
                </div>
                <div className="stat-card">
                  <h3>En Proceso</h3>
                  <p className="stat-number info">{enProceso}</p>
                </div>
                <div className="stat-card">
                  <h3>Completadas</h3>
                  <p className="stat-number success">{completadas}</p>
                </div>
              </div>

              {/* Tabla principal */}
              <div className="table-container">
                <table className="solicitudes-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      <th>Título</th>
                      <th>Cliente</th>
                      <th>Ubicación</th>
                      <th>Tipo</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Técnico</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((s) => {
                      const estadoNorm = normalizarEstado(
                        s.estado_actual || 'pendiente'
                      );
                      return (
                        <tr key={s.id}>
                          <td className="col-id">{s.id}</td>

                          <td className="col-fecha">
                            <div className="small-fecha">
                              {fmtFecha(s.fecha_solicitud)}
                            </div>
                          </td>

                          <td className="col-titulo">
                            <div className="titulo-principal">
                              {s.titulo}
                            </div>
                            <div className="titulo-descripcion">
                              {s.descripcion}
                            </div>
                          </td>

                          <td className="col-cliente">
                            <div className="cliente-nombre">
                              {s.cliente_nombre || '-'}
                            </div>
                            <div className="cliente-email">
                              {s.cliente_email || ''}
                            </div>
                          </td>

                          <td className="col-ubicacion">
                            <div>{s.comuna || '-'}</div>
                            <div className="ubicacion-region">
                              {s.region || ''}
                            </div>
                          </td>

                          <td className="col-tipo">
                            {s.tipo_servicio || '-'}
                          </td>

                          <td className="col-prioridad">
                            <span
                              className={
                                'badge-prioridad ' +
                                (s.prioridad || 'media')
                              }
                            >
                              {s.prioridad || 'media'}
                            </span>
                          </td>

                          <td className="col-estado">
                            <span
                              className={
                                'estado-tag ' + estadoNorm
                              }
                            >
                              {labelEstado(estadoNorm)}
                            </span>
                            <select
                              className="estado-select"
                              value={estadoNorm}
                              onChange={(e) =>
                                handleCambioEstado(s, e.target.value)
                              }
                              disabled={guardando === s.id}
                            >
                              {estadosDisponibles.map((st) => (
                                <option key={st} value={st}>
                                  {labelEstado(st)}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="col-tecnico">
                            <div className="tecnico-asignacion">
                              <select
                                className="tecnico-select"
                                value={s.tecnico_id || ''}
                                onChange={(e) =>
                                  handleAsignarTecnico(s, e.target.value)
                                }
                                disabled={guardando === s.id}
                              >
                                <option value="">
                                  — Sin asignar —
                                </option>
                                {tecnicos.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.nombre} ({t.email})
                                  </option>
                                ))}
                              </select>
                              <button
                                className="btn-small btn-info"
                                onClick={() =>
                                  s.tecnico_id &&
                                  enviarATecnico(s.id, s.tecnico_id)
                                }
                                disabled={!s.tecnico_id || guardando === s.id}
                                title="Reenviar al técnico"
                              >
                                <i className="fas fa-paper-plane"></i>
                              </button>
                            </div>
                            {s.tecnico_nombre && (
                              <div className="asignado-text">
                                Asignado: {s.tecnico_nombre}
                              </div>
                            )}
                          </td>

                          <td className="col-detalle">
                            <button
                              className="btn-small btn-outline"
                              disabled
                              title="(Futuro) Ver detalle completo"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {solicitudesFiltradas.length === 0 && (
                      <tr>
                        <td colSpan="10" className="sin-datos">
                          No hay solicitudes que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Controles de Paginación */}
              {totalPages > 1 && (
                <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '20px', paddingBottom: '20px' }}>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn-pagination"
                    style={{ padding: '5px 10px', border: '1px solid #ddd', background: currentPage === 1 ? '#f0f0f0' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`btn-pagination ${currentPage === i + 1 ? 'active' : ''}`}
                      style={{
                        padding: '5px 10px',
                        border: '1px solid #ddd',
                        background: currentPage === i + 1 ? '#007bff' : 'white',
                        color: currentPage === i + 1 ? 'white' : 'black',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn-pagination"
                    style={{ padding: '5px 10px', border: '1px solid #ddd', background: currentPage === totalPages ? '#f0f0f0' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
