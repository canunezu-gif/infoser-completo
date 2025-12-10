// src/pages/adminModeloPredictivo.js
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import { postForecast, fetchRawData } from '../api/ml';
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
import { Bar } from 'react-chartjs-2';

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

// Paleta simple alineada al look INFOSER (azules/grises)
const theme = {
  primary: '#0d6efd',
  primaryDark: '#0b5ed7',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
};

// Util para generar ids estables para filas
const uid = () => Math.random().toString(36).slice(2, 9);

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);

// Datos iniciales (los que usaste en Swagger)
const initialRows = [
  { id: uid(), date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4)), comuna: 'santiago', tipo_servicio: 'instalacion', count: 12 },
  { id: uid(), date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3)), comuna: 'santiago', tipo_servicio: 'instalacion', count: 9 },
  { id: uid(), date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)), comuna: 'maipu', tipo_servicio: 'reparacion', count: 5 },
  { id: uid(), date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)), comuna: 'maipu', tipo_servicio: 'reparacion', count: 7 },
];

export default function AdminModeloPredictivo() {
  const navigate = useNavigate();
  const [horizon, setHorizon] = useState(14);
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [daily, setDaily] = useState([]);        // [{date,total}]
  const [pairs, setPairs] = useState([]);        // [{comuna,tipo_servicio,next_days:[]}]
  const [touched, setTouched] = useState(false); // para validar al predecir

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 10 filas por página para que no sea tan largo

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = rows.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(rows.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const addRow = () => {
    setRows((r) => [
      ...r,
      { id: uid(), date: iso(today), comuna: '', tipo_servicio: '', count: 0 },
    ]);
  };

  const removeRow = (id) => {
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const clearAll = () => {
    setRows([{ id: uid(), date: iso(today), comuna: '', tipo_servicio: '', count: 0 }]);
    setDaily([]);
    setPairs([]);
    setError('');
    setTouched(false);
  };

  const loadRealData = async () => {
    if (!window.confirm('¿Cargar historial real de la base de datos? Esto reemplazará la tabla actual.')) return;

    setLoading(true);
    setError('');
    try {
      // 2. Traer datos
      const { rows: rawRows } = await fetchRawData('90-dias'); // Traer últimos 90 días

      if (!rawRows || rawRows.length === 0) {
        alert('No se encontraron solicitudes en los últimos 90 días.');
        setLoading(false);
        return;
      }

      // Agrupar por (fecha, comuna, tipo)
      const groups = {};

      for (const r of rawRows) {
        // r.fecha viene como string ISO o Date
        const d = new Date(r.fecha);
        const dateStr = iso(d);
        const comuna = (r.comuna || '').toLowerCase().trim();
        const tipo = (r.tipo_servicio || '').toLowerCase().trim();

        const key = `${dateStr}|${comuna}|${tipo}`;

        if (!groups[key]) {
          groups[key] = { date: dateStr, comuna, tipo_servicio: tipo, count: 0 };
        }
        groups[key].count += 1;
      }

      // Convertir a array para la tabla
      const newRows = Object.values(groups).map(g => ({
        id: uid(),
        ...g
      })).sort((a, b) => a.date.localeCompare(b.date));

      setRows(newRows);
      setDaily([]);
      setPairs([]);
      setRows(newRows);
      setDaily([]);
      setPairs([]);
      setTouched(false);
      setCurrentPage(1); // Resetear a página 1 al cargar nuevos datos

    } catch (err) {
      console.error(err);
      setError('Error cargando datos reales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: field === 'count' ? Number(value) || 0 : value } : r
      )
    );
  };

  // Validaciones simples
  const validation = useMemo(() => {
    const v = { ok: true, msg: '' };
    if (!Number.isInteger(Number(horizon)) || horizon < 1 || horizon > 30) {
      v.ok = false; v.msg = 'El horizonte debe estar entre 1 y 30 días.';
      return v;
    }
    if (!rows.length) {
      v.ok = false; v.msg = 'Debes ingresar al menos una fila de historial.';
      return v;
    }
    for (const [i, r] of rows.entries()) {
      if (!r.date) { v.ok = false; v.msg = `Fila ${i + 1}: fecha requerida.`; break; }
      if (!r.comuna?.trim()) { v.ok = false; v.msg = `Fila ${i + 1}: comuna requerida.`; break; }
      if (!r.tipo_servicio?.trim()) { v.ok = false; v.msg = `Fila ${i + 1}: tipo de servicio requerido.`; break; }
      if (!(Number(r.count) >= 0)) { v.ok = false; v.msg = `Fila ${i + 1}: count debe ser ≥ 0.`; break; }
    }
    return v;
  }, [horizon, rows]);

  const predict = async () => {
    setTouched(true);
    setError('');
    setDaily([]);
    setPairs([]);
    if (!validation.ok) {
      setError(validation.msg);
      return;
    }

    const payload = {
      horizon_days: Number(horizon),
      history: rows.map((r) => ({
        date: r.date, // ya en YYYY-MM-DD
        comuna: r.comuna.trim().toLowerCase(),
        tipo_servicio: r.tipo_servicio.trim().toLowerCase(),
        count: Number(r.count),
      })),
    };

    try {
      setLoading(true);
      const data = await postForecast(payload);

      console.log('Respuesta ML:', data);

      const dailyData = Array.isArray(data?.daily_forecast)
        ? data.daily_forecast
        : [];

      const pairData = Array.isArray(data?.pair_forecast)
        ? data.pair_forecast.map((p) => ({
          comuna: p?.comuna ?? '',
          tipo_servicio: p?.tipo_servicio ?? '',
          next_days: Array.isArray(p?.next_days) ? p.next_days : [],
        }))
        : [];

      setDaily(dailyData);
      setPairs(pairData);
    } catch (e) {
      console.error('Error en postForecast:', e);
      setError(e?.message || 'No se pudo obtener el pronóstico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-menu-container" style={{ color: theme.text }}>
      <header className="admin-menu-header" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="header-content">
          <div className="header-left">
            <button
              className="btn-volver"
              onClick={() => navigate('/admin/menu')}
              style={{ marginRight: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: theme.text }}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Volver
            </button>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
              <i className="fas fa-brain"></i>
              Pronóstico de Demanda
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
              style={{ marginLeft: 16 }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-menu-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
        <nav className="admin-menu-sidebar" style={{ width: 250, background: '#fff', borderRight: `1px solid ${theme.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/menu')}
            style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: theme.text }}
          >
            <i className="fas fa-home me-2"></i>
            Menú Principal
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/solicitudes')}
            style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: theme.text }}
          >
            <i className="fas fa-tools me-2"></i>
            📋 Solicitudes
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/clientes')}
            style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: theme.text }}
          >
            <i className="fas fa-users me-2"></i>
            👥 Clientes
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/tecnicos')}
            style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: theme.text }}
          >
            <i className="fas fa-user-cog me-2"></i>
            👨‍💻 Técnicos
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate('/admin/metricas')}
            style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: theme.text }}
          >
            <i className="fas fa-chart-line me-2"></i>
            📈 Métricas
          </button>
          <button
            className="sidebar-btn active"
            style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: '#e0f2fe', color: '#0284c7', textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}
          >
            <i className="fas fa-brain me-2"></i>
            🔮 Modelo Predictivo
          </button>
        </nav>

        <main className="admin-menu-content" style={{ flex: 1, padding: 24, background: '#f8fafc' }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: theme.muted }}>
              Ingresa el <strong>historial</strong> por <em>comuna</em> y <em>tipo de servicio</em>,
              y define el <strong>horizonte</strong>. El modelo devolverá el total diario y la predicción por par.
            </p>
          </div>

          {/* Card del formulario */}
          <div
            className="menu-card"
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              boxShadow: '0 8px 24px rgba(2,6,23,0.06)',
              borderRadius: 16,
              padding: 18,
              marginBottom: 24
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <label htmlFor="horizon"><strong>Horizonte (días)</strong></label>
              <input
                id="horizon"
                type="number"
                min={1}
                max={30}
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                style={{ width: 120, padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 8 }}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
              <div style={{ flex: 1 }} />

              <button
                type="button"
                onClick={loadRealData}
                className="logout-btn"
                style={{ background: '#198754', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}
                disabled={loading}
              >
                <i className="fas fa-database me-2"></i>
                Cargar Datos Reales
              </button>

              <button
                type="button"
                onClick={addRow}
                className="logout-btn"
                style={{ background: theme.primary, border: 'none', color: '#fff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}
              >
                + Agregar fila
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="logout-btn"
                style={{ background: '#adb5bd', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={predict}
                className="logout-btn"
                style={{ background: theme.primaryDark, border: 'none', color: '#fff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Calculando…' : 'Predecir'}
              </button>
            </div>

            {/* Tabla editable */}
            <div style={{
              overflowX: 'auto',
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
            }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#0f172a' }}>
                    <th className="pxy">Fecha (YYYY-MM-DD)</th>
                    <th className="pxy">Comuna</th>
                    <th className="pxy">Tipo de servicio</th>
                    <th className="pxy">Count</th>
                    <th className="pxy" style={{ width: 120, textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((r, idx) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td className="pxy">
                        <input
                          type="date"
                          value={r.date}
                          onChange={(e) => updateRow(r.id, 'date', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 8 }}
                        />
                      </td>
                      <td className="pxy">
                        <input
                          type="text"
                          placeholder="santiago"
                          value={r.comuna}
                          onChange={(e) => updateRow(r.id, 'comuna', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 8 }}
                        />
                      </td>
                      <td className="pxy">
                        <input
                          type="text"
                          placeholder="instalacion / reparacion…"
                          value={r.tipo_servicio}
                          onChange={(e) => updateRow(r.id, 'tipo_servicio', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 8 }}
                        />
                      </td>
                      <td className="pxy">
                        <input
                          type="number"
                          min={0}
                          value={r.count}
                          onChange={(e) => updateRow(r.id, 'count', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 8 }}
                        />
                      </td>
                      <td className="pxy" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeRow(r.id)}
                          className="logout-btn"
                          style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}
                          disabled={rows.length === 1}
                          title={rows.length === 1 ? 'Debe quedar al menos una fila' : 'Eliminar fila'}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Pie con indicación */}
                  <tr>
                    <td colSpan={5} style={{ padding: '10px 14px', color: theme.muted }}>
                      Tip: usa valores en minúsculas para <em>comuna</em> y <em>tipo_servicio</em>, p. ej. “santiago”, “instalacion”.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '20px' }}>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="logout-btn"
                  style={{ background: currentPage === 1 ? '#e5e7eb' : theme.surface, border: `1px solid ${theme.border}`, color: theme.text, padding: '5px 10px', borderRadius: 4, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Anterior
                </button>

                <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="logout-btn"
                  style={{ background: currentPage === totalPages ? '#e5e7eb' : theme.surface, border: `1px solid ${theme.border}`, color: theme.text, padding: '5px 10px', borderRadius: 4, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Siguiente
                </button>
              </div>
            )}

            {touched && !validation.ok && (
              <div style={{ color: '#b91c1c', marginTop: 12 }}>
                {validation.msg}
              </div>
            )}
            {error && (
              <div style={{ color: '#b91c1c', marginTop: 12 }}>
                {error}
              </div>
            )}
          </div>

          {/* Resultados */}
          {/* Pair forecast grouped by Service Type */}
          {pairs.length > 0 && (
            <>
              <h4 style={{ color: theme.muted, margin: '24px 0 16px' }}>
                Proyección por Tipo de Servicio
              </h4>

              {/* Generate charts for each Service Type */}
              {(() => {
                // 1. Group by Service Type (and prioritize)
                const byService = {};
                pairs.forEach(p => {
                  const s = p.tipo_servicio || 'Otros';
                  if (!byService[s]) byService[s] = [];
                  byService[s].push(p);
                });

                // 2. Render a Chart for each service group
                return Object.entries(byService).map(([serviceName, groupPairs]) => {
                  // Prepare Labels (Real Dates starting from Tomorrow)
                  const daysCount = groupPairs[0]?.next_days?.length || 0;

                  const labels = Array.from({ length: daysCount }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i + 1);
                    // Format: "Lun 12/05"
                    const weekday = d.toLocaleDateString('es-CL', { weekday: 'short' });
                    const dayMonth = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'numeric' });
                    return `${weekday} ${dayMonth}`;
                  });

                  // Colors for different comunas (simple rotation)
                  const colors = [
                    '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545',
                    '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'
                  ];

                  const data = {
                    labels,
                    datasets: groupPairs.map((p, idx) => ({
                      label: p.comuna || 'General',
                      data: p.next_days,
                      backgroundColor: colors[idx % colors.length],
                      borderRadius: 4,
                    })),
                  };

                  const options = {
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: `Pronóstico: ${serviceName.toUpperCase()}` },
                    },
                    scales: {
                      y: { beginAtZero: true, title: { display: true, text: 'Solicitudes estimadas' } }
                    }
                  };

                  return (
                    <div key={serviceName} className="menu-card" style={{ marginBottom: 24, padding: 16, border: `1px solid ${theme.border}`, borderRadius: 12 }}>
                      <Bar data={data} options={options} />
                    </div>
                  );
                });
              })()}
            </>
          )}
        </main>
      </div>

      {/* Estilos mínimos locales para padding de celdas */}
      < style > {`
        .pxy { padding: 10px 14px; text-align: left; }
        .sidebar-btn:hover { background-color: #f1f5f9 !important; }
      `}</style >
    </div >
  );
}
