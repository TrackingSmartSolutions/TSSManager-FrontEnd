import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "./Equipos_Modelos.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import editIcon from "../../assets/icons/editar.png"
import deleteIcon from "../../assets/icons/eliminar.png"

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token")
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const response = await fetch(url, { ...options, headers })
  if (!response.ok) throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`)
  return response
}

// Componente Modal Base
const Modal = ({ isOpen, onClose, title, children, size = "md", canClose = true }) => {
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
    <div className="modelos-modal-overlay" onClick={canClose ? onClose : () => {}}>
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
  })
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  const usoOptions = [
    { value: "", label: "Seleccionar uso" },
    { value: "Personal", label: "Personal" },
    { value: "Autónomo", label: "Autónomo" },
    { value: "OBD2", label: "OBD2" },
    { value: "Vehículo básico", label: "Vehículo básico" },
    { value: "Vehículo avanzado", label: "Vehículo avanzado" },
    { value: "Dashcam", label: "Dashcam" },
  ]

  useEffect(() => {
    if (isOpen) {
      if (modelo) {
        // Modo edición
        setFormData({
          nombre: modelo.nombre || "",
          imagen: null,
          imagenPreview: modelo.imagen || null,
          uso: modelo.uso || "",
        })
      } else {
        // Modo agregar
        setFormData({
          nombre: "",
          imagen: null,
          imagenPreview: null,
          uso: "",
        })
      }
      setErrors({})
    }
  }, [isOpen, modelo])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.match(/^image\/(png|jpg|jpeg)$/)) {
        setErrors((prev) => ({
          ...prev,
          imagen: "Solo se permiten archivos PNG, JPG o JPEG",
        }))
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          imagen: "El archivo no debe superar los 2MB",
        }))
        return
      }

      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          imagen: file,
          imagenPreview: e.target.result,
        }))
      }
      reader.readAsDataURL(file)

      // Limpiar error
      setErrors((prev) => ({
        ...prev,
        imagen: "",
      }))
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imagen: null,
      imagenPreview: null,
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio"
    }

    if (!formData.uso) {
      newErrors.uso = "El uso es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...formData,
        id: modelo?.id || Date.now(),
      })
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modelo ? "Editar modelo" : "Nuevo modelo"} size="md">
      <form onSubmit={handleSubmit} className="modelos-form">
        <div className="modelos-form-group">
          <label htmlFor="nombre" className="modelos-form-label">
            *Nombre:
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
          <label className="modelos-form-label">*Imagen:</label>
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
            *Uso:
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
          <button type="submit" className="modelos-btn modelos-btn-primary">
            {modelo ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, modelo, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación" size="sm">
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
  const [showOptions, setShowOptions] = useState(false)

  return (
    <div className="modelos-card">
      <div className="modelos-card-image">
        {modelo.imagen ? (
          <img src={modelo.imagen || "/placeholder.svg"} alt={modelo.nombre} className="modelos-image" />
        ) : (
          <div className="modelos-no-image">
            <span>📷</span>
          </div>
        )}
      </div>
      <div className="modelos-card-content">
        <h4 className="modelos-card-title">{modelo.nombre}</h4>
        <p className="modelos-card-uso">Uso: {modelo.uso}</p>
        <p className="modelos-card-cantidad">{modelo.cantidad} equipos</p>
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
                onEdit(modelo)
                setShowOptions(false)
              }}
            >
              <img src={editIcon || "/placeholder.svg"} alt="Editar" className="modelos-option-icon" />
              Editar
            </button>
            <button
              className="modelos-option-item modelos-option-danger"
              onClick={() => {
                onDelete(modelo)
                setShowOptions(false)
              }}
            >
              <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" className="modelos-option-icon" />
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente Principal
const EquiposModelos = () => {
  const navigate = useNavigate()

  const [modelos, setModelos] = useState([])
  const [modals, setModals] = useState({
    form: { isOpen: false, modelo: null },
    confirmDelete: { isOpen: false, modelo: null },
  })

  // Datos de ejemplo para demostración
  useEffect(() => {
    const mockModelos = [
      {
        id: 1,
        nombre: "LW4G-6A",
        imagen: "/placeholder.svg?height=120&width=120",
        uso: "Personal",
        cantidad: 5,
      },
      {
        id: 2,
        nombre: "VL802",
        imagen: "/placeholder.svg?height=120&width=120",
        uso: "Autónomo",
        cantidad: 3,
      },
      {
        id: 3,
        nombre: "JC400P",
        imagen: "/placeholder.svg?height=120&width=120",
        uso: "OBD2",
        cantidad: 8,
      },
      {
        id: 4,
        nombre: "GT06N",
        imagen: "/placeholder.svg?height=120&width=120",
        uso: "Vehículo básico",
        cantidad: 12,
      },
      {
        id: 5,
        nombre: "ST901",
        imagen: "/placeholder.svg?height=120&width=120",
        uso: "Vehículo avanzado",
        cantidad: 6,
      },
      {
        id: 6,
        nombre: "DC100",
        imagen: "/placeholder.svg?height=120&width=120",
        uso: "Dashcam",
        cantidad: 4,
      },
    ]

    setModelos(mockModelos)
  }, [])

  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: true, ...data },
    }))
  }

  const closeModal = (modalType) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: false },
    }))
  }

  const handleMenuNavigation = (menuItem) => {
    switch (menuItem) {
      case "estatus-plataforma":
        navigate("/equipos_estatusplataforma")
        break
      case "modelos":
        navigate("/equipos_modelos")
        break
      case "proveedores":
        navigate("/equipos_proveedores")
        break
      case "inventario":
        navigate("/equipos_inventario")
        break
      case "sim":
        navigate("/equipos_sim")
        break
      default:
        break
    }
  }

  const handleSaveModelo = (modeloData) => {
    if (modeloData.id && modelos.find((m) => m.id === modeloData.id)) {
      // Editar modelo existente
      setModelos((prev) =>
        prev.map((modelo) =>
          modelo.id === modeloData.id ? { ...modelo, ...modeloData, cantidad: modelo.cantidad } : modelo,
        ),
      )
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Modelo actualizado correctamente",
      })
    } else {
      // Agregar nuevo modelo
      const nuevoModelo = {
        ...modeloData,
        cantidad: 0,
      }
      setModelos((prev) => [...prev, nuevoModelo])
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Modelo agregado correctamente",
      })
    }
  }

  const handleDeleteModelo = () => {
    const modeloId = modals.confirmDelete.modelo?.id
    setModelos((prev) => prev.filter((modelo) => modelo.id !== modeloId))
    closeModal("confirmDelete")
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Modelo eliminado correctamente",
    })
  }

  return (
    <>
      <Header />
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
            </div>
          </section>

          <section className="modelos-content-panel">
            <div className="modelos-header">
              <div className="modelos-header-info">
                <h3 className="modelos-page-title">Modelos de Equipos</h3>
                <p className="modelos-subtitle">Gestión de modelos de equipos</p>
              </div>
              <div className="modelos-header-actions">
                <button className="modelos-btn modelos-btn-primary" onClick={() => openModal("form", { modelo: null })}>
                  Agregar modelo
                </button>
              </div>
            </div>

            <div className="modelos-grid">
              {modelos.length > 0 ? (
                modelos.map((modelo) => (
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

        {/* Modales */}
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
    </>
  )
}

export default EquiposModelos
