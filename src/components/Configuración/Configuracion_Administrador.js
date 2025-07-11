import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Configuracion_Administrador.css"
import Header from "../Header/Header"
import downloadIcon from "../../assets/icons/descarga.png"
import alertIcon from "../../assets/icons/alerta.png"
import uploadIcon from "../../assets/icons/subir.png"
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

const ConfiguracionAdministrador = () => {
  const [importData, setImportData] = useState({
    tiposDatos: "tratos",
    archivo: null,
  })

  const [exportData, setExportData] = useState({
    tiposDatos: "tratos",
    formato: "csv",
    fechaInicio: "",
    fechaFin: "",
  })

  const [exportHistory, setExportHistory] = useState([
    {
      id: 1,
      tipo: "tratos",
      formato: "csv",
      fecha: "2024-01-20T10:30:00Z",
      nombre: "Exportación de tratos - 20/01/2024",
      tamaño: "2.5 MB",
    },
    {
      id: 2,
      tipo: "empresas",
      formato: "pdf",
      fecha: "2024-01-18T14:15:00Z",
      nombre: "Exportación de empresas - 18/01/2024",
      tamaño: "1.8 MB",
    },
    {
      id: 3,
      tipo: "contactos",
      formato: "csv",
      fecha: "2024-01-15T09:45:00Z",
      nombre: "Exportación de contactos - 15/01/2024",
      tamaño: "3.2 MB",
    },
  ])

  const navigate = useNavigate()

  const tiposDatosOptions = [
    { value: "tratos", label: "Tratos" },
    { value: "empresas", label: "Empresas" },
    { value: "contactos", label: "Contactos" },
    { value: "modelos", label: "Modelos" },
    { value: "proveedores", label: "Proveedores" },
    { value: "equipos", label: "Equipos" },
    { value: "sims", label: "Sims" },
    { value: "historialSaldos", label: "Historial de saldos" },
  ]

  const formatosExportacion = [
    { value: "csv", label: "CSV" },
    { value: "pdf", label: "PDF" },
  ]

  const handleImportInputChange = (field, value) => {
    setImportData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleExportInputChange = (field, value) => {
    setExportData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        Swal.fire({
          icon: "error",
          title: "Formato incorrecto",
          text: "Solo se permiten archivos CSV.",
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "Archivo muy grande",
          text: "El archivo no debe exceder 10MB.",
        })
        return
      }
      setImportData((prev) => ({
        ...prev,
        archivo: file,
      }))
    }
  }

  const handleDownloadTemplate = () => {
    const tipoSeleccionado = tiposDatosOptions.find((tipo) => tipo.value === importData.tiposDatos)

    Swal.fire({
      icon: "info",
      title: "Descargando plantilla",
      text: `Descargando plantilla específica para ${tipoSeleccionado.label}...`,
      showConfirmButton: false,
      timer: 2000,
    }).then(() => {
      Swal.fire({
        icon: "success",
        title: "Plantilla descargada",
        text: `La plantilla para ${tipoSeleccionado.label} se ha descargado correctamente.`,
      })
    })
  }

  const handleImportData = async () => {
    if (!importData.archivo) {
      Swal.fire({
        icon: "warning",
        title: "Archivo requerido",
        text: "Por favor seleccione un archivo CSV para importar.",
      })
      return
    }

    try {
      const result = await Swal.fire({
        title: "¿Importar datos?",
        text: `¿Está seguro de que desea importar los datos desde el archivo "${importData.archivo.name}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Importar",
        cancelButtonText: "Cancelar",
      })

      if (result.isConfirmed) {
        // Simular proceso de importación
        Swal.fire({
          title: "Importando datos...",
          text: "Por favor espere mientras se procesan los datos.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })

        // Simular tiempo de procesamiento
        setTimeout(() => {
          Swal.fire({
            icon: "success",
            title: "Datos importados",
            text: `Los datos de ${importData.tiposDatos} se han importado correctamente.`,
          })

          // Limpiar formulario
          setImportData({
            tiposDatos: "tratos",
            archivo: null,
          })
        }, 3000)
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al importar los datos.",
      })
    }
  }

  const handleExportData = async () => {
    try {
      const result = await Swal.fire({
        title: "¿Exportar datos?",
        text: `¿Está seguro de que desea exportar los datos de ${exportData.tiposDatos} en formato ${exportData.formato.toUpperCase()}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Exportar",
        cancelButtonText: "Cancelar",
      })

      if (result.isConfirmed) {
        // Simular proceso de exportación
        Swal.fire({
          title: "Exportando datos...",
          text: "Por favor espere mientras se genera el archivo.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })

        // Simular tiempo de procesamiento
        setTimeout(() => {
          const fechaActual = new Date()
          const fechaFormateada = fechaActual.toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })

          const nuevaExportacion = {
            id: Date.now(),
            tipo: exportData.tiposDatos,
            formato: exportData.formato,
            fecha: fechaActual.toISOString(),
            nombre: `Exportación de ${exportData.tiposDatos} - ${fechaFormateada}`,
            tamaño: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
          }

          setExportHistory((prev) => [nuevaExportacion, ...prev])

          Swal.fire({
            icon: "success",
            title: "Datos exportados",
            text: `Los datos se han exportado correctamente y están disponibles en el historial.`,
          })
        }, 2500)
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al exportar los datos.",
      })
    }
  }

  const handleDownloadExport = (exportItem) => {
    Swal.fire({
      icon: "info",
      title: "Descargando archivo",
      text: `Descargando ${exportItem.nombre}...`,
      showConfirmButton: false,
      timer: 1500,
    })
  }

  const handleDeleteExport = async (exportId) => {
    const exportItem = exportHistory.find((item) => item.id === exportId)

    const result = await Swal.fire({
      title: "¿Eliminar exportación?",
      text: `¿Está seguro de que desea eliminar "${exportItem.nombre}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f44336",
    })

    if (result.isConfirmed) {
      setExportHistory((prev) => prev.filter((item) => item.id !== exportId))
      Swal.fire({
        icon: "success",
        title: "Exportación eliminada",
        text: "La exportación se ha eliminado correctamente.",
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

  const getDataTypeInfo = (tipo) => {
    const infoMap = {
      tratos: {
        campos:
          "Nombre de la Empresa, Contacto de la Empresa, Sector y características del Trato, Correo de Contacto y Teléfono de Contacto",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      empresas: {
        campos: "Nombre, Estatus, Sitio Web, Sector, Domicilio Físico, RFC, Razón Social",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      contactos: {
        campos: "Nombre, Empresa, Correos, Teléfonos, Celular, Rol",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
    }
    return infoMap[tipo] || infoMap.tratos
  }

  return (
    <>
      <Header />
      {/* Configuration Navigation */}
      <div className="config-admin-config-header">
        <h2 className="config-admin-config-title">Configuración</h2>
        <nav className="config-admin-config-nav">
          <div className="config-admin-nav-item" onClick={() => navigate("/configuracion_plantillas")}>
            Plantillas de correo
          </div>
          <div className="config-admin-nav-item config-admin-nav-item-active">Administrador de datos</div>
          <div className="config-admin-nav-item" onClick={() => navigate("/configuracion_empresa")}>
            Configuración de la empresa
          </div>
          <div className="config-admin-nav-item" onClick={() => navigate("/configuracion_almacenamiento")}>
            Almacenamiento
          </div>
          <div className="config-admin-nav-item" onClick={() => navigate("/configuracion_copias_seguridad")}>
            Copias de Seguridad
          </div>
          <div className="config-admin-nav-item" onClick={() => navigate("/configuracion_usuarios")}>
            Usuarios y roles
          </div>
        </nav>
      </div>

      <main className="config-admin-main-content">
        <div className="config-admin-container">
          {/* Importar Datos */}
          <section className="config-admin-section">
            <h3 className="config-admin-section-title">Importar datos</h3>

            <div className="config-admin-form-group">
              <label htmlFor="import-tipos-datos">Tipos de datos</label>
              <select
                id="import-tipos-datos"
                value={importData.tiposDatos}
                onChange={(e) => handleImportInputChange("tiposDatos", e.target.value)}
                className="config-admin-form-control"
              >
                {tiposDatosOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-admin-template-section">
              <label>Plantilla de importación</label>
              <button className="config-admin-btn config-admin-btn-template" onClick={handleDownloadTemplate}>
                <img src={downloadIcon || "/placeholder.svg"} alt="Descargar" className="config-admin-btn-icon" />
                Descargar plantilla específica
              </button>
            </div>

            <div className="config-admin-file-upload-area">
              <div className="config-admin-file-drop-zone">
                <div className="config-admin-upload-icon">
                  <img src={uploadIcon || "/placeholder.svg"} alt="Upload" />
                </div>
                <p>Arrastra y suelta un archivo CSV aquí</p>
                <p className="config-admin-file-formats">o haz clic para seleccionar un archivo</p>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="config-admin-file-input" />
                {importData.archivo && (
                  <div className="config-admin-selected-file">
                    <span>📄 {importData.archivo.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="config-admin-info-box">
              <div className="config-admin-info-icon">
                <img src={alertIcon || "/placeholder.svg"} alt="Info" />
              </div>
              <div className="config-admin-info-content">
                <strong>Formato de archivo</strong>
                <p>{getDataTypeInfo(importData.tiposDatos).descripcion}</p>
                <p>{getDataTypeInfo(importData.tiposDatos).campos}</p>
              </div>
            </div>

            <div className="config-admin-form-actions">
              <button className="config-admin-btn config-admin-btn-primary" onClick={handleImportData}>
                Importar datos
              </button>
            </div>
          </section>

          {/* Exportar Datos */}
          <section className="config-admin-section">
            <h3 className="config-admin-section-title">Exportar datos</h3>

            <div className="config-admin-form-row">
              <div className="config-admin-form-group">
                <label htmlFor="export-tipos-datos">Tipos de datos</label>
                <select
                  id="export-tipos-datos"
                  value={exportData.tiposDatos}
                  onChange={(e) => handleExportInputChange("tiposDatos", e.target.value)}
                  className="config-admin-form-control"
                >
                  {tiposDatosOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-admin-form-group">
                <label htmlFor="export-formato">Formato de exportación</label>
                <select
                  id="export-formato"
                  value={exportData.formato}
                  onChange={(e) => handleExportInputChange("formato", e.target.value)}
                  className="config-admin-form-control"
                >
                  {formatosExportacion.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="config-admin-date-range-section">
              <label>Rango de fechas (opcional)</label>
              <div className="config-admin-date-row">
                <input
                  type="date"
                  value={exportData.fechaInicio}
                  onChange={(e) => handleExportInputChange("fechaInicio", e.target.value)}
                  className="config-admin-form-control config-admin-date-input"
                  placeholder="dd/mm/aaaa"
                />
                <input
                  type="date"
                  value={exportData.fechaFin}
                  onChange={(e) => handleExportInputChange("fechaFin", e.target.value)}
                  className="config-admin-form-control config-admin-date-input"
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <small className="config-admin-help-text">Deja en blanco para exportar todos los datos</small>
            </div>

            <div className="config-admin-form-actions">
              <button className="config-admin-btn config-admin-btn-primary" onClick={handleExportData}>
                Exportar datos
              </button>
            </div>
          </section>

          {/* Historial de Exportaciones */}
          <section className="config-admin-section">
            <h3 className="config-admin-section-title">Historial de exportaciones</h3>

            <div className="config-admin-export-history">
              {exportHistory.length > 0 ? (
                <div className="config-admin-history-list">
                  {exportHistory.map((exportItem) => (
                    <div key={exportItem.id} className="config-admin-history-item">
                      <div className="config-admin-history-info">
                        <h4>{exportItem.nombre}</h4>
                        <div className="config-admin-history-details">
                          <span className="config-admin-history-type">
                            {tiposDatosOptions.find((t) => t.value === exportItem.tipo)?.label} -{" "}
                            {exportItem.formato.toUpperCase()}
                          </span>
                          <span className="config-admin-history-size">{exportItem.tamaño}</span>
                          <span className="config-admin-history-date">{formatDate(exportItem.fecha)}</span>
                        </div>
                      </div>
                      <div className="config-admin-history-actions">
                        <button
                          className="config-admin-btn-action config-admin-download"
                          onClick={() => handleDownloadExport(exportItem)}
                          title="Descargar"
                        >
                          <img src={downloadIcon || "/placeholder.svg"} alt="Descargar" />
                        </button>
                        <button
                          className="config-admin-btn-action config-admin-delete"
                          onClick={() => handleDeleteExport(exportItem.id)}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="config-admin-no-history">
                  <p>No hay exportaciones en el historial</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default ConfiguracionAdministrador
