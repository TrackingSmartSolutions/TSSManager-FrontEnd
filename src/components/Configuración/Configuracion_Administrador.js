import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import "./Configuracion_Administrador.css"
import Header from "../Header/Header"
import downloadIcon from "../../assets/icons/descarga.png"
import alertIcon from "../../assets/icons/alerta.png"
import uploadIcon from "../../assets/icons/subir.png"
import { API_BASE_URL } from "../Config/Config";
import Swal from "sweetalert2"

const fetchWithToken = async (url, options = {}, parseAsJson = true) => {
  const token = localStorage.getItem("token");
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!options.body || !(options.body instanceof FormData)) {
    if (parseAsJson) {
      headers["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
  }
  return parseAsJson ? response.json() : response;
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

  const [exportHistory, setExportHistory] = useState([]);
  const [importHistory, setImportHistory] = useState([]);

  const navigate = useNavigate()

  const tiposDatosOptions = [
    { value: "tratos", label: "Tratos" },
    { value: "empresas", label: "Empresas" },
    { value: "contactos", label: "Contactos" },
    { value: "correoContactos", label: "Correos de los contactos" },
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

  const handleDownloadTemplate = async () => {
    const tipoSeleccionado = tiposDatosOptions.find((tipo) => tipo.value === importData.tiposDatos);

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/administrador-datos/descargar-plantilla/${importData.tiposDatos}`, {}, false);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plantilla_${importData.tiposDatos}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Plantilla descargada",
        text: `La plantilla para ${tipoSeleccionado.label} se ha descargado correctamente.`,
      });
    } catch (error) {
      console.error("Error al descargar plantilla:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo descargar la plantilla: ${error.message}`,
      });
    }
  };

  const handleImportData = async () => {
    if (!importData.archivo) {
      Swal.fire({
        icon: "warning",
        title: "Archivo requerido",
        text: "Por favor seleccione un archivo CSV para importar.",
      });
      return;
    }
    try {
      const result = await Swal.fire({
        title: "¿Importar datos?",
        text: `¿Está seguro de que desea importar los datos desde el archivo "${importData.archivo.name}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Importar",
        cancelButtonText: "Cancelar",
      });
      if (result.isConfirmed) {
        const formData = new FormData();
        formData.append("archivo", importData.archivo);
        formData.append("tipoDatos", importData.tiposDatos);
        formData.append("usuarioId", localStorage.getItem("userId"));

        Swal.fire({
          title: "Importando datos...",
          text: "Por favor espere mientras se procesan los datos.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const response = await fetchWithToken(`${API_BASE_URL}/administrador-datos/importar-datos`, {
          method: "POST",
          body: formData,
        });
        const resultData = await response;

        Swal.fire({
          icon: resultData.exito ? "success" : "error",
          title: resultData.exito ? "Datos importados" : "Error",
          text: resultData.mensaje || "Ocurrió un error al importar los datos.",
        });
        if (resultData.exito) {
          setImportData({
            tiposDatos: "tratos",
            archivo: null,
          });
          fetchImportHistory();
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al importar los datos: " + error.message,
      });
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/administrador-datos/historial-importaciones/${localStorage.getItem("userId")}`);
      const data = await response;
      setImportHistory(data.map(item => ({
        id: item.id,
        tipoDatos: item.tipoDatos,
        nombreArchivo: item.nombreArchivo,
        fechaCreacion: item.fechaCreacion,
        registrosExitosos: item.registrosExitosos,
        registrosFallidos: item.registrosFallidos,
        errores: item.errores
      })));
    } catch (error) {
      console.error("Error fetching import history:", error);
    }
  };

  const handleExportData = async () => {
    try {
      const result = await Swal.fire({
        title: "¿Exportar datos?",
        text: `¿Está seguro de que desea exportar los datos de ${exportData.tiposDatos} en formato ${exportData.formato.toUpperCase()}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Exportar",
        cancelButtonText: "Cancelar",
      });
      if (result.isConfirmed) {
        Swal.fire({
          title: "Exportando datos...",
          text: "Por favor espere mientras se genera el archivo.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const response = await fetchWithToken(`${API_BASE_URL}/administrador-datos/exportar-datos`, {
          method: "POST",
          body: JSON.stringify({
            tipoDatos: exportData.tiposDatos,
            formatoExportacion: exportData.formato,
            fechaInicio: exportData.fechaInicio,
            fechaFin: exportData.fechaFin,
            usuarioId: parseInt(localStorage.getItem("userId")),
          }),
        });
        const resultData = await response;

        Swal.fire({
          icon: resultData.exito ? "success" : "error",
          title: resultData.exito ? "Datos exportados" : "Error",
          text: resultData.mensaje || "Ocurrió un error al exportar los datos.",
        });
        if (resultData.exito) {
          fetchExportHistory(); 
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al exportar los datos: " + error.message,
      });
    }
  };

  const fetchExportHistory = async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/administrador-datos/historial-exportaciones/${localStorage.getItem("userId")}`);
      const data = await response;
      setExportHistory(data.map(item => ({
        id: item.id,
        tipoDatos: item.tipoDatos,
        formato: item.formatoExportacion,
        nombre: item.nombreArchivo,
        tamaño: item.tamañoArchivo,
        fecha: item.fechaCreacion,
        fechaInicio: item.fechaInicio,
        fechaFin: item.fechaFin
      })));
    } catch (error) {
      console.error("Error fetching export history:", error);
    }
  };

  const handleDownloadExport = async (exportItem) => {
    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/administrador-datos/descargar-exportacion/${exportItem.id}?usuarioId=${localStorage.getItem("userId")}`,
        {},
        false
      );

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Obtener el blob del archivo
      const blob = await response.blob();

      // Verificar que el blob no esté vacío
      if (blob.size === 0) {
        throw new Error("El archivo está vacío");
      }

      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportItem.nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Descarga completada",
        text: `El archivo ${exportItem.nombre} se ha descargado correctamente.`,
      });
    } catch (error) {
      console.error("Error al descargar archivo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo descargar el archivo: ${error.message}`,
      });
    }
  };

  const handleDeleteExport = async (exportId) => {
    const exportItem = exportHistory.find((item) => item.id === exportId);
    const result = await Swal.fire({
      title: "¿Eliminar exportación?",
      text: `¿Está seguro de que desea eliminar "${exportItem.nombre}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f44336",
    });

    if (result.isConfirmed) {
      try {
        await fetchWithToken(
          `${API_BASE_URL}/administrador-datos/eliminar-exportacion/${exportId}?usuarioId=${localStorage.getItem("userId")}`,
          {
            method: "DELETE",
          },
          false
        );

        setExportHistory((prev) => prev.filter((item) => item.id !== exportId));
        Swal.fire({
          icon: "success",
          title: "Exportación eliminada",
          text: "La exportación se ha eliminado correctamente.",
        });
        fetchExportHistory();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar la exportación.",
        });
      }
    }
  };

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
        campos: "nombre, empresa_id, contacto_id, propietario_id (opcional), numero_unidades, ingresos_esperados, descripcion, fecha_cierre, no_trato, probabilidad, fase",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      empresas: {
        campos: "nombre, estatus, domicilio_fisico, propietario_id, creado_por, fecha_creacion (opcional), sitio_web (opcional), sector (opcional), domicilio_fiscal (opcional), rfc (opcional), razon_social (opcional), regimen_fiscal (opcional), modificado_por (opcional)",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      contactos: {
        campos: "nombre, empresa_id, rol, celular, propietario_id, creado_por, fecha_creacion (opcional), modificado_por (opcional)",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      correoContactos: {
        campos: "contacto_id, correo",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      modelos: {
        campos: "nombre, imagen_url, uso",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      proveedores: {
        campos: "nombre, contacto_nombre, telefono, correo, sitio_web",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      equipos: {
        campos: "imei, nombre, modelo_id, cliente_id (opcional), cliente_default, proveedor_id, tipo, estatus, tipo_activacion (opcional), plataforma (opcional), fecha_activacion (opcional), fecha_expiracion (opcional)",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      sims: {
        campos: "numero, tarifa, vigencia (opcional), recarga (opcional), responsable, principal, grupo (opcional), contrasena, equipo_imei (opcional)",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
      historialSaldos: {
        campos: "saldo_actual (opcional), datos (opcional), fecha (opcional - usa fecha actual si está vacío), sim_numero",
        descripcion: "El archivo CSV debe tener las siguientes columnas:",
      },
    }
    return infoMap[tipo] || infoMap.tratos
  }

  useEffect(() => {
    fetchExportHistory();
    fetchImportHistory();
  }, []);

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
                            {tiposDatosOptions.find((t) => t.value === exportItem.tipoDatos)?.label} - {exportItem.formato.toUpperCase()}
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

          <section className="config-admin-section">
            <h3 className="config-admin-section-title">Historial de importaciones</h3>
            <div className="config-admin-export-history">
              {importHistory.length > 0 ? (
                <div className="config-admin-history-list">
                  {importHistory.map((importItem) => (
                    <div key={importItem.id} className="config-admin-history-item">
                      <div className="config-admin-history-info">
                        <h4>{importItem.nombreArchivo}</h4>
                        <div className="config-admin-history-details">
                          <span className="config-admin-history-type">
                            {tiposDatosOptions.find((t) => t.value === importItem.tipoDatos)?.label}
                          </span>
                          <span className="config-admin-history-date">{formatDate(importItem.fechaCreacion)}</span>
                          <span className="config-admin-history-size">
                            {importItem.registrosExitosos} exitosos / {importItem.registrosFallidos} fallidos
                          </span>
                        </div>
                        {importItem.errores && <p className="config-admin-history-errors">Errores: {importItem.errores}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="config-admin-no-history">
                  <p>No hay importaciones en el historial</p>
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
