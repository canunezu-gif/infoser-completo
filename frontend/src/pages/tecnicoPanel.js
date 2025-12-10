// frontend/src/pages/TecnicoPanel.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/tecnicoPanel.css';
import { api } from '../utils/api.js';

// Estados base conocidos; el resto se sumará dinámicamente desde la BD
const ESTADOS_BASE = [
  'pendiente',
  'en_revision',
  'asignada',
  'en_proceso', // alias visual de en_progreso
  'completada',
  'cancelada',
];

export default function TecnicoPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [guardandoId, setGuardandoId] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('userData') || 'null');
    const token = localStorage.getItem('authToken');
    if (!u || !token || u.rol !== 'tecnico') {
      navigate('/login');
      return;
    }
    setUser(u);
  }, [navigate]);

  const cargarAsignadas = async () => {
    try {
      setCargando(true);
      setError('');
      const { solicitudes } = await api.get('/api/solicitudes/asignadas');
      setSolicitudes(solicitudes || []);
    } catch (e) {
      setError(
        e.message || 'No se pudieron cargar las solicitudes asignadas'
      );
      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (user) cargarAsignadas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Estados disponibles = base + los que vengan desde la BD
  const estadosDisponibles = useMemo(() => {
    const fromData = Array.from(
      new Set(
        solicitudes
          .map((s) => (s.estado_actual || '').trim())
          .filter(Boolean)
      )
    );
    return Array.from(new Set([...ESTADOS_BASE, ...fromData]));
  }, [solicitudes]);

  const actualizarEstado = async (sol, nuevoEstado) => {
    if (nuevoEstado === sol.estado_actual) return;
    try {
      setGuardandoId(sol.id);
      const res = await api.put(`/api/solicitudes/${sol.id}`, {
        estado_actual: nuevoEstado,
        tecnico_id: sol.tecnico_id ?? user?.id ?? null,
      });
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === sol.id ? { ...s, ...res.solicitud } : s))
      );
    } catch (e) {
      setError(e.message || 'No se pudo actualizar el estado');
    } finally {
      setGuardandoId(null);
    }
  };

  const fmtFecha = (iso) => {
    try {
      return new Date(iso).toLocaleString('es-CL');
    } catch {
      return iso || '';
    }
  };

  const solicitudesFiltradas = useMemo(() => {
    if (filtroEstado === 'todas') return solicitudes;
    return solicitudes.filter(
      (s) => (s.estado_actual || 'pendiente') === filtroEstado
    );
  }, [solicitudes, filtroEstado]);

  const asignadas = solicitudes.length;
  const enProceso = solicitudes.filter(
    (s) => s.estado_actual === 'en_proceso'
  ).length;
  const completadas = solicitudes.filter(
    (s) => s.estado_actual === 'completada'
  ).length;

  if (!user) return null;

  return (
    <div className="tecnico-container">
      <header className="tecnico-header">
        <div className="header-content">
          <div className="header-left">
            <button className="btn-volver" onClick={() => navigate('/')}>
              <i className="fas fa-arrow-left me-2"></i>
              Volver al Inicio
            </button>
            <h1>
              <i className="fas fa-user-cog"></i> Panel Técnico - INFOSER
            </h1>
          </div>
          <div className="header-info">
            <span className="user-info">
              <i className="fas fa-user me-2"></i>
              {user?.nombre || user?.email}
            </span>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                navigate('/login');
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i> Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="tecnico-layout">
        <nav className="tecnico-sidebar">
          <div className="perfil-card">
            <div className="tecnico-avatar">
              <i className="fas fa-user-cog"></i>
            </div>
            <div className="tecnico-info">
              <h4>{user?.nombre || 'Técnico'}</h4>
              <p className="especialidad">
                {user?.especialidad || 'Técnico de campo'}
              </p>
              <div className="estado-badge disponible">Disponible</div>
            </div>
            <div className="estadisticas">
              <div className="stat-item">
                <div className="stat-number">{asignadas}</div>
                <div className="stat-label">Asignadas</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{enProceso}</div>
                <div className="stat-label">En Proceso</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{completadas}</div>
                <div className="stat-label stat-label-completadas">
                  Completadas
                </div>
              </div>
            </div>
          </div>

          <div className="filtros-card">
            <h5>Filtros</h5>
            <div className="filtros-list">
              <button
                className={`filtro-btn ${
                  filtroEstado === 'todas' ? 'active' : ''
                }`}
                onClick={() => setFiltroEstado('todas')}
              >
                todas
              </button>
              {estadosDisponibles.map((op) => (
                <button
                  key={op}
                  className={`filtro-btn ${
                    filtroEstado === op ? 'active' : ''
                  }`}
                  onClick={() => setFiltroEstado(op)}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="tecnico-content">
          <div className="content-header">
            <div className="header-text">
              <h2>Mis Solicitudes Asignadas</h2>
              <p>Gestiona tus servicios asignados</p>
            </div>
            <div className="header-actions">
              <button
                className="btn-primary"
                onClick={cargarAsignadas}
                disabled={cargando}
              >
                <i className="fas fa-sync-alt me-2"></i>
                {cargando ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {cargando ? (
            <div className="text-muted">Cargando…</div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="alert alert-info">
              No tienes solicitudes asignadas.
            </div>
          ) : (
            <div className="solicitudes-grid">
              {solicitudesFiltradas.map((s) => (
                <div key={s.id} className="solicitud-card">
                  <div className="solicitud-header">
                    <div className="solicitud-estado">
                      <span
                        className={`estado-badge ${
                          s.estado_actual || 'pendiente'
                        }`}
                      >
                        {s.estado_actual?.replace('_', ' ') || 'pendiente'}
                      </span>
                      <span className="solicitud-id">#{s.id}</span>
                    </div>
                    <div className="solicitud-prioridad">
                      <span
                        className={`prioridad-badge ${s.prioridad || 'media'}`}
                      >
                        {s.prioridad || 'media'}
                      </span>
                    </div>
                  </div>

                  <div className="solicitud-body">
                    <h4 className="solicitud-titulo">{s.titulo}</h4>

                    <div className="cliente-info">
                      <div className="info-item">
                        <i className="fas fa-user"></i>
                        <strong>{s.cliente_nombre || '-'}</strong>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-envelope"></i>
                        {s.cliente_email || ''}
                      </div>
                      <div className="info-item">
                        <i className="fas fa-map-marker-alt"></i>
                        {s.direccion_servicio || ''}
                        {s.comuna ? `, ${s.comuna}` : ''}
                        {s.region ? `, ${s.region}` : ''}
                      </div>
                    </div>

                    <p className="solicitud-descripcion">
                      {s.descripcion}
                    </p>

                    <div className="solicitud-meta">
                      <div className="meta-item">
                        <i className="fas fa-calendar"></i>
                        <span>
                          Solicitada: {fmtFecha(s.fecha_solicitud)}
                          {s.fecha_actualizacion
                            ? ` • Actualizada: ${fmtFecha(
                                s.fecha_actualizacion
                              )}`
                            : ''}
                        </span>
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-tools"></i>
                        <span>{s.tipo_servicio}</span>
                      </div>
                    </div>

                    <div className="solicitud-actions">
                      <select
                        className="select-estado"
                        value={s.estado_actual || 'pendiente'}
                        onChange={(e) => actualizarEstado(s, e.target.value)}
                        disabled={guardandoId === s.id}
                      >
                        {estadosDisponibles.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          alert(
                            `#${s.id}\nCliente: ${
                              s.cliente_nombre || '-'
                            }\nEmail: ${
                              s.cliente_email || ''
                            }\nDirección: ${s.direccion_servicio || ''}, ${
                              s.comuna || ''
                            }, ${
                              s.region || ''
                            }\n\nDescripción:\n${s.descripcion || ''}`
                          )
                        }
                      >
                        <i className="fas fa-eye me-2"></i>Detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
