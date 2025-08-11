import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "./DashboardMetricas.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import downloadIcon from "../../assets/icons/descarga.png"
import { API_BASE_URL } from "../Config/Config"
import html2canvas from "html2canvas"
import { jwtDecode } from "jwt-decode"

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token")
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const response = await fetch(url, { ...options, headers })
  if (!response.ok) throw new Error(`Error: ${response.status} - ${response.statusText}`)
  return response
}

const DashboardMetricas = () => {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })
  const [selectedUser, setSelectedUser] = useState("todos")
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState({ nombre: "", apellidos: "" })
  const [userRole] = useState("admin") 
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)

  //  Agregando refs para las secciones como en reporte-personal
  const resumenSectionRef = useRef(null)
  const graficasSectionRef = useRef(null)
  const empresasChartRef = useRef(null)
  const respuestaChartRef = useRef(null)
  const conversionChartRef = useRef(null)

  const resumenEjecutivo = {
    totalEmpresas: 156,
    promedioContacto: 78.5,
    tasaRespuestaGlobal: 45.2,
    tasaConversionGlobal: 23.8,
    tendencias: {
      totalEmpresas: "up",
      promedioContacto: "up",
      tasaRespuestaGlobal: "down",
      tasaConversionGlobal: "up",
    },
  }

  const usuarios = [
    { id: "todos", nombre: "Todos los usuarios" },
    { id: "1", nombre: "Juan Pérez" },
    { id: "2", nombre: "María García" },
    { id: "3", nombre: "Carlos López" },
    { id: "4", nombre: "Ana Martínez" },
  ]

  const datosEmpresasCreadas = [
    { usuario: "Juan Pérez", nuevas: 45, contactadas: 35, infoEnviada: 28 },
    { usuario: "María García", nuevas: 38, contactadas: 32, infoEnviada: 25 },
    { usuario: "Carlos López", nuevas: 42, contactadas: 30, infoEnviada: 22 },
    { usuario: "Ana Martínez", nuevas: 31, contactadas: 28, infoEnviada: 20 },
  ]

  const datosTasaRespuesta = [
    { usuario: "Juan Pérez", totalLlamadas: 120, llamadasExitosas: 54, tasa: 45.0 },
    { usuario: "María García", totalLlamadas: 98, llamadasExitosas: 48, tasa: 49.0 },
    { usuario: "Carlos López", totalLlamadas: 105, llamadasExitosas: 42, tasa: 40.0 },
    { usuario: "Ana Martínez", totalLlamadas: 87, llamadasExitosas: 39, tasa: 44.8 },
  ]

  const datosConversion = [
    {
      usuario: "Juan Pérez",
      contactadas: 35,
      respuestaPositiva: 28,
      interesMedio: 22,
      reuniones: 15,
      tasaRespuesta: 80.0,
      tasaInteres: 78.6,
      tasaReuniones: 68.2,
    },
    {
      usuario: "María García",
      contactadas: 32,
      respuestaPositiva: 26,
      interesMedio: 20,
      reuniones: 14,
      tasaRespuesta: 81.3,
      tasaInteres: 76.9,
      tasaReuniones: 70.0,
    },
    {
      usuario: "Carlos López",
      contactadas: 30,
      respuestaPositiva: 22,
      interesMedio: 18,
      reuniones: 11,
      tasaRespuesta: 73.3,
      tasaInteres: 81.8,
      tasaReuniones: 61.1,
    },
    {
      usuario: "Ana Martínez",
      contactadas: 28,
      respuestaPositiva: 21,
      interesMedio: 16,
      reuniones: 12,
      tasaRespuesta: 75.0,
      tasaInteres: 76.2,
      tasaReuniones: 75.0,
    },
  ]

  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decodedToken = jwtDecode(token)
        const nombreUsuario = decodedToken.sub
        fetchUserDetails(nombreUsuario)
      } catch (decodeError) {
        console.error("Error decodificando el token:", decodeError)
        setCurrentUser({ nombre: "Usuario", apellidos: "Desconocido" })
      }
    } else {
      console.log("No se encontró token en localStorage")
    }
    if (!initialDataLoaded) {
      fetchDashboardData()
      setInitialDataLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (initialDataLoaded && (dateRange.startDate || dateRange.endDate || selectedUser !== "todos")) {
      fetchDashboardData()
    }
  }, [dateRange, selectedUser, initialDataLoaded])

  const fetchUserDetails = async (nombreUsuario) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/auth/users/by-username/${nombreUsuario}`)
      const user = await response.json()
      setCurrentUser({ nombre: user.nombre, apellidos: user.apellidos })
    } catch (error) {
      console.error("Error fetching user details:", error)
      setCurrentUser({ nombre: "Usuario", apellidos: "Desconocido" })
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const todayDate = getTodayDate()
      const startDate = dateRange.startDate || todayDate
      const endDate = dateRange.endDate || todayDate
      const userFilter = selectedUser !== "todos" ? selectedUser : ""

      const response = await fetchWithToken(
        `${API_BASE_URL}/dashboard/metricas?startDate=${startDate}&endDate=${endDate}&usuario=${userFilter}`,
      )
      const data = await response.json()

      // Aquí se procesarían los datos reales del API
      console.log("Datos del dashboard:", data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }))
  }

  const formatDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date()
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const handleDownloadPDF = async () => {
    try {
      setLoading(true)
      Swal.fire({
        icon: "info",
        title: "Generando reporte",
        text: "Descargando Dashboard de Métricas en PDF...",
        showConfirmButton: false,
      })

      const resumenCanvas = await html2canvas(resumenSectionRef.current, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        scale: 3,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        logging: true,
      })

      const graficasCanvas = await html2canvas(graficasSectionRef.current, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        scale: 3,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        logging: true,
      })

      const pdfContent = document.createElement("div")
      pdfContent.style.cssText = `
        padding: 20px;
        font-family: Arial, sans-serif;
        background: #ffffff;
        width: 800px;
        color: #333;
      `

      const resumenImg = document.createElement("img")
      resumenImg.src = resumenCanvas.toDataURL("image/png")
      resumenImg.style.cssText = "width: 100%; margin: 20px 0;"

      const graficasImg = document.createElement("img")
      graficasImg.src = graficasCanvas.toDataURL("image/png")
      graficasImg.style.cssText = "width: 100%; margin: 20px 0;"

      pdfContent.innerHTML = `
        <h1 style="text-align: center;">Dashboard de Métricas Generales</h1>
        <p style="text-align: center; margin-bottom: 30px;">
          Usuario: ${currentUser.nombre} ${currentUser.apellidos} - Fecha: ${formatDate()}
        </p>
        <div style="margin: 20px 0;">
          <h2>Resumen Ejecutivo</h2>
        </div>
      `
      pdfContent.appendChild(resumenImg)

      const graficasTitle = document.createElement("h2")
      graficasTitle.textContent = "Gráficas de Métricas"
      graficasTitle.style.marginTop = "30px"
      pdfContent.appendChild(graficasTitle)
      pdfContent.appendChild(graficasImg)

      document.body.appendChild(pdfContent)
      pdfContent.style.position = "absolute"
      pdfContent.style.left = "-9999px"

      await new Promise((resolve) => setTimeout(resolve, 500))

      const finalCanvas = await html2canvas(pdfContent, {
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        scale: 3,
      })

      document.body.removeChild(pdfContent)

      // Generar el PDF
      const imgData = finalCanvas.toDataURL("image/png")
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      const imgProps = doc.getImageProperties(imgData)
      const pdfWidth = doc.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      if (pdfHeight > doc.internal.pageSize.getHeight()) {
        const maxHeight = doc.internal.pageSize.getHeight()
        const adjustedWidth = (imgProps.width * maxHeight) / imgProps.height
        doc.addImage(imgData, "PNG", (pdfWidth - adjustedWidth) / 2, 0, adjustedWidth, maxHeight)
      } else {
        doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      }

      doc.save(`Dashboard_Metricas_${dateRange.startDate || getTodayDate()}_${dateRange.endDate || getTodayDate()}.pdf`)

      Swal.fire({
        icon: "success",
        title: "Descargado",
        text: "Dashboard PDF generado exitosamente",
      })
    } catch (error) {
      console.error("Error generando PDF:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar el PDF: " + error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatearNumero = (numero) => {
    return new Intl.NumberFormat("es-ES").format(numero)
  }

  const TarjetaResumen = ({ titulo, valor, sufijo = "", tendencia, icono }) => (
    <div className="dashboard-metricas__tarjeta-resumen">
      <div className="dashboard-metricas__tarjeta-header">
        <div className="dashboard-metricas__tarjeta-icono">
          <span className="dashboard-metricas__icono-unicode">
            {icono === "fas fa-building" && "🏢"}
            {icono === "fas fa-phone" && "📞"}
            {icono === "fas fa-chart-line" && "📈"}
            {icono === "fas fa-handshake" && "🤝"}
          </span>
        </div>
        <div className={`dashboard-metricas__tendencia dashboard-metricas__tendencia--${tendencia}`}>
          <span>{tendencia === "up" ? "↗" : "↘"}</span>
        </div>
      </div>
      <div className="dashboard-metricas__tarjeta-contenido">
        <h3 className="dashboard-metricas__tarjeta-valor">
          {formatearNumero(valor)}
          {sufijo}
        </h3>
        <p className="dashboard-metricas__tarjeta-titulo">{titulo}</p>
      </div>
    </div>
  )

  const GraficaBarras = ({ titulo, datos, series, colores }) => (
    <div className="dashboard-metricas__grafica-container">
      <h3 className="dashboard-metricas__grafica-titulo">{titulo}</h3>
      <div className="dashboard-metricas__grafica-content">
        <div className="dashboard-metricas__grafica-leyenda">
          {series.map((serie, index) => (
            <div key={index} className="dashboard-metricas__leyenda-item">
              <span className="dashboard-metricas__leyenda-color" style={{ backgroundColor: colores[index] }}></span>
              <span className="dashboard-metricas__leyenda-texto">{serie}</span>
            </div>
          ))}
        </div>
        <div className="dashboard-metricas__grafica-barras">
          {datos.map((item, index) => (
            <div key={index} className="dashboard-metricas__barra-grupo">
              <div className="dashboard-metricas__barras-container">
                {Object.keys(item)
                  .filter((key) => key !== "usuario")
                  .map((key, barIndex) => (
                    <div
                      key={barIndex}
                      className="dashboard-metricas__barra"
                      style={{
                        backgroundColor: colores[barIndex],
                        height: `${(item[key] / Math.max(...datos.map((d) => Math.max(...Object.values(d).filter((v) => typeof v === "number"))))) * 100}%`,
                      }}
                      title={`${series[barIndex]}: ${item[key]}`}
                    >
                      <span className="dashboard-metricas__barra-valor">{item[key]}</span>
                    </div>
                  ))}
              </div>
              <div className="dashboard-metricas__barra-label">{item.usuario}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Header />
      <main className="reporte-main-content">
        <div className="reporte-container">
          <div className="reporte-header">
            <div className="reporte-header-info">
              <h1 className="reporte-page-title">Dashboard de Métricas Generales</h1>
              <p className="reporte-subtitle">
                {currentUser.nombre} {currentUser.apellidos} - {formatDate()}
              </p>
            </div>
            <div className="reporte-header-controls">
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
              {userRole === "admin" && (
                <div className="reporte-date-range-container">
                  <label className="reporte-date-label">Usuario</label>
                  <select
                    className="reporte-date-input"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button className="reporte-btn reporte-btn-download" onClick={handleDownloadPDF}>
                <img src={downloadIcon || "/placeholder.svg"} alt="Descargar" className="reporte-btn-icon" />
                Generar Reporte
              </button>
            </div>
          </div>

          {loading && (
            <div className="reporte-loading">
              <div className="reporte-loading-spinner"></div>
              <span>Cargando datos...</span>
            </div>
          )}

          {/*  Panel de Resumen Ejecutivo para PDF */}
          <div className="dashboard-metricas__resumen-ejecutivo" ref={resumenSectionRef}>
            <TarjetaResumen
              titulo="Total Empresas Creadas"
              valor={resumenEjecutivo.totalEmpresas}
              tendencia={resumenEjecutivo.tendencias.totalEmpresas}
              icono="fas fa-building"
            />
            <TarjetaResumen
              titulo="Promedio de Contacto"
              valor={resumenEjecutivo.promedioContacto}
              sufijo="%"
              tendencia={resumenEjecutivo.tendencias.promedioContacto}
              icono="fas fa-phone"
            />
            <TarjetaResumen
              titulo="Tasa de Respuesta Global"
              valor={resumenEjecutivo.tasaRespuestaGlobal}
              sufijo="%"
              tendencia={resumenEjecutivo.tendencias.tasaRespuestaGlobal}
              icono="fas fa-chart-line"
            />
            <TarjetaResumen
              titulo="Tasa de Conversión Global"
              valor={resumenEjecutivo.tasaConversionGlobal}
              sufijo="%"
              tendencia={resumenEjecutivo.tendencias.tasaConversionGlobal}
              icono="fas fa-handshake"
            />
          </div>

          {/*  Gráficas con ref para PDF */}
          <div className="dashboard-metricas__graficas-grid" ref={graficasSectionRef}>
            <GraficaBarras
              titulo="Empresas Creadas por Usuario"
              datos={datosEmpresasCreadas}
              series={["Empresas Nuevas", "Empresas Contactadas", "Info Enviada"]}
              colores={["#87CEEB", "#5bc0de", "#2c5aa0"]}
            />

            <GraficaBarras
              titulo="Tasa de Respuesta por Usuario"
              datos={datosTasaRespuesta}
              series={["Total Llamadas", "Llamadas Exitosas"]}
              colores={["#2c5aa0", "#4ecdc4"]}
            />

            <div className="dashboard-metricas__grafica-conversion">
              <h3 className="dashboard-metricas__grafica-titulo">Tasa de Conversión por Usuario</h3>
              <div className="dashboard-metricas__conversion-content">
                {datosConversion.map((item, index) => (
                  <div key={index} className="dashboard-metricas__conversion-usuario">
                    <h4 className="dashboard-metricas__conversion-nombre">{item.usuario}</h4>
                    <div className="dashboard-metricas__conversion-barras">
                      <div className="dashboard-metricas__conversion-barra-stack">
                        <div
                          className="dashboard-metricas__conversion-segmento dashboard-metricas__conversion-segmento--contactadas"
                          style={{ width: "100%" }}
                          title={`Contactadas: ${item.contactadas}`}
                        >
                          <span>{item.contactadas}</span>
                        </div>
                        <div
                          className="dashboard-metricas__conversion-segmento dashboard-metricas__conversion-segmento--positiva"
                          style={{ width: `${(item.respuestaPositiva / item.contactadas) * 100}%` }}
                          title={`Respuesta Positiva: ${item.respuestaPositiva}`}
                        >
                          <span>{item.respuestaPositiva}</span>
                        </div>
                        <div
                          className="dashboard-metricas__conversion-segmento dashboard-metricas__conversion-segmento--interes"
                          style={{ width: `${(item.interesMedio / item.contactadas) * 100}%` }}
                          title={`Interés Medio/Alto: ${item.interesMedio}`}
                        >
                          <span>{item.interesMedio}</span>
                        </div>
                        <div
                          className="dashboard-metricas__conversion-segmento dashboard-metricas__conversion-segmento--reuniones"
                          style={{ width: `${(item.reuniones / item.contactadas) * 100}%` }}
                          title={`Reuniones: ${item.reuniones}`}
                        >
                          <span>{item.reuniones}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-metricas__conversion-metricas">
                      <span className="dashboard-metricas__conversion-metrica">Respuesta: {item.tasaRespuesta}%</span>
                      <span className="dashboard-metricas__conversion-metrica">Interés: {item.tasaInteres}%</span>
                      <span className="dashboard-metricas__conversion-metrica">Reuniones: {item.tasaReuniones}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default DashboardMetricas
