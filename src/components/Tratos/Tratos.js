"use client"

import { useState, useEffect } from "react"
import "./Tratos.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import expandIcon from '../../assets/icons/expandir.png';
import contractIcon from '../../assets/icons/contraer.png';
import calendarFilter from '../../assets/icons/calendario3.png';
import deploy from '../../assets/icons/desplegar.png';
import addActivity from '../../assets/icons/agregar.png';
import activityCall from '../../assets/icons/llamada.png';
import activityMeeting from '../../assets/icons/reunion.png';
import activityTask from '../../assets/icons/tarea.png';
import neglectedTreatment from '../../assets/icons/desatendido.png';

// Importar react-datepicker y su CSS
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { format } from "date-fns" // Para formatear las fechas
import { useNavigate } from "react-router-dom"

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token")

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  return response
}

const TratoCard = ({ trato, onDragStart, onDragEnd, onTratoClick }) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    e.dataTransfer.setData("tratoId", trato.id.toString())
    e.dataTransfer.effectAllowed = "move"
    onDragStart && onDragStart(trato)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    onDragEnd && onDragEnd()
  }

  const handleCardClick = (e) => {
    // Evitar navegación si se está arrastrando o si se hizo clic en el icono de actividad
    if (!isDragging && !e.target.closest(".trato-activity-icon")) {
      onTratoClick && onTratoClick(trato)
    }
  }

  const getActivityIcon = () => {
    if (trato.isNeglected) {
      return <img src={neglectedTreatment || "/placeholder.svg"} alt="Trato Desatendido" className="activity-icon" />
    } else {
      return (
        <img
          src={addActivity || "/placeholder.svg"}
          alt="Agregar Actividad"
          className="activity-icon add-activity-btn"
          onClick={(e) => {
            e.stopPropagation() // Evitar que se active el clic de la tarjeta
            Swal.fire("Agregar Actividad", "Modal para agregar actividad en desarrollo", "info")
          }}
        />
      )
    }
  }

  return (
    <div
      className={`trato-card ${isDragging ? "dragging" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      style={{ cursor: isDragging ? "grabbing" : "pointer" }}
    >
      <div className="trato-actions">
        <div className="trato-activity-icon">{getActivityIcon()}</div>
      </div>
      <div className="trato-header">
        <h4 className="trato-nombre">{trato.nombre}</h4>
      </div>
      <div className="trato-details">
        <p>
          <strong>Propietario:</strong> {trato.propietario}
        </p>
        <p>
          <strong>Fecha de cierre:</strong> {trato.fechaCierre}
        </p>
        <p>
          <strong>Nombre empresa:</strong> {trato.empresa}
        </p>
        <p>
          <strong>No. Trato:</strong> {trato.numero}
        </p>
      </div>
      {trato.ingresoEsperado && (
        <div className="trato-ingreso">
          <strong>Ingresos esperados $</strong> {trato.ingresoEsperado}
        </div>
      )}
    </div>
  )
}

const Tratos = () => {
  const navigate = useNavigate()
  const [expandedColumns, setExpandedColumns] = useState([])
  const [selectedUser, setSelectedUser] = useState("Todos los usuarios")
  const [dateRangeText, setDateRangeText] = useState("Rango de fecha del trato") // Cambiado el nombre para evitar confusión con el estado del DatePicker
  const [columnas, setColumnas] = useState([])
  const [draggedTrato, setDraggedTrato] = useState(null)

  // Nuevos estados para el rango de fechas
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  useEffect(() => {
    const columnasData = [
      {
        id: 1,
        nombre: "Clasificación",
        color: "#E180F4",
        className: "clasificacion",
        tratos: [
          {
            id: 1,
            nombre: "Nombre Trato 1",
            propietario: "Propietario A",
            fechaCierre: "2025-06-30",
            empresa: "Empresa X",
            numero: "TRT-001",
            isNeglected: false,
          },
        ],
        count: 1,
      },
      {
        id: 2,
        nombre: "Primer contacto",
        color: "#C680F4",
        className: "primer-contacto",
        tratos: [],
        count: 0,
      },
      {
        id: 3,
        nombre: "Envío de información",
        color: "#AB80F4",
        className: "envio-informacion",
        tratos: [
          {
            id: 2,
            nombre: "Nombre Trato 2",
            propietario: "Propietario B",
            fechaCierre: "2025-07-15",
            empresa: "Empresa Y",
            numero: "TRT-002",
            isNeglected: true,
          },
        ],
        count: 1,
      },
      {
        id: 4,
        nombre: "Reunión",
        color: "#9280F4",
        className: "reunion",
        tratos: [],
        count: 0,
      },
      {
        id: 5,
        nombre: "Cotización Propuesta/Precio",
        color: "#8098F4",
        className: "cotizacion-propuesta",
        tratos: [
          {
            id: 3,
            nombre: "Nombre Trato 3",
            propietario: "Propietario C",
            fechaCierre: "2025-08-01",
            empresa: "Empresa Z",
            numero: "TRT-003",
            isNeglected: false,
          },
          {
            id: 4,
            nombre: "Nombre Trato 4",
            propietario: "Propietario D",
            fechaCierre: "2025-08-10",
            empresa: "Empresa W",
            numero: "TRT-004",
            isNeglected: false,
          },
        ],
        count: 2,
      },
      {
        id: 6,
        nombre: "Negociación/Revisión",
        color: "#80C0F4",
        className: "negociacion-revision",
        tratos: [
          {
            id: 5,
            nombre: "Nombre Trato 5",
            propietario: "Propietario E",
            fechaCierre: "2025-09-01",
            empresa: "Empresa V",
            numero: "TRT-005",
            ingresoEsperado: "5,000",
            isNeglected: false,
          },
        ],
        count: 1,
      },
      {
        id: 7,
        nombre: "Cerrado ganado",
        color: "#69ED95",
        className: "cerrado-ganado",
        tratos: [
          {
            id: 6,
            nombre: "Nombre Trato 6",
            propietario: "Propietario F",
            fechaCierre: "2025-09-15",
            empresa: "Empresa U",
            numero: "TRT-006",
            isNeglected: false,
          },
          {
            id: 7,
            nombre: "Nombre Trato 7",
            propietario: "Propietario G",
            fechaCierre: "2025-09-20",
            empresa: "Empresa T",
            numero: "TRT-007",
            isNeglected: false,
          },
        ],
        count: 2,
      },
      {
        id: 8,
        nombre: "Respuesta por correo",
        color: "#EFD47B",
        className: "respuesta-correo",
        tratos: [],
        count: 0,
      },
      {
        id: 9,
        nombre: "Interes futúro",
        color: "#FFBC79",
        className: "interes-futuro",
        tratos: [
          {
            id: 8,
            nombre: "Nombre Trato 8",
            propietario: "Propietario H",
            fechaCierre: "2025-10-01",
            empresa: "Empresa S",
            numero: "TRT-008",
            isNeglected: false,
          },
        ],
        count: 1,
      },
      {
        id: 10,
        nombre: "Cerrado perdido",
        color: "#FA8585",
        className: "cerrado-perdido",
        tratos: [
          {
            id: 9,
            nombre: "Nombre Trato 9",
            propietario: "Propietario I",
            fechaCierre: "2025-10-10",
            empresa: "Empresa R",
            numero: "TRT-009",
            isNeglected: false,
          },
          {
            id: 10,
            nombre: "Nombre Trato 10",
            propietario: "Propietario J",
            fechaCierre: "2025-10-15",
            empresa: "Empresa Q",
            numero: "TRT-010",
            isNeglected: false,
          },
        ],
        count: 2,
      },
    ]

    setColumnas(columnasData)
  }, [])

  // Efecto para actualizar el texto del rango de fechas cuando cambian startDate o endDate
  useEffect(() => {
    if (startDate && endDate) {
      setDateRangeText(`${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`)
    } else if (startDate) {
      setDateRangeText(`${format(startDate, "dd/MM/yyyy")} - Fin de rango`)
    } else {
      setDateRangeText("Rango de fecha del trato")
    }
  }, [startDate, endDate])

  const handleToggleColumn = (columnId) => {
    setExpandedColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId)
      } else {
        return [...prev, columnId]
      }
    })
  }

  const handleCrearTrato = () => {
    Swal.fire({
      title: "Crear Trato",
      text: "Funcionalidad en desarrollo",
      icon: "info",
    })
  }

  const handleDragStart = (trato) => {
    setDraggedTrato(trato)
  }

  const handleDragEnd = () => {
    setDraggedTrato(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault()

    const tratoId = Number.parseInt(e.dataTransfer.getData("tratoId"))
    if (isNaN(tratoId)) {
      console.error("ID del trato no válido al soltar:", e.dataTransfer.getData("tratoId"))
      return
    }

    setColumnas((prevColumnas) => {
      const newColumnas = [...prevColumnas]
      let sourceTrato = null
      let sourceColumnIndex = -1
      let targetColumnIndex = -1

      for (let i = 0; i < newColumnas.length; i++) {
        const columna = newColumnas[i]
        const foundTrato = columna.tratos.find((t) => t.id === tratoId)
        if (foundTrato) {
          sourceTrato = foundTrato
          sourceColumnIndex = i
        }
        if (columna.id === targetColumnId) {
          targetColumnIndex = i
        }
        if (sourceTrato && targetColumnIndex !== -1) break
      }

      if (
        !sourceTrato ||
        sourceColumnIndex === -1 ||
        targetColumnIndex === -1 ||
        sourceColumnIndex === targetColumnIndex
      ) {
        return prevColumnas
      }

      const updatedSourceColumn = { ...newColumnas[sourceColumnIndex] }
      const updatedTargetColumn = { ...newColumnas[targetColumnIndex] }

      updatedSourceColumn.tratos = updatedSourceColumn.tratos.filter((trato) => trato.id !== tratoId)
      updatedSourceColumn.count = updatedSourceColumn.tratos.length

      updatedTargetColumn.tratos = [...updatedTargetColumn.tratos, sourceTrato]
      updatedTargetColumn.count = updatedTargetColumn.tratos.length

      newColumnas[sourceColumnIndex] = updatedSourceColumn
      newColumnas[targetColumnIndex] = updatedTargetColumn

      return newColumnas
    })
  }

  const onChangeDateRange = (dates) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  const handleTratoClick = (trato) => {
    navigate(`/detallestrato`)
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="tratos-container">
          <div className="tratos-controls">
            <div className="tratos-filters">
              <div className="filter-dropdown">
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="user-select">
                  <option value="Todos los usuarios">Todos los usuarios</option>
                  <option value="Usuario 1">Usuario 1</option>
                  <option value="Usuario 2">Usuario 2</option>
                </select>
                <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="icon-deploy" />
              </div>

              <div className="date-range-container">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={onChangeDateRange}
                  dateFormat="dd/MM/yyyy"
                  customInput={
                    <button className="date-filter-btn">
                      <span>{dateRangeText}</span>
                      <div>
                        <img
                          src={calendarFilter || "/placeholder.svg"}
                          alt="Filtro de Calendario"
                          className="icon-calendar"
                        />
                      </div>
                    </button>
                  }
                />
              </div>
            </div>

            <button className="btn-crear-trato" onClick={handleCrearTrato}>
              Crear Trato
            </button>
          </div>

          <div className="kanban-board">
            {columnas.map((columna) => (
              <div
                key={columna.id}
                className={`kanban-column ${expandedColumns.includes(columna.id) ? "expanded" : ""}`}
              >
                <div className={`column-color-line ${columna.className}-line`}></div>
                <div className={`column-header ${columna.className}`}>
                  <div className="column-title">
                    <span className="vertical-text">{columna.nombre}</span>
                  </div>
                  <div className="column-count">{columna.count}</div>
                </div>

                <div className="column-content" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, columna.id)}>
                  {columna.tratos.length > 0 ? (
                    columna.tratos.map((trato) => (
                      <TratoCard
                        key={trato.id}
                        trato={trato}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onTratoClick={handleTratoClick}
                      />
                    ))
                  ) : (
                    <div className="empty-column">
                      <p>No se encontró ningún trato</p>
                    </div>
                  )}
                </div>

                <div className="column-navigation">
                  <span className="nav-icon" onClick={() => handleToggleColumn(columna.id)}>
                    {expandedColumns.includes(columna.id) ? (
                      <img src={expandIcon || "/placeholder.svg"} alt="Expandir" className="icon" />
                    ) : (
                      <img src={contractIcon || "/placeholder.svg"} alt="Contraer" className="icon" />
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

export default Tratos
