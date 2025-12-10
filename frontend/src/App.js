// src/App.js
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/home';
import LoginClientes from './components/auth/loginClientes';
import RegisterClientes from './components/auth/registerClientes';
import AdminMenu from './pages/adminMenu';
import AdminClientes from './pages/adminClientes';
import AdminSolicitudes from './pages/adminSolicitudes';
import AdminTecnicos from './pages/adminTecnicos';
import AdminMetricas from './pages/adminMetricas';
import TecnicoPanel from './pages/tecnicoPanel';
import AdminCrearUsuario from './pages/adminCrearUsuario';
import AdminModeloPredictivo from './pages/adminModeloPredictivo';

// IMPORTA LAS PÁGINAS DE CONTRASEÑA
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ---- Guard genérico de rutas protegidas ----
function RequireAuth({ roles, children }) {
  const user = JSON.parse(localStorage.getItem('userData') || 'null');
  const token = localStorage.getItem('authToken');

  // debe existir usuario y token válido en Storage
  if (!user || !token) return <Navigate to="/login" replace />;

  // si se exigen roles y no coincide → redirecciona según rol
  if (roles && !roles.includes(user.rol)) {
    if (user.rol === 'tecnico') return <Navigate to="/tecnico/panel" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginClientes />} />
        <Route path="/registro" element={<RegisterClientes />} />

        {/* RUTAS DE RECUPERACIÓN (Públicas) */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* ADMIN */}
        <Route
          path="/admin/menu"
          element={
            <RequireAuth roles={['administrador', 'admin']}>
              <AdminMenu />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/clientes"
          element={
            <RequireAuth roles={['administrador', 'admin']}>
              <AdminClientes />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/solicitudes"
          element={
            <RequireAuth roles={['administrador', 'admin']}>
              <AdminSolicitudes />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/tecnicos"
          element={
            <RequireAuth roles={['administrador', 'admin']}>
              <AdminTecnicos />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/metricas"
          element={
            <RequireAuth roles={['administrador', 'admin']}>
              <AdminMetricas />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/usuarios/nuevo"
          element={
            <RequireAuth roles={['administrador', 'admin']}>
              <AdminCrearUsuario />
            </RequireAuth>
          }
        />
        {/* NUEVO: Modelo predictivo */}
        <Route
          path="/admin/modelo-predictivo"
          element={
            <RequireAuth roles={['administrador', 'admin']}>
              <AdminModeloPredictivo />
            </RequireAuth>
          }
        />

        {/* TÉCNICO */}
        <Route
          path="/tecnico/panel"
          element={
            <RequireAuth roles={['tecnico']}>
              <TecnicoPanel />
            </RequireAuth>
          }
        />

        {/* catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
