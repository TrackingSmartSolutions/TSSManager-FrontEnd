import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "./Equipos_Modelos.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import editIcon from "../../assets/icons/editar.png"
import deleteIcon from "../../assets/icons/eliminar.png"
import { API_BASE_URL } from "../Config/Config";

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

// Componente Modal Base
const Modal = ({ isOpen, onClose, title, children, size = "md", canClose = true, closeOnOverlayClick = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: "modelos-modal-sm",
    md: "modelos-modal-md",
    lg: "modelos-modal-lg",
    xl: "modelos-modal-xl",
  }

  return (
    <div className="modelos-modal-overlay" onClick={closeOnOverlayClick ? onClose : () => { }}>
      <div className={`modelos-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="modelos-modal-header">
          <h2 className="modelos-modal-title">{title}</h2>
          {canClose && (
            <button className="modelos-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="modelos-modal-body">{children}</div>
      </div>
    </div>
  )
}

// Modal para Agregar/Editar Modelo
const ModeloFormModal = ({ isOpen, onClose, modelo = null, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    imagen: null,
    imagenPreview: null,
    uso: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const usoOptions = [
    { value: "PERSONAL", label: "Personal" },
    { value: "AUTONOMO", label: "Autónomo" },
    { value: "OBD2", label: "OBD2" },
    { value: "VEHICULO_BASICO", label: "Vehículo básico" },
    { value: "VEHICULO_AVANZADO", label: "Vehículo avanzado" },
    { value: "DASHCAM", label: "Dashcam" },
    { value: "CANDADO", label: "Candado" },
  ];

  useEffect(() => {
    if (isOpen) {
      if (modelo) {
        setFormData({
          nombre: modelo.nombre || "",
          imagen: null,
          imagenPreview: modelo.imagenUrl || null,
          uso: modelo.uso || "",
        });
      } else {
        setFormData({
          nombre: "",
          imagen: null,
          imagenPreview: null,
          uso: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, modelo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match(/^image\/(png|jpg|jpeg)$/)) {
        setErrors((prev) => ({
          ...prev,
          imagen: "Solo se permiten archivos PNG, JPG o JPEG",
        }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          imagen: "El archivo no debe superar los 2MB",
        }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          imagen: file,
          imagenPreview: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({
        ...prev,
        imagen: "",
      }));
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imagen: null,
      imagenPreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.uso) newErrors.uso = "El uso es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSend = new FormData();
    formDataToSend.append("modelo", new Blob([JSON.stringify({
      nombre: formData.nombre,
      uso: formData.uso,
    })], { type: "application/json" }));
    if (formData.imagen) {
      formDataToSend.append("imagen", formData.imagen);
    }

    setIsLoading(true);

    try {
      const url = modelo ? `${API_BASE_URL}/modelos/${modelo.id}` : `${API_BASE_URL}/modelos`;
      const method = modelo ? "PUT" : "POST";
      const response = await fetchWithToken(url, {
        method,
        body: formDataToSend,
      });
      const savedModelo = await response.json();
      onSave(savedModelo);
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: modelo ? "Modelo actualizado correctamente" : "Modelo agregado correctamente",
      });
      setIsLoading(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
      setIsLoading(false);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modelo ? "Editar modelo" : "Nuevo modelo"} size="md" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="modelos-form">
        <div className="modelos-form-group">
          <label htmlFor="nombre" className="modelos-form-label">
            Nombre
            <span className="required"> *</span>
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className={`modelos-form-control ${errors.nombre ? "modelos-form-control-error" : ""}`}
            placeholder="Ingrese el nombre del modelo"
          />
          {errors.nombre && <span className="modelos-form-error">{errors.nombre}</span>}
        </div>

        <div className="modelos-form-group">
          <label className="modelos-form-label">Imagen</label>
          <div className="modelos-image-upload-container">
            {formData.imagenPreview ? (
              <div className="modelos-image-preview">
                <img
                  src={formData.imagenPreview || "/placeholder.svg"}
                  alt="Preview"
                  className="modelos-preview-image"
                />
                <button type="button" onClick={handleRemoveImage} className="modelos-remove-image-btn">
                  ✕
                </button>
              </div>
            ) : (
              <div className="modelos-image-upload-area" onClick={() => fileInputRef.current?.click()}>
                <div className="modelos-upload-icon">📁</div>
                <p className="modelos-upload-text">
                  Arrastra tu imagen aquí o haz
                  <br />
                  clic para seleccionar
                </p>
                <p className="modelos-upload-hint">PNG, JPG máximo 2MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg"
              onChange={handleImageChange}
              className="modelos-file-input"
            />
          </div>
          {errors.imagen && <span className="modelos-form-error">{errors.imagen}</span>}
        </div>

        <div className="modelos-form-group">
          <label htmlFor="uso" className="modelos-form-label">
            Uso
            <span className="required"> *</span>
          </label>
          <select
            id="uso"
            name="uso"
            value={formData.uso}
            onChange={handleInputChange}
            className={`modelos-form-control ${errors.uso ? "modelos-form-control-error" : ""}`}
          >
            {usoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.uso && <span className="modelos-form-error">{errors.uso}</span>}
        </div>

        <div className="modelos-form-actions">
          <button type="button" onClick={onClose} className="modelos-btn modelos-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="modelos-btn modelos-btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {modelo ? "Guardando..." : "Agregando..."}
              </>
            ) : (
              modelo ? "Guardar cambios" : "Agregar"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, modelo, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación" size="sm" closeOnOverlayClick={false}>
      <div className="modelos-confirmar-eliminacion">
        <div className="modelos-confirmation-content">
          <p className="modelos-confirmation-message">¿Seguro que quieres eliminar el modelo de forma permanente?</p>
          <div className="modelos-confirmation-details">
            <strong>{modelo?.nombre}</strong>
          </div>
          <div className="modelos-modal-form-actions">
            <button type="button" onClick={onClose} className="modelos-btn modelos-btn-cancel">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} className="modelos-btn modelos-btn-danger">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Componente de Tarjeta de Modelo
const ModeloCard = ({ modelo, onEdit, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);

  // Determinar el texto según la cantidad
  const cantidadTexto = modelo.cantidad === 1 ? "1 equipo" : `${modelo.cantidad} equipos`;

  return (
    <div className="modelos-card">
      <div className="modelos-card-image">
        {modelo.imagenUrl ? (
          <img src={modelo.imagenUrl || "/placeholder.svg"} alt={modelo.nombre} className="modelos-image" />
        ) : (
          <div className="modelos-no-image">
            <span>📷</span>
          </div>
        )}
      </div>
      <div className="modelos-card-content">
        <h4 className="modelos-card-title">{modelo.nombre}</h4>
        <p className="modelos-card-uso">Uso: {modelo.uso}</p>
        <p className="modelos-card-cantidad">{cantidadTexto}</p>
      </div>
      <div className="modelos-card-actions">
        <button className="modelos-options-btn" onClick={() => setShowOptions(!showOptions)}>
          <span className="modelos-options-dots">⋮</span>
        </button>
        {showOptions && (
          <div className="modelos-options-menu">
            <button
              className="modelos-option-item"
              onClick={() => {
                onEdit(modelo);
                setShowOptions(false);
              }}
            >
              <img src={editIcon || "/placeholder.svg"} alt="Editar" className="modelos-option-icon" />
              Editar
            </button>
            <button
              className="modelos-option-item modelos-option-danger"
              onClick={() => {
                onDelete(modelo);
                setShowOptions(false);
              }}
            >
              <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" className="modelos-option-icon" />
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente Principal
const EquiposModelos = () => {
  const navigate = useNavigate();
  const [modelos, setModelos] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modals, setModals] = useState({
    form: { isOpen: false, modelo: null },
    confirmDelete: { isOpen: false, modelo: null },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await fetchWithToken(`${API_BASE_URL}/modelos/summary`);
      const data = await response.json();

      setModelos(data.modelos);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los modelos",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: true, ...data },
    }));
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: false },
    }));
  };

  const modelosFiltrados = modelos.filter(modelo =>
    modelo.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  const handleMenuNavigation = (menuItem) => {
    switch (menuItem) {
      case "estatus-plataforma":
        navigate("/equipos_estatusplataforma");
        break;
      case "modelos":
        navigate("/equipos_modelos");
        break;
      case "proveedores":
        navigate("/equipos_proveedores");
        break;
      case "inventario":
        navigate("/equipos_inventario");
        break;
      case "sim":
        navigate("/equipos_sim");
        break;
      case "creditos-plataforma": navigate("/equipos_creditosplataforma"); break;
      default:
        break;
    }
  };

  const handleSaveModelo = (modeloData) => {
    setModelos((prevModelos) => {
      if (modeloData.id) {
        // Actualizar modelo existente
        return prevModelos.map((m) =>
          m.id === modeloData.id ? modeloData : m
        );
      } else {
        // Agregar nuevo modelo
        return [...prevModelos, modeloData];
      }
    });
    fetchData();
  };

  const handleDeleteModelo = async () => {
    const modeloId = modals.confirmDelete.modelo?.id;
    try {
      await fetchWithToken(`${API_BASE_URL}/modelos/${modeloId}`, { method: "DELETE" });
      fetchData();
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Modelo eliminado correctamente",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
    closeModal("confirmDelete");
  };

  return (
    <>
     <div className="page-with-header">
      <Header />
      {isLoading && (
        <div className="modelos-loading">
          <div className="spinner"></div>
          <p>Cargando modelos de equipos...</p>
        </div>
      )}
      <main className="modelos-main-content">
        <div className="modelos-container">
          <section className="modelos-sidebar">
            <div className="modelos-sidebar-header">
              <h3 className="modelos-sidebar-title">Equipos</h3>
            </div>
            <div className="modelos-sidebar-menu">
              <div className="modelos-menu-item" onClick={() => handleMenuNavigation("estatus-plataforma")}>
                Estatus plataforma
              </div>
              <div
                className="modelos-menu-item modelos-menu-item-active"
                onClick={() => handleMenuNavigation("modelos")}
              >
                Modelos
              </div>
              <div className="modelos-menu-item" onClick={() => handleMenuNavigation("proveedores")}>
                Proveedores
              </div>
              <div className="modelos-menu-item" onClick={() => handleMenuNavigation("inventario")}>
                Inventario de equipos
              </div>
              <div className="modelos-menu-item" onClick={() => handleMenuNavigation("sim")}>
                SIM
              </div>
              <div
                className="creditosplataforma-menu-item"
                onClick={() => handleMenuNavigation("creditos-plataforma")}
              >
                Créditos Plataformas
              </div>
            </div>
          </section>

          <section className="modelos-content-panel">
            <div className="modelos-header">
              <div className="modelos-header-info">
                <h3 className="modelos-page-title">Modelos de Equipos</h3>
                <p className="modelos-subtitle">Gestión de modelos de equipos</p>
              </div>
              <div className="modelos-header-actions">
                <input
                  type="text"
                  placeholder="Buscar por nombre de modelo..."
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  className="modelos-search-input"
                />
                <button className="modelos-btn modelos-btn-primary" onClick={() => openModal("form", { modelo: null })}>
                  Agregar modelo
                </button>
              </div>
            </div>

            <div className="modelos-grid">
              {modelosFiltrados.length > 0 ? (
                modelosFiltrados.map((modelo) => (
                  <ModeloCard
                    key={modelo.id}
                    modelo={modelo}
                    onEdit={(modelo) => openModal("form", { modelo })}
                    onDelete={(modelo) => openModal("confirmDelete", { modelo })}
                  />
                ))
              ) : (
                <div className="modelos-no-data">
                  <div className="modelos-no-data-icon">📦</div>
                  <h4>No hay modelos registrados</h4>
                  <p>Comienza agregando tu primer modelo de equipo</p>
                  <button
                    className="modelos-btn modelos-btn-primary"
                    onClick={() => openModal("form", { modelo: null })}
                  >
                    Agregar modelo
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <ModeloFormModal
          isOpen={modals.form.isOpen}
          onClose={() => closeModal("form")}
          modelo={modals.form.modelo}
          onSave={handleSaveModelo}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmDelete.isOpen}
          onClose={() => closeModal("confirmDelete")}
          modelo={modals.confirmDelete.modelo}
          onConfirm={handleDeleteModelo}
        />
      </main>
      </div>
    </>
  );
};

export default EquiposModelos