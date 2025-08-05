import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Configuracion_Plantillas.css";
import Header from "../Header/Header";
import deleteIcon from "../../assets/icons/eliminar.png";
import uploadIcon from "../../assets/icons/subir.png";
import { API_BASE_URL } from "../Config/Config";
import Swal from "sweetalert2";
import EditorToolbar from '../EditorToolbar/EditorToolbar';
import '../EditorToolbar/EditorToolbar.css';

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
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    nombre: "",
    asunto: "",
    contenido: "",
    adjuntos: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editorRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);
  

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/plantillas`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las plantillas.",
      });
    } finally {
      setIsLoading(false)
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

    // Cargar contenido HTML (con imágenes) en el editor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = template.mensaje || "";
      }
    }, 100);
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

    // Limpiar el editor
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
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
        title: isEditing ? "¿Guardar cambios?" : "¿Guardar plantilla?",
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
          throw new Error(errorText || `Error: ${response.status} - Tamaño de archivo excedido`);
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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no válido',
        text: 'Por favor selecciona solo archivos de imagen',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo muy grande',
        text: 'La imagen es muy grande. Máximo 2MB para imágenes embebidas',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      const editor = editorRef.current;
      if (editor) {
        const loadingTag = `<div class="image-loading">📷 Subiendo imagen...</div>`;
        const currentContent = editor.innerHTML;
        editor.innerHTML = currentContent + '<br>' + loadingTag + '<br>';
        handleInputChange("contenido", editor.innerHTML);
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetchWithToken(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      const imageUrl = data.url;

      if (editor) {
        const imgTag = `<img src="${imageUrl}" style="max-width: 400px; width: auto; height: auto; display: block; margin: 10px 0; border-radius: 4px;" alt="Imagen insertada" />`;

        const newContent = editor.innerHTML.replace(
          '<div class="image-loading">📷 Subiendo imagen...</div>',
          imgTag
        );

        editor.innerHTML = newContent;
        handleInputChange("contenido", editor.innerHTML);
        editor.scrollTop = editor.scrollHeight;
      }

      Swal.fire({
        icon: 'success',
        title: '¡Imagen insertada!',
        text: 'La imagen se ha subido e insertado correctamente',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

    } catch (error) {
      console.error("Error al procesar imagen:", error);

      Swal.fire({
        icon: 'error',
        title: 'Error al subir imagen',
        text: `No se pudo subir la imagen: ${error.message}`,
        confirmButtonText: 'Cerrar'
      });

      if (editorRef.current) {
        const content = editorRef.current.innerHTML.replace(
          '<div class="image-loading">📷 Subiendo imagen...</div>',
          ''
        );
        editorRef.current.innerHTML = content;
        handleInputChange("contenido", editorRef.current.innerHTML);
      }
    }

    event.target.value = '';
  };

  return (
    <>
      <Header />
      {isLoading && (
        <div className="correo-plantillas-loading">
          <div className="spinner"></div>
          <p>Cargando plantillas de correo...</p>
        </div>
      )}
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
                    {isEditing ? "Guardar cambios" : "Guardar plantilla"}
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
                  <EditorToolbar editorRef={editorRef} />
                  <div
                    ref={editorRef}
                    contentEditable={true}
                    className="correo-plantillas-form-control correo-plantillas-textarea gmail-message-editor"
                    onInput={(e) => handleInputChange("contenido", e.target.innerHTML)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text/plain');
                      document.execCommand('insertText', false, text);
                    }}
                    style={{
                      minHeight: '200px',
                      maxHeight: '400px',
                      border: '1px solid #ccc',
                      borderTop: 'none', // NUEVO: para conectar con toolbar
                      padding: '10px',
                      borderRadius: '0 0 4px 4px', // MODIFICADO: solo bordes inferiores redondeados
                      backgroundColor: 'white',
                      overflow: 'auto',
                      direction: 'ltr',
                      textAlign: 'left',
                      unicodeBidi: 'normal'
                    }}
                    suppressContentEditableWarning={true}
                  />
                  <small className="correo-plantillas-help-text">
                    Puede usar las mismas variables que en el asunto para personalizar el contenido.
                  </small>
                </div>
              </div>

              <div className="correo-plantillas-form-row">
                <div className="correo-plantillas-form-group correo-plantillas-full-width">
                  <div className="correo-plantillas-content-toolbar">
                    <button
                      type="button"
                      className="correo-plantillas-btn correo-plantillas-btn-secondary gmail-image-btn"
                      onClick={() => document.getElementById('plantilla-image-upload').click()}
                    >
                      📷 Insertar imagen en contenido
                    </button>
                    <input
                      id="plantilla-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
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