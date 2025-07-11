import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Configuracion_Almacenamiento.css"
import Header from "../Header/Header"
import warningIcon from "../../assets/icons/advertencia.png"
import deleteIcon from "../../assets/icons/eliminar.png"
import { API_BASE_URL } from "../Config/Config";
import Swal from "sweetalert2"

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
  return response;
};

const ConfiguracionAlmacenamiento = () => {
  const [storageData, setStorageData] = useState([
    {
      id: 1,
      modulo: "Llamadas",
      cantidad: 937,
      almacenaje: 1.83,
      unidad: "MB",
      color: "#037ce0",
    },
    {
      id: 2,
      modulo: "Notas",
      cantidad: 1720,
      almacenaje: 2.68,
      unidad: "MB",
      color: "#f27100",
    },
    {
      id: 3,
      modulo: "Empresas",
      cantidad: 465,
      almacenaje: 930,
      unidad: "kB",
      color: "#9c16f7",
    },
    {
      id: 4,
      modulo: "Tratos",
      cantidad: 450,
      almacenaje: 858,
      unidad: "kB",
      color: "#38b6ff",
    },
    {
      id: 5,
      modulo: "Tareas",
      cantidad: 44,
      almacenaje: 210,
      unidad: "kB",
      color: "#af86ff",
    },
    {
      id: 6,
      modulo: "Reuniones",
      cantidad: 0,
      almacenaje: 0,
      unidad: "kB",
      color: "#2a5cf8",
    },
    {
      id: 7,
      modulo: "Correos electrónicos",
      cantidad: 56,
      almacenaje: 246,
      unidad: "kB",
      color: "#00347f",
    },
  ])

  const [cleanupSettings, setCleanupSettings] = useState({
    tipoRegistros: "empresas",
    antiguedadMinima: "6meses",
  })

  const [cleanupStats, setCleanupStats] = useState({
    cantidadRegistros: 1643,
    almacenajeTotal: 5,
    porcentajeRecuperado: 2,
  })

  const [totalUsage, setTotalUsage] = useState({
    used: 64,
    available: 36,
    totalSpaceMB: 100,
  })

  const navigate = useNavigate()

  const tiposRegistrosOptions = [
    { value: "empresas", label: "Empresas" },
    { value: "tratos", label: "Tratos" },
    { value: "contactos", label: "Contactos" },
    { value: "notas", label: "Notas" },
    { value: "correos", label: "Correos electrónicos" },
    { value: "llamadas", label: "Llamadas" },
    { value: "tareas", label: "Tareas" },
  ]

  const antiguedadOptions = [
    { value: "3meses", label: "Más de 3 meses" },
    { value: "6meses", label: "Más de 6 meses" },
    { value: "1año", label: "Más de 1 año" },
    { value: "2años", label: "Más de 2 años" },
  ]

  useEffect(() => {
    // Simular cálculo de estadísticas de limpieza basado en la selección
    const calculateCleanupStats = () => {
      const baseStats = {
        empresas: { cantidad: 1643, almacenaje: 5, porcentaje: 2 },
        tratos: { cantidad: 892, almacenaje: 3.2, porcentaje: 1.5 },
        contactos: { cantidad: 2156, almacenaje: 7.8, porcentaje: 3.1 },
        notas: { cantidad: 3421, almacenaje: 12.5, porcentaje: 4.8 },
        correos: { cantidad: 156, almacenaje: 1.2, porcentaje: 0.5 },
        llamadas: { cantidad: 234, almacenaje: 2.1, porcentaje: 0.8 },
        tareas: { cantidad: 89, almacenaje: 0.8, porcentaje: 0.3 },
      }

      const multipliers = {
        "3meses": 0.6,
        "6meses": 1.0,
        "1año": 1.4,
        "2años": 1.8,
      }

      const base = baseStats[cleanupSettings.tipoRegistros]
      const multiplier = multipliers[cleanupSettings.antiguedadMinima]

      setCleanupStats({
        cantidadRegistros: Math.round(base.cantidad * multiplier),
        almacenajeTotal: Math.round(base.almacenaje * multiplier * 10) / 10,
        porcentajeRecuperado: Math.round(base.porcentaje * multiplier * 10) / 10,
      })
    }

    calculateCleanupStats()
  }, [cleanupSettings])

  const handleCleanupSettingChange = (field, value) => {
    setCleanupSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDeleteSelected = async () => {
    const tipoSeleccionado = tiposRegistrosOptions.find((tipo) => tipo.value === cleanupSettings.tipoRegistros)
    const antiguedadSeleccionada = antiguedadOptions.find((ant) => ant.value === cleanupSettings.antiguedadMinima)

    const result = await Swal.fire({
      title: "¿Eliminar registros seleccionados?",
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Tipo:</strong> ${tipoSeleccionado.label}</p>
          <p><strong>Antigüedad:</strong> ${antiguedadSeleccionada.label}</p>
          <p><strong>Registros a eliminar:</strong> ${cleanupStats.cantidadRegistros.toLocaleString()}</p>
          <p><strong>Espacio a recuperar:</strong> ${cleanupStats.almacenajeTotal} MB</p>
        </div>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 12px; margin: 15px 0;">
          <strong> Advertencia:</strong> Esta acción no se puede deshacer. Los registros eliminados no podrán ser recuperados.
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f44336",
      customClass: {
        popup: "config-almacenamiento-swal-popup",
      },
    })

    if (result.isConfirmed) {
      try {
        // Simular proceso de eliminación
        Swal.fire({
          title: "Eliminando registros...",
          text: "Por favor espere mientras se eliminan los registros seleccionados.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })

        // Simular tiempo de procesamiento
        setTimeout(() => {
          // Actualizar datos de almacenamiento
          const newUsedPercentage = Math.max(totalUsage.used - cleanupStats.porcentajeRecuperado, 10)
          setTotalUsage((prev) => ({
            ...prev,
            used: newUsedPercentage,
            available: 100 - newUsedPercentage,
          }))

          // Actualizar datos del módulo específico
          setStorageData((prev) =>
            prev.map((item) => {
              if (item.modulo.toLowerCase().includes(cleanupSettings.tipoRegistros)) {
                const reductionFactor = 0.7 // Reducir en 30%
                return {
                  ...item,
                  cantidad: Math.round(item.cantidad * reductionFactor),
                  almacenaje: Math.round(item.almacenaje * reductionFactor * 100) / 100,
                }
              }
              return item
            }),
          )

          Swal.fire({
            icon: "success",
            title: "Registros eliminados",
            html: `
              <p>Se han eliminado <strong>${cleanupStats.cantidadRegistros.toLocaleString()}</strong> registros.</p>
              <p>Espacio recuperado: <strong>${cleanupStats.almacenajeTotal} MB</strong></p>
            `,
          })
        }, 3000)
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al eliminar los registros.",
        })
      }
    }
  }

  const formatStorage = (value, unit) => {
    if (value === 0) return "0 kB"
    if (unit === "MB") {
      return `${value} MB`
    } else {
      return value >= 1000 ? `${(value / 1000).toFixed(2)} MB` : `${value} kB`
    }
  }

  const getTotalStorageUsed = () => {
    return storageData.reduce((total, item) => {
      const valueInMB = item.unidad === "MB" ? item.almacenaje : item.almacenaje / 1000
      return total + valueInMB
    }, 0)
  }

  return (
    <>
      <Header />
      {/* Configuration Navigation */}
      <div className="config-almacenamiento-config-header">
        <h2 className="config-almacenamiento-config-title">Configuración</h2>
        <nav className="config-almacenamiento-config-nav">
          <div className="config-almacenamiento-nav-item" onClick={() => navigate("/configuracion_plantillas")}>
            Plantillas de correo
          </div>
          <div className="config-almacenamiento-nav-item" onClick={() => navigate("/configuracion_admin_datos")}>
            Administrador de datos
          </div>
          <div className="config-almacenamiento-nav-item" onClick={() => navigate("/configuracion_empresa")}>
            Configuración de la empresa
          </div>
          <div className="config-almacenamiento-nav-item config-almacenamiento-nav-item-active">Almacenamiento</div>
          <div className="config-almacenamiento-nav-item" onClick={() => navigate("/configuracion_copias_seguridad")}>
            Copias de Seguridad
          </div>
          <div className="config-almacenamiento-nav-item" onClick={() => navigate("/configuracion_usuarios")}>
            Usuarios y roles
          </div>
        </nav>
      </div>

      <main className="config-almacenamiento-main-content">
        <div className="config-almacenamiento-container">
          {/* Storage Usage Section */}
          <section className="config-almacenamiento-section">
            <h3 className="config-almacenamiento-section-title">Uso de almacenamiento</h3>

            <div className="config-almacenamiento-usage-bar">
              <div className="config-almacenamiento-usage-labels">
                <span className="config-almacenamiento-used-label">Espacio total utilizado ({totalUsage.used}%)</span>
                <span className="config-almacenamiento-available-label">
                  Espacio total disponible ({totalUsage.available}%)
                </span>
              </div>
              <div className="config-almacenamiento-progress-bar">
                <div
                  className={`config-almacenamiento-progress-fill config-almacenamiento-progress-${Math.round(totalUsage.used / 10) * 10}`}
                ></div>
              </div>
            </div>

            <div className="config-almacenamiento-content-row">
              {/* Storage Details */}
              <div className="config-almacenamiento-details-section">
                <h4 className="config-almacenamiento-subsection-title">Detalles de uso</h4>
                <div className="config-almacenamiento-details-table">
                  <div className="config-almacenamiento-table-header">
                    <div className="config-almacenamiento-header-cell">Nombre del módulo</div>
                    <div className="config-almacenamiento-header-cell">Cantidad de registros</div>
                    <div className="config-almacenamiento-header-cell">Almacenaje</div>
                  </div>
                  <div className="config-almacenamiento-table-body">
                    {storageData.map((item) => (
                      <div key={item.id} className="config-almacenamiento-table-row">
                        <div className="config-almacenamiento-cell config-almacenamiento-module-cell">
                          <div
                            className={`config-almacenamiento-module-indicator config-almacenamiento-module-${item.modulo.toLowerCase().replace(/\s+/g, "-").replace("ó", "o")}`}
                          ></div>
                          {item.modulo}
                        </div>
                        <div className="config-almacenamiento-cell">{item.cantidad.toLocaleString()}</div>
                        <div className="config-almacenamiento-cell">{formatStorage(item.almacenaje, item.unidad)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Storage Cleanup */}
              <div className="config-almacenamiento-cleanup-section">
                <h4 className="config-almacenamiento-subsection-title">Limpiar almacenamiento</h4>

                <div className="config-almacenamiento-warning-box">
                  <div className="config-almacenamiento-warning-icon">
                    <img src={warningIcon || "/placeholder.svg"} alt="Advertencia" />
                  </div>
                  <div className="config-almacenamiento-warning-content">
                    <strong>Advertencia</strong>
                    <p>
                      La eliminación de registros es permanente y no se puede deshacer. Los tratos en fase "Perdido" se
                      eliminan automáticamente después de 3 meses, pero antes se guardan en una copia de seguridad.
                    </p>
                  </div>
                </div>

                <div className="config-almacenamiento-cleanup-form">
                  <div className="config-almacenamiento-form-group">
                    <label htmlFor="tipo-registros">Tipo de registros</label>
                    <select
                      id="tipo-registros"
                      value={cleanupSettings.tipoRegistros}
                      onChange={(e) => handleCleanupSettingChange("tipoRegistros", e.target.value)}
                      className="config-almacenamiento-form-control"
                    >
                      {tiposRegistrosOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-almacenamiento-form-group">
                    <label htmlFor="antiguedad-minima">Antigüedad mínima</label>
                    <select
                      id="antiguedad-minima"
                      value={cleanupSettings.antiguedadMinima}
                      onChange={(e) => handleCleanupSettingChange("antiguedadMinima", e.target.value)}
                      className="config-almacenamiento-form-control"
                    >
                      {antiguedadOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-almacenamiento-cleanup-stats">
                    <div className="config-almacenamiento-stat-item">
                      <span className="config-almacenamiento-stat-label">Cantidad de registros</span>
                      <span className="config-almacenamiento-stat-value">
                        {cleanupStats.cantidadRegistros.toLocaleString()}
                      </span>
                    </div>
                    <div className="config-almacenamiento-stat-item">
                      <span className="config-almacenamiento-stat-label">Almacenaje total</span>
                      <span className="config-almacenamiento-stat-value">{cleanupStats.almacenajeTotal} MB</span>
                    </div>
                    <div className="config-almacenamiento-stat-item">
                      <span className="config-almacenamiento-stat-label">Porcentaje recuperado</span>
                      <span className="config-almacenamiento-stat-value">{cleanupStats.porcentajeRecuperado}%</span>
                    </div>
                  </div>

                  <div className="config-almacenamiento-cleanup-actions">
                    <button
                      className="config-almacenamiento-btn config-almacenamiento-btn-danger"
                      onClick={handleDeleteSelected}
                      disabled={cleanupStats.cantidadRegistros === 0}
                    >
                      <img
                        src={deleteIcon || "/placeholder.svg"}
                        alt="Eliminar"
                        className="config-almacenamiento-delete-icon"
                      />
                      Eliminar seleccionados
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default ConfiguracionAlmacenamiento
