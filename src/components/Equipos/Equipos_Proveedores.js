import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Equipos_Proveedores.css"
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
    sm: "proveedores-modal-sm",
    md: "proveedores-modal-md",
    lg: "proveedores-modal-lg",
    xl: "proveedores-modal-xl",
  }

  return (
    <div className="proveedores-modal-overlay" onClick={canClose ? onClose : () => {}}>
      <div className={`proveedores-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="proveedores-modal-header">
          <h2 className="proveedores-modal-title">{title}</h2>
          {canClose && (
            <button className="proveedores-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="proveedores-modal-body">{children}</div>
      </div>
    </div>
  )
}

// Modal para Agregar/Editar Proveedor
const ProveedorFormModal = ({ isOpen, onClose, proveedor = null, onSave }) => {
  const [formData, setFormData] = useState({
    nombreProveedor: "",
    contactoNombre: "",
    telefono: "",
    correo: "",
    sitioWeb: "",
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      if (proveedor) {
        // Modo edición
        setFormData({
          nombreProveedor: proveedor.nombreProveedor || "",
          contactoNombre: proveedor.contactoNombre || "",
          telefono: proveedor.telefono || "",
          correo: proveedor.correo || "",
          sitioWeb: proveedor.sitioWeb || "",
        })
      } else {
        // Modo agregar
        setFormData({
          nombreProveedor: "",
          contactoNombre: "",
          telefono: "",
          correo: "",
          sitioWeb: "",
        })
      }
      setErrors({})
    }
  }, [isOpen, proveedor])

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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[0-9\s\-$$$$]{10,}$/
    return phoneRegex.test(phone)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombreProveedor.trim()) {
      newErrors.nombreProveedor = "El nombre del proveedor es obligatorio"
    }

    if (!formData.contactoNombre.trim()) {
      newErrors.contactoNombre = "El nombre de contacto es obligatorio"
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio"
    } else if (!validatePhone(formData.telefono)) {
      newErrors.telefono = "Formato de teléfono inválido"
    }

    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es obligatorio"
    } else if (!validateEmail(formData.correo)) {
      newErrors.correo = "Formato de correo inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...formData,
        id: proveedor?.id || Date.now(),
      })
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={proveedor ? "Editar proveedor" : "Nuevo proveedor"} size="md">
      <form onSubmit={handleSubmit} className="proveedores-form">
        <div className="proveedores-form-group">
          <label htmlFor="nombreProveedor" className="proveedores-form-label">
            *Nombre Proveedor:
          </label>
          <input
            type="text"
            id="nombreProveedor"
            name="nombreProveedor"
            value={formData.nombreProveedor}
            onChange={handleInputChange}
            className={`proveedores-form-control ${errors.nombreProveedor ? "proveedores-form-control-error" : ""}`}
            placeholder="Ingrese el nombre del proveedor"
          />
          {errors.nombreProveedor && <span className="proveedores-form-error">{errors.nombreProveedor}</span>}
        </div>

        <div className="proveedores-form-group">
          <label htmlFor="contactoNombre" className="proveedores-form-label">
            *Contacto Nombre:
          </label>
          <input
            type="text"
            id="contactoNombre"
            name="contactoNombre"
            value={formData.contactoNombre}
            onChange={handleInputChange}
            className={`proveedores-form-control ${errors.contactoNombre ? "proveedores-form-control-error" : ""}`}
            placeholder="Ingrese el nombre del contacto"
          />
          {errors.contactoNombre && <span className="proveedores-form-error">{errors.contactoNombre}</span>}
        </div>

        <div className="proveedores-form-group">
          <label htmlFor="telefono" className="proveedores-form-label">
            *Teléfono:
          </label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleInputChange}
            className={`proveedores-form-control ${errors.telefono ? "proveedores-form-control-error" : ""}`}
            placeholder="Ej: +1 555-123-4567"
          />
          {errors.telefono && <span className="proveedores-form-error">{errors.telefono}</span>}
        </div>

        <div className="proveedores-form-group">
          <label htmlFor="correo" className="proveedores-form-label">
            *Correo:
          </label>
          <input
            type="email"
            id="correo"
            name="correo"
            value={formData.correo}
            onChange={handleInputChange}
            className={`proveedores-form-control ${errors.correo ? "proveedores-form-control-error" : ""}`}
            placeholder="ejemplo@correo.com"
          />
          {errors.correo && <span className="proveedores-form-error">{errors.correo}</span>}
        </div>

        <div className="proveedores-form-group">
          <label htmlFor="sitioWeb" className="proveedores-form-label">
            Sitio web:
          </label>
          <input
            type="url"
            id="sitioWeb"
            name="sitioWeb"
            value={formData.sitioWeb}
            onChange={handleInputChange}
            className="proveedores-form-control"
            placeholder="https://ejemplo.com"
          />
        </div>

        <div className="proveedores-form-actions">
          <button type="button" onClick={onClose} className="proveedores-btn proveedores-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="proveedores-btn proveedores-btn-primary">
            {proveedor ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, proveedor, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación" size="sm">
      <div className="proveedores-confirmar-eliminacion">
        <div className="proveedores-confirmation-content">
          <p className="proveedores-confirmation-message">
            ¿Seguro que quieres eliminar el proveedor de forma permanente?
          </p>
          <div className="proveedores-confirmation-details">
            <strong>{proveedor?.nombreProveedor}</strong>
          </div>
          <div className="proveedores-modal-form-actions">
            <button type="button" onClick={onClose} className="proveedores-btn proveedores-btn-cancel">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} className="proveedores-btn proveedores-btn-danger">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Componente Principal
const EquiposProveedores = () => {
  const navigate = useNavigate()

  const [proveedores, setProveedores] = useState([])
  const [modals, setModals] = useState({
    form: { isOpen: false, proveedor: null },
    confirmDelete: { isOpen: false, proveedor: null },
  })

  // Datos de ejemplo para demostración
  useEffect(() => {
    const mockProveedores = [
      {
        id: 1,
        nombreProveedor: "Global Box",
        contactoNombre: "John Smith",
        telefono: "+1 555-123-4567",
        correo: "john.smith@globalbox.com",
        sitioWeb: "https://rastreo.globalboxgps.com/",
      },
      {
        id: 2,
        nombreProveedor: "Linkworld",
        contactoNombre: "Carlos Ramirez",
        telefono: "+52 55 1234 5678",
        correo: "carlos@linkworld.com",
        sitioWeb: "https://gpsmonitorlatam.com",
      },
      {
        id: 3,
        nombreProveedor: "TechTrack Solutions",
        contactoNombre: "Maria González",
        telefono: "+1 800-555-0199",
        correo: "maria.gonzalez@techtrack.com",
        sitioWeb: "https://techtrack.solutions",
      },
      {
        id: 4,
        nombreProveedor: "GPS Master",
        contactoNombre: "Roberto Silva",
        telefono: "+55 11 9876-5432",
        correo: "roberto@gpsmaster.com.br",
        sitioWeb: "https://gpsmaster.com.br",
      },
    ]

    setProveedores(mockProveedores)
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

  const handleSaveProveedor = (proveedorData) => {
    if (proveedorData.id && proveedores.find((p) => p.id === proveedorData.id)) {
      // Editar proveedor existente
      setProveedores((prev) =>
        prev.map((proveedor) => (proveedor.id === proveedorData.id ? { ...proveedor, ...proveedorData } : proveedor)),
      )
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Proveedor actualizado correctamente",
      })
    } else {
      // Agregar nuevo proveedor
      setProveedores((prev) => [...prev, proveedorData])
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Proveedor agregado correctamente",
      })
    }
  }

  const handleDeleteProveedor = () => {
    const proveedorId = modals.confirmDelete.proveedor?.id
    setProveedores((prev) => prev.filter((proveedor) => proveedor.id !== proveedorId))
    closeModal("confirmDelete")
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Proveedor eliminado correctamente",
    })
  }

  return (
    <>
      <Header />
      <main className="proveedores-main-content">
        <div className="proveedores-container">
          <section className="proveedores-sidebar">
            <div className="proveedores-sidebar-header">
              <h3 className="proveedores-sidebar-title">Equipos</h3>
            </div>
            <div className="proveedores-sidebar-menu">
              <div className="proveedores-menu-item" onClick={() => handleMenuNavigation("estatus-plataforma")}>
                Estatus plataforma
              </div>
              <div className="proveedores-menu-item" onClick={() => handleMenuNavigation("modelos")}>
                Modelos
              </div>
              <div
                className="proveedores-menu-item proveedores-menu-item-active"
                onClick={() => handleMenuNavigation("proveedores")}
              >
                Proveedores
              </div>
              <div className="proveedores-menu-item" onClick={() => handleMenuNavigation("inventario")}>
                Inventario de equipos
              </div>
              <div className="proveedores-menu-item" onClick={() => handleMenuNavigation("sim")}>
                SIM
              </div>
            </div>
          </section>

          <section className="proveedores-content-panel">
            <div className="proveedores-header">
              <div className="proveedores-header-info">
                <h3 className="proveedores-page-title">Proveedores</h3>
                <p className="proveedores-subtitle">Gestión de proveedores de equipos</p>
              </div>
              <div className="proveedores-header-actions">
                <button
                  className="proveedores-btn proveedores-btn-primary"
                  onClick={() => openModal("form", { proveedor: null })}
                >
                  Agregar proveedor
                </button>
              </div>
            </div>

            <div className="proveedores-table-card">
              <h4 className="proveedores-table-title">Proveedores</h4>

              <div className="proveedores-table-container">
                <table className="proveedores-table">
                  <thead>
                    <tr>
                      <th>Nombre proveedor</th>
                      <th>Contacto Nombre</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Sitio web</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.length > 0 ? (
                      proveedores.map((proveedor) => (
                        <tr key={proveedor.id}>
                          <td>
                            <div className="proveedores-proveedor-name">{proveedor.nombreProveedor}</div>
                          </td>
                          <td>{proveedor.contactoNombre}</td>
                          <td>{proveedor.telefono}</td>
                          <td>
                            <a href={`mailto:${proveedor.correo}`} className="proveedores-email-link">
                              {proveedor.correo}
                            </a>
                          </td>
                          <td>
                            {proveedor.sitioWeb ? (
                              <a
                                href={proveedor.sitioWeb}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="proveedores-website-link"
                              >
                                {proveedor.sitioWeb}
                              </a>
                            ) : (
                              <span className="proveedores-no-website">-</span>
                            )}
                          </td>
                          <td>
                            <div className="proveedores-actions">
                              <button
                                className="proveedores-action-btn proveedores-edit-btn"
                                onClick={() => openModal("form", { proveedor })}
                                title="Editar"
                              >
                                <img
                                  src={editIcon || "/placeholder.svg"}
                                  alt="Editar"
                                  className="proveedores-action-icon"
                                />
                              </button>
                              <button
                                className="proveedores-action-btn proveedores-delete-btn"
                                onClick={() => openModal("confirmDelete", { proveedor })}
                                title="Eliminar"
                              >
                                <img
                                  src={deleteIcon || "/placeholder.svg"}
                                  alt="Eliminar"
                                  className="proveedores-action-icon"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="proveedores-no-data">
                          <div className="proveedores-no-data-content">
                            <div className="proveedores-no-data-icon">📋</div>
                            <h4>No hay proveedores registrados</h4>
                            <p>Comienza agregando tu primer proveedor</p>
                            <button
                              className="proveedores-btn proveedores-btn-primary"
                              onClick={() => openModal("form", { proveedor: null })}
                            >
                              Agregar proveedor
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Modales */}
        <ProveedorFormModal
          isOpen={modals.form.isOpen}
          onClose={() => closeModal("form")}
          proveedor={modals.form.proveedor}
          onSave={handleSaveProveedor}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmDelete.isOpen}
          onClose={() => closeModal("confirmDelete")}
          proveedor={modals.confirmDelete.proveedor}
          onConfirm={handleDeleteProveedor}
        />
      </main>
    </>
  )
}

export default EquiposProveedores
