import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Configuracion_Copias.css"
import Header from "../Header/Header"
import downloadIcon from "../../assets/icons/descarga.png"
import alertIcon from "../../assets/icons/alerta.png"
import checkIcon from "../../assets/icons/comprobado.png"
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

const ConfiguracionCopias = () => {
  const [backupSettings, setBackupSettings] = useState({
    datosRespaldar: "todos",
    frecuencia: "diario",
    horaRespaldo: "02:00",
  })

  const [googleDriveSettings, setGoogleDriveSettings] = useState({
    email: "backup@trackingsmarts.com",
    vinculada: true,
  })

  const [backupHistory, setBackupHistory] = useState([
    {
      id: 1,
      numeroCopia: "01/04/2025",
      fechaCreacion: "2025-04-01T02:00:00Z",
      fechaEliminacion: "2025-07-01T02:00:00Z",
      estado: "completada",
      tamaño: "15.2 MB",
      tipo: "automatica",
    },
    {
      id: 2,
      numeroCopia: "31/03/2025",
      fechaCreacion: "2025-03-31T02:00:00Z",
      fechaEliminacion: "2025-06-30T02:00:00Z",
      estado: "completada",
      tamaño: "14.8 MB",
      tipo: "automatica",
    },
    {
      id: 3,
      numeroCopia: "30/03/2025",
      fechaCreacion: "2025-03-30T14:30:00Z",
      fechaEliminacion: "2025-06-29T14:30:00Z",
      estado: "completada",
      tamaño: "14.9 MB",
      tipo: "instantanea",
    },
  ])

  const navigate = useNavigate()

  const datosRespaldoOptions = [
    { value: "todos", label: "Todos" },
    { value: "tratos", label: "Tratos" },
    { value: "empresas", label: "Empresas" },
    { value: "contactos", label: "Contactos" },
  ]

  const frecuenciaOptions = [
    { value: "diario", label: "Diario" },
    { value: "semanal", label: "Semanal" },
    { value: "mensual", label: "Mensual" },
  ]

  const handleSettingChange = (field, value) => {
    setBackupSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGoogleDriveChange = (field, value) => {
    setGoogleDriveSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLinkGoogleDrive = async () => {
    if (googleDriveSettings.vinculada) {
      // Desvincular cuenta
      const result = await Swal.fire({
        title: "¿Desvincular cuenta?",
        text: "Se desvinculará la cuenta de Google Drive. Las copias futuras no se guardarán automáticamente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Desvincular",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#f44336",
      })

      if (result.isConfirmed) {
        setGoogleDriveSettings((prev) => ({
          ...prev,
          vinculada: false,
        }))
        Swal.fire({
          icon: "success",
          title: "Cuenta desvinculada",
          text: "La cuenta de Google Drive se ha desvinculado correctamente.",
        })
      }
    } else {
      // Vincular cuenta
      Swal.fire({
        title: "Vinculando cuenta...",
        text: "Redirigiendo a Google Drive para autenticación.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // Simular proceso de vinculación
      setTimeout(() => {
        setGoogleDriveSettings((prev) => ({
          ...prev,
          vinculada: true,
        }))
        Swal.fire({
          icon: "success",
          title: "Cuenta vinculada",
          text: "La cuenta de Google Drive se ha vinculado correctamente.",
        })
      }, 2000)
    }
  }

  const handleGenerateInstantBackup = async () => {
    const result = await Swal.fire({
      title: "¿Generar copia instantánea?",
      text: `Se generará una copia de seguridad de ${datosRespaldoOptions.find((d) => d.value === backupSettings.datosRespaldar)?.label} inmediatamente.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Generar",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Generando copia de seguridad...",
          text: "Por favor espere mientras se genera la copia.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })

        // Simular tiempo de procesamiento
        setTimeout(() => {
          const now = new Date()
          const fechaEliminacion = new Date(now)
          fechaEliminacion.setMonth(fechaEliminacion.getMonth() + 3)

          const nuevaCopia = {
            id: Date.now(),
            numeroCopia: now.toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            fechaCreacion: now.toISOString(),
            fechaEliminacion: fechaEliminacion.toISOString(),
            estado: "completada",
            tamaño: `${(Math.random() * 5 + 10).toFixed(1)} MB`,
            tipo: "instantanea",
          }

          setBackupHistory((prev) => [nuevaCopia, ...prev])

          Swal.fire({
            icon: "success",
            title: "Copia generada",
            text: "La copia de seguridad se ha generado correctamente y está disponible para descarga.",
          })
        }, 3000)
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al generar la copia de seguridad.",
        })
      }
    }
  }

  const handleDownloadBackup = (backup, format) => {
    Swal.fire({
      icon: "info",
      title: "Descargando copia",
      text: `Descargando copia ${backup.numeroCopia} en formato ${format.toUpperCase()}...`,
      showConfirmButton: false,
      timer: 2000,
    })
  }

  const handleRestoreBackup = async (backup) => {
    const result = await Swal.fire({
      title: "¿Restaurar copia de seguridad?",
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Copia:</strong> ${backup.numeroCopia}</p>
          <p><strong>Fecha de creación:</strong> ${formatDate(backup.fechaCreacion)}</p>
          <p><strong>Tamaño:</strong> ${backup.tamaño}</p>
        </div>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 12px; margin: 15px 0;">
          <strong>⚠️ Advertencia:</strong> Esta acción sobrescribirá todos los datos actuales del sistema. Esta acción no se puede deshacer.
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Restaurar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f44336",
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Restaurando datos...",
          text: "Por favor espere mientras se restauran los datos. No cierre la aplicación.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })

        // Simular tiempo de procesamiento
        setTimeout(() => {
          Swal.fire({
            icon: "success",
            title: "Datos restaurados",
            text: "Los datos se han restaurado correctamente desde la copia de seguridad.",
          })
        }, 4000)
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al restaurar la copia de seguridad.",
        })
      }
    }
  }

  const handleDeleteBackup = async (backupId) => {
    const backup = backupHistory.find((b) => b.id === backupId)

    const result = await Swal.fire({
      title: "¿Eliminar copia de seguridad?",
      text: `¿Está seguro de que desea eliminar la copia ${backup.numeroCopia}? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f44336",
    })

    if (result.isConfirmed) {
      setBackupHistory((prev) => prev.filter((b) => b.id !== backupId))
      Swal.fire({
        icon: "success",
        title: "Copia eliminada",
        text: "La copia de seguridad se ha eliminado correctamente.",
      })
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <>
      <Header />
      {/* Configuration Navigation */}
      <div className="config-copias-config-header">
        <h2 className="config-copias-config-title">Configuración</h2>
        <nav className="config-copias-config-nav">
          <div className="config-copias-nav-item" onClick={() => navigate("/configuracion_plantillas")}>
            Plantillas de correo
          </div>
          <div className="config-copias-nav-item" onClick={() => navigate("/configuracion_admin_datos")}>
            Administrador de datos
          </div>
          <div className="config-copias-nav-item" onClick={() => navigate("/configuracion_empresa")}>
            Configuración de la empresa
          </div>
          <div className="config-copias-nav-item" onClick={() => navigate("/configuracion_almacenamiento")}>
            Almacenamiento
          </div>
          <div className="config-copias-nav-item config-copias-nav-item-active">Copias de Seguridad</div>
          <div className="config-copias-nav-item" onClick={() => navigate("/configuracion_usuarios")}>
            Usuarios y roles
          </div>
        </nav>
      </div>

      <main className="config-copias-main-content">
        <div className="config-copias-container">
          <section className="config-copias-section">
            <h3 className="config-copias-section-title">Copia de seguridad</h3>

            {/* Information Box */}
            <div className="config-copias-info-box">
              <div className="config-copias-info-icon">
                <img src={alertIcon || "/placeholder.svg"} alt="Información" />
              </div>
              <div className="config-copias-info-content">
                <strong>Información</strong>
                <p>
                  El sistema guarda automáticamente una copia de seguridad de los registros y están disponibles para
                  descargar o restaurar durante 3 meses.
                </p>
              </div>
            </div>

            <div className="config-copias-form-row">
              {/* Left Column - Backup Settings */}
              <div className="config-copias-left-column">
                <div className="config-copias-form-group">
                  <label htmlFor="datos-respaldar">Datos a respaldar</label>
                  <select
                    id="datos-respaldar"
                    value={backupSettings.datosRespaldar}
                    onChange={(e) => handleSettingChange("datosRespaldar", e.target.value)}
                    className="config-copias-form-control"
                  >
                    {datosRespaldoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="config-copias-form-group">
                  <label htmlFor="frecuencia-respaldo">Frecuencia de respaldo</label>
                  <select
                    id="frecuencia-respaldo"
                    value={backupSettings.frecuencia}
                    onChange={(e) => handleSettingChange("frecuencia", e.target.value)}
                    className="config-copias-form-control"
                  >
                    {frecuenciaOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="config-copias-form-group">
                  <label htmlFor="hora-respaldo">Hora de respaldo</label>
                  <input
                    type="time"
                    id="hora-respaldo"
                    value={backupSettings.horaRespaldo}
                    onChange={(e) => handleSettingChange("horaRespaldo", e.target.value)}
                    className="config-copias-form-control"
                  />
                </div>
              </div>

              {/* Right Column - Google Drive Settings */}
              <div className="config-copias-right-column">
                <div className="config-copias-google-drive-section">
                  <label>Cuenta de Google Drive</label>
                  <div className="config-copias-drive-input-group">
                    <input
                      type="email"
                      value={googleDriveSettings.email}
                      onChange={(e) => handleGoogleDriveChange("email", e.target.value)}
                      className="config-copias-form-control"
                      placeholder="correo@ejemplo.com"
                      disabled={googleDriveSettings.vinculada}
                    />
                    <button
                      className={`config-copias-btn ${googleDriveSettings.vinculada ? "config-copias-btn-secondary" : "config-copias-btn-primary"}`}
                      onClick={handleLinkGoogleDrive}
                    >
                      {googleDriveSettings.vinculada ? "Desvincular" : "Vincular"}
                    </button>
                  </div>

                  {googleDriveSettings.vinculada && (
                    <div className="config-copias-drive-status">
                      <div className="config-copias-status-icon">
                        <img src={checkIcon || "/placeholder.svg"} alt="Vinculada" />
                      </div>
                      <div className="config-copias-status-content">
                        <strong>Cuenta vinculada</strong>
                        <p>Las copias se guardarán automáticamente a Google Drive</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Backup History Table */}
            <div className="config-copias-history-section">
              <div className="config-copias-history-header">
                <h4>Historial de copias de seguridad</h4>
                <button className="config-copias-btn config-copias-btn-instant" onClick={handleGenerateInstantBackup}>
                  <img src={downloadIcon || "/placeholder.svg"} alt="Generar" className="config-copias-btn-icon" />
                  Generar copia instantánea
                </button>
              </div>

              <div className="config-copias-table-container">
                <table className="config-copias-table">
                  <thead>
                    <tr>
                      <th>Número de copia</th>
                      <th>Fecha de creación</th>
                      <th>Fecha de eliminación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((backup) => (
                      <tr key={backup.id}>
                        <td>{backup.numeroCopia}</td>
                        <td>{formatDateShort(backup.fechaCreacion)}</td>
                        <td>{formatDateShort(backup.fechaEliminacion)}</td>
                        <td>
                          <div className="config-copias-action-buttons">
                            <button
                              className="config-copias-action-btn config-copias-csv-btn"
                              onClick={() => handleDownloadBackup(backup, "csv")}
                              title="Descargar CSV"
                            >
                              CSV
                            </button>
                            <button
                              className="config-copias-action-btn config-copias-pdf-btn"
                              onClick={() => handleDownloadBackup(backup, "pdf")}
                              title="Descargar PDF"
                            >
                              PDF
                            </button>
                            <button
                              className="config-copias-action-btn config-copias-restore-btn"
                              onClick={() => handleRestoreBackup(backup)}
                              title="Restaurar"
                            >
                              Restaurar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default ConfiguracionCopias
