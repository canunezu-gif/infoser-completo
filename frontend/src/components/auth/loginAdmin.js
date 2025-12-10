import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ojo con la ruta: estás en src/components/auth y tu helper está en src/components/utils/api.js
import { api } from '../../utils/api.js';

export default function LoginAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@infoser.cl');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const d = await api.post('/api/auth/login', { email, password });

      // guarda sesión
      localStorage.setItem('authToken', d.token);
      localStorage.setItem('userData', JSON.stringify(d.user));

      // redirige según rol
      if (d.user.rol === 'administrador') {
        navigate('/admin/solicitudes', { replace: true });
      } else if (d.user.rol === 'tecnico') {
        navigate('/tecnico/panel', { replace: true });
      } else {
        // si entra un cliente por aquí, lo frenamos
        setMsg('Este acceso es solo para administrador/técnico. Usa “Iniciar Sesión” de clientes.');
        // limpieza opcional:
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    } catch (err) {
      setMsg(err?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 40 }}>
      <h3 className="mb-3">Login Administrador / Técnico</h3>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label className="form-label">Correo</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@infoser.cl"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        {msg && <div className="alert alert-warning py-2">{msg}</div>}

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
