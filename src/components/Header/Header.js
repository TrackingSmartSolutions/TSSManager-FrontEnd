import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './Header.css';
import logo from '../../assets/images/logo.svg';
import calendarIcon from '../../assets/icons/calendario.png';
import notificationIcon from '../../assets/icons/notificaciones.png';
import profilePlaceholder from '../../assets/icons/profile-placeholder.png';
import dropdownIcon from '../../assets/icons/desplegable.png';
import clockIcon from '../../assets/icons/clock.png';

const Header = () => {
    // Estados para controlar menús desplegables
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Menú de hamburguesa
    const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false); // Desplegable de CRM
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); // Desplegable de perfil
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Usuario';
    const userRol = localStorage.getItem('userRol') || 'EMPLEADO';

    // Estados para inactividad
    const [lastActivity, setLastActivity] = useState(Date.now()); // Última actividad
    const [showInactivityModal, setShowInactivityModal] = useState(false); // Modal de inactividad
    const [timeLeft, setTimeLeft] = useState(120); // Tiempo restante (2 minutos)

    // Maneja temporizador de inactividad
    useEffect(() => {
        const timeoutDuration = 15 * 60 * 1000; // 15 minutos
        const warningDuration = 13 * 60 * 1000; // 13 minutos

        const resetTimer = () => {
            setLastActivity(Date.now());
            setShowInactivityModal(false);
            setTimeLeft(120);
        };

        const checkInactivity = () => {
            const timeSinceLastActivity = Date.now() - lastActivity;
            if (timeSinceLastActivity >= timeoutDuration) {
                localStorage.removeItem('token');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRol');
                Swal.fire({
                    icon: 'warning',
                    title: 'Sesión Expirada',
                    text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#3085d6',
                }).then(() => {
                    navigate('/');
                });
            } else if (timeSinceLastActivity >= warningDuration) {
                setShowInactivityModal(true);
            }
        };

        window.addEventListener('click', resetTimer);
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        const interval = setInterval(checkInactivity, 1000);

        return () => {
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            clearInterval(interval);
        };
    }, [lastActivity, navigate]);

    // Contador regresivo para modal de inactividad
    useEffect(() => {
        if (showInactivityModal && timeLeft > 0) {
            const countdownInterval = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
            return () => clearInterval(countdownInterval);
        } else if (timeLeft <= 0) {
            setShowInactivityModal(false);
        }
    }, [showInactivityModal, timeLeft]);

    // Formatea tiempo restante a MM:SS
    const formatTimeLeft = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    // Muestra notificación pendiente
    const handleNotificationClick = () => {
        alert('Tienes 1 notificación pendiente');
    };

    // Alterna menú de hamburguesa
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Alterna desplegable de CRM
    const toggleCrmDropdown = () => {
        setIsCrmDropdownOpen(!isCrmDropdownOpen);
        setIsProfileDropdownOpen(false);
    };

    // Alterna desplegable de perfil
    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
        setIsCrmDropdownOpen(false);
    };

    // Cierra sesión del usuario
    const handleLogout = () => {
        Swal.fire({
            icon: 'success',
            title: 'Sesión Cerrada',
            text: 'Has cerrado sesión exitosamente.',
            timer: 1500,
            showConfirmButton: false,
        }).then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRol');
            navigate('/');
        });
    };

    return (
        <>
            <header className="navbar">
                <div className="navbar-brand">
                    <Link to="/principal" className="logo-link">
                        <div className="logo">
                            <img src={logo} alt="Logo de Tracking Solutions" />
                        </div>
                    </Link>
                </div>

                <button className="hamburger-menu" onClick={toggleMenu}>
                    <span className="hamburger-icon"></span>
                </button>

                <nav className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                    <ul>
                        <li className="has-dropdown">
                            <a href="#" onClick={toggleCrmDropdown}>
                                CRM <img src={dropdownIcon} alt="Icono desplegable" className={`dropdown-arrow ${isCrmDropdownOpen ? 'open' : ''}`} />
                            </a>
                            {isCrmDropdownOpen && (
                                <ul className="dropdown-menu">
                                    <li><Link to="/empresas" onClick={() => { setIsMenuOpen(false); setIsCrmDropdownOpen(false); }}>Empresas</Link></li>
                                    <li><Link to="/tratos" onClick={() => { setIsMenuOpen(false); setIsCrmDropdownOpen(false); }}>Tratos</Link></li>
                                    <li><Link to="/reporte-personal" onClick={() => { setIsMenuOpen(false); setIsCrmDropdownOpen(false); }}>Reporte personal</Link></li>
                                </ul>
                            )}
                        </li>
                        {userRol === 'ADMINISTRADOR' && (
                            <li><a href="/admin" onClick={() => setIsMenuOpen(false)}>Admin</a></li>
                        )}
                        <li><a href="/equipos" onClick={() => setIsMenuOpen(false)}>Equipos</a></li>
                    </ul>
                </nav>

                <div className="navbar-end">
                    <button className="icon-button">
                        <img src={calendarIcon} alt="Icono de Calendario" />
                    </button>
                    <button className="icon-button notification" onClick={handleNotificationClick}>
                        <img src={notificationIcon} alt="Icono de Notificaciones" />
                        <span className="badge">1</span>
                    </button>
                    <div className="user-profile has-dropdown" onClick={toggleProfileDropdown}>
                        <img src={profilePlaceholder} alt="Foto de perfil de usuario" />
                        <span className="username">{userName}</span>
                        <img src={dropdownIcon} alt="Icono de opciones desplegables" className={`dropdown-icon ${isProfileDropdownOpen ? 'open' : ''}`} />
                        {isProfileDropdownOpen && (
                            <ul className="dropdown-menu profile-dropdown">
                                <li><Link to="/ayuda" onClick={() => { setIsMenuOpen(false); setIsProfileDropdownOpen(false); }}>Ayuda</Link></li>
                                {userRol === 'ADMINISTRADOR' && (
                                    <li><Link to="/configuracion" onClick={() => { setIsMenuOpen(false); setIsProfileDropdownOpen(false); }}>Configuración</Link></li>
                                )}
                                <li>
                                    <a href="#" onClick={(e) => {
                                        e.preventDefault();
                                        setIsMenuOpen(false);
                                        setIsProfileDropdownOpen(false);
                                        handleLogout();
                                    }}>
                                        Cerrar sesión
                                    </a>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </header>

            {showInactivityModal && timeLeft > 0 && (
                <div className="inactivity-modal">
                    <div className="modal-content">
                        <img src={clockIcon} alt="Reloj" className="modal-icon" />
                        <h3>Advertencia de Inactividad</h3>
                        <p>Tu sesión se cerrará por inactividad en <span className="countdown">{formatTimeLeft(timeLeft)}</span></p>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header