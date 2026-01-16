import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Equipos_CreditosPlataforma.css"
import Header from "../Header/Header"
import { API_BASE_URL } from "../Config/Config";
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
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

  const primerDia = new Date(año, mes, 1)
  const ultimoDia = new Date(año, mes + 1, 0)

  return [primerDia, ultimoDia];
}

const Modal = ({ isOpen, onClose, title, children, size = "md", closeOnOverlayClick = true }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050
  };

  let widthStyle = '500px';
  let maxWidthStyle = '95%';

  if (size === 'lg') widthStyle = '800px';
  if (size === 'xl') widthStyle = '950px';

  const contentStyle = {
    backgroundColor: 'white', borderRadius: '8px', padding: '20px',
    maxHeight: '95vh', overflowY: 'auto', width: widthStyle, maxWidth: maxWidthStyle,
    position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
  };

  return (
    <div style={overlayStyle} onClick={closeOnOverlayClick ? onClose : () => { }}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '10px', borderBottom: '1px solid #dee2e6', paddingBottom: '10px'
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#6c757d', padding: '0 5px'
          }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const CustomDatePickerInput = ({ value, onClick, placeholder }) => (
  <div className="creditosplataforma-date-picker-wrapper">
    <input
      type="text"
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      className="creditosplataforma-date-picker"
    />
    <div className="creditosplataforma-date-picker-icons">
      <svg
        className="creditosplataforma-calendar-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    </div>
  </div>
);

// Modal de Vista Previa
const PdfPreviewModal = ({ isOpen, onClose, pdfUrl, onDownload }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vista previa" size="xl" closeOnOverlayClick={false}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <button
            type="button"
            onClick={onDownload}
            className="creditosplataforma-btn creditosplataforma-btn-pdf"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            Descargar PDF
          </button>
        </div>

        <div style={{
          border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden',
          height: '75vh'
        }}>
          <iframe
            src={`${pdfUrl}#view=FitH&navpanes=0&toolbar=0`}
            title="Vista Previa"
            width="100%" height="100%" style={{ border: 'none' }}
          />
        </div>
      </div>
    </Modal>
  );
};

const EquiposCreditosPlataforma = () => {
  const navigate = useNavigate()
  const chartRef = useRef(null)

  // Estados para los datos
  const [creditosData, setCreditosData] = useState({
    saldosPorPlataforma: {},
    estadoCuenta: [],
    historialSaldos: [],
  })

  const [rangoFechas, setRangoFechas] = useState(() => obtenerFechasDelMesActual());
  const [fechaInicio, fechaFin] = rangoFechas;
  const [filtroPlataforma, setFiltroPlataforma] = useState("Todos");
  const [ordenFecha, setOrdenFecha] = useState("asc")
  const [plataformasDisponibles, setPlataformasDisponibles] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const [pdfPreview, setPdfPreview] = useState({
    isOpen: false,
    url: null,
    filename: ""
  });

  const toggleOrdenFecha = () => {
    setOrdenFecha((prevOrden) => (prevOrden === "desc" ? "asc" : "desc"))
  }

  const cargarDatos = async () => {
    setIsLoading(true)
    try {
      const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      };

      const fechaInicioStr = formatearFecha(fechaInicio);
      const fechaFinStr = formatearFecha(fechaFin);

      const response = await fetchWithToken(
        `${API_BASE_URL}/creditos-plataforma/dashboard?fechaInicio=${fechaInicioStr}&fechaFin=${fechaFinStr}&plataforma=${filtroPlataforma}`
      )
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
      'WHATSGPS_VITALICIA': '#55d471',
      'TRACKERKING': '#ef4444',
      'JOINTCLOUD': '#8b5cf6',
      'FULLTRACK': '#f97316',
      'F_BASIC': '#facc15'
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
  }, [fechaInicio, fechaFin, filtroPlataforma, ordenFecha])

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

  // Generar reporte PDF
  const handleGenerarReporte = async () => {
  const element = document.getElementById("creditos-reporte-content");
  element.classList.add('generating-pdf');

  await new Promise(resolve => setTimeout(resolve, 500));

  const opt = {
    margin: 0.5,
    filename: `Informe_Creditos_Plataforma_${fechaInicio ? fechaInicio.toISOString().split('T')[0] : 'sin-fecha'}_${fechaFin ? fechaFin.toISOString().split('T')[0] : 'sin-fecha'}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      allowTaint: true
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    const blobUrl = await html2pdf().set(opt).from(element).output('bloburl');

    setPdfPreview({
      isOpen: true,
      url: blobUrl,
      filename: opt.filename
    });

  } catch (error) {
    console.error("Error generando PDF:", error);
  } finally {
    element.classList.remove('generating-pdf');
  }
}

  const handleDownloadFromPreview = () => {
    if (pdfPreview.url) {
      const link = document.createElement('a');
      link.href = pdfPreview.url;
      link.download = pdfPreview.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClosePreview = () => {
    if (pdfPreview.url) {
      window.URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview({ isOpen: false, url: null, filename: "" });
  };

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
                      <DatePicker
                        selectsRange={true}
                        startDate={fechaInicio}
                        endDate={fechaFin}
                        onChange={(update) => {
                          setRangoFechas(update);
                        }}
                        isClearable={true}
                        placeholderText="Seleccione fecha o rango"
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomDatePickerInput />}
                        locale="es"
                      />
                    </div>
                    <button className="creditosplataforma-btn creditosplataforma-btn-pdf" onClick={handleGenerarReporte}>
                      Visualizar reporte
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

                  <div className="creditosplataforma-saldo-card creditosplataforma-saldo-licencias">
                    <div className="creditosplataforma-saldo-content">
                      <h4 className="creditosplataforma-saldo-title">Licencias</h4>
                      <div className="creditosplataforma-subtipos">
                        <div className="creditosplataforma-subtipo">
                          <div>
                            <strong style={{ fontSize: '0.95em' }}>Fulltrack</strong>
                            <div style={{ fontSize: '0.75em', marginTop: '2px', lineHeight: '1.4' }}>
                              <div>Ocupadas: {creditosData.saldosPorPlataforma?.FULLTRACK_OCUPADAS || 0}</div>
                              <div>Disponibles: {creditosData.saldosPorPlataforma?.FULLTRACK_DISPONIBLES || 0}</div>
                              <div>Total: {creditosData.saldosPorPlataforma?.FULLTRACK_TOTAL || 0}</div>
                            </div>
                          </div>
                          <span className="creditosplataforma-saldo-icon">📍</span>
                        </div>
                        <div className="creditosplataforma-subtipo">
                          <div>
                            <strong style={{ fontSize: '0.95em' }}>F/Basic</strong>
                            <div style={{ fontSize: '0.75em', marginTop: '2px', lineHeight: '1.4' }}>
                              <div>Ocupadas: {creditosData.saldosPorPlataforma?.F_BASIC_OCUPADAS || 0}</div>
                              <div>Disponibles: {creditosData.saldosPorPlataforma?.F_BASIC_DISPONIBLES || 0}</div>
                              <div>Total: {creditosData.saldosPorPlataforma?.F_BASIC_TOTAL || 0}</div>
                            </div>
                          </div>
                          <span className="creditosplataforma-saldo-icon">📍</span>
                        </div>
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
                          <span>Integraciones: {creditosData.saldosPorPlataforma?.WHATSGPS_VITALICIA || 0}</span>
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
                        value={filtroPlataforma}
                        onChange={(e) => setFiltroPlataforma(e.target.value)}
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
                                  {registro.tipo === 'CARGO' ? registro.monto : ''}
                                </td>
                                <td className={registro.tipo === 'ABONO' ? "creditosplataforma-abono" : ""}>
                                  {registro.tipo === 'ABONO' ? registro.monto : ''}
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
        <PdfPreviewModal
          isOpen={pdfPreview.isOpen}
          onClose={handleClosePreview}
          pdfUrl={pdfPreview.url}
          onDownload={handleDownloadFromPreview}
        />
      </div>
    </>
  )
}

export default EquiposCreditosPlataforma
