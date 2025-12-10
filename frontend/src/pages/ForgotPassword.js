import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api'; 
// IMPORTANTE: Importamos el mismo CSS que usa el Login
import '../styles/auth.css'; 

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);

    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      setCargando(false);
      return;
    }

    try {
      // Usamos tu api.post
      const response = await api.post('/api/auth/forgot-password', { email }, { auth: false });
      setMensaje(response.message || 'Si el correo existe, recibirás un enlace.');
    } catch (err) {
      // Si falla, mostramos mensaje genérico o el del error
      setError('Error al conectar con el servidor. Inténtalo de nuevo.');
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    // Usamos "login-client-container" para centrar y dar fondo
    <div className="login-client-container">
      <div className="login-client-card">
        
        {/* CABECERA: Estilo idéntico al Login */}
        <div className="login-client-header">
          <div className="login-client-icon">
            <i className="fas fa-lock-open"></i>
          </div>
          <h4>RECUPERAR ACCESO</h4>
          <p>Restablece tu contraseña de forma segura</p>
        </div>

        {/* CUERPO: Formulario con tus estilos personalizados */}
        <div className="login-client-body">
          
          {/* Mensajes de Alerta */}
          {mensaje && (
            <div className="alert alert-success text-center mb-4">
              <i className="fas fa-check-circle me-2"></i>{mensaje}
            </div>
          )}
          {error && (
            <div className="alert alert-danger text-center mb-4">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group-client">
              <label htmlFor="emailInput" className="form-label-client">
                <i className="fas fa-envelope me-2"></i>Correo Registrado
              </label>
              <input
                type="email"
                // Usamos "form-control-client" en lugar de "form-control"
                className="form-control-client" 
                id="emailInput"
                placeholder="ejemplo@infoser.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={cargando || mensaje}
              />
            </div>

            <button 
              type="submit" 
              // Usamos "btn-login-client" para el degradado azul
              className="btn-login-client" 
              disabled={cargando || mensaje}
            >
              {cargando ? (
                <>
                   <i className="fas fa-spinner fa-spin me-2"></i>
                   ENVIANDO...
                </>
              ) : (
                <>
                   <i className="fas fa-paper-plane me-2"></i>
                   ENVIAR ENLACE
                </>
              )}
            </button>
            
            <div className="register-link-client">
              <Link to="/login">
                <i className="fas fa-arrow-left me-1"></i> Volver al Inicio de Sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;