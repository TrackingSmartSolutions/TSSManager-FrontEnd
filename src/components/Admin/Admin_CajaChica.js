import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Admin_CajaChica.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import jsPDF from "jspdf"
import { API_BASE_URL } from "../Config/Config"

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

const AdminCajaChica = () => {
  const navigate = useNavigate()
  const [transaccionesEfectivo, setTransaccionesEfectivo] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [resumenCajaChica, setResumenCajaChica] = useState({
    totalIngresos: 0,
    totalGastos: 0,
    utilidadPerdida: 0,
  })
  const [categorias, setCategorias] = useState([])
  const [cuentas, setCuentas] = useState([])
  const formasPago = [{ value: "01", label: "Efectivo" }]

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [transaccionesResp, categoriasResp, cuentasResp] = await Promise.all([
          fetchWithToken(`${API_BASE_URL}/transacciones`),
          fetchWithToken(`${API_BASE_URL}/categorias`),
          fetchWithToken(`${API_BASE_URL}/cuentas`),
        ])

        const transaccionesFiltradas = transaccionesResp.filter(
          (t) =>
            t.formaPago === "01" &&
            (t.tipo === "INGRESO" ||
              (t.tipo === "GASTO" && t.notas === "Transacción generada desde Cuentas por Pagar")),
        )

        setTransaccionesEfectivo(transaccionesFiltradas)
        setCategorias(categoriasResp)
        setCuentas(cuentasResp)
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const updateTransacciones = async () => {
      try {
        const transaccionesResp = await fetchWithToken(`${API_BASE_URL}/transacciones`)
        const transaccionesFiltradas = transaccionesResp.filter((t) => t.formaPago === "01")
        setTransaccionesEfectivo(transaccionesFiltradas)
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron actualizar los datos",
        })
      }
    }

    window.addEventListener("transaccionUpdated", updateTransacciones)
    return () => window.removeEventListener("transaccionUpdated", updateTransacciones)
  }, [])

  useEffect(() => {
    const calcularResumen = () => {
      const totalIngresos = transaccionesEfectivo
        .filter((t) => t.tipo === "INGRESO")
        .reduce((sum, t) => sum + t.monto, 0)
      const totalGastos = transaccionesEfectivo.filter((t) => t.tipo === "GASTO").reduce((sum, t) => sum + t.monto, 0)
      const utilidadPerdida = totalIngresos - totalGastos

      setResumenCajaChica({ totalIngresos, totalGastos, utilidadPerdida })
    }
    calcularResumen()
  }, [transaccionesEfectivo])

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
      case "facturacion":
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

  const calcularSaldoAcumulado = () => {
    let saldoAcumulado = 0
    return transaccionesEfectivo
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .map((transaccion) => {
        if (transaccion.tipo === "INGRESO") saldoAcumulado += transaccion.monto
        else saldoAcumulado -= transaccion.monto
        return { ...transaccion, saldoAcumulado }
      })
  }

  const transaccionesConSaldo = calcularSaldoAcumulado()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  // Función para dividir transacciones en chunks
  const dividirTransaccionesEnChunks = (datos, filasPorPagina = 20) => {
    const chunks = []
    for (let i = 0; i < datos.length; i += filasPorPagina) {
      chunks.push(datos.slice(i, i + filasPorPagina))
    }
    return chunks
  }

  const handleGenerarReporte = async () => {
    try {
      // Mostrar loading
      Swal.fire({
        title: "Generando reporte...",
        text: "Por favor espere mientras se genera el PDF",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // Preparar datos formateados
      const transaccionesFormateadas = transaccionesConSaldo.map((transaccion) => ({
        fecha: new Date(transaccion.fecha).toLocaleDateString("es-MX"),
        cuenta: transaccion.cuenta.nombre,
        nota: transaccion.notas || "-",
        gastos: transaccion.tipo === "GASTO" ? formatCurrency(transaccion.monto) : "-",
        ingresos: transaccion.tipo === "INGRESO" ? formatCurrency(transaccion.monto) : "-",
        saldo: formatCurrency(transaccion.saldoAcumulado),
      }))

      // Dividir transacciones en chunks si son muchas
      const chunksTransacciones = dividirTransaccionesEnChunks(transaccionesFormateadas, 18)

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
      pdf.text("REPORTE DE CAJA CHICA", pageWidth / 2, currentY, { align: "center" })
      currentY += 10

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Fecha de generación: ${fechaActual}`, pageWidth / 2, currentY, { align: "center" })
      currentY += 15

      // Resumen financiero
      checkPageBreak(40)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("RESUMEN FINANCIERO", margin, currentY)
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
      pdf.text(formatCurrency(resumenCajaChica.totalIngresos), margin + boxWidth / 2, currentY + 14, {
        align: "center",
      })

      // Total Gastos
      pdf.setFillColor(255, 232, 232)
      pdf.rect(margin + boxWidth + 10, currentY, boxWidth, boxHeight, "F")
      pdf.setFontSize(10)
      pdf.text("Total Gastos", margin + boxWidth + 10 + boxWidth / 2, currentY + 6, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(formatCurrency(resumenCajaChica.totalGastos), margin + boxWidth + 10 + boxWidth / 2, currentY + 14, {
        align: "center",
      })

      // Utilidad
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin + 2 * boxWidth + 20, currentY, boxWidth, boxHeight, "F")
      pdf.setFontSize(10)
      pdf.text("Utilidad", margin + 2 * boxWidth + 20 + boxWidth / 2, currentY + 6, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(
        formatCurrency(resumenCajaChica.utilidadPerdida),
        margin + 2 * boxWidth + 20 + boxWidth / 2,
        currentY + 14,
        { align: "center" },
      )

      currentY += boxHeight + 20

      // Función para crear tabla de transacciones en PDF
      const crearTablaTransacciones = (datos, titulo, isLastTable = false) => {
        if (!datos || datos.length === 0) {
          checkPageBreak(30)
          pdf.setFontSize(14)
          pdf.setFont("helvetica", "bold")
          pdf.text(titulo, margin, currentY)
          currentY += 10

          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")
          pdf.text("No hay transacciones en efectivo registradas", margin, currentY)
          currentY += 15
          return
        }

        checkPageBreak(20)
        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text(titulo, margin, currentY)
        currentY += 10

        // Configurar tabla
        const headers = ["Fecha", "Cuenta", "Nota", "Gastos", "Ingresos", "Saldo"]
        const colWidths = [25, 35, 40, 25, 25, 25] // Anchos de columna en mm
        const rowHeight = 8

        // Headers
        checkPageBreak(rowHeight + 5)
        pdf.setFillColor(245, 245, 245)
        pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, "F")

        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        let xPosition = margin
        headers.forEach((header, index) => {
          pdf.text(header, xPosition + 2, currentY + 5)
          xPosition += colWidths[index]
        })
        currentY += rowHeight

        // Datos
        pdf.setFont("helvetica", "normal")
        datos.forEach((fila, index) => {
          checkPageBreak(rowHeight)

          // Alternar color de fondo
          if (index % 2 === 1) {
            pdf.setFillColor(249, 249, 249)
            pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, "F")
          }

          xPosition = margin
          const valores = [fila.fecha, fila.cuenta, fila.nota, fila.gastos, fila.ingresos, fila.saldo]

          valores.forEach((valor, colIndex) => {
            // Ajustar color del texto para gastos e ingresos
            if (colIndex === 3 && valor !== "-") {
              // Gastos en rojo
              pdf.setTextColor(139, 38, 53)
            } else if (colIndex === 4 && valor !== "-") {
              // Ingresos en verde
              pdf.setTextColor(45, 90, 45)
            } else if (colIndex === 5) {
              // Saldo en negrita
              pdf.setFont("helvetica", "bold")
            } else {
              pdf.setTextColor(0, 0, 0)
              pdf.setFont("helvetica", "normal")
            }

            if (colIndex >= 3) {
              pdf.text(valor.toString(), xPosition + colWidths[colIndex] - 2, currentY + 5, { align: "right" })
            } else {
              let textoMostrar = valor.toString()
              if (textoMostrar.length > 15 && colIndex === 2) {
                textoMostrar = textoMostrar.substring(0, 12) + "..."
              }
              pdf.text(textoMostrar, xPosition + 2, currentY + 5)
            }
            xPosition += colWidths[colIndex]
          })

          pdf.setTextColor(0, 0, 0)
          pdf.setFont("helvetica", "normal")
          currentY += rowHeight
        })

        if (!isLastTable) {
          currentY += 10
        }
      }

      // Agregar tablas de transacciones
      if (chunksTransacciones.length > 0) {
        chunksTransacciones.forEach((chunk, index) => {
          const titulo =
            index === 0 ? "DETALLE DE TRANSACCIONES" : `DETALLE DE TRANSACCIONES (Continuación ${index + 1})`
          const isLast = index === chunksTransacciones.length - 1
          crearTablaTransacciones(chunk, titulo, isLast)
        })
      } else {
        crearTablaTransacciones([], "DETALLE DE TRANSACCIONES", true)
      }

      const fechaArchivo = new Date().toISOString().split("T")[0]
      const nombreArchivo = `Caja_Chica_${fechaArchivo}.pdf`

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

  return (
    <>
      <Header />
      {isLoading && (
        <div className="cajachica-loading">
          <div className="spinner"></div>
          <p>Cargando datos de caja chica...</p>
        </div>
      )}
      <main className="cajachica-main-content">
        <div className="cajachica-container">
          <section className="cajachica-sidebar">
            <div className="cajachica-sidebar-header">
              <h3 className="cajachica-sidebar-title">Administración</h3>
            </div>
            <div className="cajachica-sidebar-menu">
              <div className="cajachica-menu-item" onClick={() => handleMenuNavigation("balance")}>
                Balance
              </div>
              <div className="cajachica-menu-item" onClick={() => handleMenuNavigation("transacciones")}>
                Transacciones
              </div>
              <div className="cajachica-menu-item" onClick={() => handleMenuNavigation("cotizaciones")}>
                Cotizaciones
              </div>
              <div className="cajachica-menu-item" onClick={() => handleMenuNavigation("facturacion")}>
                Facturas/Notas
              </div>
              <div className="cajachica-menu-item" onClick={() => handleMenuNavigation("cuentas-cobrar")}>
                Cuentas por Cobrar
              </div>
              <div className="cajachica-menu-item" onClick={() => handleMenuNavigation("cuentas-pagar")}>
                Cuentas por Pagar
              </div>
              <div
                className="cajachica-menu-item cajachica-menu-item-active"
                onClick={() => handleMenuNavigation("caja-chica")}
              >
                Caja chica
              </div>
            </div>
          </section>
          <section className="cajachica-content-panel">
            <div className="cajachica-header">
              <div className="cajachica-header-info">
                <h3 className="cajachica-page-title">Caja Chica</h3>
                <p className="cajachica-subtitle">Gestión de transacciones en Efectivo</p>
              </div>
            </div>
            <div className="cajachica-resumen-grid">
              <div className="cajachica-resumen-card cajachica-ingresos">
                <h4 className="cajachica-resumen-titulo">Total Ingresos</h4>
                <p className="cajachica-resumen-monto">{formatCurrency(resumenCajaChica.totalIngresos)}</p>
              </div>
              <div className="cajachica-resumen-card cajachica-gastos">
                <h4 className="cajachica-resumen-titulo">Total Gastos</h4>
                <p className="cajachica-resumen-monto">{formatCurrency(resumenCajaChica.totalGastos)}</p>
              </div>
              <div className="cajachica-resumen-card cajachica-utilidad">
                <h4 className="cajachica-resumen-titulo">Utilidad o Pérdida</h4>
                <p className="cajachica-resumen-monto">{formatCurrency(resumenCajaChica.utilidadPerdida)}</p>
              </div>
            </div>
            <div className="cajachica-table-card">
              <h4 className="cajachica-table-title">Transacciones en Efectivo</h4>
              <div className="cajachica-table-container">
                <table className="cajachica-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cuenta</th>
                      <th>Nota</th>
                      <th>Gastos</th>
                      <th>Ingresos</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaccionesConSaldo.length > 0 ? (
                      transaccionesConSaldo.map((transaccion) => (
                        <tr key={transaccion.id}>
                          <td>{new Date(transaccion.fecha).toLocaleDateString("es-MX")}</td>
                          <td>{transaccion.cuenta.nombre}</td>
                          <td>{transaccion.notas || "-"}</td>
                          <td className="cajachica-gasto">
                            {transaccion.tipo === "GASTO" ? formatCurrency(transaccion.monto) : "-"}
                          </td>
                          <td className="cajachica-ingreso">
                            {transaccion.tipo === "INGRESO" ? formatCurrency(transaccion.monto) : "-"}
                          </td>
                          <td className="cajachica-saldo">{formatCurrency(transaccion.saldoAcumulado)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="cajachica-no-data">
                          No hay transacciones en efectivo registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="cajachica-reporte-button-container">
              <button className="cajachica-btn cajachica-btn-reporte" onClick={handleGenerarReporte}>
                Crear Reporte
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default AdminCajaChica
