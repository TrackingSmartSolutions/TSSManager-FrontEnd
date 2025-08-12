import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "./DashboardMetricas.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import downloadIcon from "../../assets/icons/descarga.png"
import { API_BASE_URL } from "../Config/Config"
import html2canvas from "html2canvas"
import { jwtDecode } from "jwt-decode"
import jsPDF from 'jspdf'

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

const getWeekStart = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysFromMonday)
    return monday.toISOString().split("T")[0]
}

const getWeekEnd = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    const sunday = new Date(today)
    sunday.setDate(today.getDate() + daysToSunday)
    return sunday.toISOString().split("T")[0]
}

const DashboardMetricas = () => {
    const navigate = useNavigate()
    const [dateRange, setDateRange] = useState({
        startDate: getWeekStart(),
        endDate: getWeekEnd(),
    })
    const [selectedUser, setSelectedUser] = useState("todos")
    const [loading, setLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState({ nombre: "", apellidos: "" })
    const [userRole, setUserRole] = useState("admin")
    const [initialDataLoaded, setInitialDataLoaded] = useState(false)
    const [dashboardData, setDashboardData] = useState(null)
    const [usuarios, setUsuarios] = useState([{ id: "todos", nombre: "Todos los usuarios" }])


    //  Agregando refs para las secciones como en reporte-personal
    const resumenSectionRef = useRef(null)
    const graficasSectionRef = useRef(null)


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

        fetchAllUsers()

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
            setUserRole(user.rol || "EMPLEADO")
        } catch (error) {
            console.error("Error fetching user details:", error)
            setCurrentUser({ nombre: "Usuario", apellidos: "Desconocido" })
        }
    }

    const fetchAllUsers = async () => {
        try {
            const response = await fetchWithToken(`${API_BASE_URL}/auth/users`)
            const users = await response.json()

            const usuariosList = [
                { id: "todos", nombre: "Todos los usuarios" },
                ...users
                    .filter(user => user.estatus === 'ACTIVO')
                    .map(user => ({
                        id: user.id.toString(),
                        nombre: `${user.nombre}`
                    }))
            ]

            setUsuarios(usuariosList)
        } catch (error) {
            console.error("Error fetching all users:", error)
            setUsuarios([{ id: "todos", nombre: "Todos los usuarios" }])
        }
    }

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const todayDate = getTodayDate()
            const startDate = dateRange.startDate || todayDate
            const endDate = dateRange.endDate || todayDate
            const userFilter = selectedUser !== "todos" ? selectedUser : ""

            const queryParams = new URLSearchParams({
                startDate: startDate,
                endDate: endDate,
                ...(userFilter && { usuario: userFilter })
            })

            const response = await fetchWithToken(
                `${API_BASE_URL}/dashboard/metricas?${queryParams}`
            )
            const result = await response.json()

            if (result.success && result.data) {
                setDashboardData(result.data)

            } else {
                console.error("Error en la respuesta:", result.error)
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: result.error || "Error al cargar los datos del dashboard",
                })
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error)
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Error de conexión al cargar los datos del dashboard",
            })
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
            // Mostrar loading
            Swal.fire({
                title: 'Generando PDF...',
                text: 'Por favor espera mientras se genera el reporte',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            // Crear un contenedor temporal para el PDF
            const tempContainer = document.createElement('div')
            tempContainer.style.position = 'absolute'
            tempContainer.style.left = '-9999px'
            tempContainer.style.top = '0'
            tempContainer.style.width = '210mm' // A4 width
            tempContainer.style.backgroundColor = 'white'
            tempContainer.style.fontFamily = 'Arial, sans-serif'
            tempContainer.style.fontSize = '12px'
            tempContainer.style.lineHeight = '1.4'
            tempContainer.style.color = '#333'
            tempContainer.style.padding = '20px'
            document.body.appendChild(tempContainer)

            // Crear el contenido del PDF
            const fechaReporte = new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })

            const formatDateCorrect = (dateString) => {
            if (!dateString) return ''
            const [year, month, day] = dateString.split('-')
            return `${day}/${month}/${year}`
        }

            const periodoReporte = `${formatDateCorrect(dateRange.startDate)} - ${formatDateCorrect(dateRange.endDate)}`
            const usuarioSeleccionado = selectedUser === "todos" ? "Todos los usuarios" :
                usuarios.find(u => u.id === selectedUser)?.nombre || "Usuario no encontrado"

            tempContainer.innerHTML = `
            <div style="max-width: 190mm; margin: 0 auto;">
                <!-- Header del reporte -->
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4a90e2; padding-bottom: 15px;">
                    <h1 style="margin: 0; color: #2c5aa0; font-size: 24px; font-weight: bold;">
                        Dashboard de Métricas Generales
                    </h1>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">
                        Generado por: ${currentUser.nombre} ${currentUser.apellidos}
                    </p>
                    <p style="margin: 5px 0; color: #666; font-size: 12px;">
                        Fecha del reporte: ${fechaReporte}
                    </p>
                    <p style="margin: 5px 0; color: #666; font-size: 12px;">
                        Período: ${periodoReporte} | Usuario: ${usuarioSeleccionado}
                    </p>
                </div>

                <!-- Resumen Ejecutivo -->
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #2c5aa0; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #4a90e2; padding-left: 10px;">
                        📊 Resumen Ejecutivo
                    </h2>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4a90e2;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h3 style="margin: 0; font-size: 24px; color: #2c5aa0; font-weight: bold;">
                                        ${formatearNumero(dashboardData?.resumenEjecutivo?.totalEmpresas || 0)}
                                    </h3>
                                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                                        🏢 Total Empresas Creadas
                                    </p>
                                </div>
                                <span style="font-size: 16px; color: ${dashboardData?.resumenEjecutivo?.tendencias?.totalEmpresas === 'up' ? '#28a745' : dashboardData?.resumenEjecutivo?.tendencias?.totalEmpresas === 'down' ? '#dc3545' : '#6c757d'};">
                                    ${dashboardData?.resumenEjecutivo?.tendencias?.totalEmpresas === 'up' ? '↗' : dashboardData?.resumenEjecutivo?.tendencias?.totalEmpresas === 'down' ? '↘' : '→'}
                                </span>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #5bc0de;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h3 style="margin: 0; font-size: 24px; color: #2c5aa0; font-weight: bold;">
                                        ${formatearNumero(dashboardData?.resumenEjecutivo?.promedioContacto || 0)}%
                                    </h3>
                                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                                        📞 Promedio de Contacto
                                    </p>
                                </div>
                                <span style="font-size: 16px; color: ${dashboardData?.resumenEjecutivo?.tendencias?.promedioContacto === 'up' ? '#28a745' : dashboardData?.resumenEjecutivo?.tendencias?.promedioContacto === 'down' ? '#dc3545' : '#6c757d'};">
                                    ${dashboardData?.resumenEjecutivo?.tendencias?.promedioContacto === 'up' ? '↗' : dashboardData?.resumenEjecutivo?.tendencias?.promedioContacto === 'down' ? '↘' : '→'}
                                </span>
                            </div>
                        </div>

                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h3 style="margin: 0; font-size: 24px; color: #2c5aa0; font-weight: bold;">
                                        ${formatearNumero(dashboardData?.resumenEjecutivo?.tasaRespuestaGlobal || 0)}%
                                    </h3>
                                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                                        📈 Tasa de Respuesta Global
                                    </p>
                                </div>
                                <span style="font-size: 16px; color: ${dashboardData?.resumenEjecutivo?.tendencias?.tasaRespuestaGlobal === 'up' ? '#28a745' : dashboardData?.resumenEjecutivo?.tendencias?.tasaRespuestaGlobal === 'down' ? '#dc3545' : '#6c757d'};">
                                    ${dashboardData?.resumenEjecutivo?.tendencias?.tasaRespuestaGlobal === 'up' ? '↗' : dashboardData?.resumenEjecutivo?.tendencias?.tasaRespuestaGlobal === 'down' ? '↘' : '→'}
                                </span>
                            </div>
                        </div>

                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h3 style="margin: 0; font-size: 24px; color: #2c5aa0; font-weight: bold;">
                                        ${formatearNumero(dashboardData?.resumenEjecutivo?.tasaConversionGlobal || 0)}%
                                    </h3>
                                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                                        🤝 Tasa de Conversión Global
                                    </p>
                                </div>
                                <span style="font-size: 16px; color: ${dashboardData?.resumenEjecutivo?.tendencias?.tasaConversionGlobal === 'up' ? '#28a745' : dashboardData?.resumenEjecutivo?.tendencias?.tasaConversionGlobal === 'down' ? '#dc3545' : '#6c757d'};">
                                    ${dashboardData?.resumenEjecutivo?.tendencias?.tasaConversionGlobal === 'up' ? '↗' : dashboardData?.resumenEjecutivo?.tendencias?.tasaConversionGlobal === 'down' ? '↘' : '→'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sección de Gráficas -->
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #2c5aa0; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #4a90e2; padding-left: 10px;">
                        📈 Métricas Detalladas por Usuario
                    </h2>

                    <!-- Tabla de Empresas Creadas -->
                    ${(dashboardData?.empresasCreadas?.length || 0) > 0 ? `
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #2c5aa0; font-size: 14px; margin-bottom: 10px;">
                            🏢 Empresas Creadas por Usuario
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                            <thead>
                                <tr style="background-color: #4a90e2; color: white;">
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Usuario</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Nuevas</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Contactadas</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Info Enviada</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dashboardData.empresasCreadas.map((item, index) => `
                                <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                                    <td style="padding: 8px; border: 1px solid #ddd;">${item.usuario}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${formatearNumero(item.nuevas)}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${formatearNumero(item.contactadas)}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${formatearNumero(item.infoEnviada)}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">
                                        ${formatearNumero(item.nuevas + item.contactadas + item.infoEnviada)}
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}

                    <!-- Tabla de Tasa de Respuesta -->
                    ${(dashboardData?.tasaRespuesta?.length || 0) > 0 ? `
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #2c5aa0; font-size: 14px; margin-bottom: 10px;">
                            📞 Tasa de Respuesta por Usuario
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                            <thead>
                                <tr style="background-color: #2c5aa0; color: white;">
                                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Usuario</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Total Llamadas</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Llamadas Exitosas</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Tasa de Respuesta</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dashboardData.tasaRespuesta.map((item, index) => `
                                <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                                    <td style="padding: 8px; border: 1px solid #ddd;">${item.usuario}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${formatearNumero(item.totalLlamadas)}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${formatearNumero(item.llamadasExitosas)}</td>
                                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: ${item.tasa >= 70 ? '#28a745' : item.tasa >= 50 ? '#f39c12' : '#dc3545'};">
                                        ${item.tasa}%
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}

                    <!-- Tabla de Tasa de Conversión -->
                    ${(dashboardData?.tasaConversion?.length || 0) > 0 ? `
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #2c5aa0; font-size: 14px; margin-bottom: 10px;">
                            🤝 Tasa de Conversión por Usuario
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                            <thead>
                                <tr style="background-color: #f39c12; color: white;">
                                    <th style="padding: 6px; text-align: left; border: 1px solid #ddd; font-size: 9px;">Usuario</th>
                                    <th style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">Contactadas</th>
                                    <th style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">Resp. Positiva</th>
                                    <th style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">Interés Medio</th>
                                    <th style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">Reuniones</th>
                                    <th style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">% Respuesta</th>
                                    <th style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">% Interés</th>
                                    <th style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">% Reuniones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dashboardData.tasaConversion.map((item, index) => `
                                <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                                    <td style="padding: 6px; border: 1px solid #ddd; font-size: 9px;">${item.usuario}</td>
                                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">${formatearNumero(item.contactadas)}</td>
                                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">${formatearNumero(item.respuestaPositiva)}</td>
                                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">${formatearNumero(item.interesMedio)}</td>
                                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 9px;">${formatearNumero(item.reuniones)}</td>
                                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 9px; color: ${item.tasaRespuesta >= 50 ? '#28a745' : item.tasaRespuesta >= 30 ? '#f39c12' : '#dc3545'};">
                                        ${item.tasaRespuesta}%
                                    </td>
                                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 9px; color: ${item.tasaInteres >= 50 ? '#28a745' : item.tasaInteres >= 30 ? '#f39c12' : '#dc3545'};">
                                        ${item.tasaInteres}%
                                    </td>
                                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd; font-weight: bold; font-size: 9px; color: ${item.tasaReuniones >= 50 ? '#28a745' : item.tasaReuniones >= 30 ? '#f39c12' : '#dc3545'};">
                                        ${item.tasaReuniones}%
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 10px;">
                    <p style="margin: 0;">
                        Reporte generado automáticamente - TSS Manager Backend
                    </p>
                    <p style="margin: 5px 0 0 0;">
                        ${new Date().toLocaleString('es-MX')}
                    </p>
                </div>
            </div>
        `

            // Capturar el contenido con html2canvas
            const canvas = await html2canvas(tempContainer, {
                scale: 2, // Mayor resolución
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: tempContainer.scrollWidth,
                height: tempContainer.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                logging: false
            })

            // Limpiar el contenedor temporal
            document.body.removeChild(tempContainer)

            // Crear el PDF
            const imgData = canvas.toDataURL('image/png', 1.0)

            // Crear documento PDF en formato A4
            const pdf = new jsPDF('p', 'mm', 'a4')

            // Dimensiones A4 en mm
            const pdfWidth = 210
            const pdfHeight = 297

            // Calcular dimensiones de la imagen
            const imgProps = pdf.getImageProperties(imgData)
            const imgWidth = pdfWidth - 20 // 10mm margen cada lado
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width

            // Si la imagen es más alta que la página, ajustar
            let finalImgWidth = imgWidth
            let finalImgHeight = imgHeight

            if (imgHeight > pdfHeight - 20) { // 10mm margen arriba y abajo
                finalImgHeight = pdfHeight - 20
                finalImgWidth = (imgProps.width * finalImgHeight) / imgProps.height
            }

            // Posicionar la imagen desde arriba con margen mínimo
            const x = (pdfWidth - finalImgWidth) / 2
            const y = 10 // Margen superior de solo 10mm

            // Agregar la imagen al PDF
            pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight, '', 'FAST')

            // Si la imagen es muy alta, crear páginas adicionales
            if (imgHeight > pdfHeight - 20) {
                let remainingHeight = imgHeight - (pdfHeight - 20)
                let sourceY = pdfHeight - 20 // Comenzar desde donde terminó la primera página

                while (remainingHeight > 0) {
                    pdf.addPage()
                    const pageHeight = Math.min(remainingHeight, pdfHeight - 20)

                    // Calcular la proporción de la imagen para esta página
                    const cropHeight = (pageHeight / imgHeight) * imgProps.height

                    pdf.addImage(
                        imgData,
                        'PNG',
                        10,
                        10, // Margen superior constante
                        imgWidth,
                        pageHeight,
                        '',
                        'FAST'
                    )

                    remainingHeight -= (pdfHeight - 20)
                }
            }

            // Generar nombre del archivo
            const fechaArchivo = new Date().toISOString().split('T')[0]
            const usuarioTexto = selectedUser === "todos" ? "todos-usuarios" : `usuario-${selectedUser}`
            const nombreArchivo = `dashboard-metricas-${fechaArchivo}-${usuarioTexto}.pdf`

            // Descargar el PDF
            pdf.save(nombreArchivo)

            // Cerrar el loading y mostrar éxito
            Swal.close()
            Swal.fire({
                icon: 'success',
                title: '¡PDF generado!',
                text: 'El reporte PDF se ha descargado exitosamente',
                timer: 2000,
                showConfirmButton: false
            })

        } catch (error) {
            console.error('Error generando PDF:', error)
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.'
            })
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
                                        item[key] > 0 && (
                                            <div
                                                key={barIndex}
                                                className="dashboard-metricas__barra"
                                                style={{
                                                    backgroundColor: colores[barIndex],
                                                    height: `${(item[key] / Math.max(...datos.map((d) => Math.max(...Object.values(d).filter((v) => typeof v === "number"))))) * 100}%`,
                                                    opacity: '1',
                                                    filter: 'none',
                                                    WebkitPrintColorAdjust: 'exact',
                                                    printColorAdjust: 'exact'
                                                }}
                                                title={`${series[barIndex]}: ${item[key]}`}
                                                data-color={colores[barIndex]}
                                            >
                                                <span className="dashboard-metricas__barra-valor">{item[key]}</span>
                                            </div>
                                        )
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
                            {userRole === "ADMINISTRADOR" && (
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

                    {!loading && dashboardData && (
                        dashboardData.empresasCreadas?.length === 0 &&
                        dashboardData.tasaRespuesta?.length === 0 &&
                        dashboardData.tasaConversion?.length === 0
                    ) && (
                            <div className="dashboard-metricas__no-data">
                                <div className="dashboard-metricas__no-data-content">
                                    <h3>No hay datos disponibles</h3>
                                    <p>No se encontraron métricas para el período seleccionado.</p>
                                </div>
                            </div>
                        )}

                    {/*  Panel de Resumen Ejecutivo para PDF */}
                    <div className="dashboard-metricas__resumen-ejecutivo" ref={resumenSectionRef}>
                        <TarjetaResumen
                            titulo="Total Empresas Creadas"
                            valor={dashboardData?.resumenEjecutivo?.totalEmpresas || 0}
                            tendencia={dashboardData?.resumenEjecutivo?.tendencias?.totalEmpresas || "stable"}
                            icono="fas fa-building"
                        />
                        <TarjetaResumen
                            titulo="Promedio de Contacto"
                            valor={dashboardData?.resumenEjecutivo?.promedioContacto || 0}
                            sufijo="%"
                            tendencia={dashboardData?.resumenEjecutivo?.tendencias?.promedioContacto || "stable"}
                            icono="fas fa-phone"
                        />
                        <TarjetaResumen
                            titulo="Tasa de Respuesta Global"
                            valor={dashboardData?.resumenEjecutivo?.tasaRespuestaGlobal || 0}
                            sufijo="%"
                            tendencia={dashboardData?.resumenEjecutivo?.tendencias?.tasaRespuestaGlobal || "stable"}
                            icono="fas fa-chart-line"
                        />
                        <TarjetaResumen
                            titulo="Tasa de Conversión Global"
                            valor={dashboardData?.resumenEjecutivo?.tasaConversionGlobal || 0}
                            sufijo="%"
                            tendencia={dashboardData?.resumenEjecutivo?.tendencias?.tasaConversionGlobal || "stable"}
                            icono="fas fa-handshake"
                        />
                    </div>


                    {/*  Gráficas con ref para PDF */}
                    <div className="dashboard-metricas__graficas-grid" ref={graficasSectionRef}>
                        <GraficaBarras
                            titulo="Empresas Creadas por Usuario"
                            datos={dashboardData?.empresasCreadas?.map(item => ({
                                usuario: item.usuario,
                                nuevas: item.nuevas,
                                contactadas: item.contactadas,
                                infoEnviada: item.infoEnviada
                            })) || []}
                            series={["Empresas Nuevas", "Empresas Contactadas", "Info Enviada"]}
                            colores={["rgb(74, 144, 226)", "rgb(91, 192, 222)", "rgb(44, 90, 160)"]}
                        />

                        <GraficaBarras
                            titulo="Tasa de Respuesta por Usuario"
                            datos={dashboardData?.tasaRespuesta?.map(item => ({
                                usuario: item.usuario,
                                totalLlamadas: item.totalLlamadas,
                                llamadasExitosas: item.llamadasExitosas
                            })) || []}
                            series={["Total Llamadas", "Llamadas Exitosas"]}
                            colores={["rgb(44, 90, 160)", "rgb(78, 205, 196)"]}
                        />

                        <div className="dashboard-metricas__grafica-conversion">
                            <h3 className="dashboard-metricas__grafica-titulo">Tasa de Conversión por Usuario</h3>
                            <div className="dashboard-metricas__conversion-content">
                                {(dashboardData?.tasaConversion || []).map((item, index) => (
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
                                                    style={{ width: `${item.contactadas > 0 ? (item.respuestaPositiva / item.contactadas) * 100 : 0}%` }}
                                                    title={`Respuesta Positiva: ${item.respuestaPositiva}`}
                                                >
                                                    <span>{item.respuestaPositiva}</span>
                                                </div>
                                                <div
                                                    className="dashboard-metricas__conversion-segmento dashboard-metricas__conversion-segmento--interes"
                                                    style={{ width: `${item.contactadas > 0 ? (item.interesMedio / item.contactadas) * 100 : 0}%` }}
                                                    title={`Interés Medio/Alto: ${item.interesMedio}`}
                                                >
                                                    <span>{item.interesMedio}</span>
                                                </div>
                                                <div
                                                    className="dashboard-metricas__conversion-segmento dashboard-metricas__conversion-segmento--reuniones"
                                                    style={{ width: `${item.contactadas > 0 ? (item.reuniones / item.contactadas) * 100 : 0}%` }}
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
                </div >
            </main >
        </>
    )
}

export default DashboardMetricas
