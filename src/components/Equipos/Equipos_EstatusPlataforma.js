
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Equipos_EstatusPlataforma.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
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
    sm: "estatusplataforma-modal-sm",
    md: "estatusplataforma-modal-md",
    lg: "estatusplataforma-modal-lg",
    xl: "estatusplataforma-modal-xl",
  }

  return (
    <div className="estatusplataforma-modal-overlay" onClick={canClose ? onClose : () => {}}>
      <div className={`estatusplataforma-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="estatusplataforma-modal-header">
          <h2 className="estatusplataforma-modal-title">{title}</h2>
          {canClose && (
            <button className="estatusplataforma-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="estatusplataforma-modal-body">{children}</div>
      </div>
    </div>
  )
}

// Panel Lateral Deslizante para Check Equipos
const CheckEquiposSidePanel = ({ isOpen, onClose, equipos, onSaveChecklist }) => {
  const [selectedPlatform, setSelectedPlatform] = useState("Todos")
  const [equiposStatus, setEquiposStatus] = useState({})

  const plataformas = ["Todos", "Track Solid", "WhatsGPS", "TrackerKing"]

  useEffect(() => {
    if (isOpen && equipos.length > 0) {
      const initialStatus = {}
      equipos.forEach((equipo) => {
        initialStatus[equipo.id] = {
          status: null,
          motivo: "",
        }
      })
      setEquiposStatus(initialStatus)
    }
  }, [isOpen, equipos])

  const filteredEquipos = equipos.filter(
    (equipo) => selectedPlatform === "Todos" || equipo.plataforma === selectedPlatform,
  )

  const handleStatusChange = (equipoId, newStatus) => {
    setEquiposStatus((prev) => ({
      ...prev,
      [equipoId]: {
        ...prev[equipoId],
        status: newStatus,
        motivo: newStatus === false ? prev[equipoId]?.motivo || "" : "",
      },
    }))
  }

  const handleMotivoChange = (equipoId, motivo) => {
    setEquiposStatus((prev) => ({
      ...prev,
      [equipoId]: {
        ...prev[equipoId],
        motivo,
      },
    }))
  }

  const handleSaveChecklist = () => {
    const equiposConStatus = Object.entries(equiposStatus)
      .filter(([_, data]) => data.status !== null)
      .map(([equipoId, data]) => ({
        equipoId: Number.parseInt(equipoId),
        status: data.status ? "Reportando" : "No Reportando",
        motivo: data.status ? null : data.motivo,
      }))

    if (equiposConStatus.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Debe asignar al menos un estatus antes de guardar.",
      })
      return
    }

    onSaveChecklist(equiposConStatus)
    onClose()
  }

  const motivosOptions = [
    "Batería interna baja",
    "Desconexión de fuente",
    "Zona de baja cobertura",
    "Sin saldo",
    "Perdido",
    "Expirado",
    "Apagado",
    "En reparación",
  ]

  return (
    <>
      {isOpen && <div className="estatusplataforma-side-panel-overlay" onClick={onClose}></div>}

      <div className={`estatusplataforma-side-panel ${isOpen ? "estatusplataforma-side-panel-open" : ""}`}>
        <div className="estatusplataforma-side-panel-header">
          <h2 className="estatusplataforma-side-panel-title">Selecciona la plataforma</h2>
          <button className="estatusplataforma-side-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="estatusplataforma-side-panel-content">
          <div className="estatusplataforma-side-panel-form-group">
            <label htmlFor="plataforma">Plataforma</label>
            <select
              id="plataforma"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="estatusplataforma-side-panel-form-control"
            >
              {plataformas.map((plataforma) => (
                <option key={plataforma} value={plataforma}>
                  {plataforma}
                </option>
              ))}
            </select>
          </div>

          <div className="estatusplataforma-side-panel-table-container">
            <table className="estatusplataforma-side-panel-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Reportando</th>
                  <th>No Reportando</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipos.map((equipo) => (
                  <tr key={equipo.id}>
                    <td>
                      <div className="estatusplataforma-equipo-info">
                        <div className="estatusplataforma-equipo-nombre">{equipo.codigo}</div>
                        <div className="estatusplataforma-equipo-detalle">{equipo.nombre}</div>
                      </div>
                    </td>
                    <td className="estatusplataforma-status-cell">
                      <div className="estatusplataforma-status-radio-container">
                        <input
                          type="radio"
                          name={`status-${equipo.id}`}
                          checked={equiposStatus[equipo.id]?.status === true}
                          onChange={() => handleStatusChange(equipo.id, true)}
                          className="estatusplataforma-status-radio estatusplataforma-status-radio-green"
                        />
                        <span className="estatusplataforma-status-checkmark estatusplataforma-green">✓</span>
                      </div>
                    </td>
                    <td className="estatusplataforma-status-cell">
                      <div className="estatusplataforma-status-radio-container">
                        <input
                          type="radio"
                          name={`status-${equipo.id}`}
                          checked={equiposStatus[equipo.id]?.status === false}
                          onChange={() => handleStatusChange(equipo.id, false)}
                          className="estatusplataforma-status-radio estatusplataforma-status-radio-red"
                        />
                        <span className="estatusplataforma-status-checkmark estatusplataforma-red">✗</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Motivos para equipos No Reportando */}
          {Object.entries(equiposStatus).some(([_, data]) => data.status === false) && (
            <div className="estatusplataforma-motivos-section">
              <h4>Motivos para equipos No Reportando:</h4>
              {Object.entries(equiposStatus)
                .filter(([_, data]) => data.status === false)
                .map(([equipoId, data]) => {
                  const equipo = equipos.find((e) => e.id === Number.parseInt(equipoId))
                  return (
                    <div key={equipoId} className="estatusplataforma-motivo-item">
                      <label>{equipo?.codigo}:</label>
                      <select
                        value={data.motivo || ""}
                        onChange={(e) => handleMotivoChange(Number.parseInt(equipoId), e.target.value)}
                        className="estatusplataforma-side-panel-form-control"
                      >
                        <option value="">Seleccionar motivo</option>
                        {motivosOptions.map((motivo) => (
                          <option key={motivo} value={motivo}>
                            {motivo}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        <div className="estatusplataforma-side-panel-footer">
          <button
            type="button"
            onClick={handleSaveChecklist}
            className="estatusplataforma-btn estatusplataforma-btn-primary estatusplataforma-btn-full-width"
          >
            Guardar checklist
          </button>
        </div>
      </div>
    </>
  )
}

// Modal de Confirmación de Cambio de Estatus
const ConfirmarCambioEstatusModal = ({
  isOpen,
  onClose,
  onConfirm,
  equipoNombre,
  nuevoEstatus,
  motivo,
  onMotivoChange,
}) => {
  const motivosOptions = [
    "Batería interna baja",
    "Desconexión de fuente",
    "Zona de baja cobertura",
    "Sin saldo",
    "Perdido",
    "Expirado",
    "Apagado",
    "En reparación",
  ]

  const handleConfirm = () => {
    if (nuevoEstatus === "No Reportando" && !motivo) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Debe seleccionar un motivo para equipos no reportando.",
      })
      return
    }
    onConfirm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar cambio de estatus" size="sm">
      <div className="estatusplataforma-confirmar-eliminacion">
        <div className="estatusplataforma-confirmation-content">
          <p className="estatusplataforma-confirmation-message">
            ¿Seguro que quieres cambiar el estatus de reporte de {equipoNombre} a {nuevoEstatus}?
          </p>

          {nuevoEstatus === "No Reportando" && (
            <div className="estatusplataforma-modal-form-group" style={{ width: "100%", marginTop: "1rem" }}>
              <label htmlFor="motivo">Motivo:</label>
              <select
                id="motivo"
                value={motivo}
                onChange={(e) => onMotivoChange(e.target.value)}
                className="estatusplataforma-modal-form-control"
              >
                <option value="">Seleccionar motivo</option>
                {motivosOptions.map((motivoOption) => (
                  <option key={motivoOption} value={motivoOption}>
                    {motivoOption}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="estatusplataforma-modal-form-actions">
            <button type="button" onClick={onClose} className="estatusplataforma-btn estatusplataforma-btn-cancel">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="estatusplataforma-btn estatusplataforma-btn-confirm"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Componente Principal
const EquiposEstatusPlataforma = () => {
  const navigate = useNavigate()

  const [equiposData, setEquiposData] = useState({
    estatusPorCliente: [],
    equiposPorPlataforma: [],
    equiposOffline: [],
    equiposParaCheck: [],
    fechaUltimoCheck: null,
  })

  const [modals, setModals] = useState({
    checkEquipos: { isOpen: false },
    confirmarCambio: {
      isOpen: false,
      equipoNombre: "",
      nuevoEstatus: "",
      motivo: "",
      onConfirm: null,
    },
  })

  // Datos de ejemplo para demostración
  useEffect(() => {
    const mockData = {
      estatusPorCliente: [
        { cliente: "AG", enLinea: 0, fueraLinea: 8 },
        { cliente: "BN", enLinea: 0, fueraLinea: 6 },
        { cliente: "SANTANDER SEALES", enLinea: 8, fueraLinea: 4 },
        { cliente: "FERM Constructora", enLinea: 2, fueraLinea: 0 },
        { cliente: "DYC Logistic", enLinea: 1, fueraLinea: 2 },
        { cliente: "Ranch Capital", enLinea: 6, fueraLinea: 2 },
        { cliente: "Agua Bastos", enLinea: 8, fueraLinea: 2 },
      ],
      equiposPorPlataforma: [
        { plataforma: "Track Solid", cantidad: 45 },
        { plataforma: "WhatsGPS", cantidad: 38 },
        { plataforma: "TrackerKing", cantidad: 12 },
      ],
      equiposOffline: [
        { cliente: "AG", nombre: "VL502-L-10343", plataforma: "Tracksolid", motivo: "Expirado" },
        { cliente: "Agua Bastos", nombre: "Columbia", plataforma: "Tracksolid", motivo: "Desconexión de fuente" },
        { cliente: "BN", nombre: "303-93075", plataforma: "Tracksolid", motivo: "Batería interna baja" },
        { cliente: "DYC Logistic", nombre: "225", plataforma: "WhatsGPS", motivo: "En reparación" },
      ],
      equiposParaCheck: [
        { id: 1, codigo: "NISSAN-GABARITO", nombre: "Equipo Demo 1", plataforma: "Track Solid", tipo: "Cliente" },
        { id: 2, codigo: "VL502-L-10343", nombre: "Equipo Demo 2", plataforma: "WhatsGPS", tipo: "Demo" },
        { id: 3, codigo: "CASCADA", nombre: "Equipo Demo 3", plataforma: "TrackerKing", tipo: "Cliente" },
      ],
      fechaUltimoCheck: "2024/12/25",
    }

    setEquiposData(mockData)
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

  const handleCheckEquipos = () => {
    openModal("checkEquipos")
  }

  const handleSaveChecklist = (equiposConStatus) => {
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: `Se ha guardado el checklist de ${equiposConStatus.length} equipos.`,
    })

    console.log("Equipos con status:", equiposConStatus)
  }

  const handleGeneratePDF = () => {
    Swal.fire({
      icon: "info",
      title: "Generando PDF",
      text: "El reporte PDF se está generando...",
    })
  }

  // Configuración de gráficos
  const estatusClienteChartData = {
    labels: equiposData.estatusPorCliente.map((item) => item.cliente),
    datasets: [
      {
        label: "En Línea",
        data: equiposData.estatusPorCliente.map((item) => item.enLinea),
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
        borderWidth: 1,
      },
      {
        label: "Fuera de Línea",
        data: equiposData.estatusPorCliente.map((item) => item.fueraLinea),
        backgroundColor: "#f44336",
        borderColor: "#f44336",
        borderWidth: 1,
      },
    ],
  }

  const plataformaChartData = {
    labels: equiposData.equiposPorPlataforma.map((item) => item.plataforma),
    datasets: [
      {
        label: "Cantidad de Equipos",
        data: equiposData.equiposPorPlataforma.map((item) => item.cantidad),
        backgroundColor: ["#037ce0", "#4CAF50", "#FF9800"],
        borderColor: ["#037ce0", "#4CAF50", "#FF9800"],
        borderWidth: 1,
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
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 2,
        },
      },
    },
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

  return (
    <>
      <Header />
      <main className="estatusplataforma-main-content">
        <div className="estatusplataforma-container">
          {/* Simple Sidebar Navigation */}
          <section className="estatusplataforma-sidebar">
            <div className="estatusplataforma-sidebar-header">
              <h3 className="estatusplataforma-sidebar-title">Equipos</h3>
            </div>
            <div className="estatusplataforma-sidebar-menu">
              <div
                className="estatusplataforma-menu-item estatusplataforma-menu-item-active"
                onClick={() => handleMenuNavigation("estatus-plataforma")}
              >
                Estatus plataforma
              </div>
              <div className="estatusplataforma-menu-item" onClick={() => handleMenuNavigation("modelos")}>
                Modelos
              </div>
              <div className="estatusplataforma-menu-item" onClick={() => handleMenuNavigation("proveedores")}>
                Proveedores
              </div>
              <div className="estatusplataforma-menu-item" onClick={() => handleMenuNavigation("inventario")}>
                Inventario de equipos
              </div>
              <div className="estatusplataforma-menu-item" onClick={() => handleMenuNavigation("sim")}>
                SIM
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="estatusplataforma-content-panel">
            <div className="estatusplataforma-header">
              <h3 className="estatusplataforma-page-title">Estatus plataforma</h3>
              <div className="estatusplataforma-header-actions">
                <button className="estatusplataforma-btn estatusplataforma-btn-primary" onClick={handleCheckEquipos}>
                  Check equipos
                </button>
              </div>
            </div>

            <p className="estatusplataforma-subtitle">Monitoreo de equipos por cliente</p>

            {equiposData.fechaUltimoCheck && (
              <p className="estatusplataforma-data-date">Datos actualizados: {equiposData.fechaUltimoCheck}</p>
            )}

            {/* Charts Section */}
            <div className="estatusplataforma-charts-grid">
              {/* Estatus por Cliente Chart */}
              <div className="estatusplataforma-chart-card">
                <h4 className="estatusplataforma-chart-title">Estatus de equipos por cliente</h4>
                <div className="estatusplataforma-chart-container">
                  <Bar data={estatusClienteChartData} options={chartOptions} />
                </div>
              </div>

              {/* Equipos por Plataforma Chart */}
              <div className="estatusplataforma-chart-card">
                <h4 className="estatusplataforma-chart-title">Equipos por Plataforma</h4>
                <div className="estatusplataforma-chart-container">
                  <Bar data={plataformaChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Equipos Offline Table */}
            <div className="estatusplataforma-table-card">
              <h4 className="estatusplataforma-table-title">Equipos Offline</h4>

              <div className="estatusplataforma-table-container">
                <table className="estatusplataforma-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Nombre</th>
                      <th>Plataforma</th>
                      <th>Reportando</th>
                      <th>Motivo de no Reporte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equiposData.equiposOffline.length > 0 ? (
                      equiposData.equiposOffline.map((equipo, index) => (
                        <tr key={index}>
                          <td>{equipo.cliente}</td>
                          <td>{equipo.nombre}</td>
                          <td>{equipo.plataforma}</td>
                          <td>
                            <span className="estatusplataforma-status-cross">✗</span>
                          </td>
                          <td>{equipo.motivo}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="estatusplataforma-no-data">
                          No hay equipos offline
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PDF Generation Button */}
            <div className="estatusplataforma-pdf-button-container">
              <button className="estatusplataforma-btn estatusplataforma-btn-pdf" onClick={handleGeneratePDF}>
                Crear PDF
              </button>
            </div>
          </section>
        </div>

        {/* Side Panel for Check Equipos */}
        <CheckEquiposSidePanel
          isOpen={modals.checkEquipos.isOpen}
          onClose={() => closeModal("checkEquipos")}
          equipos={equiposData.equiposParaCheck}
          onSaveChecklist={handleSaveChecklist}
        />

        <ConfirmarCambioEstatusModal
          isOpen={modals.confirmarCambio.isOpen}
          onClose={() => closeModal("confirmarCambio")}
          onConfirm={modals.confirmarCambio.onConfirm}
          equipoNombre={modals.confirmarCambio.equipoNombre}
          nuevoEstatus={modals.confirmarCambio.nuevoEstatus}
          motivo={modals.confirmarCambio.motivo}
          onMotivoChange={(motivo) =>
            setModals((prev) => ({
              ...prev,
              confirmarCambio: { ...prev.confirmarCambio, motivo },
            }))
          }
        />
      </main>
    </>
  )
}

export default EquiposEstatusPlataforma
