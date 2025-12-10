import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import { api } from '../utils/api.js';

const AdminMenu = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    navigate('/');
  };

  const menuOptions = [
    {
      id: 'solicitudes',
      title: 'Gestión de Solicitudes',
      description: 'Revisar y asignar trabajos pendientes',
      icon: 'fas fa-tools',
      path: '/admin/solicitudes'
    },
    {
      id: 'clientes',
      title: 'Gestión de Clientes',
      description: 'Administrar clientes registrados',
      icon: 'fas fa-users',
      path: '/admin/clientes'
    },
    {
      id: 'tecnicos',
      title: 'Equipo de Técnicos',
      description: 'Gestionar personal y especialidades',
      icon: 'fas fa-user-cog',
      path: '/admin/tecnicos'
    },
    {
      id: 'metricas',
      title: 'Analytics & Reportes',
      description: 'Métricas de rendimiento y productividad',
      icon: 'fas fa-chart-line',
      path: '/admin/metricas'
    },
    {
      id: 'modeloPredictivo',
      title: 'Modelo Predictivo',
      description: 'Evaluar riesgo con IA para las solicitudes',
      icon: 'fas fa-brain',
      path: '/admin/modelo-predictivo'
    }
  ];

  return (
    <div className="admin-menu-container">
      {/* Header */}
      <header className="admin-menu-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-shield-alt me-2"></i>
            Panel de Administración INFOSER
          </h1>
          <button
            className="logout-btn"
            onClick={handleLogout}
            style={{ display: 'flex', background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Menú de opciones */}
      <main className="admin-menu-main">
        <div className="welcome-section">
          <h2>Bienvenido, Administrador</h2>
          <p>Selecciona una opción del menú para gestionar el sistema</p>
        </div>

        <div className="menu-grid">
          {menuOptions.map(option => (
            <div
              key={option.id}
              className="menu-card"
              onClick={() => navigate(option.path)}
            >
              <div className="menu-icon">
                <i className={option.icon}></i>
              </div>
              <h3>{option.title}</h3>
              <p>{option.description}</p>
              <div className="menu-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminMenu;
