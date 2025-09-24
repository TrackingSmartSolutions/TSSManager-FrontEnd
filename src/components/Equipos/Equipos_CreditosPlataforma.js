import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Equipos_CreditosPlataforma.css"
import Header from "../Header/Header"
import { API_BASE_URL } from "../Config/Config";
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import html2pdf from "html2pdf.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

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

const obtenerFechasDelMesActual = () => {
  const ahora = new Date()
  const año = ahora.getFullYear()
  const mes = ahora.getMonth()

  // Primer día del mes
  const primerDia = new Date(año, mes, 1)
  // Último día del mes
  const ultimoDia = new Date(año, mes + 1, 0)

  return {
    inicio: primerDia.toISOString().split('T')[0],
    fin: ultimoDia.toISOString().split('T')[0]
  }
}

const EquiposCreditosPlataforma = () => {
  const navigate = useNavigate()
  const chartRef = useRef(null)

  // Estados para los datos
  const [creditosData, setCreditosData] = useState({
    saldosPorPlataforma: {},
    estadoCuenta: [],
    historialSaldos: [],
  })

  const [filtros, setFiltros] = useState(() => {
    const fechasDelMes = obtenerFechasDelMesActual()
    return {
      fechaInicio: fechasDelMes.inicio,
      fechaFin: fechasDelMes.fin,
      plataforma: "Todos",
    }
  })

  const [ordenFecha, setOrdenFecha] = useState("asc")
  const [plataformasDisponibles, setPlataformasDisponibles] = useState([]);
  const [isLoading, setIsLoading] = useState(false)

  const toggleOrdenFecha = () => {
    setOrdenFecha((prevOrden) => (prevOrden === "desc" ? "asc" : "desc"))
  }

  const cargarDatos = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/creditos-plataforma/dashboard?fechaInicio=${filtros.fechaInicio}&fechaFin=${filtros.fechaFin}&plataforma=${filtros.plataforma}`)
      const data = await response.json()
      setCreditosData(data)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Datos para la gráfica de saldos
  const generateChartData = () => {
  if (!creditosData.historialSaldos || creditosData.historialSaldos.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  // Crear datasets dinámicamente basado en las plataformas disponibles
  const dataByDate = {}
  const plataformasEnHistorial = new Set()
  
  creditosData.historialSaldos.forEach(item => {
    const fecha = item.fecha
    if (!dataByDate[fecha]) {
      dataByDate[fecha] = {}
    }
    dataByDate[fecha][item.plataforma] = item.saldo
    plataformasEnHistorial.add(item.plataforma)
  })

  const labels = Object.keys(dataByDate).sort()

  // Colores para cada plataforma
  const colores = {
    'TRACK_SOLID': '#6366f1',
    'WHATSGPS_ANUAL': '#10b981',
    'WHATSGPS_VITALICIA': '#f59e0b',
    'TRACKERKING': '#ef4444',
    'JOINTCLOUD': '#8b5cf6'
  }

  const datasets = Array.from(plataformasEnHistorial).map(plataforma => ({
    label: plataforma.replace('_', ' '),
    data: labels.map(fecha => dataByDate[fecha][plataforma] || 0),
    borderColor: colores[plataforma] || '#6b7280',
    backgroundColor: `${colores[plataforma] || '#6b7280'}20`,
    tension: 0.4,
    fill: true,
  }))

  return { labels, datasets }
}

  const saldosChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  }

  useEffect(() => {
    cargarDatos()
  }, [filtros, ordenFecha])

  useEffect(() => {
    const fetchPlataformas = async () => {
      try {
        const response = await fetchWithToken(`${API_BASE_URL}/plataformas`);
        const data = await response.json();
        setPlataformasDisponibles(data);
      } catch (error) {
        console.error('Error loading plataformas:', error);
      }
    };

    fetchPlataformas();
  }, []);


  // Navegación del menú
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
      case "creditos-plataforma":
        navigate("/equipos_creditosplataforma")
        break
      default:
        break
    }
  }

  // Manejar cambios en filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  // Generar reporte PDF
  const handleGenerarReporte = async () => {
    const element = document.getElementById("creditos-reporte-content")

    element.classList.add('generating-pdf')

    await new Promise(resolve => setTimeout(resolve, 1000))

    const opt = {
      margin: 0.5,
      filename: `Informe_Creditos_Plataforma_${filtros.fechaInicio}_${filtros.fechaFin}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 1.2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        height: element.scrollHeight + 200,
        allowTaint: true
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait"
      },
    }

    try {
      await html2pdf().set(opt).from(element).save()
    } finally {
      element.classList.remove('generating-pdf')
    }
  }

  return (
    <>
      <div className="page-with-header">
        <Header />
        {isLoading && (
          <div className="creditosplataforma-loading">
            <div className="spinner"></div>
            <p>Cargando datos de créditos...</p>
          </div>
        )}

        <main className="creditosplataforma-main-content">
          <div className="creditosplataforma-container">
            {/* Sidebar de navegación */}
            <section className="creditosplataforma-sidebar">
              <div className="creditosplataforma-sidebar-header">
                <h3 className="creditosplataforma-sidebar-title">Equipos</h3>
              </div>
              <div className="creditosplataforma-sidebar-menu">
                <div className="creditosplataforma-menu-item" onClick={() => handleMenuNavigation("estatus-plataforma")}>
                  Estatus plataforma
                </div>
                <div className="creditosplataforma-menu-item" onClick={() => handleMenuNavigation("modelos")}>
                  Modelos
                </div>
                <div className="creditosplataforma-menu-item" onClick={() => handleMenuNavigation("proveedores")}>
                  Proveedores
                </div>
                <div className="creditosplataforma-menu-item" onClick={() => handleMenuNavigation("inventario")}>
                  Inventario de equipos
                </div>
                <div className="creditosplataforma-menu-item" onClick={() => handleMenuNavigation("sim")}>
                  SIM
                </div>
                <div
                  className="creditosplataforma-menu-item creditosplataforma-menu-item-active"
                  onClick={() => handleMenuNavigation("creditos-plataforma")}
                >
                  Créditos Plataformas
                </div>
              </div>
            </section>

            {/* Panel de contenido principal */}
            <section className="creditosplataforma-content-panel">
              <div id="creditos-reporte-content">
                <div className="creditosplataforma-header">
                  <h3 className="creditosplataforma-page-title">Créditos por Plataforma</h3>
                  <div className="creditosplataforma-header-actions">
                    <div className="creditosplataforma-filtros-container">
                      <label>Rango de fecha del movimiento</label>
                      <div className="creditosplataforma-date-range">
                        <input
                          type="date"
                          value={filtros.fechaInicio}
                          onChange={(e) => handleFiltroChange("fechaInicio", e.target.value)}
                          className="creditosplataforma-date-input"
                        />
                        <span>-</span>
                        <input
                          type="date"
                          value={filtros.fechaFin}
                          onChange={(e) => handleFiltroChange("fechaFin", e.target.value)}
                          className="creditosplataforma-date-input"
                        />
                      </div>
                    </div>
                    <button className="creditosplataforma-btn creditosplataforma-btn-pdf" onClick={handleGenerarReporte}>
                      Crear reporte
                    </button>
                  </div>
                </div>

                <p className="creditosplataforma-subtitle">Gestión de los créditos en las distintas Plataformas</p>

                {/* Cards de saldo por plataforma */}
                <div className="creditosplataforma-saldos-grid">
                  <div className="creditosplataforma-saldo-card creditosplataforma-saldo-track-solid">
                    <div className="creditosplataforma-saldo-content">
                      <h4 className="creditosplataforma-saldo-title">Track Solid</h4>
                      <div className="creditosplataforma-saldo-amount">
                        <span className="creditosplataforma-saldo-number">
                          {creditosData.saldosPorPlataforma?.TRACK_SOLID || 0}
                        </span>
                        <span className="creditosplataforma-saldo-icon">⚡</span>
                      </div>
                    </div>
                  </div>

                  <div className="creditosplataforma-saldo-card creditosplataforma-saldo-whats-gps">
                    <div className="creditosplataforma-saldo-content">
                      <h4 className="creditosplataforma-saldo-title">WhatsGPS</h4>
                      <div className="creditosplataforma-saldo-amount">
                        <span className="creditosplataforma-saldo-number">
                        </span>

                      </div>
                      <div className="creditosplataforma-subtipos">
                        <div className="creditosplataforma-subtipo">
                          <span>Anual: {creditosData.saldosPorPlataforma?.WHATSGPS_ANUAL || 0}</span>
                          <span className="creditosplataforma-saldo-icon">⚡</span>
                        </div>
                        <div className="creditosplataforma-subtipo">
                          <span>Vitalicia: {creditosData.saldosPorPlataforma?.WHATSGPS_VITALICIA || 0}</span>
                          <span className="creditosplataforma-saldo-icon">⚡</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfica de saldos por plataforma */}
                <div className="creditosplataforma-chart-section">
                  <div className="creditosplataforma-chart-card">
                    <h4 className="creditosplataforma-chart-title">Saldo por plataforma</h4>
                    <div className="creditosplataforma-chart-container">
                      <Line ref={chartRef} data={generateChartData()} options={saldosChartOptions} />
                    </div>
                  </div>
                </div>

                {/* Filtros y tabla de estado de cuenta */}
                <div className="creditosplataforma-table-section">
                  <div className="creditosplataforma-table-header">
                    <h4 className="creditosplataforma-table-title">Estado de cuenta</h4>
                    <div className="creditosplataforma-table-filters">
                      <select
                        value={filtros.plataforma}
                        onChange={(e) => handleFiltroChange("plataforma", e.target.value)}
                        className="creditosplataforma-filter-select"
                      >
                        <option value="Todos">Todas las plataformas</option>
                        {plataformasDisponibles.map((plataforma) => (
                          <option key={plataforma.id} value={plataforma.nombrePlataforma}>
                            {plataforma.nombrePlataforma}
                          </option>
                        ))}
                      </select>
                      <button
                        className="creditosplataforma-btn creditosplataforma-btn-orden"
                        onClick={toggleOrdenFecha}
                        title={`Cambiar a orden ${ordenFecha === "desc" ? "ascendente" : "descendente"} por fecha`}
                      >
                        {ordenFecha === "desc" ? "📅 ↓ Recientes primero" : "📅 ↑ Antiguas primero"}
                      </button>
                    </div>
                  </div>

                  <div className="creditosplataforma-table-card">
                    <div className="creditosplataforma-table-container">
                      <table className="creditosplataforma-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Plataforma</th>
                            <th>Concepto</th>
                            <th>Nombre del equipo</th>
                            <th>Cargo</th>
                            <th>Abono</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditosData.estadoCuenta
                            ?.slice()
                            .sort((a, b) => {
                              const fechaA = new Date(a.fecha);
                              const fechaB = new Date(b.fecha);
                              return ordenFecha === 'desc' ? fechaB - fechaA : fechaA - fechaB;
                            })
                            .map((registro, index) => (
                              <tr key={index}>
                                <td>{new Date(registro.fecha).toLocaleDateString('es-MX')}</td>
                                <td>{registro.plataforma || '-'}</td>
                                <td>{registro.concepto.replace('_', ' ')}</td>
                                <td>{registro.equipoNombre || registro.nota || '-'}</td>
                                <td className={registro.tipo === 'CARGO' ? "creditosplataforma-cargo" : ""}>
                                  {registro.tipo === 'CARGO' ? `$${registro.monto}` : ''}
                                </td>
                                <td className={registro.tipo === 'ABONO' ? "creditosplataforma-abono" : ""}>
                                  {registro.tipo === 'ABONO' ? `$${registro.monto}` : ''}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  )
}

export default EquiposCreditosPlataforma
