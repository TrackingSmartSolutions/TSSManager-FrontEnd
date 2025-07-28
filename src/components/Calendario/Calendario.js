import { useState, useEffect, useRef } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import "./Calendario.css";
import Header from "../Header/Header";
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
  const [currentView, setCurrentView] = useState("timeGridWeek");
  const [currentDate, setCurrentDate] = useState(new Date());
  const userRol = localStorage.getItem("userRol");
  const userName = localStorage.getItem("userName");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Inicializar selectedUser basándose en el rol
  const [selectedUser, setSelectedUser] = useState(
    userRol === "ADMINISTRADOR" ? "Todos los usuarios" : (userName || null)
  );

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const calendarRef = useRef(null);

  const [users, setUsers] = useState(
    userRol === "ADMINISTRADOR" ? ["Todos los usuarios"] : []
  );

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (userRol === "EMPLEADO" && !userName) {
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/auth/me`);
          const userData = await response.json();

          localStorage.setItem("userName", userData.nombre);
          setSelectedUser(userData.nombre);
        } catch (error) {
          console.error("ERROR al cargar datos del usuario actual:", error);
        }
      }
    };

    if (userRol === "EMPLEADO") {
      loadCurrentUser();
    }
  }, [userRol, userName]);

  useEffect(() => {
    const loadUsers = async () => {

      try {
        const response = await fetchWithToken(`${API_BASE_URL}/auth/users`);
        const data = await response.json();
        const usersList = ["Todos los usuarios", ...data.map(user => user.nombre)];

        setUsers(usersList);
      } catch (error) {
        console.error("ERROR al cargar usuarios:", error);
      }
    };

    // Solo cargar usuarios si es administrador
    if (userRol === "ADMINISTRADOR") {
      loadUsers();
    }
  }, [userRol]);

  const navigateDate = (direction) => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi[direction]();
    setCurrentDate(calendarApi.getDate());
  };

  const getEventClassName = (eventType) => {
    switch (eventType?.toUpperCase()) {
      case 'REUNION':
        return 'evento-reunion';
      case 'LLAMADA':
        return 'evento-llamada';
      case 'TAREA':
        return 'evento-tarea';
      case 'RECARGA':
        return 'evento-recarga';
      case 'CUENTA POR COBRAR':
        return 'evento-cuenta-cobrar';
      case 'CUENTA POR PAGAR':
        return 'evento-cuenta-pagar';
      default:
        return '';
    }
  };

  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedUser) {
        return;
      }

      if (isInitialLoad) {
        setIsLoading(true);
      }

      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();

      let url;
      if (userRol === "ADMINISTRADOR") {
        url = `${API_BASE_URL}/calendario/eventos?startDate=${start}&endDate=${end}&usuario=${selectedUser}`;
      } else {
        url = `${API_BASE_URL}/calendario/eventos?startDate=${start}&endDate=${end}`;
      }

      try {
        const response = await fetchWithToken(url);
        const data = await response.json();

        const processedEvents = data.map(event => {
          const eventConfig = {
            title: event.titulo,
            start: new Date(event.inicio),
            color: event.color,
            allDay: event.allDay || false,
            className: getEventClassName(event.tipo),
            extendedProps: {
              tipo: event.tipo,
              asignadoA: event.asignadoA,
              trato: event.trato,
              modalidad: event.modalidad,
              medio: event.medio,
              numeroSim: event.numeroSim,
              imei: event.imei,
              numeroCuenta: event.numeroCuenta,
              cliente: event.cliente,
              estado: event.estado,
              esquema: event.esquema
            }
          };

          if (!event.allDay && event.fin) {
            eventConfig.end = new Date(event.fin);
          }

          return eventConfig;
        });

        setEvents(processedEvents);
      } catch (error) {
        console.error("ERROR al cargar eventos:", error);
      } finally {
        setIsLoading(false);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    };

    if (selectedUser) {
      loadEvents();
    }
 }, [currentDate, selectedUser, userRol, isInitialLoad]);

  const closeEventModal = () => {
    setSelectedEvent(null);
    setIsEventModalOpen(false);
  };

  const handleEventClick = (info) => {
    const eventData = {
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      allDay: info.event.allDay,
      ...info.event.extendedProps
    };

    setSelectedEvent(eventData);
    setIsEventModalOpen(true);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView(view === "Día" ? "timeGridDay" : view === "Semana" ? "timeGridWeek" : "dayGridMonth");
  };

  const handleUserChange = (e) => {
    const newUser = e.target.value;
    setSelectedUser(newUser);
  };

  return (
    <>
      <Header />
      {isLoading && (
        <div className="calendario-loading">
          <div className="spinner"></div>
          <p>Cargando calendario...</p>
        </div>
      )}
      <div className="ts-calendar-container">
        <div className="ts-calendar-header">

          {userRol === "ADMINISTRADOR" && (
            <div className="ts-calendar-user-filter">
              <select
                value={selectedUser || "Todos los usuarios"}
                onChange={handleUserChange}
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
          <div className="ts-calendar-header-center">
            <div className="ts-calendar-view-buttons">
              {["Día", "Semana", "Mes"].map((view) => (
                <button
                  key={view}
                  className={`ts-calendar-view-btn ${currentView === view ? "active" : ""}`}
                  onClick={() => handleViewChange(view)}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
        </div>



        <div className="ts-calendar-navigation">
          <button className="ts-calendar-nav-btn" onClick={() => navigateDate("prev")}>
            ‹
          </button>
          <h2 className="ts-calendar-title">
            {calendarRef.current?.getApi().view.title || currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <button className="ts-calendar-nav-btn" onClick={() => navigateDate("next")}>
            ›
          </button>
        </div>

        <div className="ts-calendar-content">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView === "Día" ? "timeGridDay" : currentView === "Semana" ? "timeGridWeek" : "dayGridMonth"}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            contentHeight="auto"
            selectable={true}
            locale="es"
            headerToolbar={false}
            // Agregar estas propiedades:
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            expandRows={true}
            eventMaxStack={3}
            dayMaxEvents={true}
            dayMaxEventRows={3}
            eventDisplay="block"
            // Para eventos superpuestos:
            slotEventOverlap={false}
            eventOverlap={false}
            eventConstraint={{
              start: '06:00',
              end: '22:00'
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Lista'
            }}
            dayHeaderFormat={{ weekday: 'short' }}
            allDayText="Todo el día"
          />
        </div>

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
                {selectedEvent.tipo && ["REUNION", "LLAMADA", "TAREA"].includes(selectedEvent.tipo.toUpperCase()) && (
                  <>
                    <div className="ts-calendar-modal-field">
                      <strong>Tipo:</strong> {selectedEvent.tipo}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Asignado a:</strong> {selectedEvent.asignadoA}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Fecha:</strong> {selectedEvent.start ? new Date(selectedEvent.start).toLocaleDateString('es-ES') : 'No disponible'}
                    </div>
                    {!selectedEvent.allDay && (
                      <div className="ts-calendar-modal-field">
                        <strong>Hora:</strong> {selectedEvent.end ? new Date(selectedEvent.end).toLocaleTimeString('es-ES') : "Sin fin"}
                      </div>
                    )}
                    <div className="ts-calendar-modal-field">
                      <strong>Modalidad:</strong> {selectedEvent.modalidad || 'No especificada'}
                    </div>
                    {selectedEvent.medio && (
                      <div className="ts-calendar-modal-field">
                        <strong>Medio:</strong> {selectedEvent.medio}
                      </div>
                    )}
                    {selectedEvent.trato && (
                      <div className="ts-calendar-modal-field">
                        <strong>Trato:</strong> {selectedEvent.trato}
                      </div>
                    )}
                  </>
                )}

                {selectedEvent.tipo === "Recarga" && (
                  <>
                    <div className="ts-calendar-modal-field">
                      <strong>Número de SIM:</strong> {selectedEvent.numeroSim}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>IMEI del Equipo:</strong> {selectedEvent.imei}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Fecha de Recarga:</strong> {new Date(selectedEvent.start).toLocaleDateString('es-ES')}
                    </div>
                  </>
                )}

                {selectedEvent.tipo === "Cuenta por Cobrar" && (
                  <>
                    <div className="ts-calendar-modal-field">
                      <strong>No.:</strong> {selectedEvent.numeroCuenta}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Fecha de Pago:</strong> {new Date(selectedEvent.start).toLocaleDateString('es-ES')}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Cliente:</strong> {selectedEvent.cliente}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Estatus:</strong> {selectedEvent.estado}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Esquema:</strong> {selectedEvent.esquema}
                    </div>
                  </>
                )}

                {selectedEvent.tipo === "Cuenta por Pagar" && (
                  <>
                    <div className="ts-calendar-modal-field">
                      <strong>No.:</strong> {selectedEvent.numeroCuenta}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Fecha de Pago:</strong> {new Date(selectedEvent.start).toLocaleDateString('es-ES')}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Cuenta:</strong> {selectedEvent.cliente}
                    </div>
                    <div className="ts-calendar-modal-field">
                      <strong>Estatus:</strong> {selectedEvent.estado}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Calendario;