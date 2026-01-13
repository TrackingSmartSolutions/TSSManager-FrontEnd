import { useState, useEffect, useRef } from "react";
import "./ReportePersonal.css";
import Header from "../Header/Header";
import Swal from "sweetalert2";
import downloadIcon from "../../assets/icons/descarga.png";
import { API_BASE_URL } from "../Config/Config";
import Chart from "chart.js/auto";
import html2canvas from "html2canvas";
import { jwtDecode } from "jwt-decode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`Error: ${response.status} - ${response.statusText}`);
  return response;
};

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
            className="reporte-btn reporte-btn-download"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', width: 'auto', padding: '8px 16px' }}
          >
            <img src={downloadIcon} alt="Descargar" className="reporte-btn-icon" style={{ width: '16px', height: '16px' }} />
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

const CustomDatePickerInput = ({ value, onClick, placeholder }) => (
  <div className="reporte-date-picker-wrapper">
    <input
      type="text"
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      className="reporte-date-picker"
    />
    <div className="reporte-date-picker-icons">
      <svg
        className="reporte-calendar-icon"
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

const ReportePersonal = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [loading, setLoading] = useState(false);
  const [actividadesData, setActividadesData] = useState([]);
  const [empresasData, setEmpresasData] = useState([]);
  const [notasData, setNotasData] = useState([]);
  const [currentUser, setCurrentUser] = useState({ nombre: "", apellidos: "" });
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pdfPreview, setPdfPreview] = useState({
    isOpen: false,
    url: null,
    filename: ""
  });

  const activitiesChartRef = useRef(null);
  const companiesChartRef = useRef(null);
  const chartsSectionRef = useRef(null);
  const notesSectionRef = useRef(null);

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const mexicoTime = new Date(today.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    const year = mexicoTime.getFullYear();
    const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
    const day = String(mexicoTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem("token");
      const userRol = localStorage.getItem("userRol");

      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const nombreUsuario = decodedToken.sub;
          const userData = await fetchUserDetails(nombreUsuario);

          setCurrentUser({
            nombre: userData.nombre,
            apellidos: userData.apellidos
          });

          if (userRol === "ADMINISTRADOR" || userRol === "GESTOR") {
            setSelectedUser(userData.nombre);
          }
        } catch (decodeError) {
          console.error("Error decodificando el token:", decodeError);
          setCurrentUser({ nombre: "Usuario", apellidos: "Desconocido" });
        }
      }
    };

    loadCurrentUser();

    if (!initialDataLoaded) {
      fetchReportData();
      setInitialDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const userRol = localStorage.getItem("userRol");

      if (userRol === "ADMINISTRADOR" || userRol === "GESTOR") {
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/auth/users`);
          const data = await response.json();
          const usersList = data.map(user => user.nombre.trim());
          console.log("Lista de usuarios cargada:", usersList);
          setUsers(usersList);
        } catch (error) {
          console.error("ERROR al cargar usuarios:", error);
        }
      }
    };

    loadUsers();
  }, []);

  // Actualizar datos cuando cambie el rango de fechas
  useEffect(() => {
    if (initialDataLoaded && (startDate || endDate)) {
      fetchReportData();
    }
  }, [startDate, endDate, initialDataLoaded]);

  useEffect(() => {
    if (initialDataLoaded && selectedUser) {
      fetchReportData();
    }
  }, [selectedUser, initialDataLoaded]);

  // Crear/actualizar gráficos cuando cambien los datos
  useEffect(() => {
    requestAnimationFrame(() => {
      updateCharts();
    });
  }, [actividadesData, empresasData]);


  const fetchUserDetails = async (nombreUsuario) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/auth/users/by-username/${nombreUsuario}`);
      const user = await response.json();
      return user;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return { nombre: "Usuario", apellidos: "Desconocido" };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const todayDate = getTodayDate();

      const formatDateForAPI = (date) => {
        if (!date) return todayDate;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startDateFormatted = formatDateForAPI(startDate);
      const endDateFormatted = formatDateForAPI(endDate);
      const userRol = localStorage.getItem("userRol");

      let url = `${API_BASE_URL}/reportes/actividades?startDate=${startDateFormatted}&endDate=${endDateFormatted}`;

      // Si es administrador y tiene un usuario seleccionado, agregarlo a la URL
      if (userRol === "ADMINISTRADOR" && selectedUser) {
        url += `&usuario=${selectedUser}`;
      }

      const response = await fetchWithToken(url);
      const data = await response.json();

      setActividadesData(data.actividades || []);
      setEmpresasData(data.empresas || []);
      setNotasData(data.notas || []);

    } catch (error) {
      console.error("Error fetching report data:", error);
      setActividadesData([]);
      setEmpresasData([]);
      setNotasData([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCharts = () => {
    if (actividadesData.length > 0) {
      console.log("   - Primer elemento actividades:", actividadesData[0]);
      console.log("   - Propiedades disponibles:", Object.keys(actividadesData[0]));
    }
    if (empresasData.length > 0) {
      console.log("   - Primer elemento empresas:", empresasData[0]);
      console.log("   - Propiedades disponibles:", Object.keys(empresasData[0]));
    }

    // Destruir gráficos existentes
    if (activitiesChartRef.current) {
      activitiesChartRef.current.destroy();
      activitiesChartRef.current = null;
    }
    if (companiesChartRef.current) {
      companiesChartRef.current.destroy();
      companiesChartRef.current = null;
    }

    // Obtener contextos de los canvas
    const activitiesCtx = document.getElementById("activitiesChart")?.getContext("2d");
    const companiesCtx = document.getElementById("companiesChart")?.getContext("2d");

    // Crear gráfico de actividades
    if (activitiesCtx) {
      if (actividadesData.length > 0) {
        try {
          // Agrupar datos por tipo principal
          const groupedData = actividadesData.reduce((acc, item) => {
            const tipo = item.tipo || "OTROS";
            if (!acc[tipo]) {
              acc[tipo] = [];
            }
            acc[tipo].push(item);
            return acc;
          }, {});

          // Crear datasets para cada tipo
          const datasets = [];
          const allLabels = new Set();

          // Colores por tipo
          const typeColors = {
            'TAREAS': ['#45b7d1', '#5bc0de', '#17a2b8'],
            'LLAMADAS': ['#4ecdc4', '#26d0ce'],
            'REUNIONES': ['#ff6b6b', '#fd79a8']
          };

          Object.entries(groupedData).forEach(([tipo, items], typeIndex) => {
            const labels = items.map(item => item.name);
            const values = items.map(item => item.value);
            const colors = typeColors[tipo];

            labels.forEach(label => allLabels.add(label));

            datasets.push({
              label: tipo,
              data: Array.from(allLabels).map(label => {
                const item = items.find(i => i.name === label);
                return item ? item.value : 0;
              }),
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1,
              categoryPercentage: 0.8,
              barPercentage: 0.9
            });
          });

          activitiesChartRef.current = new Chart(activitiesCtx, {
            type: "bar",
            data: {
              labels: Array.from(allLabels),
              datasets: datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  callbacks: {
                    title: function (tooltipItems) {
                      const datasetLabel = tooltipItems[0].dataset.label;
                      const label = tooltipItems[0].label;
                      return `${datasetLabel} - ${label}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Medio de Comunicación'
                  }
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Cantidad'
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error("Error creando gráfico de actividades:", error);
        }
      } else {
        activitiesChartRef.current = new Chart(activitiesCtx, {
          type: "bar",
          data: {
            labels: ["Sin datos"],
            datasets: [{
              label: "Actividades",
              data: [0],
              backgroundColor: "#e0e0e0",
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          },
        });
      }
    }

    // Crear gráfico de empresas
    if (companiesCtx) {
      if (empresasData.length > 0) {
        try {
          // Procesar datos para el gráfico
          const labels = empresasData.map((item) => {
            return item.name || item.empresa || item.nombre || "Sin nombre";
          });
          const values = empresasData.map((item) => {
            const value = item.value || item.cantidad || item.count || item.interacciones || 0;
            return value;
          });

          companiesChartRef.current = new Chart(companiesCtx, {
            type: "bar",
            data: {
              labels: labels,
              datasets: [{
                label: "Interacciones",
                data: values,
                backgroundColor: "#4ecdc4",
                barPercentage: 0.5,
                categoryPercentage: 0.8,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              layout: {
                padding: {
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Número de Interacciones'
                  }
                },
                y: {
                  ticks: {
                    maxRotation: 0,
                    minRotation: 0,
                    autoSkip: false,
                    font: {
                      size: empresasData.length > 20 ? 10 : 12
                    },
                    callback: function (value, index) {
                      const label = this.getLabelForValue(value);
                      return label.length > 25 ? label.substring(0, 25) + '...' : label;
                    }
                  },
                  title: {
                    display: true,
                    text: 'Empresas'
                  }
                }
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  callbacks: {
                    title: function (tooltipItems) {
                      return labels[tooltipItems[0].dataIndex];
                    },
                    label: function (context) {
                      return `Interacciones: ${context.parsed.x}`;
                    }
                  }
                }
              }
            }
          });
          if (companiesChartRef.current && empresasData.length > 0) {
            const canvas = document.getElementById("companiesChart");
            const minHeight = Math.max(400, empresasData.length * 25);
            canvas.style.height = `${minHeight}px`;
            companiesChartRef.current.resize();
          }
        } catch (error) {
          console.error("Error creando gráfico de empresas:", error);
        }
      } else {
        companiesChartRef.current = new Chart(companiesCtx, {
          type: "bar",
          data: {
            labels: ["Sin datos"],
            datasets: [{
              label: "Interacciones",
              data: [0],
              backgroundColor: "#e0e0e0",
              barPercentage: 0.5,
              categoryPercentage: 0.8,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: { x: { beginAtZero: true } },
          },
        });
      }
    }
  };

  const formatDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      Swal.fire({
        icon: "info",
        title: "Generando reporte",
        text: "Creando reporte en PDF...",
        showConfirmButton: false,
      });

      const originalChartCardStyle = chartsSectionRef.current.querySelector('.reporte-chart-card')?.style.backgroundColor;
      const originalNotesSectionStyle = notesSectionRef.current.style.backgroundColor;
      const originalTableStyle = notesSectionRef.current.querySelector('.reporte-table')?.style.backgroundColor;
      const originalOpacity = chartsSectionRef.current.style.opacity;
      const originalAnimation = chartsSectionRef.current.style.animation;

      chartsSectionRef.current.querySelectorAll('.reporte-chart-card').forEach(card => {
        card.style.backgroundColor = '#ffffff';
        card.style.opacity = '1';
        card.style.animation = 'none';
      });

      if (notesSectionRef.current.querySelector('.reporte-table')) {
        notesSectionRef.current.querySelectorAll('.reporte-notas-cell, td').forEach(cell => {
          cell.style.whiteSpace = 'normal';
          cell.style.wordWrap = 'break-word';
          cell.style.wordBreak = 'break-word';
          cell.style.maxWidth = '200px';
          cell.style.verticalAlign = 'top';
          cell.style.padding = '8px';
        });
      }

      notesSectionRef.current.style.backgroundColor = '#ffffff';
      notesSectionRef.current.style.opacity = '1';
      notesSectionRef.current.style.animation = 'none';

      if (notesSectionRef.current.querySelector('.reporte-table')) {
        notesSectionRef.current.querySelector('.reporte-table').style.backgroundColor = '#ffffff';
        notesSectionRef.current.querySelector('.reporte-table').style.opacity = '1';
      }

      if (activitiesChartRef.current) activitiesChartRef.current.resize();
      if (companiesChartRef.current) companiesChartRef.current.resize();
      await new Promise(resolve => setTimeout(resolve, 150));

      chartsSectionRef.current.querySelectorAll('.reporte-chart-card').forEach(card => {
        card.style.backgroundColor = originalChartCardStyle || '';
        card.style.opacity = originalOpacity || '';
        card.style.animation = originalAnimation || '';
      });
      notesSectionRef.current.style.backgroundColor = originalNotesSectionStyle || '';
      notesSectionRef.current.style.opacity = originalOpacity || '';
      notesSectionRef.current.style.animation = originalAnimation || '';
      if (notesSectionRef.current.querySelector('.reporte-table')) {
        notesSectionRef.current.querySelector('.reporte-table').style.backgroundColor = originalTableStyle || '';
      }
      notesSectionRef.current.querySelectorAll('.reporte-notas-cell, td').forEach(cell => {
        cell.style.whiteSpace = '';
        cell.style.wordWrap = '';
        cell.style.wordBreak = '';
        cell.style.maxWidth = '';
        cell.style.verticalAlign = '';
        cell.style.padding = '';
      });

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      const primaryBlue = [37, 99, 235]; // #2563eb
      const darkBlue = [30, 64, 175]; // #1e40af  
      const lightBlue = [239, 246, 255]; // #eff6ff
      const textDark = [31, 41, 55]; // #1f2937
      const textGray = [107, 114, 128]; // #6b7280
      const borderGray = [229, 231, 235]; // #e5e7eb

      const addHeader = (pageNum = 1) => {
        doc.setDrawColor(...primaryBlue);
        doc.setLineWidth(3);
        doc.line(margin, 15, pageWidth - margin, 15);

        doc.setTextColor(...textDark);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Actividades", margin, 25);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textGray);
        const userInfo = `${(localStorage.getItem("userRol") === "ADMINISTRADOR" || localStorage.getItem("userRol") === "GESTOR") && selectedUser ? selectedUser : `${currentUser.nombre} ${currentUser.apellidos}`}`;
        doc.text(userInfo, margin, 32);

        const currentDate = new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.text(currentDate, pageWidth - margin - doc.getTextWidth(currentDate), 32);

        // Período
        const period = `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
        doc.text(period, margin, 38);

        doc.setFontSize(9);
        doc.text(`${pageNum}`, pageWidth - margin - 5, pageHeight - 10);
      };

      addHeader(1);
      let currentY = 50;

      let activitiesImgData = null;
      let companiesImgData = null;

      const activitiesCanvas = document.getElementById("activitiesChart");
      const companiesCanvas = document.getElementById("companiesChart");

      if (activitiesCanvas) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 2;

        tempCanvas.width = activitiesCanvas.width * scale;
        tempCanvas.height = activitiesCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(activitiesCanvas, 0, 0);

        activitiesImgData = tempCanvas.toDataURL("image/png", 1.0);
      }

      if (companiesCanvas) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 2;

        tempCanvas.width = companiesCanvas.width * scale;
        tempCanvas.height = companiesCanvas.height * scale;
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(companiesCanvas, 0, 0);

        companiesImgData = tempCanvas.toDataURL("image/png", 1.0);
      }

      const totalActividades = actividadesData.reduce((sum, item) => sum + (item.value || 0), 0);
      const totalEmpresas = empresasData.length;
      const totalNotas = notasData.length;

      doc.setFillColor(...lightBlue);
      doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, 'F');
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, 'S');

      doc.setTextColor(...textDark);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen", margin + 8, currentY + 8);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Actividades: ${totalActividades}`, margin + 8, currentY + 16);
      doc.text(`Empresas: ${totalEmpresas}`, margin + 60, currentY + 16);
      doc.text(`Interacciones: ${totalNotas}`, margin + 110, currentY + 16);

      currentY += 35;

      if (activitiesImgData) {
        // Título de sección
        doc.setTextColor(...primaryBlue);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Actividades", margin, currentY);

        currentY += 10;

        // Gráfico con borde sutil
        const chartHeight = 70;
        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.5);
        doc.rect(margin, currentY, contentWidth, chartHeight);
        doc.addImage(activitiesImgData, "PNG", margin + 1, currentY + 1, contentWidth - 2, chartHeight - 2);

        currentY += chartHeight + 10;
      }

      if (companiesImgData) {
        // Verificar espacio
        const companiesChartHeight = 70;
        if (currentY + companiesChartHeight + 20 > pageHeight - 30) {
          doc.addPage();
          addHeader(2);
          currentY = 50;
        }

        // Título de sección
        doc.setTextColor(...primaryBlue);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Empresas Contactadas", margin, currentY);

        currentY += 10;

        // Gráfico con borde sutil
        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.5);
        doc.rect(margin, currentY, contentWidth, companiesChartHeight);
        doc.addImage(companiesImgData, "PNG", margin + 1, currentY + 1, contentWidth - 2, companiesChartHeight - 2);
      }

      // PÁGINAS DE TABLA: Interacciones
      if (notasData.length > 0) {
        doc.addPage();
        let pageNum = doc.internal.getNumberOfPages();
        addHeader(pageNum);

        currentY = 50;

        // Título de sección
        doc.setTextColor(...primaryBlue);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalle de Interacciones", margin, currentY);

        currentY += 15;

        // Configuración de tabla limpia
        const rowHeight = 20;
        const headerHeight = 10;
        const colWidths = [45, 35, 35, 55];
        const headers = ["Empresa", "Respuesta", "Interés", "Observaciones"];

        // Header de tabla
        const drawTableHeader = (yPosition) => {
          doc.setFillColor(...primaryBlue);
          doc.rect(margin, yPosition, contentWidth, headerHeight, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);

          let currentX = margin + 3;
          headers.forEach((header, index) => {
            doc.text(header, currentX, yPosition + 7);
            currentX += colWidths[index];
          });

          return yPosition + headerHeight;
        };

        currentY = drawTableHeader(currentY);

        // Filas de datos
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        notasData.forEach((nota, index) => {
          const notasText = nota.notas || "";
          const notasLines = doc.splitTextToSize(notasText, colWidths[3] - 6);
          const requiredHeight = Math.max(rowHeight, notasLines.length * 3 + 8);

          // Nueva página si es necesario
          if (currentY + requiredHeight > pageHeight - 30) {
            doc.addPage();
            pageNum = doc.internal.getNumberOfPages();
            addHeader(pageNum);
            currentY = 50;

            doc.setTextColor(...primaryBlue);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Detalle de Interacciones (cont.)", margin, currentY);
            currentY += 15;

            currentY = drawTableHeader(currentY);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
          }

          // Fila alternada
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY, contentWidth, requiredHeight, 'F');
          }

          // Borde de fila
          doc.setDrawColor(...borderGray);
          doc.setLineWidth(0.3);
          doc.rect(margin, currentY, contentWidth, requiredHeight);

          // Contenido
          let currentX = margin + 3;
          const rowData = [
            nota.empresa || "",
            nota.respuesta || "",
            nota.interes || "",
            notasText
          ];

          doc.setTextColor(...textDark);

          rowData.forEach((cellData, cellIndex) => {
            const maxWidth = colWidths[cellIndex] - 6;

            if (cellIndex === 3) { // Observaciones
              const lines = doc.splitTextToSize(cellData, maxWidth);
              lines.forEach((line, lineIndex) => {
                doc.text(line, currentX, currentY + 6 + (lineIndex * 3));
              });
            } else {
              const lines = doc.splitTextToSize(cellData, maxWidth);
              doc.text(lines[0] || "", currentX, currentY + (requiredHeight / 2) + 1);
            }

            currentX += colWidths[cellIndex];
          });

          currentY += requiredHeight;
        });
      }

      const userInfo = `${(localStorage.getItem("userRol") === "ADMINISTRADOR" || localStorage.getItem("userRol") === "GESTOR") && selectedUser ? selectedUser : `${currentUser.nombre} ${currentUser.apellidos}`}`;
      const fileName = `Reporte_${userInfo.replace(/\s+/g, '_')}_${dateRange.startDate || getTodayDate()}_${dateRange.endDate || getTodayDate()}.pdf`;
      const blobUrl = doc.output('bloburl');

      setPdfPreview({
        isOpen: true,
        url: blobUrl,
        filename: fileName
      });

      Swal.close();

    } catch (error) {
      console.error("Error generando PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo generar el reporte: " + error.message,
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (pdfPreview.url) {
      const a = document.createElement('a');
      a.href = pdfPreview.url;
      a.download = pdfPreview.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      Swal.fire({
        icon: "success",
        title: "Reporte descargado",
        text: "PDF guardado exitosamente",
        confirmButtonColor: '#2563eb',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const handleClosePreview = () => {
    if (pdfPreview.url) {
      window.URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview({ isOpen: false, url: null, filename: "" });
  };

  const handleUserChange = (e) => {
    const newUser = e.target.value;
    setSelectedUser(newUser);
  };

  return (
    <>
      <div className="page-with-header">
        <Header />
        <main className="reporte-main-content">
          <div className="reporte-container">
            <div className="reporte-header">
              <div className="reporte-header-info">
                <h1 className="reporte-page-title">Reportes de actividad</h1>
                <p className="reporte-subtitle">
                  {(localStorage.getItem("userRol") === "ADMINISTRADOR" || localStorage.getItem("userRol") === "GESTOR") && selectedUser
                    ? `${selectedUser} - ${startDate && endDate
                      ? `${formatDate(startDate.toISOString().split('T')[0])} a ${formatDate(endDate.toISOString().split('T')[0])}`
                      : formatDate()}`
                    : `${currentUser.nombre} ${currentUser.apellidos} - ${startDate && endDate
                      ? `${formatDate(startDate.toISOString().split('T')[0])} a ${formatDate(endDate.toISOString().split('T')[0])}`
                      : formatDate()}`
                  }
                </p>
              </div>
              <div className="reporte-header-controls">
                {(localStorage.getItem("userRol") === "ADMINISTRADOR" || localStorage.getItem("userRol") === "GESTOR") && (
                  <div className="reporte-user-filter">
                    <label className="reporte-date-label">Usuario</label>
                    <select
                      value={selectedUser || ""}
                      onChange={handleUserChange}
                      className="reporte-user-select"
                    >
                      {users.map((user) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="reporte-date-range-container">
                  <label className="reporte-date-label">Rango de fecha</label>
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => {
                      setDateRange(update);
                    }}
                    isClearable={true}
                    placeholderText="Seleccione fecha o rango"
                    dateFormat="dd/MM/yyyy"
                    customInput={<CustomDatePickerInput />}
                    locale="es"
                  />
                </div>
                <button className="reporte-btn reporte-btn-download" onClick={handleDownloadPDF}>
                  <img src={downloadIcon} alt="Descargar" className="reporte-btn-icon" />
                  Visualizar PDF
                </button>
              </div>
            </div>

            {loading && (
              <div className="reporte-loading">
                <div className="reporte-loading-spinner"></div>
                <span>Cargando datos...</span>
              </div>
            )}

            <div className="reporte-charts-section" ref={chartsSectionRef}>
              <div className="reporte-chart-card">
                <h3 className="reporte-chart-title">Actividades Realizadas</h3>
                <div className="reporte-chart-subtitle">Actividades por Tipo</div>
                <div style={{ position: 'relative', height: '300px' }}>
                  <canvas id="activitiesChart"></canvas>
                </div>
              </div>
              <div className="reporte-chart-card">
                <h3 className="reporte-chart-title">Empresas Contactadas</h3>
                <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                  <div style={{
                    height: '400px',
                    overflowY: empresasData.length > 15 ? 'auto' : 'hidden',
                    overflowX: 'hidden'
                  }}>
                    <canvas
                      id="companiesChart"
                      style={{
                        minHeight: `${Math.max(400, empresasData.length * 25)}px`,
                        width: '100%'
                      }}
                    ></canvas>
                  </div>
                </div>
              </div>
            </div>

            <div className="reporte-notes-section" ref={notesSectionRef}>
              <div className="reporte-notes-header">
                <h3 className="reporte-notes-title">Notas de interacciones</h3>
              </div>
              <div className="reporte-table-container">
                <table className="reporte-table">
                  <thead>
                    <tr><th>Empresa</th><th>Respuesta</th><th>Interés</th><th>Notas</th></tr>
                  </thead>
                  <tbody>
                    {notasData.map((nota, index) => (
                      <tr key={index}>
                        <td className="reporte-empresa-cell">{nota.empresa}</td>
                        <td className="reporte-respuesta-cell">
                          <span className={`reporte-badge reporte-respuesta-${nota.respuesta.toLowerCase()}`}>
                            {nota.respuesta}
                          </span>
                        </td>
                        <td className="reporte-interes-cell">
                          <span className={`reporte-badge reporte-interes-${nota.interes.toLowerCase()}`}>
                            {nota.interes}
                          </span>
                        </td>
                        <td className="reporte-notas-cell">{nota.notas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
  );
};

export default ReportePersonal