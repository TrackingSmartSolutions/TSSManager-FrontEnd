"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import "./Header.css"
import logo from "../../assets/images/logo.svg"
import calendarIcon from "../../assets/icons/calendario.png"
import notificationIcon from "../../assets/icons/notificaciones.png"
import profilePlaceholder from "../../assets/icons/profile-placeholder.png"
import dropdownIcon from "../../assets/icons/desplegable.png"
import clockIcon from "../../assets/icons/clock.png"

const Header = () => {
  // Estados para controlar menús desplegables
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const userName = localStorage.getItem("userName") || "Usuario"
  const userRol = localStorage.getItem("userRol") || "EMPLEADO"

  // Estados para inactividad
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showInactivityModal, setShowInactivityModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)

  // Maneja temporizador de inactividad
  useEffect(() => {
    const timeoutDuration = 15 * 60 * 1000 // 15 minutos
    const warningDuration = 13 * 60 * 1000 // 13 minutos

    const resetTimer = () => {
      setLastActivity(Date.now())
      setShowInactivityModal(false)
      setTimeLeft(120)
    }

    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivity
      if (timeSinceLastActivity >= timeoutDuration) {
        localStorage.removeItem("token")
        localStorage.removeItem("userName")
        localStorage.removeItem("userRol")
        Swal.fire({
          icon: "warning",
          title: "Sesión Expirada",
          text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        }).then(() => {
          navigate("/")
        })
      } else if (timeSinceLastActivity >= warningDuration) {
        setShowInactivityModal(true)
      }
    }

    window.addEventListener("click", resetTimer)
    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("keydown", resetTimer)
    const interval = setInterval(checkInactivity, 1000)

    return () => {
      window.removeEventListener("click", resetTimer)
      window.removeEventListener("mousemove", resetTimer)
      window.removeEventListener("keydown", resetTimer)
      clearInterval(interval)
    }
  }, [lastActivity, navigate])

  // Contador regresivo para modal de inactividad
  useEffect(() => {
    if (showInactivityModal && timeLeft > 0) {
      const countdownInterval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
      return () => clearInterval(countdownInterval)
    } else if (timeLeft <= 0) {
      setShowInactivityModal(false)
    }
  }, [showInactivityModal, timeLeft])

  // Cierra el sidebar al cambiar de ruta
  useEffect(() => {
    const handleRouteChange = () => {
      setIsSidebarOpen(false)
    }

    return () => {
      handleRouteChange()
    }
  }, [navigate])

  // Formatea tiempo restante a MM:SS
  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Muestra notificación pendiente
  const handleNotificationClick = () => {
    alert("Tienes 1 notificación pendiente")
  }

  // Alterna menú lateral
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    // Bloquear scroll del body cuando el sidebar está abierto
    document.body.style.overflow = !isSidebarOpen ? "hidden" : ""
  }

  // Alterna desplegable de CRM
  const toggleCrmDropdown = (e) => {
    e.preventDefault()
    setIsCrmDropdownOpen(!isCrmDropdownOpen)
    setIsProfileDropdownOpen(false)
  }

  // Alterna desplegable de perfil
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen)
    setIsCrmDropdownOpen(false)
  }

  // Cierra sesión del usuario
  const handleLogout = () => {
    Swal.fire({
      icon: "success",
      title: "Sesión Cerrada",
      text: "Has cerrado sesión exitosamente.",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      localStorage.removeItem("token")
      localStorage.removeItem("userName")
      localStorage.removeItem("userRol")
      navigate("/")
    })
  }

  return (
    <>
      <header className="navbar">
        <div className="navbar-brand">
          <Link to="/principal" className="logo-link">
            <div className="logo">
              <img src={logo || "/placeholder.svg"} alt="Logo de Tracking Solutions" />
            </div>
          </Link>
        </div>

        <button
          className={`hamburger-menu ${isSidebarOpen ? "open" : ""}`}
          onClick={toggleSidebar}
          aria-label="Menú principal"
        >
          <span className="hamburger-icon"></span>
        </button>

        {/* Menú de navegación para escritorio */}
        <nav className="navbar-menu desktop-menu">
          <ul>
            <li className="has-dropdown">
              <a href="#" onClick={toggleCrmDropdown}>
                CRM{" "}
                <img
                  src={dropdownIcon || "/placeholder.svg"}
                  alt="Icono desplegable"
                  className={`dropdown-arrow ${isCrmDropdownOpen ? "open" : ""}`}
                />
              </a>
              {isCrmDropdownOpen && (
                <ul className="dropdown-menu">
                  <li>
                    <Link to="/empresas" onClick={() => setIsCrmDropdownOpen(false)}>
                      Empresas
                    </Link>
                  </li>
                  <li>
                    <Link to="/tratos" onClick={() => setIsCrmDropdownOpen(false)}>
                      Tratos
                    </Link>
                  </li>
                  <li>
                    <Link to="/reporte-personal" onClick={() => setIsCrmDropdownOpen(false)}>
                      Reporte personal
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            {userRol === "ADMINISTRADOR" && (
              <li>
                <Link to="/admin">Admin</Link>
              </li>
            )}
            <li>
              <Link to="/equipos_estatusplataforma">Equipos</Link>
            </li>
          </ul>
        </nav>

        <div className="navbar-end">
          <button className="icon-button">
            <img src={calendarIcon || "/placeholder.svg"} alt="Icono de Calendario" />
          </button>
          <button className="icon-button notification" onClick={handleNotificationClick}>
            <img src={notificationIcon || "/placeholder.svg"} alt="Icono de Notificaciones" />
            <span className="badge">1</span>
          </button>
          <div className="user-profile has-dropdown" onClick={toggleProfileDropdown}>
            <img src={profilePlaceholder || "/placeholder.svg"} alt="Foto de perfil de usuario" />
            <span className="username">{userName}</span>
            <img
              src={dropdownIcon || "/placeholder.svg"}
              alt="Icono de opciones desplegables"
              className={`dropdown-icon ${isProfileDropdownOpen ? "open" : ""}`}
            />
            {isProfileDropdownOpen && (
              <ul className="dropdown-menu profile-dropdown">
                <li>
                  <Link to="/ayuda" onClick={() => setIsProfileDropdownOpen(false)}>
                    Ayuda
                  </Link>
                </li>
                {userRol === "ADMINISTRADOR" && (
                  <li>
                    <Link to="/configuracion" onClick={() => setIsProfileDropdownOpen(false)}>
                      Configuración
                    </Link>
                  </li>
                )}
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setIsProfileDropdownOpen(false)
                      handleLogout()
                    }}
                  >
                    Cerrar sesión
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* Menú lateral para móviles */}
      <div className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`} onClick={toggleSidebar}></div>
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-user">
            <img src={profilePlaceholder || "/placeholder.svg"} alt="Foto de perfil" className="sidebar-avatar" />
            <div className="sidebar-user-info">
              <span className="sidebar-username">{userName}</span>
              <span className="sidebar-role">{userRol}</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>
            ×
          </button>
        </div>
        <nav className="sidebar-menu">
          <div className="sidebar-section">
            <div className="sidebar-section-header" onClick={() => setIsCrmDropdownOpen(!isCrmDropdownOpen)}>
              <span>CRM</span>
              <img
                src={dropdownIcon || "/placeholder.svg"}
                alt="Expandir"
                className={`sidebar-dropdown-icon ${isCrmDropdownOpen ? "open" : ""}`}
              />
            </div>
            <ul className={`sidebar-submenu ${isCrmDropdownOpen ? "open" : ""}`}>
              <li>
                <Link to="/empresas" onClick={toggleSidebar}>
                  Empresas
                </Link>
              </li>
              <li>
                <Link to="/tratos" onClick={toggleSidebar}>
                  Tratos
                </Link>
              </li>
              <li>
                <Link to="/reporte-personal" onClick={toggleSidebar}>
                  Reporte personal
                </Link>
              </li>
            </ul>
          </div>
          {userRol === "ADMINISTRADOR" && (
            <div className="sidebar-section">
              <Link to="/admin" onClick={toggleSidebar} className="sidebar-link">
                Admin
              </Link>
            </div>
          )}
          <div className="sidebar-section">
            <Link to="/equipos_estatusplataforma" onClick={toggleSidebar} className="sidebar-link">
              Equipos
            </Link>
          </div>
        </nav>
        <div className="sidebar-footer">
          <Link to="/ayuda" onClick={toggleSidebar} className="sidebar-footer-link">
            Ayuda
          </Link>
          {userRol === "ADMINISTRADOR" && (
            <Link to="/configuracion" onClick={toggleSidebar} className="sidebar-footer-link">
              Configuración
            </Link>
          )}
          <a
            href="#"
            className="sidebar-footer-link logout"
            onClick={(e) => {
              e.preventDefault()
              toggleSidebar()
              handleLogout()
            }}
          >
            Cerrar sesión
          </a>
        </div>
      </div>

      {showInactivityModal && timeLeft > 0 && (
        <div className="inactivity-modal">
          <div className="modal-content">
            <img src={clockIcon || "/placeholder.svg"} alt="Reloj" className="modal-icon" />
            <h3>Advertencia de Inactividad</h3>
            <p>
              Tu sesión se cerrará por inactividad en <span className="countdown">{formatTimeLeft(timeLeft)}</span>
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
