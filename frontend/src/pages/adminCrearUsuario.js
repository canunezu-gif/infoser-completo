// frontend/src/pages/adminCrearUsuario.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api.js';

export default function AdminCrearUsuario() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirm: '',
    telefono: '',
    especialidad: '',
    rol: 'tecnico', // 'tecnico' | 'administrador'
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre || !form.email || !form.password) {
      setError('Nombre, email y contraseña son obligatorios.');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setCargando(true);
      await api.post('/api/usuarios', {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        telefono: form.telefono || null,
        especialidad: form.especialidad || null,
        rol: form.rol,
      });
      alert('Usuario creado correctamente.');
      navigate('/admin/tecnicos');
    } catch (err) {
      setError(err?.message || 'No se pudo crear el usuario.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-4">
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container">
          <Link className="navbar-brand" to="/admin/menu">
            <i className="fas fa-shield-alt me-2"></i> INFOSER & EP SPA
          </Link>
          <div className="navbar-nav ms-auto">
            <Link className="nav-link" to="/admin/tecnicos">Volver a Técnicos</Link>
          </div>
        </div>
      </nav>

      <h3 className="mb-3"><i className="fas fa-user-plus me-2"></i>Crear usuario interno</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={onSubmit} className="card p-4 shadow-sm">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Nombre *</label>
            <input name="nombre" className="form-control" value={form.nombre} onChange={onChange} required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Email *</label>
            <input type="email" name="email" className="form-control" value={form.email} onChange={onChange} required />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Teléfono</label>
            <input name="telefono" className="form-control" value={form.telefono} onChange={onChange} />
          </div>
          <div className="col-md-8 mb-3">
            <label className="form-label">Especialidad</label>
            <input name="especialidad" className="form-control" value={form.especialidad} onChange={onChange} />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Rol *</label>
            <select name="rol" className="form-select" value={form.rol} onChange={onChange}>
              <option value="tecnico">Técnico</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Contraseña *</label>
            <input type="password" name="password" className="form-control" value={form.password} onChange={onChange} required />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Confirmar contraseña *</label>
            <input type="password" name="confirm" className="form-control" value={form.confirm} onChange={onChange} required />
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/tecnicos')} disabled={cargando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? (<><i className="fas fa-spinner fa-spin me-2"></i>Creando...</>) : (<>Crear usuario</>)}
          </button>
        </div>
      </form>
    </div>
  );
}
