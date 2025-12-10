import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/auth.css'; // Reutilizamos el estilo

const ResetPassword = () => {
    const { token } = useParams(); 
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setCargando(true);
        try {
            const response = await api.post('/api/auth/reset-password', { 
                token, 
                newPassword: password 
            }, { auth: false });

            if (response.success) {
                setMensaje('¡Contraseña actualizada correctamente!');
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(response.message || 'Error al restablecer.');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-client-container">
            <div className="login-client-card">
                <div className="login-client-header">
                    <div className="login-client-icon">
                        <i className="fas fa-key"></i>
                    </div>
                    <h4>NUEVA CONTRASEÑA</h4>
                    <p>Ingresa tu nueva clave segura</p>
                </div>

                <div className="login-client-body">
                    {mensaje && <div className="alert alert-success text-center">{mensaje}</div>}
                    {error && <div className="alert alert-danger text-center">{error}</div>}

                    {!mensaje && (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group-client">
                                <label className="form-label-client">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    className="form-control-client"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div className="form-group-client">
                                <label className="form-label-client">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    className="form-control-client"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Repite la contraseña"
                                />
                            </div>

                            <button type="submit" className="btn-login-client" disabled={cargando}>
                                {cargando ? 'GUARDANDO...' : 'CAMBIAR CONTRASEÑA'}
                            </button>
                        </form>
                    )}
                    
                    <div className="register-link-client">
                        <Link to="/login">Volver al Inicio</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;