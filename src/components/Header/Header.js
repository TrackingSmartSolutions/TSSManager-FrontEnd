import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import "./Header.css"
import { API_BASE_URL } from "../Config/Config";
import calendarIcon from "../../assets/icons/calendario.png"
import notificationIcon from "../../assets/icons/notificaciones.png"
import profilePlaceholder from "../../assets/icons/profile-placeholder.png"
import dropdownIcon from "../../assets/icons/desplegable.png"
import clockIcon from "../../assets/icons/clock.png"


// Cache global para el logo
let logoCache = {
  url: null,
  timestamp: null,
  isLoading: false,
  hasError: false
};

const Header = ({ logoUrl }) => {
  // Estados para controlar menús desplegables
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const navigate = useNavigate()
  const userName = localStorage.getItem("userName") || "Usuario"
  const userRol = localStorage.getItem("userRol") || "EMPLEADO"


  // Estados para inactividad
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showInactivityModal, setShowInactivityModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)

  // Estado optimizado para el logo
  const [currentLogoUrl, setCurrentLogoUrl] = useState(() => {
    return logoCache.url ||
      localStorage.getItem("cachedLogoUrl") ||
      logoUrl ||
      "/placeholder.svg"
  });

  const [isLogoLoading, setIsLogoLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const logoFetchedRef = useRef(false)
  const touchHandledRef = useRef(false)
  const logoErrorHandled = useRef(false)
  const HELP_URL = "https://drive.google.com/file/d/1AsgJBmqi-r2X65Gz4soyGO5WCOJ_v2XF/view?usp=drive_link";

  const preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = reject
      img.src = url
    })
  }

  // Función para obtener el logo
  const fetchLogo = async (force = false) => {
    if (logoCache.isLoading && !force) return

    // Si ya hubo error y no es forzado, no reintentar
    if (logoCache.hasError && !force) {
      setCurrentLogoUrl("/placeholder.svg")
      setLogoError(false)
      return
    }

    const cacheAge = Date.now() - (logoCache.timestamp || 0)
    const cacheValid = cacheAge < 5 * 60 * 1000

    if (logoCache.url && cacheValid && !force && !logoCache.hasError) {
      setCurrentLogoUrl(logoCache.url)
      setLogoError(false)
      return
    }

    logoCache.isLoading = true
    setIsLogoLoading(true)
    setLogoError(false)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error('No token available')
      }

      const response = await fetch(`${API_BASE_URL}/configuracion/empresa`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json();

      // Verificar si hay logoUrl válida
      if (!data.logoUrl || data.logoUrl.trim() === '') {
        logoCache.url = "/placeholder.svg"
        logoCache.hasError = false
        setCurrentLogoUrl("/placeholder.svg")
        setLogoError(false)
        return
      }

      const newLogoUrl = data.logoUrl

      // Precargar la imagen antes de mostrarla
      try {
        await preloadImage(newLogoUrl)

        // Actualizar caché exitosamente
        logoCache.url = newLogoUrl
        logoCache.timestamp = Date.now()
        logoCache.hasError = false

        localStorage.setItem("cachedLogoUrl", newLogoUrl)

        setCurrentLogoUrl(newLogoUrl)
        setLogoError(false)

      } catch (imageError) {
        console.warn("Error precargando imagen del logo:", imageError)
        logoCache.url = "/placeholder.svg"
        logoCache.hasError = true
        setCurrentLogoUrl("/placeholder.svg")
        setLogoError(false)
      }

    } catch (error) {
      console.error("Error fetching logo configuration:", error)
      logoCache.hasError = true
      logoCache.url = "/placeholder.svg"
      setCurrentLogoUrl("/placeholder.svg")
      setLogoError(false)
    } finally {
      logoCache.isLoading = false
      setIsLogoLoading(false)
    }
  }

  // Effect para cargar el logo solo una vez por sesión
  useEffect(() => {
    if (!logoFetchedRef.current) {
      logoFetchedRef.current = true
      fetchLogo()
    }
  }, [])

  // Effect para actualizar logo cuando cambia el prop (si es necesario)
  useEffect(() => {
    if (logoUrl && logoUrl !== currentLogoUrl) {
      setCurrentLogoUrl(logoUrl)
      setLogoError(false)
    }
  }, [logoUrl])

  useEffect(() => {
    const handleLogoUpdate = () => {
      // Reset error states when logo is updated
      logoCache.hasError = false
      logoErrorHandled.current = false
      fetchLogo(true);
    };
    window.addEventListener("logoUpdated", handleLogoUpdate);
    return () => window.removeEventListener("logoUpdated", handleLogoUpdate);
  }, []);

  // Función mejorada para manejar errores del logo
  const handleLogoError = (e) => {
    // Evitar múltiples ejecuciones del mismo error
    if (logoErrorHandled.current) return

    logoErrorHandled.current = true

    // Solo cambiar a placeholder si no está ya usando el placeholder
    if (e.target.src !== "/placeholder.svg" && !e.target.src.includes("placeholder.svg")) {
      console.warn("Error cargando logo personalizado, usando placeholder")
      setLogoError(true)
      setCurrentLogoUrl("/placeholder.svg")
      logoCache.hasError = true

      // Reset después de un breve delay
      setTimeout(() => {
        logoErrorHandled.current = false
        setLogoError(false)
      }, 1000)
    }
  }

  const [notificaciones, setNotificaciones] = useState([]);
  const [cantidadNoLeidas, setCantidadNoLeidas] = useState(0);

  // Función para obtener notificaciones del usuario
  const obtenerNotificaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/notificaciones/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotificaciones(data);
      }
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
    }
  };

  // Función para obtener contador de no leídas
  const obtenerContadorNoLeidas = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/notificaciones/user/contador-no-leidas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCantidadNoLeidas(data.count);
      }
    } catch (error) {
      console.error("Error al obtener contador:", error);
    }
  };

  // Función para marcar como leída
  const marcarComoLeida = async (notificacionId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}/marcar-leida`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await obtenerNotificaciones();
        await obtenerContadorNoLeidas();
      }
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  // Función para marcar todas como leídas
  const marcarTodasComoLeidas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/notificaciones/marcar-todas-leidas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await obtenerNotificaciones();
        await obtenerContadorNoLeidas();
      }
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaNotificacion = new Date(fecha);
    const diferencia = ahora - fechaNotificacion;

    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 60) {
      return `hace ${minutos} min`;
    } else if (horas < 24) {
      return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else {
      return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    }
  };

  // Función para obtener tipo de notificación
  const obtenerTipoNotificacion = (tipo) => {
    const tipos = {
      'ACTIVIDAD': 'meeting',
      'CUENTA_COBRAR': 'payment',
      'CUENTA_PAGAR': 'payment',
      'TRATO_GANADO': 'deal',
      'RECARGA': 'recharge',
      'CAMBIO_CONTRASENA': 'security',
      'ESCALAMIENTO': 'escalation'
    };
    return tipos[tipo] || 'default';
  };

  const obtenerTextoTipoNotificacion = (tipo) => {
    const tiposTexto = {
      'ACTIVIDAD': 'Actividad',
      'CUENTA_COBRAR': 'Cuenta por Cobrar',
      'CUENTA_PAGAR': 'Cuenta por Pagar',
      'TRATO_GANADO': 'Trato ganado',
      'RECARGA': 'Recarga',
      'CAMBIO_CONTRASENA': 'Cambio de Contraseña',
      'ESCALAMIENTO': 'Escalamiento'
    };
    return tiposTexto[tipo] || tipo;
  };

  // Effect para cargar notificaciones
  useEffect(() => {
    obtenerNotificaciones();
    obtenerContadorNoLeidas();

    // Actualizar cada 30 segundos
    const intervalo = setInterval(() => {
      obtenerContadorNoLeidas();
    }, 30000);

    return () => clearInterval(intervalo);
  }, []);


  // Maneja temporizador de inactividad
  useEffect(() => {
    const timeoutDuration = 30 * 60 * 1000 // 30 minutos
    const warningDuration = 28 * 60 * 1000 // 28 minutos

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
        localStorage.removeItem("cachedLogoUrl")
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

  // Cierra modales al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".header-notification-container")) {
        setIsNotificationModalOpen(false)
      }
      if (
        !event.target.closest(".has-dropdown") &&
        !event.target.closest(".ts-header-sidebar-section-header")
      ) {
        setIsCrmDropdownOpen(false)
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  // Formatea tiempo restante a MM:SS
  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Navega al calendario
  const handleCalendarClick = () => {
    navigate("/calendario")
  }

  // Alterna modal de notificaciones
  const handleNotificationClick = (e) => {
    e.stopPropagation()
    setIsNotificationModalOpen(!isNotificationModalOpen)
  }

  // Alterna menú lateral
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    document.body.style.overflow = !isSidebarOpen ? "hidden" : ""
  }

  const handleCrmToggle = (e) => {
    e.stopPropagation()
    if (e.type === "touchstart") {
      touchHandledRef.current = true
    }
    if (e.type === "click" && touchHandledRef.current) {
      return
    }
    setIsCrmDropdownOpen(!isCrmDropdownOpen)
    console.log(`${e.type} handled, isCrmDropdownOpen:`, !isCrmDropdownOpen)
    if (e.type === "touchstart") {
      setTimeout(() => {
        touchHandledRef.current = false
      }, 300)
    }
  }

  // Alterna desplegable de CRM
  const toggleCrmDropdown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsCrmDropdownOpen(!isCrmDropdownOpen)
    setIsProfileDropdownOpen(false)
  }

  // Alterna desplegable de perfil
  const toggleProfileDropdown = (e) => {
    e.stopPropagation()
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
      localStorage.removeItem("userId")
      localStorage.removeItem("cachedLogoUrl")
      // Limpiar caché global
      logoCache = { url: null, timestamp: null, isLoading: false, hasError: false }
      navigate("/")
    })
  }

  return (
    <>
      <header className="ts-header-navbar">
        <div className="ts-header-navbar-brand">
          <Link to="/principal" className="ts-header-logo-link">
            <div className="ts-header-logo">
              <img
                src={currentLogoUrl}
                alt="Logo de Tracking Solutions"
                style={{
                  transition: 'opacity 0.2s ease-in-out',
                  opacity: isLogoLoading ? 0.7 : 1
                }}
                onError={handleLogoError}
                onLoad={() => {
                  logoErrorHandled.current = false
                  setLogoError(false)
                }}
              />
            </div>
          </Link>
        </div>

        <button
          className={`ts-header-hamburger-menu ${isSidebarOpen ? "open" : ""}`}
          onClick={toggleSidebar}
          aria-label="Menú principal"
        >
          <span className="ts-header-hamburger-icon"></span>
        </button>

        {/* Menú de navegación para escritorio */}
        <nav className="ts-header-navbar-menu ts-header-desktop-menu">
          <ul>
            <li className="ts-header-has-dropdown">
              <a href="#" onClick={toggleCrmDropdown}>
                CRM{" "}
                <img
                  src={dropdownIcon || "/placeholder.svg"}
                  alt="Icono desplegable"
                  className={`ts-header-dropdown-arrow ${isCrmDropdownOpen ? "open" : ""}`}
                />
              </a>
              {isCrmDropdownOpen && (
                <ul className="ts-header-dropdown-menu">
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
                    <Link to="/reporte_personal" onClick={() => setIsCrmDropdownOpen(false)}>
                      Reporte personal
                    </Link>
                  </li>
                  <li>
                    <Link to="/metricas_generales" onClick={() => setIsCrmDropdownOpen(false)}>
                      Métricas Generales
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            {userRol === "ADMINISTRADOR" && (
              <li>
                <Link to="/admin_balance">Admin</Link>
              </li>
            )}
            <li>
              <Link to="/equipos_estatusplataforma">Equipos</Link>
            </li>
          </ul>
        </nav>

        <div className="ts-header-navbar-end">
          <button className="ts-header-icon-button" onClick={handleCalendarClick}>
            <img src={calendarIcon || "/placeholder.svg"} alt="Icono de Calendario" />
          </button>

          <div className="header-notification-container">
            <button className="ts-header-icon-button ts-header-notification" onClick={handleNotificationClick}>
              <img src={notificationIcon || "/placeholder.svg"} alt="Icono de Notificaciones" />
              {cantidadNoLeidas > 0 && (
                <span className="ts-header-notification-badge">
                  {cantidadNoLeidas > 99 ? '99+' : cantidadNoLeidas}
                </span>
              )}
            </button>

            {isNotificationModalOpen && (
              <div className="ts-header-notification-modal">
                <div className="ts-header-notification-header">
                  <h3>Notificaciones</h3>
                  <span className="ts-header-notification-count">{cantidadNoLeidas} sin leer</span>
                </div>
                <div className="ts-header-notification-list">
                  {notificaciones.length > 0 ? (
                    notificaciones.map((notificacion) => (
                      <div
                        key={notificacion.id}
                        className={`ts-header-notification-item ${notificacion.estatus === 'NO_LEIDA' ? 'unread' : ''}`}
                      >
                        <div className="ts-header-notification-content">
                          <div className="ts-header-notification-title">
                            {obtenerTextoTipoNotificacion(notificacion.tipoNotificacion)}
                          </div>
                          <div className="ts-header-notification-message">
                            {notificacion.mensaje}
                          </div>
                          <div className="ts-header-notification-time">
                            {formatearFecha(notificacion.fechaCreacion)}
                          </div>
                        </div>
                        <div className={`ts-header-notification-type ts-header-type-${obtenerTipoNotificacion(notificacion.tipoNotificacion)}`}></div>
                        {notificacion.estatus === 'NO_LEIDA' && (
                          <button
                            className="ts-header-notification-check-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLeida(notificacion.id);
                            }}
                            title="Marcar como leída"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="ts-header-notification-empty">
                      No tienes notificaciones
                    </div>
                  )}
                </div>
                <div className="ts-header-notification-footer">
                  <button
                    className="ts-header-notification-btn"
                    onClick={marcarTodasComoLeidas}
                  >
                    Marcar como leídas
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="ts-header-user-profile ts-header-has-dropdown" onClick={toggleProfileDropdown}>
            <img src={profilePlaceholder || "/placeholder.svg"} alt="Foto de perfil de usuario" />
            <span className="ts-header-username">{userName}</span>
            <img
              src={dropdownIcon || "/placeholder.svg"}
              alt="Icono de opciones desplegables"
              className={`ts-header-dropdown-icon ${isProfileDropdownOpen ? "open" : ""}`}
            />
            {isProfileDropdownOpen && (
              <ul className="ts-header-dropdown-menu ts-header-profile-dropdown">
                <li>
                  <a
                    href={HELP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    Ayuda
                  </a>
                </li>
                {userRol === "ADMINISTRADOR" && (
                  <li>
                    <Link to="/configuracion_plantillas" onClick={() => setIsProfileDropdownOpen(false)}>
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
      <div className={`ts-header-sidebar-overlay ${isSidebarOpen ? "active" : ""}`} onClick={toggleSidebar}></div>
      <div className={`ts-header-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="ts-header-sidebar-header">
          <div className="ts-header-sidebar-user">
            <img
              src={profilePlaceholder || "/placeholder.svg"}
              alt="Foto de perfil"
              className="ts-header-sidebar-avatar"
            />
            <div className="ts-header-sidebar-user-info">
              <span className="ts-header-sidebar-username">{userName}</span>
              <span className="ts-header-sidebar-role">{userRol}</span>
            </div>
          </div>
          <button className="ts-header-sidebar-close" onClick={toggleSidebar}>
            ×
          </button>
        </div>
        <nav className="ts-header-sidebar-menu">
          <div className="ts-header-sidebar-section">
            <div
              className="ts-header-sidebar-section-header"
              onClick={handleCrmToggle}
              onTouchStart={handleCrmToggle}
            >
              <span>CRM</span>
              <img
                src={dropdownIcon || "/placeholder.svg"}
                alt="Expandir"
                className={`ts-header-sidebar-dropdown-icon ${isCrmDropdownOpen ? "open" : ""}`}
              />
            </div>
            <ul className={`ts-header-sidebar-submenu ${isCrmDropdownOpen ? "open" : ""}`}>
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
                <Link to="/reporte_personal" onClick={toggleSidebar}>
                  Reporte personal
                </Link>
              </li>
              <li>
                <Link to="/metricas_generales" onClick={toggleSidebar}>
                  Métricas Generales
                </Link>
              </li>
            </ul>
          </div>
          {userRol === "ADMINISTRADOR" && (
            <div className="ts-header-sidebar-section">
              <Link to="/admin_balance" onClick={toggleSidebar} className="ts-header-sidebar-link">
                Admin
              </Link>
            </div>
          )}
          <div className="ts-header-sidebar-section">
            <Link to="/equipos_estatusplataforma" onClick={toggleSidebar} className="ts-header-sidebar-link">
              Equipos
            </Link>
          </div>
        </nav>
        <div className="ts-header-sidebar-footer">
          <a
            href={HELP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={toggleSidebar}
            className="ts-header-sidebar-footer-link"
          >
            Ayuda
          </a>
          {userRol === "ADMINISTRADOR" && (
            <Link to="/configuracion_plantillas" onClick={toggleSidebar} className="ts-header-sidebar-footer-link">
              Configuración
            </Link>
          )}
          <a
            href="#"
            className="ts-header-sidebar-footer-link logout"
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
        <div className="ts-header-inactivity-modal">
          <div className="ts-header-modal-content">
            <img src={clockIcon || "/placeholder.svg"} alt="Reloj" className="ts-header-modal-icon" />
            <h3>Advertencia de Inactividad</h3>
            <p>
              Tu sesión se cerrará por inactividad en{" "}
              <span className="ts-header-countdown">{formatTimeLeft(timeLeft)}</span>
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default Header