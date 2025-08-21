import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Admin_Balance.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import jsPDF from "jspdf"
import { API_BASE_URL } from "../Config/Config"

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
  return response.json()
}

const AdminBalance = () => {
  const navigate = useNavigate()
  const [balanceData, setBalanceData] = useState({
    resumenContable: { totalIngresos: 0, totalGastos: 0, utilidadPerdida: 0 },
    graficoMensual: [],
    acumuladoCuentas: [],
    equiposVendidos: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    tiempoGrafico: "Año",
    cuentaSeleccionada: "Todas",
    categoriaSeleccionada: "Todas",
  })
  const [categorias, setCategorias] = useState([])
  const [cuentas, setCuentas] = useState([])
  const REPOSICION_ID = 12

  const obtenerRangoFechas = (tipoFiltro) => {
    const ahora = new Date()
    const mesActual = ahora.getMonth()
    const añoActual = ahora.getFullYear()
    switch (tipoFiltro) {
      case "Mes":
        const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate()
        return {
          inicio: new Date(añoActual, mesActual, 1),
          fin: new Date(añoActual, mesActual + 1, 0),
          labels: Array.from({ length: diasEnMes }, (_, i) => `${i + 1}`),
        }
      case "Trimestre":
        const mesInicio = Math.max(0, mesActual - 2)
        return {
          inicio: new Date(añoActual, mesInicio, 1),
          fin: new Date(añoActual, mesActual + 1, 0),
          labels: Array.from({ length: 3 }, (_, i) => {
            const mes = mesInicio + i
            return new Date(añoActual, mes, 1).toLocaleString("es-MX", { month: "long" })
          }),
        }
      case "Año":
        return {
          inicio: new Date(añoActual, 0, 1),
          fin: new Date(añoActual, 11, 31),
          labels: Array.from({ length: 12 }, (_, i) => {
            return new Date(añoActual, i, 1).toLocaleString("es-MX", { month: "long" })
          }),
        }
      case "Histórico":
        return {
          inicio: new Date(añoActual - 4, 0, 1),
          fin: new Date(añoActual, 11, 31),
          labels: Array.from({ length: 5 }, (_, i) => (añoActual - 4 + i).toString()),
        }
      default:
        return {
          inicio: new Date(añoActual, 0, 1),
          fin: new Date(añoActual, 11, 31),
          labels: Array.from({ length: 12 }, (_, i) => {
            return new Date(añoActual, i, 1).toLocaleString("es-MX", { month: "long" })
          }),
        }
    }
  }

  const generarDatosGrafico = (transacciones, tipoFiltro) => {
    const { inicio, fin, labels } = obtenerRangoFechas(tipoFiltro)
    const transaccionesFiltradas = transacciones.filter((t) => {
      const fechaTransaccion = new Date(t.fechaPago)
      return fechaTransaccion >= inicio && fechaTransaccion <= fin
    })

    if (tipoFiltro === "Mes") {
      const ahora = new Date()
      const mesActual = ahora.getMonth()
      const añoActual = ahora.getFullYear()
      const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate()
      return Array.from({ length: diasEnMes }, (_, i) => {
        const dia = i + 1
        const ingresos = transaccionesFiltradas
          .filter((t) => t.tipo === "INGRESO")
          .filter((t) => {
            const fechaTransaccion = new Date(t.fechaPago)
            return (
              fechaTransaccion.getDate() === dia &&
              fechaTransaccion.getMonth() === mesActual &&
              fechaTransaccion.getFullYear() === añoActual
            )
          })
          .reduce((sum, t) => sum + t.monto, 0)
        const gastos = transaccionesFiltradas
          .filter((t) => t.tipo === "GASTO" && t.notas === "Transacción generada desde Cuentas por Pagar")
          .filter((t) => {
            const fechaTransaccion = new Date(t.fechaPago)
            return (
              fechaTransaccion.getDate() === dia &&
              fechaTransaccion.getMonth() === mesActual &&
              fechaTransaccion.getFullYear() === añoActual
            )
          })
          .reduce((sum, t) => sum + t.monto, 0)
        return { mes: dia.toString(), ingresos, gastos }
      })
    }

    if (tipoFiltro === "Trimestre") {
      const ahora = new Date()
      const mesActual = ahora.getMonth()
      const añoActual = ahora.getFullYear()
      const mesInicio = Math.max(0, mesActual - 2)
      return Array.from({ length: 3 }, (_, i) => {
        const mes = mesInicio + i
        const ingresos = transaccionesFiltradas
          .filter((t) => t.tipo === "INGRESO")
          .filter((t) => {
            const fechaTransaccion = new Date(t.fechaPago)
            return fechaTransaccion.getMonth() === mes && fechaTransaccion.getFullYear() === añoActual
          })
          .reduce((sum, t) => sum + t.monto, 0)
        const gastos = transaccionesFiltradas
          .filter((t) => t.tipo === "GASTO" && t.notas === "Transacción generada desde Cuentas por Pagar")
          .filter((t) => {
            const fechaTransaccion = new Date(t.fechaPago)
            return fechaTransaccion.getMonth() === mes && fechaTransaccion.getFullYear() === añoActual
          })
          .reduce((sum, t) => sum + t.monto, 0)
        return { mes: labels[i], ingresos, gastos }
      })
    }

    if (tipoFiltro === "Año") {
      const añoActual = new Date().getFullYear()
      return Array.from({ length: 12 }, (_, i) => {
        const ingresos = transaccionesFiltradas
          .filter((t) => t.tipo === "INGRESO")
          .filter((t) => {
            const fechaTransaccion = new Date(t.fechaPago)
            return fechaTransaccion.getMonth() === i && fechaTransaccion.getFullYear() === añoActual
          })
          .reduce((sum, t) => sum + t.monto, 0)
        const gastos = transaccionesFiltradas
          .filter((t) => t.tipo === "GASTO" && t.notas === "Transacción generada desde Cuentas por Pagar")
          .filter((t) => {
            const fechaTransaccion = new Date(t.fechaPago)
            return fechaTransaccion.getMonth() === i && fechaTransaccion.getFullYear() === añoActual
          })
          .reduce((sum, t) => sum + t.monto, 0)
        return { mes: labels[i], ingresos, gastos }
      })
    }

    if (tipoFiltro === "Histórico") {
      const añoActual = new Date().getFullYear()
      return Array.from({ length: 5 }, (_, i) => {
        const año = añoActual - 4 + i
        const ingresos = transaccionesFiltradas
          .filter((t) => t.tipo === "INGRESO")
          .filter((t) => new Date(t.fechaPago).getFullYear() === año)
          .reduce((sum, t) => sum + t.monto, 0)
        const gastos = transaccionesFiltradas
          .filter((t) => t.tipo === "GASTO" && t.notas === "Transacción generada desde Cuentas por Pagar")
          .filter((t) => new Date(t.fechaPago).getFullYear() === año)
          .reduce((sum, t) => sum + t.monto, 0)
        return { mes: labels[i], ingresos, gastos }
      })
    }
    return []
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [transaccionesResp, categoriasResp, cuentasResp, cuentasPorCobrarResp, cotizacionesResp] =
        await Promise.all([
          fetchWithToken(`${API_BASE_URL}/transacciones`),
          fetchWithToken(`${API_BASE_URL}/categorias`),
          fetchWithToken(`${API_BASE_URL}/cuentas`),
          fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar`),
          fetchWithToken(`${API_BASE_URL}/cotizaciones`),
        ])

      const transacciones = transaccionesResp.filter((t) => t.cuenta.id !== REPOSICION_ID)
      const cuentasPorCobrar = cuentasPorCobrarResp.filter((c) => c.estatus === "PAGADO")
      const cotizaciones = cotizacionesResp

      const totalIngresos = transacciones.filter((t) => t.tipo === "INGRESO").reduce((sum, t) => sum + t.monto, 0)
      const totalGastos = transacciones
        .filter((t) => t.tipo === "GASTO" && t.notas === "Transacción generada desde Cuentas por Pagar")
        .reduce((sum, t) => sum + t.monto, 0)
      const utilidadPerdida = totalIngresos - totalGastos

      const graficoMensual = generarDatosGrafico(transacciones, filtros.tiempoGrafico)

      const acumuladoCuentas = categoriasResp.map((cat) => {
        const cuentasFiltradas = cuentasResp.filter((c) => c.categoria.id === cat.id && c.id !== REPOSICION_ID)
        const montoTotal = transacciones
          .filter(
            (t) =>
              t.categoria.id === cat.id &&
              t.cuenta.id !== REPOSICION_ID &&
              (t.tipo === "INGRESO" ||
                (t.tipo === "GASTO" && t.notas === "Transacción generada desde Cuentas por Pagar")),
          )
          .reduce((sum, t) => sum + t.monto, 0)
        return { categoria: cat.descripcion, cuenta: "Todas", monto: montoTotal }
      })

      const equiposVendidos = (await Promise.all(
        cuentasPorCobrar.map(async (c) => {
          const cotizacion = cotizaciones.find((co) => co.id === c.cotizacionId)
          return {
            cliente: c.clienteNombre,
            fechaPago: c.fechaRealPago,
            numeroEquipos: cotizacion ? cotizacion.cantidadTotal : 0,
          }
        }),
      )).filter(equipo => equipo.numeroEquipos > 0)
      .sort((a, b) => new Date(a.fechaPago) - new Date(b.fechaPago))

      setBalanceData({
        resumenContable: { totalIngresos, totalGastos, utilidadPerdida },
        graficoMensual,
        acumuladoCuentas,
        equiposVendidos,
      })
      setCategorias(categoriasResp)
      setCuentas(cuentasResp)
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los datos: " + error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filtros.tiempoGrafico])

  const handleFiltroTiempoChange = (nuevoFiltro) => {
    setFiltros((prev) => ({ ...prev, tiempoGrafico: nuevoFiltro }))
  }

  const handleCuentaChange = (nuevaCuenta) => {
    setFiltros((prev) => ({ ...prev, cuentaSeleccionada: nuevaCuenta }))
  }

  const handleCategoriaChange = (nuevaCategoria) => {
    setFiltros((prev) => ({ ...prev, categoriaSeleccionada: nuevaCategoria }))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const dividirTablaEnChunks = (datos, filasPorPagina = 25) => {
    const chunks = []
    for (let i = 0; i < datos.length; i += filasPorPagina) {
      chunks.push(datos.slice(i, i + filasPorPagina))
    }
    return chunks
  }

  const crearTablaHTML = (datos, headers, titulo, esUltimaTabla = false) => {
    if (!datos || datos.length === 0) {
      return `
        <div style="margin-bottom: ${esUltimaTabla ? "20px" : "40px"}; page-break-inside: avoid;">
          <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">${titulo}</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                ${headers.map((header) => `<th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">${header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="${headers.length}" style="border: 1px solid #ddd; padding: 20px; text-align: center; color: #666;">
                  No hay datos disponibles
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    }

    return `
      <div style="margin-bottom: ${esUltimaTabla ? "20px" : "40px"}; page-break-inside: avoid;">
        <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">${titulo}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              ${headers.map((header) => `<th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">${header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${datos
        .map(
          (fila, index) => `
              <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f9f9f9"}; page-break-inside: avoid;">
                ${Object.values(fila)
              .map((valor) => `<td style="border: 1px solid #ddd; padding: 8px;">${valor}</td>`)
              .join("")}
              </tr>
            `,
        )
        .join("")}
          </tbody>
        </table>
      </div>
    `
  }

  const handleGenerarReporte = async () => {
    try {
      Swal.fire({
        title: "Generando reporte...",
        text: "Por favor espere mientras se genera el PDF",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // Capturar el gráfico primero
      let graficoImageData = ""
      const chartCanvas = document.querySelector(".adminbalance-chart-container canvas")
      if (chartCanvas) {
        graficoImageData = chartCanvas.toDataURL("image/png", 1.0)
      }

      const acumuladoFiltrado = balanceData.acumuladoCuentas
        .filter((ac) => filtros.categoriaSeleccionada === "Todas" || ac.categoria === filtros.categoriaSeleccionada)
        .filter((ac) => filtros.cuentaSeleccionada === "Todas" || ac.cuenta === filtros.cuentaSeleccionada)
        .map((ac) => ({
          categoria: ac.categoria,
          cuenta: ac.cuenta,
          monto: formatCurrency(ac.monto),
        }))

      const equiposFormateados = balanceData.equiposVendidos.map((equipo) => ({
        cliente: equipo.cliente,
        fecha: equipo.fechaPago,
        equipos: equipo.numeroEquipos.toString(),
      }))

      const chunksAcumulado = dividirTablaEnChunks(acumuladoFiltrado, 20)
      const chunksEquipos = dividirTablaEnChunks(equiposFormateados, 20)

      const fechaActual = new Date().toLocaleDateString("es-MX")

      // Crear PDF
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15

      let currentY = margin

      // Función para agregar nueva página si es necesario
      const checkPageBreak = (requiredHeight) => {
        if (currentY + requiredHeight > pageHeight - margin) {
          pdf.addPage()
          currentY = margin
          return true
        }
        return false
      }

      // Encabezado del reporte
      pdf.setFontSize(20)
      pdf.setFont("helvetica", "bold")
      pdf.text("REPORTE DE BALANCE", pageWidth / 2, currentY, { align: "center" })
      currentY += 10

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Fecha de generación: ${fechaActual}`, pageWidth / 2, currentY, { align: "center" })
      currentY += 6
      pdf.text(`Período: ${obtenerTituloGrafico()}`, pageWidth / 2, currentY, { align: "center" })
      currentY += 15

      // Resumen contable
      checkPageBreak(40)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("RESUMEN CONTABLE", margin, currentY)
      currentY += 10

      const resumenHeight = 25
      checkPageBreak(resumenHeight)

      // Crear cajas para el resumen
      const boxWidth = (pageWidth - 2 * margin - 20) / 3
      const boxHeight = 20

      // Total Ingresos
      pdf.setFillColor(232, 245, 232)
      pdf.rect(margin, currentY, boxWidth, boxHeight, "F")
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "bold")
      pdf.text("Total Ingresos", margin + boxWidth / 2, currentY + 6, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(formatCurrency(balanceData.resumenContable.totalIngresos), margin + boxWidth / 2, currentY + 14, {
        align: "center",
      })

      // Total Gastos
      pdf.setFillColor(255, 232, 232)
      pdf.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight, "F")
      pdf.setFontSize(10)
      pdf.text("Total Gastos", margin + boxWidth + 10 + boxWidth / 2, currentY + 6, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(
        formatCurrency(balanceData.resumenContable.totalGastos),
        margin + boxWidth + 10 + boxWidth / 2,
        currentY + 14,
        { align: "center" },
      )

      // Utilidad
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin + 2 * boxWidth + 20, currentY, boxWidth, boxHeight, "F")
      pdf.setFontSize(10)
      pdf.text("Utilidad", margin + 2 * boxWidth + 20 + boxWidth / 2, currentY + 6, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(
        formatCurrency(balanceData.resumenContable.utilidadPerdida),
        margin + 2 * boxWidth + 20 + boxWidth / 2,
        currentY + 14,
        { align: "center" },
      )

      currentY += boxHeight + 20

      // Agregar gráfico si existe
      if (graficoImageData) {
        checkPageBreak(80)
        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text(obtenerTituloGrafico().toUpperCase(), margin, currentY)
        currentY += 10

        const imgWidth = pageWidth - 2 * margin
        const imgHeight = 60
        checkPageBreak(imgHeight)

        pdf.addImage(graficoImageData, "PNG", margin, currentY, imgWidth, imgHeight)
        currentY += imgHeight + 15
      }

      // Función para crear tabla en PDF
      const crearTablaPDF = (datos, headers, titulo, isLastTable = false) => {
        if (!datos || datos.length === 0) {
          checkPageBreak(30)
          pdf.setFontSize(14)
          pdf.setFont("helvetica", "bold")
          pdf.text(titulo, margin, currentY)
          currentY += 10

          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")
          pdf.text("No hay datos disponibles", margin, currentY)
          currentY += 15
          return
        }

        checkPageBreak(20)
        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text(titulo, margin, currentY)
        currentY += 10

        const colWidth = (pageWidth - 2 * margin) / headers.length
        const rowHeight = 8

        checkPageBreak(rowHeight + 5)
        pdf.setFillColor(245, 245, 245)
        pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, "F")

        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        headers.forEach((header, index) => {
          pdf.text(header, margin + index * colWidth + 2, currentY + 5)
        })
        currentY += rowHeight

        pdf.setFont("helvetica", "normal")
        datos.forEach((fila, index) => {
          checkPageBreak(rowHeight)

          if (index % 2 === 1) {
            pdf.setFillColor(249, 249, 249)
            pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, "F")
          }

          Object.values(fila).forEach((valor, colIndex) => {
            pdf.text(valor.toString(), margin + colIndex * colWidth + 2, currentY + 5)
          })
          currentY += rowHeight
        })

        if (!isLastTable) {
          currentY += 10
        }
      }

      // Agregar tablas de acumulado de cuentas
      if (chunksAcumulado.length > 0) {
        chunksAcumulado.forEach((chunk, index) => {
          const titulo = index === 0 ? "ACUMULADO DE CUENTAS" : `ACUMULADO DE CUENTAS (Continuación ${index + 1})`
          crearTablaPDF(chunk, ["Categoría", "Cuenta", "Monto"], titulo)
        })
      } else {
        crearTablaPDF([], ["Categoría", "Cuenta", "Monto"], "ACUMULADO DE CUENTAS")
      }

      if (chunksEquipos.length > 0) {
        chunksEquipos.forEach((chunk, index) => {
          const titulo = index === 0 ? "EQUIPOS VENDIDOS" : `EQUIPOS VENDIDOS (Continuación ${index + 1})`
          const isLast = index === chunksEquipos.length - 1
          crearTablaPDF(chunk, ["Cliente", "Fecha", "N° Equipos"], titulo, isLast)
        })
      } else {
        crearTablaPDF([], ["Cliente", "Fecha", "N° Equipos"], "EQUIPOS VENDIDOS", true)
      }

      const fechaArchivo = new Date().toISOString().split("T")[0]
      const nombreArchivo = `Balance_${fechaArchivo}.pdf`

      pdf.save(nombreArchivo)

      Swal.fire({
        icon: "success",
        title: "Reporte generado exitosamente",
        text: `El archivo ${nombreArchivo} se ha descargado correctamente`,
        timer: 3000,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error("Error al generar el reporte:", error)
      Swal.fire({
        icon: "error",
        title: "Error al generar reporte",
        text: "Ocurrió un error al generar el PDF. Por favor, inténtelo nuevamente.",
      })
    }
  }

  const obtenerTituloGrafico = () => {
    switch (filtros.tiempoGrafico) {
      case "Mes":
        return `Balance del mes`
      case "Trimestre":
        return `Balance del trimestre`
      case "Año":
        return `Balance del año`
      case "Histórico":
        return `Balance histórico`
      default:
        return `Balance del año`
    }
  }

  const graficoBalanceData =
    balanceData.graficoMensual.length > 0
      ? {
        labels: balanceData.graficoMensual.map((item) => item.mes),
        datasets: [
          {
            label: "Ingresos",
            data: balanceData.graficoMensual.map((item) => item.ingresos),
            backgroundColor: "#4CAF50",
            borderColor: "#4CAF50",
            borderWidth: 1,
          },
          {
            label: "Gastos",
            data: balanceData.graficoMensual.map((item) => item.gastos),
            backgroundColor: "#f44336",
            borderColor: "#f44336",
            borderWidth: 1,
          },
        ],
      }
      : { labels: [], datasets: [] }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 500 } } },
  }

  const handleMenuNavigation = (menuItem) => {
    switch (menuItem) {
      case "balance":
        navigate("/admin_balance")
        break
      case "transacciones":
        navigate("/admin_transacciones")
        break
      case "cotizaciones":
        navigate("/admin_cotizaciones")
        break
      case "facturas-notas":
        navigate("/admin_facturacion")
        break
      case "cuentas-cobrar":
        navigate("/admin_cuentas_cobrar")
        break
      case "cuentas-pagar":
        navigate("/admin_cuentas_pagar")
        break
      case "caja-chica":
        navigate("/admin_caja_chica")
        break
      default:
        break
    }
  }

  const opcionesTiempo = ["Mes", "Trimestre", "Año", "Histórico"]
  const cuentasPorCategoria = categorias.reduce(
    (acc, cat) => {
      acc[cat.descripcion] = [
        "Todas",
        ...cuentas.filter((c) => c.categoria.id === cat.id && c.id !== REPOSICION_ID).map((c) => c.nombre),
      ]
      return acc
    },
    { Todas: ["Todas"] },
  )

  return (
    <>
      <Header />
      {isLoading && (
        <div className="adminbalance-loading">
          <div className="spinner"></div>
          <p>Cargando datos del balance...</p>
        </div>
      )}
      <main className="adminbalance-main-content">
        <div className="adminbalance-container">
          <section className="adminbalance-sidebar">
            <div className="adminbalance-sidebar-header">
              <h3 className="adminbalance-sidebar-title">Administración</h3>
            </div>
            <div className="adminbalance-sidebar-menu">
              <div
                className="adminbalance-menu-item adminbalance-menu-item-active"
                onClick={() => handleMenuNavigation("balance")}
              >
                Balance
              </div>
              <div className="adminbalance-menu-item" onClick={() => handleMenuNavigation("transacciones")}>
                Transacciones
              </div>
              <div className="adminbalance-menu-item" onClick={() => handleMenuNavigation("cotizaciones")}>
                Cotizaciones
              </div>
              <div className="adminbalance-menu-item" onClick={() => handleMenuNavigation("facturas-notas")}>
                Facturas/Notas
              </div>
              <div className="adminbalance-menu-item" onClick={() => handleMenuNavigation("cuentas-cobrar")}>
                Cuentas por Cobrar
              </div>
              <div className="adminbalance-menu-item" onClick={() => handleMenuNavigation("cuentas-pagar")}>
                Cuentas por Pagar
              </div>
              <div className="adminbalance-menu-item" onClick={() => handleMenuNavigation("caja-chica")}>
                Caja chica
              </div>
            </div>
          </section>
          <section className="adminbalance-content-panel">
            <div className="adminbalance-header">
              <h3 className="adminbalance-page-title">Balance</h3>
              <div className="adminbalance-header-actions">
                <div className="adminbalance-filtro-tiempo">
                  <select
                    value={filtros.tiempoGrafico}
                    onChange={(e) => handleFiltroTiempoChange(e.target.value)}
                    className="adminbalance-filtro-select"
                  >
                    {opcionesTiempo.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <p className="adminbalance-subtitle">Gestión de ingresos y generación de reportes contables</p>
            <div className="adminbalance-resumen-grid">
              <div className="adminbalance-resumen-card adminbalance-ingresos">
                <h4 className="adminbalance-resumen-titulo">Total Ingresos</h4>
                <p className="adminbalance-resumen-monto">
                  ${balanceData.resumenContable.totalIngresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="adminbalance-resumen-card adminbalance-gastos">
                <h4 className="adminbalance-resumen-titulo">Total Gastos</h4>
                <p className="adminbalance-resumen-monto">
                  ${balanceData.resumenContable.totalGastos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="adminbalance-resumen-card adminbalance-utilidad">
                <h4 className="adminbalance-resumen-titulo">Utilidad o Pérdida</h4>
                <p className="adminbalance-resumen-monto">
                  ${balanceData.resumenContable.utilidadPerdida.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {balanceData.graficoMensual.length > 0 && (
              <div className="adminbalance-chart-card">
                <h4 className="adminbalance-chart-title">{obtenerTituloGrafico()}</h4>
                <div className="adminbalance-chart-container">
                  <Bar data={graficoBalanceData} options={chartOptions} />
                </div>
              </div>
            )}
            <div className="adminbalance-tables-grid">
              <div className="adminbalance-table-card">
                <h4 className="adminbalance-table-title">Acumulado de Cuentas</h4>
                <div className="adminbalance-table-filters">
                  <select
                    value={filtros.categoriaSeleccionada}
                    onChange={(e) => handleCategoriaChange(e.target.value)}
                    className="adminbalance-table-select"
                  >
                    <option value="Todas">Todas</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.descripcion}>
                        {cat.descripcion}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filtros.cuentaSeleccionada}
                    onChange={(e) => handleCuentaChange(e.target.value)}
                    className="adminbalance-table-select"
                  >
                    {cuentasPorCategoria[filtros.categoriaSeleccionada || "Todas"].map((cuenta) => (
                      <option key={cuenta} value={cuenta}>
                        {cuenta}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="adminbalance-table-container">
                  <table className="adminbalance-table">
                    <thead>
                      <tr>
                        <th>Categoría</th>
                        <th>Cuenta</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceData.acumuladoCuentas.length > 0 ? (
                        balanceData.acumuladoCuentas
                          .filter(
                            (ac) =>
                              filtros.categoriaSeleccionada === "Todas" ||
                              ac.categoria === filtros.categoriaSeleccionada,
                          )
                          .filter(
                            (ac) => filtros.cuentaSeleccionada === "Todas" || ac.cuenta === filtros.cuentaSeleccionada,
                          )
                          .map((ac, index) => (
                            <tr key={index}>
                              <td>{ac.categoria}</td>
                              <td>{ac.cuenta}</td>
                              <td>${ac.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="adminbalance-no-data">
                            No hay datos disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="adminbalance-table-card">
                <h4 className="adminbalance-table-title">Equipos vendidos</h4>
                <div className="adminbalance-table-container">
                  <table className="adminbalance-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>N° Equipos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceData.equiposVendidos.length > 0 ? (
                        balanceData.equiposVendidos.map((equipo, index) => (
                          <tr key={index}>
                            <td>{equipo.cliente}</td>
                            <td>{equipo.fechaPago}</td>
                            <td>{equipo.numeroEquipos}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="adminbalance-no-data">
                            No hay equipos vendidos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="adminbalance-reporte-button-container">
              <button className="adminbalance-btn adminbalance-btn-reporte" onClick={handleGenerarReporte}>
                Crear reporte
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default AdminBalance
