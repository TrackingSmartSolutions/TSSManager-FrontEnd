import { useState } from "react"
import "./Calendario.css"
import Header from "../Header/Header"
import { API_BASE_URL } from "../Config/Config";

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

const Calendario = () => {
  const [currentView, setCurrentView] = useState("Semana") // Vista por defecto: Semana
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedUser, setSelectedUser] = useState("Todos los usuarios")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)

  const userRol = localStorage.getItem("userRol") || "EMPLEADO"
  const currentUser = localStorage.getItem("userName") || "Usuario"

  // Usuarios ficticios para el filtro (solo para administradores)
  const users = ["Todos los usuarios", "Juan Pérez", "María García", "Carlos López", "Ana Martínez"]

  // Eventos ficticios
  const events = [
    {
      id: 1,
      title: "AIVEL NAVA - Reunión",
      type: "Reunión",
      date: "2025-04-12",
      time: "13:00",
      endTime: "14:00",
      assignedTo: "Juan Pérez",
      company: "AIVEL NAVA",
      deal: "Trato AIVEL-001",
      modality: "Virtual",
      medium: "Zoom",
      description: "Reunión de seguimiento del proyecto",
      meetingLink: "https://zoom.us/j/123456789",
      color: "#3b82f6",
    },
    {
      id: 2,
      title: "Nissan Mamiya Gildart - Llamada",
      type: "Llamada",
      date: "2025-04-17",
      time: "11:00",
      endTime: "11:30",
      assignedTo: "María García",
      company: "Nissan Mamiya Gildart",
      deal: "Trato NMG-002",
      modality: "Telefónica",
      medium: "Teléfono",
      description: "Llamada de prospección inicial",
      color: "#10b981",
    },
    {
      id: 3,
      title: "Recarga - 123456789 - ABC123",
      type: "Recarga",
      date: "2025-04-15",
      time: "09:00",
      endTime: "09:15",
      simNumber: "123456789",
      imei: "ABC123",
      rechargeAmount: "$500.00",
      color: "#f59e0b",
    },
    {
      id: 4,
      title: "Cuenta por Cobrar - REPIBA-01-01 - REPIBA",
      type: "Cuenta por Cobrar",
      date: "2025-04-20",
      time: "09:00",
      endTime: "09:15",
      accountNumber: "REPIBA-01-01",
      client: "REPIBA",
      status: "Pendiente",
      scheme: "Mensual",
      equipmentCount: 15,
      concept: "Servicio de rastreo GPS",
      color: "#ef4444",
    },
    {
      id: 5,
      title: "Cuenta por Pagar - personal-01 - personal",
      type: "Cuenta por Pagar",
      date: "2025-04-18",
      time: "09:00",
      endTime: "09:15",
      accountNumber: "personal-01",
      account: "personal",
      amount: "$2,500.00",
      paymentMethod: "Transferencia",
      status: "Programado",
      note: "Pago de nómina quincenal",
      color: "#8b5cf6",
    },
  ]

  // Filtrar eventos según el usuario seleccionado y rol
  const getFilteredEvents = () => {
    let filtered = events

    // Filtrar por rol - solo administradores ven recargas y cuentas
    if (userRol !== "ADMINISTRADOR") {
      filtered = filtered.filter((event) => !["Recarga", "Cuenta por Cobrar", "Cuenta por Pagar"].includes(event.type))
    }

    // Filtrar por usuario seleccionado
    if (selectedUser !== "Todos los usuarios") {
      filtered = filtered.filter(
        (event) =>
          event.assignedTo === selectedUser ||
          (event.type === "Recarga" && userRol === "ADMINISTRADOR") ||
          (["Cuenta por Cobrar", "Cuenta por Pagar"].includes(event.type) && userRol === "ADMINISTRADOR"),
      )
    }

    return filtered
  }

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return getFilteredEvents().filter((event) => event.date === dateStr)
  }

  // Obtener eventos para la semana actual
  const getEventsForWeek = (startDate) => {
    const events = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dayEvents = getEventsForDate(date)
      events.push(...dayEvents)
    }
    return events
  }

  // Navegar fechas
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)

    switch (currentView) {
      case "Día":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1))
        break
      case "Semana":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7))
        break
      case "Mes":
        newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1))
        break
    }

    setCurrentDate(newDate)
  }

  // Obtener inicio de semana (lunes)
  const getWeekStart = (date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    return start
  }

  // Obtener días del mes
  const getMonthDays = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = getWeekStart(firstDay)

    const days = []
    const current = new Date(startDate)

    // Generar 42 días (6 semanas) para mostrar el mes completo
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  // Formatear fecha para mostrar
  const formatDate = (date) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }
    return date.toLocaleDateString("es-ES", options)
  }

  // Formatear mes y año
  const formatMonthYear = (date) => {
    const options = { year: "numeric", month: "long" }
    return date.toLocaleDateString("es-ES", options)
  }

  // Formatear semana
  const formatWeek = (startDate) => {
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)

    const startOptions = { month: "long", day: "numeric" }
    const endOptions = { month: "long", day: "numeric", year: "numeric" }

    return `${startDate.toLocaleDateString("es-ES", startOptions)} - ${endDate.toLocaleDateString("es-ES", endOptions)}`
  }

  // Abrir modal de evento
  const openEventModal = (event) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  // Cerrar modal de evento
  const closeEventModal = () => {
    setSelectedEvent(null)
    setIsEventModalOpen(false)
  }

  // Generar horas para vista de día y semana
  const generateHours = () => {
    const hours = []
    for (let i = 8; i <= 19; i++) {
      hours.push(`${i}:00`)
    }
    return hours
  }

  const hours = generateHours()

  return (
    <>
      <Header />
      <div className="ts-calendar-container">
        {/* Header del calendario */}
        <div className="ts-calendar-header">
          <div className="ts-calendar-header-left">
            {userRol === "ADMINISTRADOR" && (
              <div className="ts-calendar-user-filter">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="ts-calendar-select"
                >
                  {users.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="ts-calendar-header-center">
            <div className="ts-calendar-view-buttons">
              {["Día", "Semana", "Mes"].map((view) => (
                <button
                  key={view}
                  className={`ts-calendar-view-btn ${currentView === view ? "active" : ""}`}
                  onClick={() => setCurrentView(view)}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="ts-calendar-header-right">
            <button className="ts-calendar-create-btn">Crear Actividad</button>
          </div>
        </div>

        {/* Navegación de fechas */}
        <div className="ts-calendar-navigation">
          <button className="ts-calendar-nav-btn" onClick={() => navigateDate("prev")}>
            ‹
          </button>
          <h2 className="ts-calendar-title">
            {currentView === "Día" && formatDate(currentDate)}
            {currentView === "Semana" && formatWeek(getWeekStart(currentDate))}
            {currentView === "Mes" && formatMonthYear(currentDate)}
          </h2>
          <button className="ts-calendar-nav-btn" onClick={() => navigateDate("next")}>
            ›
          </button>
        </div>

        {/* Vista del calendario */}
        <div className="ts-calendar-content">
          {/* Vista Mensual */}
          {currentView === "Mes" && (
            <div className="ts-calendar-month-view">
              <div className="ts-calendar-month-header">
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => (
                  <div key={day} className="ts-calendar-month-day-header">
                    {day}
                  </div>
                ))}
              </div>
              <div className="ts-calendar-month-grid">
                {getMonthDays(currentDate).map((day, index) => {
                  const dayEvents = getEventsForDate(day)
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                  const isToday = day.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={index}
                      className={`ts-calendar-month-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""}`}
                    >
                      <div className="ts-calendar-day-number">{day.getDate()}</div>
                      <div className="ts-calendar-day-events">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="ts-calendar-month-event"
                            style={{ backgroundColor: event.color }}
                            onClick={() => openEventModal(event)}
                          >
                            <div className="ts-calendar-event-time">{event.time}</div>
                            <div className="ts-calendar-event-title">{event.title}</div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="ts-calendar-more-events">+{dayEvents.length - 3} más</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Vista Semanal */}
          {currentView === "Semana" && (
            <div className="ts-calendar-week-view">
              <div className="ts-calendar-week-header">
                <div className="ts-calendar-time-column"></div>
                {Array.from({ length: 7 }, (_, i) => {
                  const day = new Date(getWeekStart(currentDate))
                  day.setDate(day.getDate() + i)
                  const isToday = day.toDateString() === new Date().toDateString()

                  return (
                    <div key={i} className={`ts-calendar-week-day-header ${isToday ? "today" : ""}`}>
                      <div className="ts-calendar-week-day-name">
                        {day.toLocaleDateString("es-ES", { weekday: "long" })}
                      </div>
                      <div className="ts-calendar-week-day-number">{day.getDate()}</div>
                    </div>
                  )
                })}
              </div>
              <div className="ts-calendar-week-grid">
                {hours.map((hour) => (
                  <div key={hour} className="ts-calendar-week-row">
                    <div className="ts-calendar-time-slot">{hour}</div>
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const day = new Date(getWeekStart(currentDate))
                      day.setDate(day.getDate() + dayIndex)
                      const dayEvents = getEventsForDate(day).filter((event) =>
                        event.time.startsWith(hour.split(":")[0]),
                      )

                      return (
                        <div key={dayIndex} className="ts-calendar-week-cell">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="ts-calendar-week-event"
                              style={{ backgroundColor: event.color }}
                              onClick={() => openEventModal(event)}
                            >
                              <div className="ts-calendar-event-time">{event.time}</div>
                              <div className="ts-calendar-event-title">{event.title}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vista Diaria */}
          {currentView === "Día" && (
            <div className="ts-calendar-day-view">
              <div className="ts-calendar-day-header">
                <div className="ts-calendar-time-column"></div>
                <div className="ts-calendar-day-column-header">
                  <div className="ts-calendar-day-name">
                    {currentDate.toLocaleDateString("es-ES", { weekday: "long" })}
                  </div>
                  <div className="ts-calendar-day-date">
                    {currentDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>
              <div className="ts-calendar-day-grid">
                {hours.map((hour) => {
                  const hourEvents = getEventsForDate(currentDate).filter((event) =>
                    event.time.startsWith(hour.split(":")[0]),
                  )

                  return (
                    <div key={hour} className="ts-calendar-day-row">
                      <div className="ts-calendar-time-slot">{hour}</div>
                      <div className="ts-calendar-day-cell">
                        {hourEvents.map((event) => (
                          <div
                            key={event.id}
                            className="ts-calendar-day-event"
                            style={{ backgroundColor: event.color }}
                            onClick={() => openEventModal(event)}
                          >
                            <div className="ts-calendar-event-time">{event.time}</div>
                            <div className="ts-calendar-event-title">{event.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal de detalles del evento */}
        {isEventModalOpen && selectedEvent && (
          <div className="ts-calendar-modal-overlay" onClick={closeEventModal}>
            <div className="ts-calendar-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ts-calendar-modal-header">
                <h3>{selectedEvent.title}</h3>
                <button className="ts-calendar-modal-close" onClick={closeEventModal}>
                  ×
                </button>
              </div>
              <div className="ts-calendar-modal-content">
                {/* Detalles para actividades */}
                {["Reunión", "Llamada", "Tarea"].includes(selectedEvent.type) && (
                  <>
                    <div className="ts-calendar-modal-field">
                      <strong>Tipo:</strong> {selectedEvent.type}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Asignado a:</strong> {selectedEvent.assignedTo}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Fecha:</strong> {selectedEvent.date}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Hora:</strong> {selectedEvent.time} - {selectedEvent.endTime}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Modalidad:</strong> {selectedEvent.modality}
                    </div>
                    {selectedEvent.medium && (
                      <div className="ts-calendar-modal-field">
                        <strong>Medio:</strong> {selectedEvent.medium}
                      </div>
                    )}
                    <div className="ts-calendar-modal-field">
                      <strong>Descripción:</strong> {selectedEvent.description}
                    </div>
                    {selectedEvent.meetingLink && (
                      <div className="ts-calendar-modal-field">
                        <strong>Enlace de reunión:</strong>
                        <a href={selectedEvent.meetingLink} target="_blank" rel="noopener noreferrer">
                          {selectedEvent.meetingLink}
                        </a>
                      </div>
                    )}
                  </>
                )}

                {/* Detalles para recargas */}
                {selectedEvent.type === "Recarga" && (
                  <>
                    <div className="ts-calendar-modal-field">
                      <strong>Número de SIM:</strong> {selectedEvent.simNumber}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>IMEI del Equipo:</strong> {selectedEvent.imei}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Fecha de Recarga:</strong> {selectedEvent.date}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Monto de Recarga:</strong> {selectedEvent.rechargeAmount}
                    </div>
                  </>
                )}

                {/* Detalles para cuentas por cobrar */}
                {selectedEvent.type === "Cuenta por Cobrar" && (
                  <>
                    <div className="ts-calendar-modal-field">
                      <strong>No.:</strong> {selectedEvent.accountNumber}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Fecha de Pago:</strong> {selectedEvent.date}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Cliente:</strong> {selectedEvent.client}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Estatus:</strong> {selectedEvent.status}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Esquema:</strong> {selectedEvent.scheme}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>No. Equipos:</strong> {selectedEvent.equipmentCount}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Concepto/s:</strong> {selectedEvent.concept}
                    </div>
                  </>
                )}

                {/* Detalles para cuentas por pagar */}
                {selectedEvent.type === "Cuenta por Pagar" && (
                  <>
                    <div className="ts-calendar-modal-field">
                      <strong>No.:</strong> {selectedEvent.accountNumber}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Fecha de Pago:</strong> {selectedEvent.date}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Cuenta:</strong> {selectedEvent.account}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Monto:</strong> {selectedEvent.amount}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Forma de Pago:</strong> {selectedEvent.paymentMethod}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Estatus:</strong> {selectedEvent.status}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Nota:</strong> {selectedEvent.note}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Calendario
