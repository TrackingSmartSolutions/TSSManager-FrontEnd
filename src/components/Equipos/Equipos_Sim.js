import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Equipos_Sim.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import editIcon from "../../assets/icons/editar.png"
import deleteIcon from "../../assets/icons/eliminar.png"
import balancesIcon from "../../assets/icons/check-saldos.png"

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
    sm: "sim-modal-sm",
    md: "sim-modal-md",
    lg: "sim-modal-lg",
    xl: "sim-modal-xl",
  }

  return (
    <div className="sim-modal-overlay" onClick={canClose ? onClose : () => {}}>
      <div className={`sim-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="sim-modal-header">
          <h2 className="sim-modal-title">{title}</h2>
          {canClose && (
            <button className="sim-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="sim-modal-body">{children}</div>
      </div>
    </div>
  )
}

// Modal para Agregar/Editar SIM
const SimFormModal = ({ isOpen, onClose, sim = null, onSave, equiposDisponibles, gruposDisponibles }) => {
  const [formData, setFormData] = useState({
    numero: "",
    tarifa: "Por segundo",
    vigencia: new Date().toISOString().split("T")[0],
    recarga: 50,
    responsable: "TSS",
    principal: "No",
    grupo: "",
    equipo: "",
    contraseña: "tss2025",
  })
  const [errors, setErrors] = useState({})

  const tarifaOptions = [
    { value: "Por segundo", label: "Por segundo" },
    { value: "Sin límite", label: "Sin límite" },
  ]

  const responsableOptions = [
    { value: "TSS", label: "TSS" },
    { value: "Cliente", label: "Cliente" },
  ]

  const principalOptions = [
    { value: "Sí", label: "Sí" },
    { value: "No", label: "No" },
  ]

  useEffect(() => {
    if (isOpen) {
      if (sim) {
        // Modo edición
        setFormData({
          numero: sim.numero || "",
          tarifa: sim.tarifa || "Por segundo",
          vigencia: sim.vigencia || new Date().toISOString().split("T")[0],
          recarga: sim.recarga || 50,
          responsable: sim.responsable || "TSS",
          principal: sim.principal || "No",
          grupo: sim.grupo || "",
          equipo: sim.equipo || "",
          contraseña: sim.contraseña || "tss2025",
        })
      } else {
        // Modo agregar
        setFormData({
          numero: "",
          tarifa: "Por segundo",
          vigencia: new Date().toISOString().split("T")[0],
          recarga: 50,
          responsable: "TSS",
          principal: "No",
          grupo: "",
          equipo: "",
          contraseña: "tss2025",
        })
      }
      setErrors({})
    }
  }, [isOpen, sim])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

    if (!formData.numero.trim()) {
      newErrors.numero = "El número es obligatorio"
    }

    if (!formData.equipo) {
      newErrors.equipo = "El equipo es obligatorio"
    }

    if (formData.responsable === "TSS") {
      if (formData.principal === "No" && !formData.grupo) {
        newErrors.grupo = "El grupo es obligatorio cuando no es principal"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      const simData = {
        ...formData,
        id: sim?.id || Date.now(),
        // Asignar valores según responsable
        vigencia: formData.responsable === "TSS" ? formData.vigencia : null,
        recarga: formData.responsable === "TSS" ? formData.recarga : null,
        principal: formData.responsable === "TSS" ? formData.principal : "No",
        grupo:
          formData.responsable === "TSS"
            ? formData.principal === "Sí"
              ? Math.floor(Math.random() * 1000) + 1
              : formData.grupo
            : 99,
        contraseña: formData.responsable === "TSS" ? formData.contraseña : null,
      }
      onSave(simData)
      onClose()
    }
  }

  const isTssResponsable = formData.responsable === "TSS"
  const isPrincipal = formData.principal === "Sí"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sim ? "Editar SIM" : "Nueva SIM"} size="md">
      <form onSubmit={handleSubmit} className="sim-form">
        <div className="sim-form-group">
          <label htmlFor="numero" className="sim-form-label">
            *Número:
          </label>
          <input
            type="text"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleInputChange}
            className={`sim-form-control ${errors.numero ? "sim-form-control-error" : ""}`}
            placeholder="Ingrese el número de SIM"
          />
          {errors.numero && <span className="sim-form-error">{errors.numero}</span>}
        </div>

        <div className="sim-form-group">
          <label htmlFor="tarifa" className="sim-form-label">
            *Tarifa:
          </label>
          <select
            id="tarifa"
            name="tarifa"
            value={formData.tarifa}
            onChange={handleInputChange}
            className="sim-form-control"
          >
            {tarifaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sim-form-group">
          <label htmlFor="responsable" className="sim-form-label">
            *Responsable:
          </label>
          <select
            id="responsable"
            name="responsable"
            value={formData.responsable}
            onChange={handleInputChange}
            className="sim-form-control"
          >
            {responsableOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isTssResponsable && (
          <>
            <div className="sim-form-group">
              <label htmlFor="vigencia" className="sim-form-label">
                *Vigencia:
              </label>
              <input
                type="date"
                id="vigencia"
                name="vigencia"
                value={formData.vigencia}
                onChange={handleInputChange}
                className="sim-form-control"
              />
            </div>

            <div className="sim-form-group">
              <label htmlFor="recarga" className="sim-form-label">
                *Recarga:
              </label>
              <input
                type="number"
                id="recarga"
                name="recarga"
                value={formData.recarga}
                onChange={handleInputChange}
                className="sim-form-control"
                min="0"
                step="0.01"
              />
            </div>

            <div className="sim-form-group">
              <label htmlFor="principal" className="sim-form-label">
                *Principal:
              </label>
              <select
                id="principal"
                name="principal"
                value={formData.principal}
                onChange={handleInputChange}
                className="sim-form-control"
              >
                {principalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sim-form-group">
              <label htmlFor="grupo" className="sim-form-label">
                Grupo:
              </label>
              <select
                id="grupo"
                name="grupo"
                value={formData.grupo}
                onChange={handleInputChange}
                className={`sim-form-control ${errors.grupo ? "sim-form-control-error" : ""}`}
                disabled={isPrincipal}
              >
                <option value="">{isPrincipal ? "Se generará automáticamente" : "Seleccione un grupo"}</option>
                {!isPrincipal &&
                  gruposDisponibles.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      Grupo {grupo.id} ({grupo.simsCount}/6 SIMs)
                    </option>
                  ))}
              </select>
              {!isPrincipal && (
                <small className="sim-help-text">
                  Solo se muestran grupos con espacio disponible (menos de 6 SIMs)
                </small>
              )}
              {errors.grupo && <span className="sim-form-error">{errors.grupo}</span>}
            </div>

            <div className="sim-form-group">
              <label htmlFor="contraseña" className="sim-form-label">
                Contraseña:
              </label>
              <input
                type="text"
                id="contraseña"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleInputChange}
                className="sim-form-control"
                placeholder="Contraseña de la SIM"
              />
            </div>
          </>
        )}

        <div className="sim-form-group">
          <label htmlFor="equipo" className="sim-form-label">
            *Equipo:
          </label>
          <select
            id="equipo"
            name="equipo"
            value={formData.equipo}
            onChange={handleInputChange}
            className={`sim-form-control ${errors.equipo ? "sim-form-control-error" : ""}`}
          >
            <option value="">Seleccione un equipo</option>
            {equiposDisponibles.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre} - {equipo.cliente} ({equipo.tipo})
              </option>
            ))}
          </select>
          <small className="sim-help-text">Solo se muestran equipos tipo "Cliente" o "Demo" sin SIM vinculada</small>
          {errors.equipo && <span className="sim-form-error">{errors.equipo}</span>}
        </div>

        <div className="sim-form-actions">
          <button type="button" onClick={onClose} className="sim-btn sim-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="sim-btn sim-btn-primary">
            {sim ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Panel Lateral para Gestión de Saldos
const SaldosSidePanel = ({ isOpen, onClose, sim, onSaveSaldo }) => {
  const [formData, setFormData] = useState({
    saldoActual: "",
    datos: "",
    fecha: new Date().toISOString().split("T")[0],
  })
  const [historialSaldos, setHistorialSaldos] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen && sim) {
      setFormData({
        saldoActual: "",
        datos: "",
        fecha: new Date().toISOString().split("T")[0],
      })
      // Cargar historial de saldos mock
      const mockHistorial = [
        { fecha: "28/4/2025", saldoActual: 47.2, datos: null },
        { fecha: "25/4/2025", saldoActual: 48.4, datos: null },
        { fecha: "22/4/2025", saldoActual: 49.15, datos: null },
        { fecha: "19/4/2025", saldoActual: 50, datos: null },
      ]
      setHistorialSaldos(mockHistorial)
      setErrors({})
    }
  }, [isOpen, sim])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (sim?.tarifa === "Por segundo" && !formData.saldoActual) {
      newErrors.saldoActual = "El saldo actual es obligatorio"
    }

    if (sim?.tarifa === "Sin límite" && !formData.datos) {
      newErrors.datos = "Los datos son obligatorios"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      const nuevoRegistro = {
        fecha: new Date().toLocaleDateString("es-MX"),
        saldoActual: sim?.tarifa === "Por segundo" ? Number.parseFloat(formData.saldoActual) : null,
        datos: sim?.tarifa === "Sin límite" ? Number.parseInt(formData.datos) : null,
      }

      setHistorialSaldos((prev) => [nuevoRegistro, ...prev])
      onSaveSaldo(sim.id, nuevoRegistro)

      // Limpiar formulario
      setFormData({
        saldoActual: "",
        datos: "",
        fecha: new Date().toISOString().split("T")[0],
      })

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Saldo registrado correctamente",
      })
    }
  }

  if (!sim) return null

  return (
    <>
      {isOpen && <div className="sim-side-panel-overlay" onClick={onClose}></div>}

      <div className={`sim-side-panel ${isOpen ? "sim-side-panel-open" : ""}`}>
        <div className="sim-side-panel-header">
          <h2 className="sim-side-panel-title">Reporte Saldos</h2>
          <button className="sim-side-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sim-side-panel-content">
          <form onSubmit={handleSubmit} className="sim-saldos-form">
            <div className="sim-side-panel-form-group">
              <label htmlFor="numero" className="sim-form-label">
                *Número:
              </label>
              <input type="text" id="numero" value={sim.numero} className="sim-side-panel-form-control" readOnly />
            </div>

            {sim.tarifa === "Por segundo" && (
              <div className="sim-side-panel-form-group">
                <label htmlFor="saldoActual" className="sim-form-label">
                  *Saldo Actual:
                </label>
                <div className="sim-input-group">
                  <span className="sim-input-prefix">$</span>
                  <input
                    type="number"
                    id="saldoActual"
                    name="saldoActual"
                    value={formData.saldoActual}
                    onChange={handleInputChange}
                    className={`sim-side-panel-form-control ${errors.saldoActual ? "sim-form-control-error" : ""}`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                {errors.saldoActual && <span className="sim-form-error">{errors.saldoActual}</span>}
              </div>
            )}

            {sim.tarifa === "Sin límite" && (
              <div className="sim-side-panel-form-group">
                <label htmlFor="datos" className="sim-form-label">
                  *Datos:
                </label>
                <div className="sim-input-group">
                  <input
                    type="number"
                    id="datos"
                    name="datos"
                    value={formData.datos}
                    onChange={handleInputChange}
                    className={`sim-side-panel-form-control ${errors.datos ? "sim-form-control-error" : ""}`}
                    placeholder="0"
                    min="0"
                  />
                  <span className="sim-input-suffix">MB</span>
                </div>
                {errors.datos && <span className="sim-form-error">{errors.datos}</span>}
              </div>
            )}

            <div className="sim-side-panel-form-group">
              <label htmlFor="fecha" className="sim-form-label">
                Fecha:
              </label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                className="sim-side-panel-form-control"
                readOnly
              />
            </div>

            <div className="sim-side-panel-form-actions">
              <button type="submit" className="sim-btn sim-btn-primary sim-btn-full-width">
                Guardar
              </button>
            </div>
          </form>

          <div className="sim-historial-section">
            <h4 className="sim-historial-title">Historial de saldos</h4>
            <div className="sim-side-panel-table-container">
              <table className="sim-side-panel-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    {sim.tarifa === "Por segundo" && <th>Saldo Actual</th>}
                    {sim.tarifa === "Sin límite" && <th>Datos</th>}
                  </tr>
                </thead>
                <tbody>
                  {historialSaldos.length > 0 ? (
                    historialSaldos.map((registro, index) => (
                      <tr key={index}>
                        <td>{registro.fecha}</td>
                        {sim.tarifa === "Por segundo" && <td>${registro.saldoActual}</td>}
                        {sim.tarifa === "Sin límite" && <td>{registro.datos} MB</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={sim.tarifa === "Por segundo" ? 2 : 2} className="sim-no-data">
                        No hay registros de saldos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, sim, onConfirm, hasEquipoVinculado = false }) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hasEquipoVinculado ? "Error al eliminar el registro" : "Confirmar eliminación"}
      size="sm"
    >
      <div className="sim-confirmar-eliminacion">
        {hasEquipoVinculado ? (
          <div className="sim-warning-content">
            <p className="sim-warning-message">
              No se puede eliminar la SIM porque está vinculada a un equipo. Desvincule la SIM primero.
            </p>
            <div className="sim-form-actions">
              <button type="button" onClick={onClose} className="sim-btn sim-btn-primary">
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <div className="sim-confirmation-content">
            <p className="sim-confirmation-message">¿Seguro que quieres eliminar esta SIM?</p>
            <div className="sim-form-actions">
              <button type="button" onClick={onClose} className="sim-btn sim-btn-cancel">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirm} className="sim-btn sim-btn-confirm">
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Componente Principal
const EquiposSim = () => {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState("Admin") // Mock del rol del usuario

  const [sims, setSims] = useState([])
  const [filterGrupo, setFilterGrupo] = useState("")
  const [modals, setModals] = useState({
    form: { isOpen: false, sim: null },
    saldos: { isOpen: false, sim: null },
    confirmDelete: { isOpen: false, sim: null, hasEquipoVinculado: false },
  })

  // Datos mock
  const [equiposDisponibles] = useState([
    { id: 1, nombre: "303-63015", cliente: "BN", tipo: "Demo", imei: "864859506063015" },
    { id: 2, nombre: "VL802-63016", cliente: "AG", tipo: "Cliente", imei: "864859506063016" },
    { id: 3, nombre: "ST901-75423", cliente: "SANTANDER", tipo: "Cliente", imei: "863017028775423" },
  ])

  const [gruposDisponibles] = useState([
    { id: 1, simsCount: 3 },
    { id: 2, simsCount: 5 },
    { id: 3, simsCount: 1 },
    { id: 4, simsCount: 4 },
  ])

  // Datos de ejemplo para demostración
  useEffect(() => {
    const mockSims = [
      {
        id: 1,
        numero: "4779173681",
        tarifa: "Por segundo",
        compañia: "Telcel",
        vigencia: "17/05/2025",
        recarga: 50,
        responsable: "TSS",
        grupo: 1,
        principal: "Sí",
        nombreEquipo: "NISSAN-41729",
        contraseña: "Tss2024",
        equipoId: 1,
      },
      {
        id: 2,
        numero: "4771279168",
        tarifa: "Por segundo",
        compañia: "Telcel",
        vigencia: "23/07/2025",
        recarga: 50,
        responsable: "TSS",
        grupo: 1,
        principal: "No",
        nombreEquipo: "PALACIO501",
        contraseña: "Tss2024",
        equipoId: 2,
      },
      {
        id: 3,
        numero: "4779876543",
        tarifa: "Sin límite",
        compañia: "Telcel",
        vigencia: null,
        recarga: null,
        responsable: "Cliente",
        grupo: 99,
        principal: "No",
        nombreEquipo: "CLIENTE-001",
        contraseña: null,
        equipoId: 3,
      },
    ]

    setSims(mockSims)
  }, [])

  // Obtener grupos únicos para el filtro
  const gruposUnicos = [...new Set(sims.map((sim) => sim.grupo))].sort((a, b) => a - b)

  // Filtrar SIMs
  const filteredSims = sims.filter((sim) => {
    const matchesGrupo = !filterGrupo || sim.grupo.toString() === filterGrupo
    return matchesGrupo
  })

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

  const handleSaveSim = (simData) => {
    if (simData.id && sims.find((s) => s.id === simData.id)) {
      // Editar SIM existente
      setSims((prev) => prev.map((sim) => (sim.id === simData.id ? { ...sim, ...simData, compañia: "Telcel" } : sim)))
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "SIM actualizada correctamente",
      })
    } else {
      // Agregar nueva SIM
      const nuevaSim = {
        ...simData,
        compañia: "Telcel",
        nombreEquipo: equiposDisponibles.find((e) => e.id.toString() === simData.equipo.toString())?.nombre || "N/A",
      }
      setSims((prev) => [...prev, nuevaSim])
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "SIM agregada correctamente",
      })
    }
  }

  const handleDeleteSim = () => {
    const simId = modals.confirmDelete.sim?.id
    setSims((prev) => prev.filter((sim) => sim.id !== simId))
    closeModal("confirmDelete")
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "SIM eliminada correctamente",
    })
  }

  const handleSaveSaldo = (simId, registroSaldo) => {
    // Aquí se guardaría el registro de saldo en la base de datos
    console.log("Guardando saldo para SIM:", simId, registroSaldo)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return dateString
  }

  return (
    <>
      <Header />
      <main className="sim-main-content">
        <div className="sim-container">
          {/* Sidebar Simple */}
          <section className="sim-sidebar">
            <div className="sim-sidebar-header">
              <h3 className="sim-sidebar-title">Equipos</h3>
            </div>
            <div className="sim-sidebar-menu">
              <div className="sim-menu-item" onClick={() => handleMenuNavigation("estatus-plataforma")}>
                Estatus plataforma
              </div>
              <div className="sim-menu-item" onClick={() => handleMenuNavigation("modelos")}>
                Modelos
              </div>
              <div className="sim-menu-item" onClick={() => handleMenuNavigation("proveedores")}>
                Proveedores
              </div>
              <div className="sim-menu-item" onClick={() => handleMenuNavigation("inventario")}>
                Inventario de equipos
              </div>
              <div className="sim-menu-item sim-menu-item-active" onClick={() => handleMenuNavigation("sim")}>
                SIM
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="sim-content-panel">
            <div className="sim-header">
              <div className="sim-header-info">
                <h3 className="sim-page-title">SIM</h3>
                <p className="sim-subtitle">Gestión de SIMs asociadas a equipos</p>
              </div>
            </div>

            {/* Tabla de SIMs */}
            <div className="sim-table-card">
              <div className="sim-table-header">
                <h4 className="sim-table-title">SIMs</h4>
                <div className="sim-table-controls">
                  <select
                    value={filterGrupo}
                    onChange={(e) => setFilterGrupo(e.target.value)}
                    className="sim-filter-select"
                  >
                    <option value="">Grupo 1</option>
                    {gruposUnicos.map((grupo) => (
                      <option key={grupo} value={grupo.toString()}>
                        Grupo {grupo}
                      </option>
                    ))}
                  </select>
                  <button className="sim-btn sim-btn-primary" onClick={() => openModal("form", { sim: null })}>
                    Agregar SIM
                  </button>
                </div>
              </div>

              <div className="sim-table-container">
                <table className="sim-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Tarifa</th>
                      <th>Compañía</th>
                      <th>Vigencia</th>
                      <th>Recarga</th>
                      <th>Responsable</th>
                      <th>Grupo</th>
                      <th>Principal</th>
                      <th>Equipo</th>
                      <th>Contraseña</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSims.length > 0 ? (
                      filteredSims.map((sim) => (
                        <tr key={sim.id}>
                          <td>{sim.numero}</td>
                          <td>{sim.tarifa}</td>
                          <td>{sim.compañia}</td>
                          <td>{formatDate(sim.vigencia)}</td>
                          <td>{sim.recarga || "N/A"}</td>
                          <td>{sim.responsable}</td>
                          <td>{sim.grupo}</td>
                          <td>{sim.principal}</td>
                          <td>{sim.nombreEquipo}</td>
                          <td>{sim.contraseña || "N/A"}</td>
                          <td>
                            <div className="sim-action-buttons">
                              <button
                                className="sim-btn-action sim-edit"
                                onClick={() => openModal("form", { sim })}
                                title="Editar"
                              >
                                <img src={editIcon || "/placeholder.svg"} alt="Editar" />
                              </button>
                              {userRole === "Admin" && (
                                <button
                                  className="sim-btn-action sim-delete"
                                  onClick={() => {
                                    const hasEquipoVinculado = sim.equipoId !== null
                                    openModal("confirmDelete", { sim, hasEquipoVinculado })
                                  }}
                                  title="Eliminar"
                                >
                                  <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" />
                                </button>
                              )}
                              <button
                                className="sim-btn-action sim-saldos"
                                onClick={() => openModal("saldos", { sim })}
                                title="Saldos"
                              >
                                <img src={balancesIcon || "/placeholder.svg"} alt="Saldos" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="sim-no-data">
                          No se encontraron SIMs
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
        <SimFormModal
          isOpen={modals.form.isOpen}
          onClose={() => closeModal("form")}
          onSave={handleSaveSim}
          sim={modals.form.sim}
          equiposDisponibles={equiposDisponibles}
          gruposDisponibles={gruposDisponibles}
        />

        <SaldosSidePanel
          isOpen={modals.saldos.isOpen}
          onClose={() => closeModal("saldos")}
          sim={modals.saldos.sim}
          onSaveSaldo={handleSaveSaldo}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmDelete.isOpen}
          onClose={() => closeModal("confirmDelete")}
          onConfirm={handleDeleteSim}
          sim={modals.confirmDelete.sim}
          hasEquipoVinculado={modals.confirmDelete.hasEquipoVinculado}
        />
      </main>
    </>
  )
}

export default EquiposSim
