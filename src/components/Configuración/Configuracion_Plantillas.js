import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Configuracion_Plantillas.css";
import Header from "../Header/Header";
import deleteIcon from "../../assets/icons/eliminar.png";
import uploadIcon from "../../assets/icons/subir.png";
import { API_BASE_URL } from "../Config/Config";
import Swal from "sweetalert2";

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
  return response;
};

const ConfiguracionPlantillas = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    asunto: "",
    contenido: "",
    adjuntos: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/plantillas`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las plantillas.",
      });
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.asunto.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData({
      nombre: template.nombre,
      asunto: template.asunto,
      contenido: template.mensaje || "",
      adjuntos: template.adjuntos || [],
    });
    setIsEditing(true);
    setEditingId(template.id);
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setFormData({
      nombre: "",
      asunto: "",
      contenido: "",
      adjuntos: [],
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

 const handleSaveTemplate = async () => {
  if (!formData.nombre.trim() || !formData.asunto.trim() || !formData.contenido.trim()) {
    Swal.fire({
      icon: "warning",
      title: "Campos requeridos",
      text: "Por favor complete todos los campos obligatorios.",
    });
    return;
  }

  try {
    const result = await Swal.fire({
      title: isEditing ? "¿Guardar cambios?" : "¿Crear plantilla?",
      text: isEditing
        ? "Los cambios se guardarán en la plantilla."
        : "Se creará una nueva plantilla de correo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isEditing ? "Guardar" : "Crear",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const url = isEditing ? `${API_BASE_URL}/plantillas/${editingId}` : `${API_BASE_URL}/plantillas`;
      const method = isEditing ? "PUT" : "POST";
      const body = new FormData();
      body.append("plantilla", new Blob([JSON.stringify({
        nombre: formData.nombre,
        asunto: formData.asunto,
        mensaje: formData.contenido,
      })], { type: "application/json" }));

      // Enviar solo los archivos nuevos como "adjuntos"
      formData.adjuntos.forEach((adjunto, index) => {
        if (adjunto instanceof File) {
          body.append("adjuntos", adjunto);
        }
      });

      // Enviar la lista de URLs de adjuntos a eliminar (si es edición)
      if (isEditing && selectedTemplate) {
        const existingAdjuntos = selectedTemplate.adjuntos || [];
        const adjuntosToRemove = existingAdjuntos
          .map((a) => a.adjuntoUrl)
          .filter((url) => !formData.adjuntos.some((adj) => adj.adjuntoUrl === url && !(adj instanceof File)));
        if (adjuntosToRemove.length > 0) {
          body.append("adjuntosToRemove", JSON.stringify(adjuntosToRemove));
        }
      }

      const response = await fetchWithToken(url, {
        method,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText || "Tamaño de archivo excedido"}`);
      }

      const data = await response.json();
      if (isEditing) {
        await fetchTemplates(); // Recarga la lista tras editar
        Swal.fire({
          icon: "success",
          title: "Plantilla actualizada",
          text: "La plantilla se ha actualizado correctamente.",
        });
      } else {
        await fetchTemplates(); // Recarga la lista tras crear
        setSelectedTemplate(templates.find(t => t.id === data.id)); // Selecciona la nueva plantilla
        setIsEditing(true);
        setEditingId(data.id);
        Swal.fire({
          icon: "success",
          title: "Plantilla creada",
          text: "La plantilla se ha creado correctamente.",
        });
      }
      setFormData({
        nombre: "",
        asunto: "",
        contenido: "",
        adjuntos: [],
      });
      setSelectedTemplate(null);
      setIsEditing(false);
      setEditingId(null);
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: error.message.includes("Tamaño de archivo excedido")
        ? "El tamaño total de los archivos excede el límite permitido (máx. 10MB). Por favor, suba archivos más pequeños o reduzca la cantidad."
        : `Ocurrió un error al guardar la plantilla: ${error.message}`,
      confirmButtonText: "Aceptar",
    });
  }
};

 const handleDeleteTemplate = async (templateId) => {
  const result = await Swal.fire({
    title: "¿Eliminar plantilla?",
    text: `¿Está seguro de que desea eliminar la plantilla "${templates.find((t) => t.id === templateId).nombre}"? Esta acción no se puede deshacer.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#f44336",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/plantillas/${templateId}`, { method: "DELETE" });
      if (response.status === 204) {
        await fetchTemplates(); // Recarga la lista tras eliminar
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
          setFormData({ nombre: "", asunto: "", contenido: "", adjuntos: [] });
          setIsEditing(false);
          setEditingId(null);
        }
        Swal.fire({
          icon: "success",
          title: "Plantilla eliminada",
          text: "La plantilla se ha eliminado correctamente.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Ocurrió un error al eliminar la plantilla: ${error.message}`,
      });
    }
  }
};

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    const maxTotalSize = 10 * 1024 * 1024; // 10MB en bytes
    const currentTotalSize = formData.adjuntos.reduce((total, file) => total + (file.size || 0), 0);
    const newTotalSize = files.reduce((total, file) => total + file.size, 0);

    if (currentTotalSize + newTotalSize > maxTotalSize) {
      Swal.fire({
        icon: "warning",
        title: "Límite de tamaño excedido",
        text: `El tamaño total de los archivos excede el límite de 10MB. Por favor, seleccione archivos más pequeños o elimine algunos existentes.`,
        confirmButtonText: "Aceptar",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      adjuntos: [...prev.adjuntos, ...files],
    }));
  };

  const handleRemoveAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      adjuntos: prev.adjuntos.filter((_, i) => i !== index),
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Header />
      <div className="correo-plantillas-config-header">
        <h2 className="correo-plantillas-config-title">Configuración</h2>
        <nav className="correo-plantillas-config-nav">
          <div className="correo-plantillas-nav-item correo-plantillas-nav-item-active">Plantillas de correo</div>
          <div
            className="correo-plantillas-nav-item"
            onClick={() => navigate("/configuracion_admin_datos")}
          >
            Administrador de datos
          </div>
          <div
            className="correo-plantillas-nav-item"
            onClick={() => navigate("/configuracion_empresa")}
          >
            Configuración de la empresa
          </div>
          <div
            className="correo-plantillas-nav-item"
            onClick={() => navigate("/configuracion_almacenamiento")}
          >
            Almacenamiento
          </div>
          <div
            className="correo-plantillas-nav-item"
            onClick={() => navigate("/configuracion_copias_seguridad")}
          >
            Copias de Seguridad
          </div>
          <div
            className="correo-plantillas-nav-item"
            onClick={() => navigate("/configuracion_usuarios")}
          >
            Usuarios y roles
          </div>
        </nav>
      </div>
      <main className="correo-plantillas-main-content">
        <div className="correo-plantillas-container">
          <section className="correo-plantillas-templates-panel">
            <div className="correo-plantillas-panel-header">
              <button
                className="correo-plantillas-btn correo-plantillas-btn-add"
                onClick={handleNewTemplate}
              >
                Nueva plantilla
              </button>
            </div>

            <div className="correo-plantillas-search-section">
              <div className="correo-plantillas-search-filter-row">
                <div className="correo-plantillas-search-input-container">
                  <input
                    type="text"
                    placeholder="Buscar plantilla por nombre o asunto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="correo-plantillas-search-input"
                  />
                </div>
              </div>
            </div>

            <div className="correo-plantillas-templates-list">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`correo-plantillas-template-item ${selectedTemplate?.id === template.id ? "selected" : ""
                    }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="correo-plantillas-template-info">
                    <h3>{template.nombre}</h3>
                    <p className="correo-plantillas-template-subject">{template.asunto}</p>
                  </div>
                  <div className="correo-plantillas-template-actions">
                    <button
                      className="correo-plantillas-btn-action correo-plantillas-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      title="Eliminar plantilla"
                    >
                      <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="correo-plantillas-editor-panel">
            <div className="correo-plantillas-editor-form">
              <div className="correo-plantillas-form-header">
                <h3>{isEditing ? "Editar Plantilla" : "Nueva Plantilla"}</h3>
                <div className="correo-plantillas-form-actions">
                  <button
                    className="correo-plantillas-btn correo-plantillas-btn-primary"
                    onClick={handleSaveTemplate}
                  >
                    {isEditing ? "Guardar cambios" : "Crear plantilla"}
                  </button>
                </div>
              </div>

              <div className="correo-plantillas-form-row">
                <div className="correo-plantillas-form-group">
                  <label htmlFor="nombre">
                    Nombre de la plantilla <span className="correo-plantillas-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    className="correo-plantillas-form-control"
                    placeholder="Ej: Seguimiento de Trato"
                  />
                </div>
              </div>

              <div className="correo-plantillas-form-row">
                <div className="correo-plantillas-form-group correo-plantillas-full-width">
                  <label htmlFor="asunto">
                    Asunto <span className="correo-plantillas-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="asunto"
                    value={formData.asunto}
                    onChange={(e) => handleInputChange("asunto", e.target.value)}
                    className="correo-plantillas-form-control"
                    placeholder="Ej: Seguimiento sobre nuestro trato - [Nombre de la Empresa]"
                  />
                  <small className="correo-plantillas-help-text">
                    Puede usar variables como [Nombre], [Nombre de la Empresa], [Nombre del Trato], [Hora], etc.
                  </small>
                </div>
              </div>

              <div className="correo-plantillas-form-row">
                <div className="correo-plantillas-form-group correo-plantillas-full-width">
                  <label htmlFor="contenido">
                    Contenido <span className="correo-plantillas-required">*</span>
                  </label>
                  <textarea
                    id="contenido"
                    value={formData.contenido}
                    onChange={(e) => handleInputChange("contenido", e.target.value)}
                    className="correo-plantillas-form-control correo-plantillas-textarea"
                    rows="8"
                    placeholder="Escriba el contenido del correo aquí..."
                  />
                  <small className="correo-plantillas-help-text">
                    Puede usar las mismas variables que en el asunto para personalizar el contenido.
                  </small>
                </div>
              </div>

              <div className="correo-plantillas-form-row">
                <div className="correo-plantillas-form-group correo-plantillas-full-width">
                  <label>Adjuntos</label>
                  <div className="correo-plantillas-file-upload-area">
                    <div className="correo-plantillas-file-drop-zone">
                      <div className="correo-plantillas-upload-icon">
                        <img src={uploadIcon || "/placeholder.svg"} alt="Upload" />
                      </div>
                      <p>Arrastra y suelta archivos aquí</p>
                      <p className="correo-plantillas-file-formats">PDF, JPG, PNG, DOC (máx. 5MB por archivo, 10MB total)</p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                        className="correo-plantillas-file-input"
                      />
                      <button
                        type="button"
                        className="correo-plantillas-btn correo-plantillas-btn-secondary"
                        onClick={() => document.querySelector(".correo-plantillas-file-input").click()}
                      >
                        Seleccionar archivos
                      </button>
                    </div>
                  </div>

                  {formData.adjuntos.length > 0 && (
                    <div className="correo-plantillas-attachments-list">
                      <h4>Archivos adjuntos:</h4>
                      {formData.adjuntos.map((archivo, index) => (
                        <div key={index} className="correo-plantillas-attachment-item">
                          <span className="correo-plantillas-attachment-name">
                            📄 {archivo.name ? archivo.name : archivo.adjuntoUrl || `Adjunto ${index + 1}`}
                          </span>
                          <button
                            type="button"
                            className="correo-plantillas-btn-remove-attachment"
                            onClick={() => handleRemoveAttachment(index)}
                            title="Eliminar archivo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedTemplate && (
                <div className="correo-plantillas-template-info-section">
                  <h4>Información de la plantilla</h4>
                  <div className="correo-plantillas-info-grid">
                    <div className="correo-plantillas-info-item">
                      <label>Fecha de creación:</label>
                      <span>{formatDate(selectedTemplate.fechaCreacion)}</span>
                    </div>
                    <div className="correo-plantillas-info-item">
                      <label>Última modificación:</label>
                      <span>{formatDate(selectedTemplate.fechaModificacion)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default ConfiguracionPlantillas