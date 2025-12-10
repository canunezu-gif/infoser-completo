// frontend/src/pages/adminMetricas.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminMetricas.css';
import { api } from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminMetricas = () => {
  const navigate = useNavigate();

  // Filtros
  const [filtroTiempo, setFiltroTiempo] = useState('30-dias');
  const [filtroComuna, setFiltroComuna] = useState('todas');
  const [filtroServicio, setFiltroServicio] = useState('todos');

  // Estado de carga / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos que vienen del backend
  const [kpis, setKpis] = useState({
    totalSolicitudes: 0,
    completadas: 0,
    pendientes: 0,
    enProgreso: 0,
  });

  const [porDia, setPorDia] = useState([]); // vista_solicitudes_por_dia
  const [rendimiento, setRendimiento] = useState([]); // vista_rendimiento_tecnicos
  const [recientes, setRecientes] = useState([]); // vista_solicitudes_recientes

  // NUEVO: datos crudos para filtrar en cliente (sin PII)
  const [raw, setRaw] = useState([]);

  // Cargar métricas desde el backend
  const cargarMetricas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Pedimos dashboard (global) + crudo (para filtrar en front)
      const [dataDash, dataRaw] = await Promise.all([
        api.get('/metricas/dashboard', {
          auth: true,
          query: {
            rango: filtroTiempo,
            comuna: filtroComuna === 'todas' ? '' : filtroComuna,
            tipo_servicio: filtroServicio === 'todos' ? '' : filtroServicio,
          },
        }),
        api.get('/metricas/raw-solicitudes', {
          auth: true,
          query: { rango: filtroTiempo },
        }),
      ]);

      const dashboard = dataDash.dashboard || {};

      setKpis({
        totalSolicitudes: dashboard.total_solicitudes || 0,
        completadas: dashboard.completadas || 0,
        pendientes: dashboard.pendientes || 0,
        enProgreso: dashboard.en_progreso || 0,
      });

      setPorDia(dataDash.solicitudes_por_dia || []);
      setRendimiento(dataDash.rendimiento_tecnicos || []);
      setRecientes(dataDash.solicitudes_recientes || []);

      // Guardamos el crudo
      setRaw(dataRaw.rows || []);
    } catch (err) {
      console.error('Error cargando métricas:', err);
      setError(err.message || 'Error obteniendo métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMetricas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrado local (client-side) sobre "raw"
  const filtradas = React.useMemo(() => {
    const c = filtroComuna === 'todas' ? '' : (filtroComuna || '').toLowerCase();
    const s = filtroServicio === 'todos' ? '' : (filtroServicio || '');
    return (raw || []).filter(r => (c ? r.comuna === c : true) && (s ? r.tipo_servicio === s : true));
  }, [raw, filtroComuna, filtroServicio]);

  // Serie por día filtrada (para el gráfico de evolución)
  const porDiaFiltrado = React.useMemo(() => {
    const map = new Map();
    for (const r of filtradas) {
      if (!map.has(r.fecha)) map.set(r.fecha, { fecha: r.fecha, total_solicitudes: 0, completadas: 0 });
      const o = map.get(r.fecha);
      o.total_solicitudes++;
      if (r.estado === 'completada') o.completadas++;
    }
    return Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [filtradas]);

  const solicitudesAbiertas = kpis.pendientes + kpis.enProgreso;

  // --- Configuración de Gráficos ---

  // 1. Gráfico de Líneas (Evolución)
  const lineChartData = {
    labels: porDiaFiltrado.map(d => d.fecha),
    datasets: [
      {
        label: 'Solicitudes Totales',
        data: porDiaFiltrado.map(d => d.total_solicitudes),
        borderColor: '#3182ce', // accent-blue
        backgroundColor: 'rgba(49, 130, 206, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Completadas',
        data: porDiaFiltrado.map(d => d.completadas),
        borderColor: '#38a169', // success
        backgroundColor: 'rgba(56, 161, 105, 0.0)',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 3,
      }
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: { family: "'Segoe UI', sans-serif", size: 12 }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#2d3748',
        bodyColor: '#4a5568',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f7fafc' },
        ticks: { font: { size: 11 }, color: '#718096' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#718096', maxRotation: 45, minRotation: 45 }
      }
    }
  };

  // 2. Gráfico de Barras Horizontal (Técnicos)
  const barChartData = {
    labels: rendimiento.map(t => t.tecnico_nombre),
    datasets: [
      {
        label: 'Completadas',
        data: rendimiento.map(t => t.completadas),
        backgroundColor: '#38a169',
        borderRadius: 4,
        barPercentage: 0.7,
      },
      {
        label: 'Total Asignadas',
        data: rendimiento.map(t => t.total_solicitudes),
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        barPercentage: 0.7,
        // Hacemos que las barras se superpongan un poco visualmente si se desea, 
        // pero Chart.js por defecto las pone al lado o apiladas. 
        // Para "progreso", mejor dejarlas agrupadas o usar un truco de stack si se quiere.
        // Aquí las dejaremos agrupadas para comparar.
      }
    ]
  };

  const barChartOptions = {
    indexAxis: 'y', // Horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#2d3748',
        bodyColor: '#4a5568',
        borderColor: '#e2e8f0',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#f7fafc' }
      },
      y: {
        grid: { display: false }
      }
    }
  };

  // Helper para status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completada': return <span className="badge badge-success">Completada</span>;
      case 'en_proceso': return <span className="badge badge-warning">En Progreso</span>;
      case 'asignada': return <span className="badge badge-info">Asignada</span>;
      case 'pendiente': return <span className="badge badge-danger">Pendiente</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="admin-metricas-container">
      <header className="admin-metricas-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="btn-volver"
              onClick={() => navigate('/admin/menu')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Volver
            </button>
            <h1>
              <i className="fas fa-chart-pie me-2"></i>
              Dashboard Administrativo
            </h1>
          </div>
          <div className="header-actions">
            <div className="admin-info">
              <span className="admin-badge">Admin</span>
              <button
                className="logout-btn"
                onClick={() => (window.location.href = '/')}
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-metricas-layout">
        <nav className="admin-metricas-sidebar">
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
          <button className="sidebar-btn active">
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

        <main className="admin-metricas-content">
          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Barra de Filtros */}
          <div className="filters-bar">
            <div className="filter-group">
              <label><i className="far fa-calendar-alt me-1"></i> Período:</label>
              <select
                value={filtroTiempo}
                onChange={(e) => setFiltroTiempo(e.target.value)}
                className="filter-select"
              >
                <option value="7-dias">Últimos 7 días</option>
                <option value="30-dias">Últimos 30 días</option>
                <option value="90-dias">Últimos 3 meses</option>
                <option value="este-año">Este año</option>
              </select>
            </div>

            <div className="filter-group">
              <label><i className="fas fa-map-marker-alt me-1"></i> Comuna:</label>
              <select
                value={filtroComuna}
                onChange={(e) => setFiltroComuna(e.target.value)}
                className="filter-select"
              >
                <option value="todas">Todas</option>
                <option value="melipilla">Melipilla</option>
                <option value="santiago">Santiago</option>
                <option value="providencia">Providencia</option>
              </select>
            </div>

            <div className="filter-group">
              <label><i className="fas fa-tools me-1"></i> Servicio:</label>
              <select
                value={filtroServicio}
                onChange={(e) => setFiltroServicio(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todos</option>
                <option value="instalacion">Instalación</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="reparacion">Reparación</option>
              </select>
            </div>

            <button
              className="btn-refresh"
              onClick={cargarMetricas}
              disabled={loading}
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>

          {/* KPIs Cards */}
          <div className="kpis-grid">
            <div className="kpi-card primary">
              <div className="kpi-icon-wrapper">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <div className="kpi-data">
                <h3>{kpis.totalSolicitudes}</h3>
                <p>Solicitudes Totales</p>
              </div>
            </div>

            <div className="kpi-card success">
              <div className="kpi-icon-wrapper">
                <i className="fas fa-check-double"></i>
              </div>
              <div className="kpi-data">
                <h3>{kpis.completadas}</h3>
                <p>Completadas</p>
              </div>
            </div>

            <div className="kpi-card warning">
              <div className="kpi-icon-wrapper">
                <i className="fas fa-clock"></i>
              </div>
              <div className="kpi-data">
                <h3>{solicitudesAbiertas}</h3>
                <p>En Curso / Pendientes</p>
              </div>
            </div>

            {/* KPI Extra: Tasa de éxito (ejemplo) */}
            <div className="kpi-card info">
              <div className="kpi-icon-wrapper">
                <i className="fas fa-percentage"></i>
              </div>
              <div className="kpi-data">
                <h3>
                  {kpis.totalSolicitudes > 0
                    ? Math.round((kpis.completadas / kpis.totalSolicitudes) * 100)
                    : 0}%
                </h3>
                <p>Tasa de Finalización</p>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="charts-grid">
            {/* Gráfico Lineal */}
            <div className="chart-container main-chart">
              <div className="chart-header-simple">
                <h5>Evolución de Solicitudes</h5>
              </div>
              <div className="chart-canvas-wrapper" style={{ height: '300px' }}>
                {porDiaFiltrado.length > 0 ? (
                  <Line data={lineChartData} options={lineChartOptions} />
                ) : (
                  <div className="no-data">Sin datos para mostrar</div>
                )}
              </div>
            </div>

            {/* Gráfico Barras */}
            <div className="chart-container side-chart">
              <div className="chart-header-simple">
                <h5>Rendimiento Técnico</h5>
              </div>
              <div className="chart-canvas-wrapper" style={{ height: '300px' }}>
                {rendimiento.length > 0 ? (
                  <Bar data={barChartData} options={barChartOptions} />
                ) : (
                  <div className="no-data">Sin datos de técnicos</div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla Recientes */}
          <div className="recent-table-container">
            <div className="table-header">
              <h5>Últimas Solicitudes</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.length > 0 ? (
                    recientes.map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td>{s.titulo}</td>
                        <td>{getStatusBadge(s.estado_actual)}</td>
                        <td>{new Date(s.fecha_creacion).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-3">No hay solicitudes recientes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminMetricas;
