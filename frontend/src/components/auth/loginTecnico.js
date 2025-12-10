const navigate = useNavigate();

const handleChange = (e) => {
  setCredenciales({
    ...credenciales,
    [e.target.name]: e.target.value
  });
};

const handleSubmit = (e) => {
  e.preventDefault();

  // Solo técnicos pueden acceder aquí
  if (credenciales.email === 'juan.alvarez@infoser.cl') {
    localStorage.setItem('tecnicoLoggedIn', 'true');
    navigate('/tecnico/panel');
  } else {
    alert('Acceso denegado. Solo técnicos autorizados.');
  }
};

return (
  <div className="login-client-container">
    <div className="login-client-card">
      <div className="login-client-header">
        <div className="login-client-icon">
          <i className="fas fa-tools"></i>
        </div>
        <h4>ACCESO TÉCNICO</h4>
        <p>Panel Técnico INFOSER</p>
      </div>

      <div className="login-client-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group-client">
            <label className="form-label-client">
              <i className="fas fa-envelope me-2"></i>Email Técnico
            </label>
            <input
              type="email"
              className="form-control-client"
              name="email"
              value={credenciales.email}
              onChange={handleChange}
              placeholder="tecnico@infoser.cl"
              required
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
              value={credenciales.password}
              onChange={handleChange}
              placeholder="Ingrese contraseña"
              required
            />
          </div>

          <button type="submit" className="btn-login-client">
            <i className="fas fa-sign-in-alt me-2"></i>
            ACCEDER COMO TÉCNICO
          </button>

          <div className="register-link-client">
            <a href="/login">Volver al login principal</a>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};

export default LoginTecnico;