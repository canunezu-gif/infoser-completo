import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import '../../styles/auth.css';
import { api } from '../../utils/api.js';
const LoginClientes = () => {
  const [credenciales, setCredenciales] = useState({ email: '', password: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      // 🔐 login público (no manda Authorization)
      const data = await api.post('/api/auth/login', credenciales, { auth: false });

      if (data?.success && data?.user) {
        // Guarda token en ambas claves para compatibilidad con otros módulos (ml.js)
        if (data.token) {
          localStorage.setItem('authToken', data.token); // ya lo tenías
          localStorage.setItem('token', data.token);     // 👈 nuevo alias
        }
        localStorage.setItem('userData', JSON.stringify(data.user));

        manejarLoginExitoso(data.user);
      } else {
        setError(data?.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const manejarLoginExitoso = (userData) => {
    // Limpia banderas antiguas
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('tecnicoLoggedIn');
    localStorage.removeItem('clienteLoggedIn');
    localStorage.removeItem('clienteActual');

    // ⚠️ El backend devuelve 'administrador' | 'tecnico' | 'cliente'
    if (userData.rol === 'administrador') {
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
      navigate('/admin/menu'); // ruta de admin
      return;
    }

    if (userData.rol === 'tecnico') {
      localStorage.setItem('tecnicoLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
      navigate('/tecnico/panel'); // ruta de técnico
      return;
    }

    // cliente
    localStorage.setItem('clienteActual', JSON.stringify(userData));
    localStorage.setItem('clienteLoggedIn', 'true');
    setCredenciales({ email: '', password: '' });
    navigate('/'); // home
  };

  return (
    <div className="login-client-container">
      <div className="login-client-card">
        <div className="login-client-header">
          <div className="login-client-icon">
            <i className="fas fa-user-circle"></i>
          </div>
          <h4>ACCESO AL SISTEMA</h4>
          <p>Sistema de Gestión de Solicitudes INFOSER</p>
        </div>

        <div className="login-client-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group-client">
              <label htmlFor="clientEmail" className="form-label-client">
                <i className="fas fa-envelope me-2"></i>Email
              </label>
              <input
                id="clientEmail"
                type="email"
                name="email"
                className="form-control-client"
                value={credenciales.email}
                onChange={handleChange}
                placeholder="Ingrese su email"
                required
                disabled={cargando}
              />
            </div>

            <div className="form-group-client">
              <label htmlFor="clientPassword" className="form-label-client">
                <i className="fas fa-lock me-2"></i>Contraseña
              </label>
              <input
                id="clientPassword"
                type="password"
                name="password"
                className="form-control-client"
                value={credenciales.password}
                onChange={handleChange}
                placeholder="Ingrese su contraseña"
                required
                disabled={cargando}
              />
              <div className="forgot-password-client">
                <Link to="/forgot-password">¿Olvidó su contraseña?</Link>
              </div>
            </div>

            {error && <div className="error-text-client" style={{ marginBottom: 12 }}>{error}</div>}

            <button type="submit" className="btn-login-client" disabled={cargando}>
              {cargando ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  PROCESANDO...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  INICIAR SESIÓN
                </>
              )}
            </button>

            <div className="register-link-client">
              ¿No tiene una cuenta? <a href="/registro">Regístrese aquí</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginClientes;
