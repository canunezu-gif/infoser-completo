// frontend/src/components/auth/registerClientes.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/register.css';
import { api } from '../../utils/api.js';

const RegisterClientes = () => {
  const [datosRegistro, setDatosRegistro] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
  });
  const [cargando, setCargando] = useState(false);
  const [backendDisponible, setBackendDisponible] = useState(false);
  const navigate = useNavigate();

  // Verificar si el backend está disponible al cargar la página
  useEffect(() => {
    verificarBackend();
  }, []);

  const verificarBackend = async () => {
    try {
      // usa el helper: esto llama a /api/health en la URL correcta
      const data = await api.getNoAuth('/health');
      if (data?.success) {
        setBackendDisponible(true);
      } else {
        setBackendDisponible(false);
      }
    } catch (error) {
      setBackendDisponible(false);
    }
  };

  const handleChange = (e) => {
    setDatosRegistro({
      ...datosRegistro,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    if (backendDisponible) {
      await registrarConBackend();
    } else {
      registrarEnLocalStorage();
    }

    setCargando(false);
  };

  const registrarConBackend = async () => {
    try {
      // usa el helper: POST /api/auth/register sin auth
      const data = await api.postNoAuth('/auth/register', datosRegistro);

      if (data?.success) {
        alert(
          `Registro exitoso ${datosRegistro.nombre}! Ahora puedes iniciar sesión.`
        );
        setDatosRegistro({
          nombre: '',
          email: '',
          password: '',
          telefono: '',
        });
        setTimeout(() => navigate('/login'), 1000);
      } else {
        alert(`Error en registro: ${data?.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error registrando en backend:', error);
      alert(
        'Error al conectar con el servidor. Guardando en modo local (solo demo)...'
      );
      registrarEnLocalStorage();
    }
  };

  const registrarEnLocalStorage = () => {
    const clientesExistentes =
      JSON.parse(localStorage.getItem('clientesRegistrados')) || [];

    if (
      clientesExistentes.some(
        (cliente) => cliente.email === datosRegistro.email
      )
    ) {
      alert('Este email ya está registrado. Use otro email o inicie sesión.');
      return;
    }

    const nuevoCliente = {
      id: Date.now(),
      nombre: datosRegistro.nombre,
      email: datosRegistro.email,
      password: datosRegistro.password,
      telefono: datosRegistro.telefono,
      fechaRegistro: new Date().toISOString(),
      rol: 'cliente',
    };

    clientesExistentes.push(nuevoCliente);
    localStorage.setItem(
      'clientesRegistrados',
      JSON.stringify(clientesExistentes)
    );

    alert(
      `Registro exitoso ${datosRegistro.nombre}! Ahora puedes iniciar sesión.`
    );
    setDatosRegistro({ nombre: '', email: '', password: '', telefono: '' });
    setTimeout(() => navigate('/login'), 1000);
  };

  return (
    <div className="register-client-container">
      <div className="register-client-card">
        <div className="register-client-header">
          <div className="register-client-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h4>REGISTRO CLIENTE</h4>
          <p>Crear nueva cuenta</p>
        </div>

        <div className="register-client-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-user me-2"></i>Nombre Completo
              </label>
              <input
                type="text"
                className="form-control-client"
                name="nombre"
                value={datosRegistro.nombre}
                onChange={handleChange}
                placeholder="Juan Perez"
                required
                disabled={cargando}
              />
            </div>

            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-envelope me-2"></i>Email
              </label>
              <input
                type="email"
                className="form-control-client"
                name="email"
                value={datosRegistro.email}
                onChange={handleChange}
                placeholder="cliente@ejemplo.com"
                required
                disabled={cargando}
              />
            </div>

            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-lock me-2"></i>Contraseña
              </label>
              <input
                type="password"
                className="form-control-client"
                name="password"
                value={datosRegistro.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                minLength="6"
                required
                disabled={cargando}
              />
            </div>

            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-phone me-2"></i>Teléfono
              </label>
              <input
                type="tel"
                className="form-control-client"
                name="telefono"
                value={datosRegistro.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                required
                disabled={cargando}
              />
            </div>

            <button
              type="submit"
              className="btn-register-client"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  REGISTRANDO...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  CREAR CUENTA
                </>
              )}
            </button>

            <div className="login-link-client">
              ¿Ya tiene una cuenta? <a href="/login">Inicie sesión aquí</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterClientes;
