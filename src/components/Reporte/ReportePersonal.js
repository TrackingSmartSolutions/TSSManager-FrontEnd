import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ReportePersonal.css";
import Header from "../Header/Header";
import Swal from "sweetalert2";
import downloadIcon from "../../assets/icons/descarga.png";
import { API_BASE_URL } from "../Config/Config";
import Chart from "chart.js/auto";
import html2canvas from "html2canvas";
import { jwtDecode } from "jwt-decode";

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

const ReportePersonal = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [actividadesData, setActividadesData] = useState([]);
  const [empresasData, setEmpresasData] = useState([]);
  const [notasData, setNotasData] = useState([]);
  const [currentUser, setCurrentUser] = useState({ nombre: "", apellidos: "" });
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const activitiesChartRef = useRef(null);
  const companiesChartRef = useRef(null);
  const chartsSectionRef = useRef(null);
  const notesSectionRef = useRef(null);

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
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
    if (initialDataLoaded && (dateRange.startDate || dateRange.endDate)) {
      fetchReportData();
    }
  }, [dateRange, initialDataLoaded]);

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
      const startDate = dateRange.startDate || todayDate;
      const endDate = dateRange.endDate || todayDate;
      const userRol = localStorage.getItem("userRol");

      let url = `${API_BASE_URL}/reportes/actividades?startDate=${startDate}&endDate=${endDate}`;

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
              scales: { x: { beginAtZero: true } },
            },
          });
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

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
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
        text: "Descargando reporte en PDF...",
        showConfirmButton: false,
      });

      // Guardar estilos originales y aplicar ajustes temporales
      const originalChartCardStyle = chartsSectionRef.current.querySelector('.reporte-chart-card')?.style.backgroundColor;
      const originalNotesSectionStyle = notesSectionRef.current.style.backgroundColor;
      const originalTableStyle = notesSectionRef.current.querySelector('.reporte-table')?.style.backgroundColor;
      const originalOpacity = chartsSectionRef.current.style.opacity;
      const originalAnimation = chartsSectionRef.current.style.animation;

      // Aplicar fondo sólido y desactivar animaciones/opacidad
      chartsSectionRef.current.querySelectorAll('.reporte-chart-card').forEach(card => {
        card.style.backgroundColor = '#ffffff';
        card.style.opacity = '1';
        card.style.animation = 'none';
      });
      // Configurar ajuste de texto en la tabla
      if (notesSectionRef.current.querySelector('.reporte-table')) {
        notesSectionRef.current.querySelectorAll('.reporte-notas-cell').forEach(cell => {
          cell.style.whiteSpace = 'normal';
          cell.style.wordWrap = 'break-word';
          cell.style.wordBreak = 'break-word';
          cell.style.maxWidth = '200px';
          cell.style.minHeight = 'auto';
          cell.style.verticalAlign = 'top';
        });

        // También aplicar a otras celdas que puedan tener texto largo
        notesSectionRef.current.querySelectorAll('td').forEach(cell => {
          cell.style.whiteSpace = 'normal';
          cell.style.wordWrap = 'break-word';
          cell.style.padding = '8px';
          cell.style.verticalAlign = 'top';
        });
      }
      notesSectionRef.current.style.backgroundColor = '#ffffff';
      notesSectionRef.current.style.opacity = '1';
      notesSectionRef.current.style.animation = 'none';
      if (notesSectionRef.current.querySelector('.reporte-table')) {
        notesSectionRef.current.querySelector('.reporte-table').style.backgroundColor = '#ffffff';
        notesSectionRef.current.querySelector('.reporte-table').style.opacity = '1';
        notesSectionRef.current.querySelectorAll('.reporte-badge').forEach(badge => {
          badge.style.backgroundColor = badge.style.backgroundColor.replace(/rgba\((.*?),\s*0\.\d+\)/, 'rgb($1)');
        });
      }

      // Forzar redibujo de los gráficos
      if (activitiesChartRef.current) activitiesChartRef.current.resize();
      if (companiesChartRef.current) companiesChartRef.current.resize();
      await new Promise(resolve => setTimeout(resolve, 100)); // Pequeño delay para redibujo

      // Capturar las secciones como imágenes
      const chartsCanvas = await html2canvas(chartsSectionRef.current, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        scale: 3,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        logging: true,
      });

      const notesCanvas = await html2canvas(notesSectionRef.current, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        scale: 2, // Reducir escala para mejor manejo de texto
        windowWidth: 1200, // Ancho fijo para consistencia
        windowHeight: document.documentElement.offsetHeight,
        logging: true,
        onclone: function (clonedDoc) {
          // Asegurar que el texto se ajuste en el clon
          const table = clonedDoc.querySelector('.reporte-table');
          if (table) {
            table.style.tableLayout = 'fixed';
            table.style.width = '100%';

            const cells = clonedDoc.querySelectorAll('.reporte-notas-cell');
            cells.forEach(cell => {
              cell.style.whiteSpace = 'normal';
              cell.style.wordWrap = 'break-word';
              cell.style.wordBreak = 'break-word';
              cell.style.maxWidth = '200px';
              cell.style.overflow = 'visible';
            });
          }
        }
      });

      // Restaurar estilos originales
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
        notesSectionRef.current.querySelectorAll('.reporte-badge').forEach(badge => {
          badge.style.backgroundColor = ''; // Restaurar al valor original del CSS
        });
      }
      notesSectionRef.current.querySelectorAll('.reporte-notas-cell, td').forEach(cell => {
        cell.style.whiteSpace = '';
        cell.style.wordWrap = '';
        cell.style.wordBreak = '';
        cell.style.maxWidth = '';
        cell.style.minHeight = '';
        cell.style.verticalAlign = '';
        cell.style.padding = '';
      });

      // Crear el contenido del PDF
      const pdfContent = document.createElement("div");
      pdfContent.style.cssText = `
      padding: 20px;
      font-family: Arial, sans-serif;
      background: #ffffff;
      width: 800px;
      color: #333;
    `;

      const chartsImg = document.createElement("img");
      chartsImg.src = chartsCanvas.toDataURL("image/png");
      chartsImg.style.cssText = "width: 100%; margin: 20px 0;";

      const notesImg = document.createElement("img");
      notesImg.src = notesCanvas.toDataURL("image/png");
      notesImg.style.cssText = "width: 100%; margin: 20px 0;";

      pdfContent.innerHTML = `
      <h1 style="text-align: center;">Reporte de Actividades</h1>
      <p style="text-align: center; margin-bottom: 30px;">
        Usuario: ${(localStorage.getItem("userRol") === "ADMINISTRADOR" || localStorage.getItem("userRol") === "GESTOR") && selectedUser ? selectedUser : `${currentUser.nombre} ${currentUser.apellidos}`} - Fecha: ${formatDate()}
      </p>
      <div style="margin: 20px 0;">
        <h2>Gráficos de Actividades</h2>
      </div>
    `;
      pdfContent.appendChild(chartsImg);

      const notesTitle = document.createElement("h2");
      notesTitle.textContent = "Notas de Interacciones";
      notesTitle.style.marginTop = "30px";
      pdfContent.appendChild(notesTitle);
      pdfContent.appendChild(notesImg);

      // Agregar al DOM temporalmente
      document.body.appendChild(pdfContent);
      pdfContent.style.position = "absolute";
      pdfContent.style.left = "-9999px";

      // Esperar a que las imágenes se carguen
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capturar el contenido final
      const finalCanvas = await html2canvas(pdfContent, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        scale: 3,
      });

      document.body.removeChild(pdfContent);

      // Generar el PDF
      const imgData = finalCanvas.toDataURL("image/png");
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (pdfHeight > doc.internal.pageSize.getHeight()) {
        const maxHeight = doc.internal.pageSize.getHeight();
        const adjustedWidth = (imgProps.width * maxHeight) / imgProps.height;
        doc.addImage(imgData, "PNG", (pdfWidth - adjustedWidth) / 2, 0, adjustedWidth, maxHeight);
      } else {
        doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      doc.save(`Reporte_Actividades_${dateRange.startDate || getTodayDate()}_${dateRange.endDate || getTodayDate()}.pdf`);

      Swal.fire({
        icon: "success",
        title: "Descargado",
        text: "Reporte PDF generado exitosamente"
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar el PDF: " + error.message
      });
    } finally {
      setLoading(false);
    }
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
                    ? `${selectedUser} - ${formatDate()}`
                    : `${currentUser.nombre} ${currentUser.apellidos} - ${formatDate()}`
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
                  <div className="reporte-date-inputs">
                    <input
                      type="date"
                      value={dateRange.startDate || ""}
                      onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
                      className="reporte-date-input"
                    />
                    <span className="reporte-date-separator">-</span>
                    <input
                      type="date"
                      value={dateRange.endDate || ""}
                      onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
                      className="reporte-date-input"
                    />
                  </div>
                </div>
                <button className="reporte-btn reporte-btn-download" onClick={handleDownloadPDF}>
                  <img src={downloadIcon} alt="Descargar" className="reporte-btn-icon" />
                  Descargar PDF
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
                <div style={{ position: 'relative', height: '300px' }}>
                  <canvas id="companiesChart"></canvas>
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
      </div>
    </>
  );
};

export default ReportePersonal