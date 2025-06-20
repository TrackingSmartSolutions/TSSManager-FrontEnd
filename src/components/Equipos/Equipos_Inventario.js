import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Equipos_Inventario.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import editIcon from "../../assets/icons/editar.png"
import deleteIcon from "../../assets/icons/eliminar.png"
import detailsIcon from "../../assets/icons/lupa.png"
import activateIcon from "../../assets/icons/activar.png"
import renewIcon from "../../assets/icons/renovar.png"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

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
    sm: "inventario-modal-sm",
    md: "inventario-modal-md",
    lg: "inventario-modal-lg",
    xl: "inventario-modal-xl",
  }

  return (
    <div className="inventario-modal-overlay" onClick={canClose ? onClose : () => {}}>
      <div className={`inventario-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="inventario-modal-header">
          <h2 className="inventario-modal-title">{title}</h2>
          {canClose && (
            <button className="inventario-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="inventario-modal-body">{children}</div>
      </div>
    </div>
  )
}

// Modal para Agregar/Editar Equipo
const EquipoFormModal = ({ isOpen, onClose, equipo = null, onSave }) => {
  const [formData, setFormData] = useState({
    imei: "",
    nombre: "",
    modelo: "",
    cliente: "AG",
    proveedor: "",
    tipo: "Almacen",
    estatus: "Inactivo",
    tipoActivacion: "Anual",
    plataforma: "Track Solid",
  })
  const [errors, setErrors] = useState({})

  const modeloOptions = [
    { value: "", label: "Seleccione un modelo" },
    { value: "LW4G-6A", label: "LW4G-6A" },
    { value: "VL802", label: "VL802" },
    { value: "JC400P", label: "JC400P" },
    { value: "GT06N", label: "GT06N" },
    { value: "ST901", label: "ST901" },
    { value: "DC100", label: "DC100" },
  ]

  const clienteOptions = [
    { value: "AG", label: "AG" },
    { value: "BN", label: "BN" },
    { value: "SANTANDER SEALES", label: "SANTANDER SEALES" },
    { value: "FERM Constructora", label: "FERM Constructora" },
    { value: "DYC Logistic", label: "DYC Logistic" },
    { value: "Ranch Capital", label: "Ranch Capital" },
    { value: "Agua Bastos", label: "Agua Bastos" },
  ]

  const proveedorOptions = [
    { value: "", label: "Seleccione un proveedor" },
    { value: "Global Box", label: "Global Box" },
    { value: "Linkworld", label: "Linkworld" },
    { value: "TechTrack Solutions", label: "TechTrack Solutions" },
    { value: "GPS Master", label: "GPS Master" },
  ]

  const tipoOptions = [
    { value: "Almacen", label: "Almacén" },
    { value: "Demo", label: "Demo" },
    { value: "Vendido", label: "Vendido" },
  ]

  const estatusOptions = [
    { value: "Inactivo", label: "Inactivo" },
    { value: "Activo", label: "Activo" },
  ]

  const tipoActivacionOptions = [
    { value: "Anual", label: "Anual" },
    { value: "Vitalicia", label: "Vitalicia" },
  ]

  const plataformaOptions = [
    { value: "Track Solid", label: "Track Solid" },
    { value: "WhatsGPS", label: "WhatsGPS" },
    { value: "TrackerKing", label: "TrackerKing" },
  ]

  useEffect(() => {
    if (isOpen) {
      if (equipo) {
        // Modo edición
        setFormData({
          imei: equipo.imei || "",
          nombre: equipo.nombre || "",
          modelo: equipo.modelo || "",
          cliente: equipo.cliente || "AG",
          proveedor: equipo.proveedor || "",
          tipo: equipo.tipo || "Almacen",
          estatus: equipo.estatus || "Inactivo",
          tipoActivacion: equipo.tipoActivacion || "Anual",
          plataforma: equipo.plataforma || "Track Solid",
        })
      } else {
        // Modo agregar
        setFormData({
          imei: "",
          nombre: "",
          modelo: "",
          cliente: "AG",
          proveedor: "",
          tipo: "Almacen",
          estatus: "Inactivo",
          tipoActivacion: "Anual",
          plataforma: "Track Solid",
        })
      }
      setErrors({})
    }
  }, [isOpen, equipo])

  // Generar nombre automáticamente cuando se selecciona modelo e IMEI
  useEffect(() => {
    if (formData.modelo && formData.imei && !equipo) {
      if (formData.imei.length >= 5) {
        const ultimosCincoDigitos = formData.imei.slice(-5)
        const nombreGenerado = `${formData.modelo} ${ultimosCincoDigitos}`
        setFormData((prev) => ({ ...prev, nombre: nombreGenerado }))
      }
    }
  }, [formData.modelo, formData.imei, equipo])

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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.imei.trim()) {
      newErrors.imei = "El IMEI es obligatorio"
    } else if (!/^\d{15}$/.test(formData.imei.trim())) {
      newErrors.imei = "El IMEI debe tener exactamente 15 dígitos"
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio"
    }

    if (!formData.modelo) {
      newErrors.modelo = "El modelo es obligatorio"
    }

    if (!formData.proveedor) {
      newErrors.proveedor = "El proveedor es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...formData,
        id: equipo?.id || Date.now(),
        fechaActivacion: formData.estatus === "Activo" ? new Date().toISOString().split("T")[0] : null,
        fechaExpiracion:
          formData.estatus === "Activo"
            ? formData.tipoActivacion === "Anual"
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
              : new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            : null,
        sim: equipo?.sim || null,
      })
      onClose()
    }
  }

  const isTipoActivacionDisabled = formData.estatus === "Inactivo"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipo ? "Editar equipo" : "Nuevo equipo"} size="md">
      <form onSubmit={handleSubmit} className="inventario-form">
        <div className="inventario-form-group">
          <label htmlFor="imei" className="inventario-form-label">
            *IMEI:
          </label>
          <input
            type="text"
            id="imei"
            name="imei"
            value={formData.imei}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.imei ? "inventario-form-control-error" : ""}`}
            placeholder="Ingrese el IMEI (15 dígitos)"
            maxLength="15"
          />
          {errors.imei && <span className="inventario-form-error">{errors.imei}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="modelo" className="inventario-form-label">
            *Modelo:
          </label>
          <select
            id="modelo"
            name="modelo"
            value={formData.modelo}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.modelo ? "inventario-form-control-error" : ""}`}
          >
            {modeloOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.modelo && <span className="inventario-form-error">{errors.modelo}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="nombre" className="inventario-form-label">
            *Nombre:
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.nombre ? "inventario-form-control-error" : ""}`}
            placeholder="Nombre del equipo"
          />
          <small className="inventario-help-text">
            Se genera automáticamente como "[Modelo] + últimos 5 dígitos del IMEI" al crear, pero es editable
          </small>
          {errors.nombre && <span className="inventario-form-error">{errors.nombre}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="cliente" className="inventario-form-label">
            Cliente:
          </label>
          <select
            id="cliente"
            name="cliente"
            value={formData.cliente}
            onChange={handleInputChange}
            className="inventario-form-control"
          >
            {clienteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="inventario-form-group">
          <label htmlFor="proveedor" className="inventario-form-label">
            *Proveedor:
          </label>
          <select
            id="proveedor"
            name="proveedor"
            value={formData.proveedor}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.proveedor ? "inventario-form-control-error" : ""}`}
          >
            {proveedorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.proveedor && <span className="inventario-form-error">{errors.proveedor}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="tipo" className="inventario-form-label">
            *Tipo:
          </label>
          <select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
            className="inventario-form-control"
          >
            {tipoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="inventario-form-group">
          <label htmlFor="estatus" className="inventario-form-label">
            *Estatus:
          </label>
          <select
            id="estatus"
            name="estatus"
            value={formData.estatus}
            onChange={handleInputChange}
            className="inventario-form-control"
          >
            {estatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="inventario-form-group">
          <label htmlFor="tipoActivacion" className="inventario-form-label">
            *Tipo Activación:
          </label>
          <select
            id="tipoActivacion"
            name="tipoActivacion"
            value={formData.tipoActivacion}
            onChange={handleInputChange}
            className="inventario-form-control"
            disabled={isTipoActivacionDisabled}
          >
            {tipoActivacionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isTipoActivacionDisabled && (
            <small className="inventario-help-text">Deshabilitado cuando el estatus es "Inactivo"</small>
          )}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="plataforma" className="inventario-form-label">
            *Plataforma:
          </label>
          <select
            id="plataforma"
            name="plataforma"
            value={formData.plataforma}
            onChange={handleInputChange}
            className="inventario-form-control"
          >
            {plataformaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="inventario-form-actions">
          <button type="button" onClick={onClose} className="inventario-btn inventario-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="inventario-btn inventario-btn-primary">
            {equipo ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Modal de Detalles de Equipo
const DetallesEquipoModal = ({ isOpen, onClose, equipo }) => {
  if (!equipo) return null

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-MX")
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles equipo" size="md">
      <div className="inventario-detalles-content">
        <div className="inventario-detalles-grid">
          <div className="inventario-detalle-item">
            <label>IMEI:</label>
            <span>{equipo.imei || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Nombre:</label>
            <span>{equipo.nombre || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Modelo:</label>
            <span>{equipo.modelo || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Cliente:</label>
            <span>{equipo.cliente || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Proveedor:</label>
            <span>{equipo.proveedor || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Tipo:</label>
            <span>{equipo.tipo || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Estatus:</label>
            <span>{equipo.estatus || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Tipo Activación:</label>
            <span>{equipo.tipoActivacion || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Fecha activación:</label>
            <span>{formatDate(equipo.fechaActivacion)}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Fecha expiración:</label>
            <span>{formatDate(equipo.fechaExpiracion)}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>Plataforma:</label>
            <span>{equipo.plataforma || "N/A"}</span>
          </div>
          <div className="inventario-detalle-item">
            <label>SIM Referenciada:</label>
            <span>{equipo.sim || "N/A"}</span>
          </div>
        </div>
        <div className="inventario-form-actions">
          <button type="button" onClick={onClose} className="inventario-btn inventario-btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, onConfirm, equipo, hasSimVinculada = false }) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hasSimVinculada ? "Error al eliminar registro" : "Confirmar eliminación"}
      size="sm"
    >
      <div className="inventario-confirmar-eliminacion">
        {hasSimVinculada ? (
          <div className="inventario-warning-content">
            <p className="inventario-warning-message">
              No se puede eliminar el equipo porque tiene una SIM vinculada. Desvincule la SIM primero.
            </p>
            <div className="inventario-form-actions">
              <button type="button" onClick={onClose} className="inventario-btn inventario-btn-primary">
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <div className="inventario-confirmation-content">
            <p className="inventario-confirmation-message">¿Seguro que quieres eliminar este equipo?</p>
            <div className="inventario-form-actions">
              <button type="button" onClick={onClose} className="inventario-btn inventario-btn-cancel">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirm} className="inventario-btn inventario-btn-confirm">
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Modal de Confirmación de Activación
const ConfirmarActivacionModal = ({ isOpen, onClose, onConfirm, equipo }) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar activación" size="sm">
      <div className="inventario-confirmar-eliminacion">
        <div className="inventario-confirmation-content">
          <p className="inventario-confirmation-message">¿Seguro que quieres activar el equipo?</p>
          <div className="inventario-form-actions">
            <button type="button" onClick={onClose} className="inventario-btn inventario-btn-cancel">
              Cancelar
            </button>
            <button type="button" onClick={handleConfirm} className="inventario-btn inventario-btn-primary">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Componente Principal
const EquiposInventario = () => {
  const navigate = useNavigate()

  const [equipos, setEquipos] = useState([])
  const [filterTipo, setFilterTipo] = useState("")
  const [modals, setModals] = useState({
    form: { isOpen: false, equipo: null },
    detalles: { isOpen: false, equipo: null },
    confirmDelete: { isOpen: false, equipo: null, hasSimVinculada: false },
    confirmActivate: { isOpen: false, equipo: null },
  })

  const tipoFilterOptions = [
    { value: "", label: "Todos" },
    { value: "Almacen", label: "Almacén" },
    { value: "Demo", label: "Demo" },
    { value: "Vendido", label: "Vendido" },
  ]

  // Datos de ejemplo para demostración
  useEffect(() => {
    const mockEquipos = [
      {
        id: 1,
        imei: "864859506063015",
        nombre: "303-63015",
        modelo: "LW4G-6A",
        cliente: "BN",
        proveedor: "Global Box",
        tipo: "Demo",
        estatus: "Activo",
        tipoActivacion: "Anual",
        plataforma: "Track Solid",
        fechaActivacion: "2024-01-15",
        fechaExpiracion: "2025-01-15",
        sim: "4779973681",
      },
      {
        id: 2,
        imei: "863017028775423",
        nombre: "S2TL-775423",
        modelo: "ST901",
        cliente: "BN",
        proveedor: "Linkworld",
        tipo: "Demo",
        estatus: "Inactivo",
        tipoActivacion: "Anual",
        plataforma: "WhatsGPS",
        fechaActivacion: null,
        fechaExpiracion: null,
        sim: "4771279168",
      },
      {
        id: 3,
        imei: "864859506063016",
        nombre: "VL802-63016",
        modelo: "VL802",
        cliente: "AG",
        proveedor: "TechTrack Solutions",
        tipo: "Almacen",
        estatus: "Activo",
        tipoActivacion: "Vitalicia",
        plataforma: "TrackerKing",
        fechaActivacion: "2024-03-10",
        fechaExpiracion: "2034-03-10",
        sim: null,
      },
    ]

    setEquipos(mockEquipos)
  }, [])

  // Filtrar equipos
  const filteredEquipos = equipos.filter((equipo) => {
    const matchesTipo = !filterTipo || equipo.tipo === filterTipo
    return matchesTipo
  })

  // Verificar si un equipo necesita renovación (30 días antes de expirar)
  const needsRenewal = (equipo) => {
    if (!equipo.fechaExpiracion || equipo.estatus !== "Activo") return false
    const today = new Date()
    const expirationDate = new Date(equipo.fechaExpiracion)
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiration <= 30 && daysUntilExpiration >= 0
  }

  // Verificar si un equipo está expirado
  const isExpired = (equipo) => {
    if (!equipo.fechaExpiracion) return false
    const today = new Date()
    const expirationDate = new Date(equipo.fechaExpiracion)
    return expirationDate < today
  }

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

  const handleSaveEquipo = (equipoData) => {
    if (equipoData.id && equipos.find((e) => e.id === equipoData.id)) {
      // Editar equipo existente
      setEquipos((prev) => prev.map((equipo) => (equipo.id === equipoData.id ? equipoData : equipo)))
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Equipo actualizado correctamente",
      })
    } else {
      // Agregar nuevo equipo
      setEquipos((prev) => [...prev, equipoData])
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Equipo agregado correctamente",
      })
    }
  }

  const handleDeleteEquipo = () => {
    const equipoId = modals.confirmDelete.equipo?.id
    setEquipos((prev) => prev.filter((equipo) => equipo.id !== equipoId))
    closeModal("confirmDelete")
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Equipo eliminado correctamente",
    })
  }

  const handleActivateEquipo = (equipoId) => {
    const equipo = equipos.find((e) => e.id === equipoId)
    if (equipo) {
      openModal("confirmActivate", { equipo })
    }
  }

  const handleConfirmActivateEquipo = () => {
    const equipoId = modals.confirmActivate.equipo?.id
    const equipo = equipos.find((e) => e.id === equipoId)
    if (equipo) {
      const updatedEquipo = {
        ...equipo,
        estatus: "Activo",
        fechaActivacion: new Date().toISOString().split("T")[0],
        fechaExpiracion:
          equipo.tipoActivacion === "Anual"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            : new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      }
      setEquipos((prev) => prev.map((e) => (e.id === equipoId ? updatedEquipo : e)))
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Equipo activado correctamente",
      })
    }
  }

  const handleRenewEquipo = (equipoId) => {
    const equipo = equipos.find((e) => e.id === equipoId)
    if (equipo) {
      const updatedEquipo = {
        ...equipo,
        estatus: "Activo",
        fechaActivacion: new Date().toISOString().split("T")[0],
        fechaExpiracion:
          equipo.tipoActivacion === "Anual"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            : new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      }
      setEquipos((prev) => prev.map((e) => (e.id === equipoId ? updatedEquipo : e)))
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Equipo renovado correctamente",
      })
    }
  }

  // Configuración del gráfico
  const chartData = {
    labels: ["Personal", "Autónomo", "OBD2", "Vehículo básico", "Vehículo avanzado", "Dashcam"],
    datasets: [
      {
        label: "Almacén",
        data: [25, 30, 15, 40, 35, 20],
        backgroundColor: "#2563eb",
      },
      {
        label: "Demo",
        data: [10, 15, 8, 25, 20, 12],
        backgroundColor: "#f59e0b",
      },
      {
        label: "Vendido",
        data: [15, 20, 10, 30, 25, 18],
        backgroundColor: "#10b981",
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "Equipos por Tipo y Uso",
        font: {
          size: 16,
          weight: "bold",
        },
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
        },
      },
    },
  }

  return (
    <>
      <Header />
      <main className="inventario-main-content">
        <div className="inventario-container">
          {/* Sidebar Simple */}
          <section className="inventario-sidebar">
            <div className="inventario-sidebar-header">
              <h3 className="inventario-sidebar-title">Equipos</h3>
            </div>
            <div className="inventario-sidebar-menu">
              <div className="inventario-menu-item" onClick={() => handleMenuNavigation("estatus-plataforma")}>
                Estatus plataforma
              </div>
              <div className="inventario-menu-item" onClick={() => handleMenuNavigation("modelos")}>
                Modelos
              </div>
              <div className="inventario-menu-item" onClick={() => handleMenuNavigation("proveedores")}>
                Proveedores
              </div>
              <div
                className="inventario-menu-item inventario-menu-item-active"
                onClick={() => handleMenuNavigation("inventario")}
              >
                Inventario de equipos
              </div>
              <div className="inventario-menu-item" onClick={() => handleMenuNavigation("sim")}>
                SIM
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="inventario-content-panel">
            <div className="inventario-header">
              <h3 className="inventario-page-title">Inventario de equipos</h3>
              <p className="inventario-subtitle">Gestión de inventario de equipos</p>
            </div>

            {/* Gráfico */}
            <div className="inventario-chart-card">
              <div className="inventario-chart-container">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Tabla de equipos */}
            <div className="inventario-table-card">
              <div className="inventario-table-header">
                <h4 className="inventario-table-title">Inventario de Equipos</h4>
                <div className="inventario-table-controls">
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="inventario-filter-select"
                  >
                    {tipoFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="inventario-btn inventario-btn-primary"
                    onClick={() => openModal("form", { equipo: null })}
                  >
                    Agregar equipo
                  </button>
                </div>
              </div>

              <div className="inventario-table-container">
                <table className="inventario-table">
                  <thead>
                    <tr>
                      <th>IMEI</th>
                      <th>Nombre</th>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th>Estatus</th>
                      <th>SIM</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipos.length > 0 ? (
                      filteredEquipos.map((equipo) => (
                        <tr key={equipo.id}>
                          <td>{equipo.imei}</td>
                          <td>{equipo.nombre}</td>
                          <td>{equipo.cliente}</td>
                          <td>{equipo.tipo}</td>
                          <td>
                            <span
                              className={`inventario-status-badge inventario-status-${
                                isExpired(equipo) ? "expirado" : equipo.estatus?.toLowerCase()
                              }`}
                            >
                              {isExpired(equipo) ? "Expirado" : equipo.estatus}
                            </span>
                          </td>
                          <td>{equipo.sim || "N/A"}</td>
                          <td>
                            <div className="inventario-action-buttons">
                              <button
                                className="inventario-btn-action inventario-edit"
                                onClick={() => openModal("form", { equipo })}
                                title="Editar"
                              >
                                <img src={editIcon || "/placeholder.svg"} alt="Editar" />
                              </button>
                              <button
                                className="inventario-btn-action inventario-delete"
                                onClick={() => {
                                  const hasSimVinculada = equipo.sim !== null && equipo.sim !== undefined
                                  openModal("confirmDelete", { equipo, hasSimVinculada })
                                }}
                                title="Eliminar"
                              >
                                <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" />
                              </button>
                              <button
                                className="inventario-btn-action inventario-details"
                                onClick={() => openModal("detalles", { equipo })}
                                title="Detalles"
                              >
                                <img src={detailsIcon || "/placeholder.svg"} alt="Detalles" />
                              </button>
                              {equipo.estatus === "Inactivo" && (
                                <button
                                  className="inventario-btn inventario-btn-activate"
                                  onClick={() => handleActivateEquipo(equipo.id)}
                                  title="Activar"
                                >
                                  <img
                                    src={activateIcon || "/placeholder.svg"}
                                    alt="Activar"
                                    className="inventario-action-icon"
                                  />
                                  Activar
                                </button>
                              )}
                              {needsRenewal(equipo) && (
                                <button
                                  className="inventario-btn inventario-btn-renew"
                                  onClick={() => handleRenewEquipo(equipo.id)}
                                  title="Renovar"
                                >
                                  <img
                                    src={renewIcon || "/placeholder.svg"}
                                    alt="Renovar"
                                    className="inventario-action-icon"
                                  />
                                  Renovar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="inventario-no-data">
                          No se encontraron equipos
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
        <EquipoFormModal
          isOpen={modals.form.isOpen}
          onClose={() => closeModal("form")}
          onSave={handleSaveEquipo}
          equipo={modals.form.equipo}
        />

        <DetallesEquipoModal
          isOpen={modals.detalles.isOpen}
          onClose={() => closeModal("detalles")}
          equipo={modals.detalles.equipo}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmDelete.isOpen}
          onClose={() => closeModal("confirmDelete")}
          onConfirm={handleDeleteEquipo}
          equipo={modals.confirmDelete.equipo}
          hasSimVinculada={modals.confirmDelete.hasSimVinculada}
        />

        <ConfirmarActivacionModal
          isOpen={modals.confirmActivate.isOpen}
          onClose={() => closeModal("confirmActivate")}
          onConfirm={handleConfirmActivateEquipo}
          equipo={modals.confirmActivate.equipo}
        />
      </main>
    </>
  )
}

export default EquiposInventario
