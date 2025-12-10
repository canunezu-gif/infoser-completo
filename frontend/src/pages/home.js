// src/pages/home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/home.css';
import { api } from '../utils/api.js';

const Home = () => {
  const [cliente, setCliente] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    titulo: '',
    descripcion: '',
    direccion_servicio: '',
    comuna: '',
    region: 'Región Metropolitana',
    tipo_servicio: 'instalacion',
    prioridad: 'media',
    equipos_solicitados: '',
    comentarios_finales: ''
  });
  const [mostrarSolicitudes, setMostrarSolicitudes] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const comunasRM = [
    'Melipilla', 'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'La Reina',
    'Macul', 'Peñalolén', 'La Florida', 'Puente Alto', 'San Bernardo',
    'Maipú', 'Cerrillos', 'Quilicura', 'Recoleta', 'Independencia', 'Conchalí',
    'Renca', 'Quinta Normal', 'Lo Prado', 'Pudahuel', 'Cerro Navia', 'Lo Espejo',
    'Pedro Aguirre Cerda', 'San Miguel', 'San Joaquín', 'La Granja', 'La Pintana',
    'El Bosque', 'San Ramón', 'Lo Barnechea', 'Vitacura', 'Huechuraba', 'Colina',
    'Lampa', 'Til Til', 'San José de Maipo', 'Pirque', 'Talagante'
  ];

  const tiposServicio = [
    { value: 'instalacion', label: 'Instalación' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'asesoria', label: 'Asesoría' }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' }
  ];

  // Cargar cliente y sus solicitudes al montar
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');
    const clienteActual = JSON.parse(localStorage.getItem('clienteActual') || 'null');
    const isCliente = (userData?.rol === 'cliente') || !!clienteActual;

    const c = clienteActual || (isCliente ? userData : null);
    if (!c) return;

    setCliente(c);
    cargarSolicitudes(c.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar solicitudes al entrar a la vista
  useEffect(() => {
    if (cliente && mostrarSolicitudes) {
      cargarSolicitudes(cliente.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarSolicitudes]);

  const cargarSolicitudes = async (clienteId) => {
    setError('');
    setCargando(true);
    try {
      console.log('Cargando solicitudes para cliente:', clienteId);
      const data = await api.get(`/api/solicitudes/cliente/${clienteId}`);
      console.log('Respuesta solicitudes:', data);
      if (data && Array.isArray(data.solicitudes)) {
        setSolicitudes(data.solicitudes);
      } else {
        console.warn('Formato inesperado de solicitudes:', data);
        setSolicitudes([]);
      }
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
      setError(err.message || 'No se pudieron cargar las solicitudes');
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clienteActual');
    localStorage.removeItem('clienteLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setCliente(null);
    setSolicitudes([]);
    setMostrarFormulario(false);
    window.location.reload();
  };

  const handleVerSolicitudes = () => {
    if (!cliente) {
      navigate('/login');
    } else {
      setMostrarSolicitudes(true);
      setMostrarFormulario(false);
    }
  };

  const handleSolicitarServicio = () => {
    if (!cliente) {
      navigate('/login');
    } else {
      setMostrarFormulario(true);
      setMostrarSolicitudes(false);
    }
  };

  // ... (existing code)

  // ======= VISTA MIS SOLICITUDES =======
  if (cliente && mostrarSolicitudes) {
    return (
      <div className="home-page">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <i className="fas fa-shield-alt me-2"></i>
              <strong>INFOSER</strong> & EP SPA
            </Link>
            <div className="navbar-nav ms-auto align-items-center">
              <div className="d-flex align-items-center text-light me-3">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
                  {cliente.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="fw-medium">{cliente.nombre}</span>
              </div>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => setMostrarSolicitudes(false)}
              >
                <i className="fas fa-arrow-left me-1"></i>Volver al Inicio
              </button>
            </div>
          </div>
        </nav>

        <section className="container my-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow">
                <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">
                    <i className="fas fa-list-ul me-2"></i>Mis Solicitudes
                  </h4>
                  <button className="btn btn-light btn-sm text-info" onClick={handleSolicitarServicio}>
                    <i className="fas fa-plus me-1"></i>Nueva Solicitud
                  </button>
                </div>
                <div className="card-body p-0">
                  {error && (
                    <div className="alert alert-danger m-3" role="alert">
                      <i className="fas fa-exclamation-circle me-2"></i>{error}
                    </div>
                  )}
                  {cargando ? (
                    <div className="text-center p-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="mt-2 text-muted">Cargando tus solicitudes...</p>
                    </div>
                  ) : solicitudes.length === 0 ? (
                    <div className="text-center p-5">
                      <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No tienes solicitudes registradas aún.</p>
                      <button className="btn btn-primary" onClick={handleSolicitarServicio}>
                        Crear mi primera solicitud
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Título</th>
                            <th>Servicio</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {solicitudes.map((sol) => {
                            const estado = sol.estado || sol.estado_actual || 'pendiente';
                            return (
                              <tr key={sol.id}>
                                <td>#{sol.id}</td>
                                <td>{sol.titulo}</td>
                                <td>
                                  <span className="badge bg-light text-dark border">
                                    {tiposServicio.find(t => t.value === sol.tipo_servicio)?.label || sol.tipo_servicio}
                                  </span>
                                </td>
                                <td>{new Date(sol.fecha_creacion).toLocaleDateString()}</td>
                                <td>
                                  <span className={`badge ${estado === 'pendiente' ? 'bg-warning text-dark' :
                                    estado === 'en_proceso' || estado === 'en_progreso' ? 'bg-info text-white' :
                                      estado === 'completada' ? 'bg-success' :
                                        'bg-secondary'
                                    }`}>
                                    {estado.toUpperCase().replace('_', ' ')}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }




  const handleSolicitudChange = (e) => {
    const { name, value } = e.target;
    setNuevaSolicitud((prev) => ({ ...prev, [name]: value }));
  };

  const crearSolicitud = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    if (!nuevaSolicitud.titulo || !nuevaSolicitud.descripcion || !nuevaSolicitud.direccion_servicio || !nuevaSolicitud.comuna) {
      alert('Por favor complete todos los campos obligatorios (*)');
      setCargando(false);
      return;
    }

    const datosSolicitud = {
      ...nuevaSolicitud,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre,
      cliente_email: cliente.email
    };

    try {
      const data = await api.post('/api/solicitudes', datosSolicitud);
      if (data?.success) {
        alert('¡Solicitud creada exitosamente! Será revisada por nuestro equipo.');
        resetearFormulario();
        await cargarSolicitudes(cliente.id);
      } else {
        alert(`Error al crear solicitud: ${data?.message || 'Desconocido'}`);
      }
    } catch (err) {
      alert(err.message || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const resetearFormulario = () => {
    setNuevaSolicitud({
      titulo: '',
      descripcion: '',
      direccion_servicio: '',
      comuna: '',
      region: 'Región Metropolitana',
      tipo_servicio: 'instalacion',
      prioridad: 'media',
      equipos_solicitados: '',
      comentarios_finales: ''
    });
    setMostrarFormulario(false);
  };
  const serviciosData = [
    { id: 1, title: 'Instalación CCTV', description: 'Sistemas de cámaras de vigilancia de alta definición para tu hogar o negocio.', icon: 'fas fa-camera' },
    { id: 2, title: 'Sistemas de Alarmas', description: 'Alarmas inteligentes cableadas e inalámbricas con monitoreo 24/7.', icon: 'fas fa-bell' },
    { id: 3, title: 'Control de Acceso', description: 'Cerraduras biométricas, tarjetas RFID y sistemas de control para edificios.', icon: 'fas fa-fingerprint' },
    { id: 4, title: 'Mantenimiento y Soporte', description: 'Planes de mantenimiento preventivo y correctivo con SLA garantizado.', icon: 'fas fa-tools' }
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1, // MOSTRAR TESTIMONIOS A LA VEZ
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    responsive: [
      { breakpoint: 992, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1 } }
    ]
  };

  // ======= VISTA FORMULARIO (cuando el cliente decide crear una solicitud) =======
  if (cliente && mostrarFormulario) {
    return (
      <div className="home-page">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <i className="fas fa-shield-alt me-2"></i>
              <strong>INFOSER</strong> & EP SPA
            </Link>
            <div className="navbar-nav ms-auto">
              <span className="nav-link text-light">
                <i className="fas fa-user me-1"></i>Hola, {cliente.nombre}
              </span>
              <button
                className="btn btn-outline-light btn-sm ms-2"
                onClick={() => setMostrarFormulario(false)}
                disabled={cargando}
              >
                <i className="fas fa-arrow-left me-1"></i>Volver al Inicio
              </button>
            </div>
          </div>
        </nav>

        <section className="container my-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">
                    <i className="fas fa-file-alt me-2"></i>Nueva Solicitud de Servicio
                  </h4>
                  <small className="opacity-75">Complete todos los campos obligatorios (*)</small>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={crearSolicitud}>
                    {/* Información Básica */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h5 className="text-primary mb-3">
                          <i className="fas fa-info-circle me-2"></i>Información del Servicio
                        </h5>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Título de la Solicitud *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="titulo"
                          value={nuevaSolicitud.titulo}
                          onChange={handleSolicitudChange}
                          placeholder="Ej: Instalación de cámaras de seguridad en residencia"
                          required
                          disabled={cargando}
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tipo de Servicio *</label>
                        <select
                          className="form-select"
                          name="tipo_servicio"
                          value={nuevaSolicitud.tipo_servicio}
                          onChange={handleSolicitudChange}
                          required
                          disabled={cargando}
                        >
                          {tiposServicio.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="mb-4">
                      <label className="form-label">Descripción Detallada *</label>
                      <textarea
                        className="form-control"
                        name="descripcion"
                        value={nuevaSolicitud.descripcion}
                        onChange={handleSolicitudChange}
                        placeholder="Describa en detalle el servicio requerido..."
                        rows="4"
                        required
                        disabled={cargando}
                      ></textarea>
                    </div>

                    {/* Ubicación */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h5 className="text-primary mb-3">
                          <i className="fas fa-map-marker-alt me-2"></i>Ubicación del Servicio
                        </h5>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Dirección Completa *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="direccion_servicio"
                          value={nuevaSolicitud.direccion_servicio}
                          onChange={handleSolicitudChange}
                          placeholder="Calle, número, depto, etc."
                          required
                          disabled={cargando}
                        />
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">Comuna *</label>
                        <select
                          className="form-select"
                          name="comuna"
                          value={nuevaSolicitud.comuna}
                          onChange={handleSolicitudChange}
                          required
                          disabled={cargando}
                        >
                          <option value="">Seleccione comuna</option>
                          {comunasRM.map(comuna => (
                            <option key={comuna} value={comuna}>{comuna}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">Región</label>
                        <input
                          type="text"
                          className="form-control"
                          name="region"
                          value={nuevaSolicitud.region}
                          onChange={handleSolicitudChange}
                          readOnly
                          disabled={cargando}
                        />
                      </div>
                    </div>

                    {/* Detalles Adicionales */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h5 className="text-primary mb-3">
                          <i className="fas fa-cogs me-2"></i>Detalles Adicionales
                        </h5>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Equipos Solicitados</label>
                        <select
                          className="form-select"
                          name="equipos_solicitados"
                          value={nuevaSolicitud.equipos_solicitados}
                          onChange={handleSolicitudChange}
                          disabled={cargando}
                          title="Seleccione el tipo de equipo que requiere para ver más detalles en la descripción al pasar el mouse."
                        >
                          <option value="">Seleccione equipos requeridos</option>
                          <option value="camaras_colorvu" title="Tecnología de vanguardia que captura imágenes a todo color las 24 horas, incluso en oscuridad total. Perfecta para identificar detalles cruciales como colores de vehículos o ropa bajo cualquier condición de luz.">Cámaras ColorVu (24/7 color)</option>
                          <option value="camaras_ptz" title="Cámaras robóticas de alto rendimiento con rotación 360° y Zoom Óptico 25x. Ideales para cubrir grandes áreas, monitorear perímetros extensos y realizar seguimiento activo de objetivos.">Cámaras PTZ (Zoom 25x)</option>
                          <option value="sistema_completo" title="Kit de seguridad 'Llave en Mano'. Incluye evalución técnica, cámaras de alta resolución, grabador (DVR/NVR), disco duro, cableado certificado, instalación profesional y configuración móvil.">Sistema completo de seguridad</option>
                          <option value="dvr_nvr" title="Unidades centrales de procesamiento y grabación. Gestionan el video de múltiples canales, permiten la visualización remota y almacenan semanas de grabación continua en alta definición.">DVR/NVR y almacenamiento</option>
                          <option value="accesorios" title="Componentes esenciales para infraestructura: fuentes de poder certificadas, baluns de video HD, cajas estancas, cableado UTP/Coaxial exterior y conectores de alta calidad para garantizar estabilidad.">Accesorios y cableado</option>
                          <option value="otro" title="Soluciones personalizadas fuera de catálogo. Seleccione esta opción si requiere integración con alarmas, control de acceso, cámaras térmicas o proyectos de ingeniería específicos.">Otro equipo</option>
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Prioridad del Servicio</label>
                        <select
                          className="form-select"
                          name="prioridad"
                          value={nuevaSolicitud.prioridad}
                          onChange={handleSolicitudChange}
                          disabled={cargando}
                        >
                          {prioridades.map(prioridad => (
                            <option key={prioridad.value} value={prioridad.value}>{prioridad.label}</option>
                          ))}
                        </select>
                        <div className="form-text">
                          {nuevaSolicitud.prioridad === 'alta' && '⚠️ Servicio urgente - Respuesta inmediata'}
                          {nuevaSolicitud.prioridad === 'media' && '⏱️ Servicio estándar - Respuesta en 24-48 horas'}
                          {nuevaSolicitud.prioridad === 'baja' && '📅 Servicio programado - Respuesta en 3-5 días'}
                        </div>
                      </div>
                    </div>

                    {/* Comentarios */}
                    <div className="mb-4">
                      <label className="form-label">Comentarios o Información Adicional</label>
                      <textarea
                        className="form-control"
                        name="comentarios_finales"
                        value={nuevaSolicitud.comentarios_finales}
                        onChange={handleSolicitudChange}
                        placeholder="Horarios preferidos, acceso, restricciones, etc."
                        rows="3"
                        disabled={cargando}
                      ></textarea>
                    </div>

                    {/* Acciones */}
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                      <button
                        type="button"
                        className="btn btn-secondary me-md-2"
                        onClick={() => setMostrarFormulario(false)}
                        disabled={cargando}
                      >
                        <i className="fas fa-times me-2"></i>Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={cargando}>
                        {cargando ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-2"></i>
                            ENVIANDO...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Enviar Solicitud
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ======= VISTA HOME NORMAL =======
  return (
    <div className="home-page">
      <nav id="inicio" className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-shield-alt me-2"></i>
            <strong>INFOSER</strong> & EP SPA
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><a className="nav-link" href="#inicio">Inicio</a></li>
              <li className="nav-item"><a className="nav-link" href="#why-choose-us">Nosotros</a></li>
              <li className="nav-item"><a className="nav-link" href="#servicios">Servicios</a></li>
              <li className="nav-item"><a className="nav-link" href="#contacto">Contacto</a></li>

              {!cliente ? (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/login">Iniciar Sesión</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/registro">Registrarse</Link></li>
                </>
              ) : (
                <>
                  <li className="nav-item ms-2">
                    <div className="dropdown">
                      <button
                        className="btn btn-outline-secondary border-0 text-light dropdown-toggle d-flex align-items-center"
                        type="button"
                        id="userDropdown"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="me-1">{cliente.nombre}</span>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark" aria-labelledby="userDropdown">
                        <li><h6 className="dropdown-header">Mi Cuenta</h6></li>
                        <li>
                          <button className="dropdown-item" onClick={handleVerSolicitudes}>
                            <i className="fas fa-list-ul me-2"></i>Mis Solicitudes
                          </button>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <button className="dropdown-item text-danger" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                          </button>
                        </li>
                      </ul>
                    </div>
                  </li>

                  <li className="nav-item ms-2">
                    <button className="btn btn-primary btn-sm" onClick={handleSolicitarServicio}>
                      <i className="fas fa-plus me-1"></i> Nueva Solicitud
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section py-5" style={{ background: 'linear-gradient(135deg,#0d47a1 0%, #1565c0 100%)' }}>
        <div className="container">
          <div className="row align-items-center" style={{ minHeight: '60vh' }}>
            <div className="col-lg-6 text-white">
              <h1 className="mb-3">Protección Profesional para lo que más Importa</h1>
              <p className="lead opacity-75">
                Sistemas de seguridad confiables para hogares y empresas. Instalación experta y mantenimiento.
              </p>
              <div className="mt-4">
                <button className="btn btn-light btn-lg me-3" onClick={handleSolicitarServicio}>
                  <i className="fas fa-tools me-2"></i>
                  {cliente ? 'Nueva Solicitud' : 'Solicitar Servicio'}
                </button>
                <a href="#why-choose-us" className="btn btn-outline-light btn-lg">
                  <i className="fas fa-info-circle me-2"></i>Más Información
                </a>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block text-center">
              <i className="fas fa-shield-alt" style={{ fontSize: '15rem', color: 'rgba(255,255,255,0.1)' }}></i>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US (Excellence) */}
      <section id="why-choose-us" className="why-choose-us-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <h2 className="section-title-alt mb-4">INFOSER: Seguridad con Excelencia</h2>
              <p className="lead mb-5">Elegirnos es optar por la tranquilidad operativa. Ofrecemos soluciones de seguridad y TI con un compromiso de calidad, soporte continuo y la tecnología más avanzada.</p>

              <div className="advantages-grid">
                <div className="advantage-item d-flex mb-4">
                  <div className="advantage-icon text-accent-blue me-3"><i className="fas fa-certificate"></i></div>
                  <div>
                    <h5 className="text-dark-blue">Certificación y Trayectoria</h5>
                    <p>Años de experiencia con proyectos de alto impacto y resultados garantizados.</p>
                  </div>
                </div>

                <div className="advantage-item d-flex mb-4">
                  <div className="advantage-icon text-accent-blue me-3"><i className="fas fa-microchip"></i></div>
                  <div>
                    <h5 className="text-dark-blue">Innovación Tecnológica</h5>
                    <p>Implementamos sistemas de seguridad con equipos y software de última generación.</p>
                  </div>
                </div>

                <div className="advantage-item d-flex mb-4">
                  <div className="advantage-icon text-accent-blue me-3"><i className="fas fa-headset"></i></div>
                  <div>
                    <h5 className="text-dark-blue">Asistencia Proactiva 24/7</h5>
                    <p>Soporte técnico inmediato y acompañamiento estratégico post-instalación.</p>
                  </div>
                </div>

                <div className="advantage-item d-flex mb-4">
                  <div className="advantage-icon text-accent-blue me-3"><i className="fas fa-user-shield"></i></div>
                  <div>
                    <h5 className="text-dark-blue">Foco en el Cliente</h5>
                    <p>Soluciones personalizadas que se ajustan a su presupuesto y necesidades únicas.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <img src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Cámaras de Seguridad" className="img-fluid why-choose-us-image" />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / CLIENTS */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 about-main-content mb-5 mb-lg-0">
              <h2 className="section-title-alt text-start mb-4">Nuestra Trayectoria y Compromiso</h2>
              <p className="lead">INFOSER & EP SPA: Especialistas en consultoría y gestión de instalaciones informáticas.</p>
              <p className="text-muted mb-4">
                Constituidos legalmente como SOCIEDAD POR ACCIONES desde el 03 de Agosto del 2020, operamos bajo el régimen de sociedades mercantiles y comerciales del país.
              </p>
              <p className="text-muted mb-4">
                Nuestro principal compromiso es acompañarte en cada paso, diseñando soluciones efectivas y personalizadas que aporten valor real, ayudándote a alcanzar tus objetivos de crecimiento y seguridad.
              </p>

              <div className="mt-4">
                <button className="btn btn-outline-primary-alt" onClick={handleSolicitarServicio}>
                  <i className="fas fa-headset me-2"></i>Solicita una Asesoría Gratuita
                </button>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="proyectos-card-refined bg-white p-4 rounded shadow-sm">
                <h4 className="card-title-alt mb-4"><i className="fas fa-star me-2"></i>Proyectos y Clientes Destacados</h4>
                <p className="mb-3">Experiencia comprobada en sectores clave:</p>

                <h5 className="client-group-title"><i className="fas fa-building me-2"></i>Sector Público e Infraestructura</h5>
                <ul className="list-unstyled client-list-refined mb-4">
                  <li><i className="fas fa-map-marker-alt me-2"></i>Municipalidad de Melipilla (Mantención CCTV interna)</li>
                  <li><i className="fas fa-map-marker-alt me-2"></i>Hospital de Melipilla</li>
                  <li><i className="fas fa-map-marker-alt me-2"></i>Variante Autopista Melipilla</li>
                </ul>

                <h5 className="client-group-title"><i className="fas fa-home me-2"></i>Comunidades y Retail</h5>
                <ul className="list-unstyled client-list-refined">
                  <li><i className="fas fa-map-marker-alt me-2"></i>Postulaciones FOCMUS Metropolitano</li>
                  <li><i className="fas fa-map-marker-alt me-2"></i>Comités de población de Melipilla (Lomas de Manso, Cantillana, etc.)</li>
                  <li><i className="fas fa-map-marker-alt me-2"></i>Certificación de Puntos de Red (Fashionpark Melipilla, Puente Alto, La Florida.)</li>
                </ul>

                <p className="text-end text-muted mt-3"><small>Más de 4 años aportando soluciones en la Región Metropolitana.</small></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES CORE */}
      <section id="servicios" className="services-infoser-core">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title-core">Nuestras Especialidades</h2>
            <p className="text-muted lead">Soluciones integrales para cada necesidad de seguridad</p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="service-card-core h-100">
                <div className="service-icon-core bg-primary-blue-light text-primary-blue-strong">
                  <i className="fas fa-video"></i>
                </div>
                <h4 className="card-title-core">CCTV y Videovigilancia</h4>
                <ul className="list-unstyled service-list-core">
                  <li><i className="fas fa-check-circle me-2"></i>Cámaras IP y Análogas</li>
                  <li><i className="fas fa-check-circle me-2"></i>Monitoreo Remoto</li>
                  <li><i className="fas fa-check-circle me-2"></i>Analítica de Video</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="service-card-core h-100">
                <div className="service-icon-core bg-accent-blue-light text-accent-blue-strong">
                  <i className="fas fa-network-wired"></i>
                </div>
                <h4 className="card-title-core">Redes y Conectividad</h4>
                <ul className="list-unstyled service-list-core">
                  <li><i className="fas fa-check-circle me-2"></i>Cableado Estructurado</li>
                  <li><i className="fas fa-check-circle me-2"></i>Enlaces Inalámbricos</li>
                  <li><i className="fas fa-check-circle me-2"></i>Certificación de Puntos</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="service-card-core h-100">
                <div className="service-icon-core bg-secondary-blue-light text-secondary-blue-strong">
                  <i className="fas fa-lock"></i>
                </div>
                <h4 className="card-title-core">Control de Acceso</h4>
                <ul className="list-unstyled service-list-core">
                  <li><i className="fas fa-check-circle me-2"></i>Biometría y RFID</li>
                  <li><i className="fas fa-check-circle me-2"></i>Portones Automáticos</li>
                  <li><i className="fas fa-check-circle me-2"></i>Gestión de Visitas</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="service-card-core h-100">
                <div className="service-icon-core bg-primary-blue-light text-primary-blue-strong">
                  <i className="fas fa-solar-panel"></i>
                </div>
                <h4 className="card-title-core">Energía y Respaldo</h4>
                <ul className="list-unstyled service-list-core">
                  <li><i className="fas fa-check-circle me-2"></i>UPS y Respaldo</li>
                  <li><i className="fas fa-check-circle me-2"></i>Energía Solar</li>
                  <li><i className="fas fa-check-circle me-2"></i>Iluminación LED</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-dark text-white py-5 mt-auto">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 mb-4 mb-lg-0">
              <h5 className="mb-3"><i className="fas fa-shield-alt me-2"></i>INFOSER & EP SPA</h5>
              <p className="text-white-50 small">
                Expertos en seguridad electrónica y soluciones TI. Protegemos lo que más te importa con tecnología de punta y servicio profesional.
              </p>
            </div>
            <div className="col-lg-4 mb-4 mb-lg-0 text-center">
              <h6 className="text-uppercase mb-3 fw-bold">Enlaces Rápidos</h6>
              <ul className="list-unstyled">
                <li><a href="#inicio" className="text-white-50 text-decoration-none">Inicio</a></li>
                <li><a href="#why-choose-us" className="text-white-50 text-decoration-none">Nosotros</a></li>
                <li><a href="#servicios" className="text-white-50 text-decoration-none">Servicios</a></li>
              </ul>
            </div>
            <div className="col-lg-4 text-lg-end">
              <h6 className="text-uppercase mb-3 fw-bold">Contacto</h6>
              <div className="mb-2"><i className="fas fa-envelope me-2"></i>infoserepspa@gmail.com</div>
              <div className="mb-2"><i className="fas fa-phone me-2"></i>+56 9 7719 6032</div>
              <div className="text-white-50 small mt-3">Región Metropolitana, Chile</div>
            </div>
          </div>
          <hr className="my-4 border-secondary" />
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start">
              <small className="text-white-50">© 2025 INFOSER & EP SPA. Todos los derechos reservados.</small>
            </div>
            <div className="col-md-6 text-center text-md-end">
              {/* Social icons could go here */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
