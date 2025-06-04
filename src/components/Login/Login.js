import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import loginBg from '../../assets/images/login-bg.png';
import companyLogo from '../../assets/images/logo.svg';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../Config/Config';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false); // Controla visibilidad de la contraseña
  const [isLoaded, setIsLoaded] = useState(false); // Controla animación inicial
  const [isLoading, setIsLoading] = useState(false); // Controla spinner de carga
  const navigate = useNavigate();

  // Activa animación inicial tras un breve retraso
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Maneja el envío del formulario de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        nombreUsuario: username,
        contrasena: password,
      });

      const { token, message, rol } = response.data;
      localStorage.setItem('token', token);
      const name = message.replace('Bienvenido/a ', '').trim();
      localStorage.setItem('userName', name);
      localStorage.setItem('userRol', rol);

      await Swal.fire({
        icon: 'success',
        title: '¡Inicio de sesión exitoso!',
        text: message,
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        setIsLoading(false);
        navigate('/principal');
      }, 500);
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error de inicio de sesión',
        text: 'Usuario o contraseña incorrectos',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  // Alterna visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      )}
      <div className="map-container">
        <img src={loginBg} alt="Mapa de fondo" className="background-image" />
        <div className={`login-card ${isLoaded ? 'loaded' : ''}`}>
          <div className="logo-container">
            <div className="logo">
              <div className="logo-waves">
                <div className="wave wave-1"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-3"></div>
              </div>
              <img src={companyLogo} alt="Logo de la empresa" className="company-logo" />
            </div>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group-login">
              <label htmlFor="username">Usuario</label>
              <input type="text" id="username" className="form-control-login" />
            </div>
            <div className="form-group-login">
              <label htmlFor="password">Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-control-login"
              />
              <div className="toggle-password">
                <input
                  type="checkbox"
                  id="show-password"
                  onChange={togglePasswordVisibility}
                />
                <label htmlFor="show-password"></label>
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Cargando...' : 'Iniciar sesión'}
            </button>
            <div className="forgot-password">
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>
          </form>
        </div>
        <div className="marker marker-1"></div>
        <div className="marker marker-2"></div>
        <div className="marker marker-3"></div>
        <div className="marker marker-4"></div>
        <div className="marker marker-5"></div>
        <div className="marker marker-6"></div>
        <div className="dotted-line line-1"></div>
        <div className="dotted-line line-2"></div>
        <div className="dotted-line line-3"></div>
      </div>
    </div>
  );
};

export default Login