import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./ReportePersonal.css";
import Header from "../Header/Header";
import Swal from "sweetalert2";
import downloadIcon from "../../assets/icons/descarga.png";
import { API_BASE_URL } from "../Config/Config";
import Chart from "chart.js/auto";
import { jwtDecode } from "jwt-decode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BAR_SLOT = 30;
const CHART_VIEWPORT = 420;
const CHART_PADDING = 70;

const TOP_N_OPTIONS = [
  { label: "Top 10", value: 10 },
  { label: "Top 25", value: 25 },
  { label: "Top 50", value: 50 },
  { label: "Todas", value: "all" },
];

const TYPE_COLORS = {
  TAREAS: "#f0ad4e",
  TAREA: "#f0ad4e",
  LLAMADAS: "#ff6b8a",
  LLAMADA: "#ff6b8a",
  REUNIONES: "#5bc0de",
  REUNION: "#5bc0de",
  CORREOS: "#45b7d1",
  MENSAJES: "#96ceb4",
};
const FALLBACK_COLOR = "#9aa5b1";
const colorForType = (tipo) => TYPE_COLORS[tipo] || FALLBACK_COLOR;

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(`Error: ${response.status} - ${response.statusText}`);
  }
  return response;
};

const formatDateForAPI = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => {
  const today = new Date();
  const mexicoTime = new Date(
    today.toLocaleString("en-US", { timeZone: "America/Mexico_City" }),
  );
  return formatDateForAPI(mexicoTime);
};

const puedeFiltrarUsuarios = () => {
  const rol = localStorage.getItem("userRol");
  return rol === "ADMINISTRADOR" || rol === "GESTOR";
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
}) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1050,
  };

  let widthStyle = "500px";
  if (size === "lg") widthStyle = "800px";
  if (size === "xl") widthStyle = "950px";

  const contentStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    maxHeight: "95vh",
    overflowY: "auto",
    width: widthStyle,
    maxWidth: "95%",
    position: "relative",
    boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div
      style={overlayStyle}
      onClick={closeOnOverlayClick ? onClose : () => {}}
    >
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            borderBottom: "1px solid #dee2e6",
            paddingBottom: "10px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "#6c757d",
              padding: "0 5px",
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const PdfPreviewModal = ({ isOpen, onClose, pdfUrl, onDownload }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vista previa"
      size="xl"
      closeOnOverlayClick={false}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
          }}
        >
          <button
            type="button"
            onClick={onDownload}
            className="reporte-btn reporte-btn-download"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              width: "auto",
              padding: "8px 16px",
            }}
          >
            <img
              src={downloadIcon}
              alt="Descargar"
              className="reporte-btn-icon"
              style={{ width: "16px", height: "16px" }}
            />
            Descargar PDF
          </button>
        </div>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "4px",
            overflow: "hidden",
            height: "75vh",
          }}
        >
          <iframe
            src={`${pdfUrl}#view=FitH&navpanes=0&toolbar=0`}
            title="Vista previa del reporte"
            width="100%"
            height="100%"
            style={{ border: "none" }}
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

const renderChartToImage = (config, width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const chart = new Chart(ctx, {
    ...config,
    options: {
      ...config.options,
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      devicePixelRatio: 1,
    },
  });

  chart.update("none");
  const image = canvas.toDataURL("image/png", 1.0);
  chart.destroy();

  return { image, ratio: height / width };
};

const ReportePersonal = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [loading, setLoading] = useState(false);
  const [actividadesData, setActividadesData] = useState([]);
  const [empresasData, setEmpresasData] = useState([]);
  const [notasData, setNotasData] = useState([]);
  const [currentUser, setCurrentUser] = useState({ nombre: "", apellidos: "" });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [topN, setTopN] = useState(10);
  const [ready, setReady] = useState(false);
  const [pdfPreview, setPdfPreview] = useState({
    isOpen: false,
    url: null,
    filename: "",
  });

  const activitiesChartRef = useRef(null);
  const companiesChartRef = useRef(null);
  const activitiesCanvasRef = useRef(null);
  const companiesCanvasRef = useRef(null);
  const requestIdRef = useRef(0);

  const canFilterUsers = puedeFiltrarUsuarios();
  const empresasOrdenadas = useMemo(
    () =>
      empresasData
        .map((item) => ({
          name: item.name || item.empresa || item.nombre || "Sin nombre",
          value: Number(
            item.value ??
              item.cantidad ??
              item.count ??
              item.interacciones ??
              0,
          ),
        }))
        .sort((a, b) => b.value - a.value),
    [empresasData],
  );

  const empresasChartData = useMemo(() => {
    if (topN === "all") return empresasOrdenadas;
    const top = empresasOrdenadas.slice(0, topN);
    const resto = empresasOrdenadas.slice(topN);
    if (resto.length > 0) {
      top.push({
        name: `Otras (${resto.length})`,
        value: resto.reduce((sum, e) => sum + e.value, 0),
        esOtras: true,
      });
    }
    return top;
  }, [empresasOrdenadas, topN]);

  const companiesSizerHeight = Math.max(
    240,
    empresasChartData.length * BAR_SLOT + CHART_PADDING,
  );

  const totalActividades = useMemo(
    () =>
      actividadesData.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [actividadesData],
  );

  const buildActivitiesConfig = useCallback(
    (fontScale = 1) => {
      if (actividadesData.length === 0) {
        return {
          type: "bar",
          data: {
            labels: ["Sin datos"],
            datasets: [
              { label: "Actividades", data: [0], backgroundColor: "#e0e0e0" },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          },
        };
      }

      const labels = [...new Set(actividadesData.map((item) => item.name))];
      const tipos = [
        ...new Set(actividadesData.map((item) => item.tipo || "OTROS")),
      ];

      const datasets = tipos.map((tipo) => {
        const items = actividadesData.filter(
          (item) => (item.tipo || "OTROS") === tipo,
        );
        return {
          label: tipo,
          data: labels.map((label) => {
            const match = items.find((i) => i.name === label);
            return match ? Number(match.value) || 0 : 0;
          }),
          backgroundColor: colorForType(tipo),
          borderColor: colorForType(tipo),
          borderWidth: 1,
          categoryPercentage: 0.8,
          barPercentage: 0.9,
        };
      });

      return {
        type: "bar",
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 300 },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: { font: { size: 12 * fontScale } },
            },
            tooltip: {
              callbacks: {
                title: (items) =>
                  `${items[0].dataset.label} - ${items[0].label}`,
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Medio de comunicación",
                font: { size: 12 * fontScale },
              },
              ticks: { font: { size: 11 * fontScale } },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Cantidad",
                font: { size: 12 * fontScale },
              },
              ticks: { font: { size: 11 * fontScale } },
            },
          },
        },
      };
    },
    [actividadesData],
  );

  const buildCompaniesConfig = useCallback((data, fontScale = 1) => {
    if (data.length === 0) {
      return {
        type: "bar",
        data: {
          labels: ["Sin datos"],
          datasets: [
            { label: "Interacciones", data: [0], backgroundColor: "#e0e0e0" },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } },
        },
      };
    }

    return {
      type: "bar",
      data: {
        labels: data.map((e) => e.name),
        datasets: [
          {
            label: "Interacciones",
            data: data.map((e) => e.value),
            backgroundColor: data.map((e) =>
              e.esOtras ? "#b9c2cc" : "#4ecdc4",
            ),
            borderRadius: 3,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        animation: data.length > 25 ? false : { duration: 300 },
        layout: { padding: { top: 8, bottom: 8, left: 8, right: 16 } },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Número de interacciones",
              font: { size: 12 * fontScale },
            },
            ticks: { precision: 0, font: { size: 11 * fontScale } },
          },
          y: {
            ticks: {
              autoSkip: false,
              font: { size: (data.length > 30 ? 10 : 11.5) * fontScale },
              callback(value) {
                const label = this.getLabelForValue(value);
                return label.length > 28 ? `${label.slice(0, 28)}…` : label;
              },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => data[items[0].dataIndex]?.name ?? "",
              label: (ctx) => `Interacciones: ${ctx.parsed.x}`,
            },
          },
        },
      },
    };
  }, []);

  const fetchUserDetails = async (nombreUsuario) => {
    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/auth/users/by-username/${nombreUsuario}`,
      );
      return await response.json();
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      return { nombre: "Usuario", apellidos: "Desconocido" };
    }
  };

  const fetchReportData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const todayDate = getTodayDate();
      const startDateFormatted = formatDateForAPI(startDate) || todayDate;
      const endDateFormatted = formatDateForAPI(endDate) || startDateFormatted;

      let url = `${API_BASE_URL}/reportes/actividades?startDate=${startDateFormatted}&endDate=${endDateFormatted}`;
      if (canFilterUsers && selectedUser) {
        url += `&usuario=${encodeURIComponent(selectedUser)}`;
      }

      const response = await fetchWithToken(url);
      const data = await response.json();

      if (requestId !== requestIdRef.current) return;

      setActividadesData(data.actividades || []);
      setEmpresasData(data.empresas || []);
      setNotasData(data.notas || []);
    } catch (error) {
      console.error("Error obteniendo datos del reporte:", error);
      if (requestId !== requestIdRef.current) return;
      setActividadesData([]);
      setEmpresasData([]);
      setNotasData([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [startDate, endDate, selectedUser, canFilterUsers]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const userData = await fetchUserDetails(decodedToken.sub);
          if (cancelled) return;

          setCurrentUser({
            nombre: userData.nombre,
            apellidos: userData.apellidos,
          });
          if (canFilterUsers) setSelectedUser(userData.nombre);
        } catch (error) {
          console.error("Error decodificando el token:", error);
          if (!cancelled)
            setCurrentUser({ nombre: "Usuario", apellidos: "Desconocido" });
        }
      }

      if (canFilterUsers) {
        try {
          const response = await fetchWithToken(
            `${API_BASE_URL}/auth/users/active`,
          );
          const data = await response.json();
          if (!cancelled) setUsers(data.map((user) => user.nombre.trim()));
        } catch (error) {
          console.error("Error cargando la lista de usuarios:", error);
        }
      }

      if (!cancelled) setReady(true);
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetchReportData();
  }, [ready, fetchReportData]);

  useEffect(() => {
    if (!activitiesCanvasRef.current) return;

    activitiesChartRef.current?.destroy();
    activitiesChartRef.current = new Chart(
      activitiesCanvasRef.current.getContext("2d"),
      buildActivitiesConfig(),
    );

    return () => {
      activitiesChartRef.current?.destroy();
      activitiesChartRef.current = null;
    };
  }, [buildActivitiesConfig]);

  useEffect(() => {
    if (!companiesCanvasRef.current) return;

    companiesChartRef.current?.destroy();
    companiesChartRef.current = new Chart(
      companiesCanvasRef.current.getContext("2d"),
      buildCompaniesConfig(empresasChartData),
    );

    return () => {
      companiesChartRef.current?.destroy();
      companiesChartRef.current = null;
    };
  }, [buildCompaniesConfig, empresasChartData]);

  const formatDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getUserInfo = () =>
    canFilterUsers && selectedUser
      ? selectedUser
      : `${currentUser.nombre} ${currentUser.apellidos}`.trim();

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      Swal.fire({
        icon: "info",
        title: "Generando reporte",
        text: "Creando reporte en PDF...",
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      const primaryBlue = [37, 99, 235];
      const lightBlue = [239, 246, 255];
      const textDark = [31, 41, 55];
      const textGray = [107, 114, 128];
      const borderGray = [229, 231, 235];

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
        doc.text(getUserInfo(), margin, 32);

        const currentDate = new Date().toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        doc.text(
          currentDate,
          pageWidth - margin - doc.getTextWidth(currentDate),
          32,
        );
        doc.text(
          `${formatDate(startDate)} - ${formatDate(endDate)}`,
          margin,
          38,
        );

        doc.setFontSize(9);
        doc.text(`${pageNum}`, pageWidth - margin - 5, pageHeight - 10);
      };

      const ensureSpace = (needed) => {
        if (currentY + needed <= pageHeight - 25) return;
        doc.addPage();
        addHeader(doc.internal.getNumberOfPages());
        currentY = 50;
      };

      addHeader(1);
      let currentY = 50;

      doc.setFillColor(...lightBlue);
      doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, "F");
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, "S");

      doc.setTextColor(...textDark);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen", margin + 8, currentY + 8);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Actividades: ${totalActividades}`, margin + 8, currentY + 16);
      doc.text(
        `Empresas: ${empresasOrdenadas.length}`,
        margin + 60,
        currentY + 16,
      );
      doc.text(
        `Interacciones: ${notasData.length}`,
        margin + 110,
        currentY + 16,
      );

      currentY += 35;

      if (actividadesData.length > 0) {
        const { image, ratio } = renderChartToImage(
          buildActivitiesConfig(1.6),
          1200,
          520,
        );
        const imgHeight = contentWidth * ratio;

        ensureSpace(imgHeight + 15);
        doc.setTextColor(...primaryBlue);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Actividades", margin, currentY);
        currentY += 8;

        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.5);
        doc.rect(margin, currentY, contentWidth, imgHeight);
        doc.addImage(image, "PNG", margin, currentY, contentWidth, imgHeight);
        currentY += imgHeight + 12;
      }

      if (empresasOrdenadas.length > 0) {
        const pdfTop = empresasOrdenadas.slice(0, 12);
        const resto = empresasOrdenadas.slice(12);
        const pdfData = [...pdfTop];
        if (resto.length > 0) {
          pdfData.push({
            name: `Otras (${resto.length})`,
            value: resto.reduce((sum, e) => sum + e.value, 0),
            esOtras: true,
          });
        }

        const chartPxHeight = Math.max(360, pdfData.length * 46 + 90);
        const { image, ratio } = renderChartToImage(
          buildCompaniesConfig(pdfData, 1.7),
          1200,
          chartPxHeight,
        );
        const imgHeight = contentWidth * ratio;

        ensureSpace(imgHeight + 18);
        doc.setTextColor(...primaryBlue);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Empresas Contactadas", margin, currentY);
        currentY += 6;

        if (resto.length > 0) {
          doc.setTextColor(...textGray);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Mostrando las 12 empresas con más interacciones de ${empresasOrdenadas.length} en total.`,
            margin,
            currentY,
          );
          currentY += 5;
        }

        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.5);
        doc.rect(margin, currentY, contentWidth, imgHeight);
        doc.addImage(image, "PNG", margin, currentY, contentWidth, imgHeight);
        currentY += imgHeight + 12;
      }

      if (empresasOrdenadas.length > 12) {
        doc.addPage();
        addHeader(doc.internal.getNumberOfPages());
        currentY = 50;

        doc.setTextColor(...primaryBlue);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Empresas Contactadas (detalle)", margin, currentY);
        currentY += 12;

        const empHeaderHeight = 9;
        const empRowHeight = 7;
        const empColWidths = [contentWidth - 35, 35];

        const drawEmpresasHeader = () => {
          doc.setFillColor(...primaryBlue);
          doc.rect(margin, currentY, contentWidth, empHeaderHeight, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text("Empresa", margin + 3, currentY + 6.5);
          doc.text(
            "Interacciones",
            margin + empColWidths[0] + 3,
            currentY + 6.5,
          );
          currentY += empHeaderHeight;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...textDark);
        };

        drawEmpresasHeader();

        empresasOrdenadas.forEach((empresa, index) => {
          if (currentY + empRowHeight > pageHeight - 25) {
            doc.addPage();
            addHeader(doc.internal.getNumberOfPages());
            currentY = 50;
            drawEmpresasHeader();
          }

          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY, contentWidth, empRowHeight, "F");
          }

          doc.setDrawColor(...borderGray);
          doc.setLineWidth(0.2);
          doc.rect(margin, currentY, contentWidth, empRowHeight);
          doc.setTextColor(...textDark);

          const nombre =
            doc.splitTextToSize(empresa.name, empColWidths[0] - 6)[0] || "";
          doc.text(nombre, margin + 3, currentY + 4.8);
          doc.text(
            String(empresa.value),
            margin + empColWidths[0] + 3,
            currentY + 4.8,
          );

          currentY += empRowHeight;
        });
      }

      if (notasData.length > 0) {
        doc.addPage();
        addHeader(doc.internal.getNumberOfPages());
        currentY = 50;

        doc.setTextColor(...primaryBlue);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalle de Interacciones", margin, currentY);
        currentY += 12;

        const headerHeight = 10;
        const lineHeight = 3.6;
        const colWidths = [45, 35, 35, 55];
        const headers = ["Empresa", "Respuesta", "Interés", "Observaciones"];

        const drawTableHeader = () => {
          doc.setFillColor(...primaryBlue);
          doc.rect(margin, currentY, contentWidth, headerHeight, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);

          let x = margin + 3;
          headers.forEach((header, index) => {
            doc.text(header, x, currentY + 7);
            x += colWidths[index];
          });

          currentY += headerHeight;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
        };

        drawTableHeader();

        notasData.forEach((nota, index) => {
          const notasText = nota.notas || "";
          const notasLines = doc.splitTextToSize(notasText, colWidths[3] - 6);
          const rowHeight = Math.max(12, notasLines.length * lineHeight + 6);

          if (currentY + rowHeight > pageHeight - 25) {
            doc.addPage();
            addHeader(doc.internal.getNumberOfPages());
            currentY = 50;

            doc.setTextColor(...primaryBlue);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Detalle de Interacciones (cont.)", margin, currentY);
            currentY += 12;
            drawTableHeader();
          }

          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY, contentWidth, rowHeight, "F");
          }

          doc.setDrawColor(...borderGray);
          doc.setLineWidth(0.3);
          doc.rect(margin, currentY, contentWidth, rowHeight);
          doc.setTextColor(...textDark);

          const rowData = [
            nota.empresa || "",
            nota.respuesta || "",
            nota.interes || "",
            notasText,
          ];
          let x = margin + 3;

          rowData.forEach((cellData, cellIndex) => {
            const maxWidth = colWidths[cellIndex] - 6;

            if (cellIndex === 3) {
              notasLines.forEach((line, lineIndex) => {
                doc.text(line, x, currentY + 5 + lineIndex * lineHeight);
              });
            } else {
              const lines = doc.splitTextToSize(cellData, maxWidth);
              doc.text(lines[0] || "", x, currentY + 5);
              if (lines[1]) doc.text(lines[1], x, currentY + 5 + lineHeight);
            }

            x += colWidths[cellIndex];
          });

          currentY += rowHeight;
        });
      }

      const startStr = formatDateForAPI(startDate) || getTodayDate();
      const endStr = formatDateForAPI(endDate) || startStr;
      const fileName = `Reporte_${getUserInfo().replace(/\s+/g, "_")}_${startStr}_${endStr}.pdf`;

      setPdfPreview({
        isOpen: true,
        url: doc.output("bloburl"),
        filename: fileName,
      });
      Swal.close();
    } catch (error) {
      console.error("Error generando PDF:", error);
      Swal.fire({
        icon: "error",
        title: "No se pudo generar el reporte",
        text: error.message,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!pdfPreview.url) return;

    const link = document.createElement("a");
    link.href = pdfPreview.url;
    link.download = pdfPreview.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: "success",
      title: "Reporte descargado",
      text: "PDF guardado exitosamente",
      confirmButtonColor: "#2563eb",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleClosePreview = () => {
    if (pdfPreview.url) window.URL.revokeObjectURL(pdfPreview.url);
    setPdfPreview({ isOpen: false, url: null, filename: "" });
  };

  const subtituloUsuario =
    canFilterUsers && selectedUser
      ? selectedUser
      : `${currentUser.nombre} ${currentUser.apellidos}`;

  const subtituloFechas =
    startDate && endDate
      ? `${formatDate(startDate)} a ${formatDate(endDate)}`
      : formatDate();

  return (
    <div className="page-with-header">
      <Header />
      <main className="reporte-main-content">
        <div className="reporte-container">
          <div className="reporte-header">
            <div className="reporte-header-info">
              <h1 className="reporte-page-title">Reportes de actividad</h1>
              <p className="reporte-subtitle">{`${subtituloUsuario} - ${subtituloFechas}`}</p>
            </div>

            <div className="reporte-header-controls">
              {canFilterUsers && (
                <div className="reporte-user-filter">
                  <label className="reporte-date-label">Usuario</label>
                  <select
                    value={selectedUser || ""}
                    onChange={(e) => setSelectedUser(e.target.value)}
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
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={setDateRange}
                  isClearable
                  placeholderText="Seleccione fecha o rango"
                  dateFormat="dd/MM/yyyy"
                  customInput={<CustomDatePickerInput />}
                  locale="es"
                />
              </div>

              <button
                className="reporte-btn reporte-btn-download"
                onClick={handleDownloadPDF}
                disabled={loading}
              >
                <img src={downloadIcon} alt="" className="reporte-btn-icon" />
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

          <div className="reporte-charts-section">
            <div className="reporte-chart-card">
              <h3 className="reporte-chart-title">Actividades Realizadas</h3>
              <div className="reporte-chart-subtitle">Actividades por tipo</div>
              <div style={{ position: "relative", height: "300px" }}>
                <canvas ref={activitiesCanvasRef} />
              </div>
            </div>

            <div className="reporte-chart-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <h3 className="reporte-chart-title" style={{ margin: 0 }}>
                  Empresas Contactadas
                </h3>
                <select
                  className="reporte-user-select"
                  value={topN}
                  onChange={(e) =>
                    setTopN(
                      e.target.value === "all" ? "all" : Number(e.target.value),
                    )
                  }
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    width: "auto",
                  }}
                >
                  {TOP_N_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="reporte-chart-subtitle">
                {empresasOrdenadas.length > 0
                  ? `${empresasChartData.length} de ${empresasOrdenadas.length} empresas`
                  : "Sin empresas en este periodo"}
              </div>

              <div
                style={{
                  height: `${CHART_VIEWPORT}px`,
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                {/* Sizer: aquí vive el alto dinámico, el canvas no lo toca */}
                <div
                  style={{
                    position: "relative",
                    height: `${companiesSizerHeight}px`,
                  }}
                >
                  <canvas ref={companiesCanvasRef} />
                </div>
              </div>
            </div>
          </div>

          <div className="reporte-notes-section">
            <div className="reporte-notes-header">
              <h3 className="reporte-notes-title">Notas de interacciones</h3>
            </div>
            <div className="reporte-table-container">
              <table className="reporte-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Respuesta</th>
                    <th>Interés</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {notasData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#6b7280",
                        }}
                      >
                        No hay interacciones registradas en este periodo.
                      </td>
                    </tr>
                  ) : (
                    notasData.map((nota, index) => (
                      <tr key={`${nota.empresa}-${index}`}>
                        <td className="reporte-empresa-cell">{nota.empresa}</td>
                        <td className="reporte-respuesta-cell">
                          <span
                            className={`reporte-badge reporte-respuesta-${(nota.respuesta || "").toLowerCase()}`}
                          >
                            {nota.respuesta}
                          </span>
                        </td>
                        <td className="reporte-interes-cell">
                          <span
                            className={`reporte-badge reporte-interes-${(nota.interes || "").toLowerCase()}`}
                          >
                            {nota.interes}
                          </span>
                        </td>
                        <td className="reporte-notas-cell">{nota.notas}</td>
                      </tr>
                    ))
                  )}
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
  );
};

export default ReportePersonal;
