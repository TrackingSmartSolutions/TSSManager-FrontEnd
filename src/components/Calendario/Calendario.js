import { useState, useEffect, useRef, } from "react";
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MarcarPagadaModal } from "../Admin/Admin_CuentasPagar";
import { SimDetailsModal } from "../Equipos/Equipos_Sim";
import Swal from "sweetalert2";
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
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [currentDate, setCurrentDate] = useState(new Date());
  const userRol = localStorage.getItem("userRol");
  const userName = localStorage.getItem("userName");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState(
    userRol === "EMPLEADO" ? (userName || null) : null
  );

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const calendarRef = useRef(null);

  const [users, setUsers] = useState([]);

  const [modalMarcarPagada, setModalMarcarPagada] = useState({
    isOpen: false,
    cuenta: null
  });

  const [simDetailsModal, setSimDetailsModal] = useState({
    isOpen: false,
    sim: null
  });

  const [filtrosCategoria, setFiltrosCategoria] = useState({
    CRM: true,
    ADMON: true,
    EQUIPOS: true
  });

  const [equipos, setEquipos] = useState([]);

  const [formasPago] = useState({
    "01": "Efectivo",
    "03": "Transferencia electrónica de fondos",
    "04": "Tarjeta de crédito",
    "07": "Con Saldo Acumulado",
    "28": "Tarjeta de débito",
    "30": "Aplicación de anticipos",
    "99": "Por definir",
    "02": "Tarjeta Spin"
  });

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
    const loadCurrentAdminUser = async () => {
      if ((userRol === "ADMINISTRADOR" || userRol === "GESTOR") && !userName) {
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/auth/me`);
          const userData = await response.json();

          localStorage.setItem("userName", userData.nombre);
          setSelectedUser(userData.nombre);
        } catch (error) {
          console.error("ERROR al cargar datos del usuario administrador:", error);
          // En caso de error, establecer un usuario por defecto
          setSelectedUser("Todos los usuarios");
        }
      }
    };

    if (userRol === "ADMINISTRADOR" || userRol === "GESTOR") {
      loadCurrentAdminUser();
    }
  }, [userRol, userName]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchWithToken(`${API_BASE_URL}/auth/users`);
        const data = await response.json();
        const activeUsers = data.filter(user => user.estatus === "ACTIVO");

        const usersList = (userRol === "ADMINISTRADOR" || userRol === "GESTOR")
          ? ["Todos los usuarios", ...activeUsers.map(user => user.nombre)]
          : activeUsers.map(user => user.nombre);

        setUsers(usersList);

        // Si el selectedUser aún es null y ya tenemos userName, establecerlo
        if ((userRol === "ADMINISTRADOR" || userRol === "GESTOR") && !selectedUser && userName) {
          setSelectedUser(userName);
        }
      } catch (error) {
        console.error("ERROR al cargar usuarios:", error);
      }
    };

    // Solo cargar usuarios si es administrador
    if (userRol === "ADMINISTRADOR" || userRol === "GESTOR") {
      loadUsers();
    }
  }, [userRol, selectedUser, userName]);
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
      case 'EXPIRACIÓN DE EQUIPO':
        return 'evento-expiracion-equipo';
      default:
        return '';
    }
  };

  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedUser) return;

      if (isInitialLoad) {
        setIsLoading(true);
      }

      // Obtener el rango visible actual del calendario
      const calendarApi = calendarRef.current?.getApi();
      let start, end;

      if (calendarApi) {
        const view = calendarApi.view;
        // Usar el rango exacto de la vista actual (incluye días de meses adyacentes)
        start = view.activeStart.toISOString();
        end = view.activeEnd.toISOString();
      } else {
        // Fallback si el calendario aún no está inicializado
        start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
        end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();
      }

      let url;
      if (userRol === "ADMINISTRADOR" || userRol === "GESTOR") {
        url = `${API_BASE_URL}/calendario/eventos?startDate=${start}&endDate=${end}&usuario=${selectedUser}`;
      } else {
        url = `${API_BASE_URL}/calendario/eventos?startDate=${start}&endDate=${end}`;
      }

      try {
        const controller = new AbortController();
        const response = await fetchWithToken(url, { signal: controller.signal });
        const data = await response.json();

        const processedEvents = data
          .filter(event => event !== null)
          .map(event => ({
            title: event.titulo,
            start: new Date(event.inicio),
            end: event.fin ? new Date(event.fin) : null,
            color: event.color,
            allDay: event.allDay || false,
            className: getEventClassName(event.tipo),
            extendedProps: {
              id: event.id,
              tipo: event.tipo,
              categoria: event.categoria,
              asignadoA: event.asignadoA,
              trato: event.trato,
              tratoId: event.tratoId,
              modalidad: event.modalidad,
              medio: event.medio,
              numeroSim: event.numeroSim,
              imei: event.imei,
              numeroCuenta: event.numeroCuenta,
              cliente: event.cliente,
              estado: event.estado,
              esquema: event.esquema,
              monto: event.monto,
              nota: event.nota,
              plataformaNombre: event.plataformaNombre,
              clienteEquipo: event.clienteEquipo
            }
          }));

        setEvents(processedEvents);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("ERROR al cargar eventos:", error);
        }
      } finally {
        setIsLoading(false);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    };
    const timeoutId = setTimeout(() => {
      loadEvents();
    });

    return () => clearTimeout(timeoutId);
  }, [currentDate, selectedUser, userRol, isInitialLoad, users, currentView]);

  useEffect(() => {
    if (isEventModalOpen) {
      const popovers = document.querySelectorAll('.fc-popover');
      popovers.forEach(popover => {
        popover.remove();
      });
    }
  }, [isEventModalOpen]);

  const closeEventModal = () => {
    setSelectedEvent(null);
    setIsEventModalOpen(false);
  };

  const handleEventClick = (info) => {
    const popovers = document.querySelectorAll('.fc-popover');
    popovers.forEach(popover => {
      popover.remove();
    });

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
    const calendarApi = calendarRef.current.getApi();
    const fullCalendarView = view === "Día" ? "timeGridDay" : view === "Semana" ? "timeGridWeek" : "dayGridMonth";
    calendarApi.changeView(fullCalendarView);
    setCurrentView(fullCalendarView);
  };

  const handleUserChange = (e) => {
    const newUser = e.target.value;
    setSelectedUser(newUser);
  };

  const handleMarcarComoPagadaDesdeCalendario = async (evento) => {
    if (!evento.id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo identificar la cuenta por pagar",
      });
      return;
    }

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar/${evento.id}`);
      const cuentaCompleta = await response.json();

      setModalMarcarPagada({
        isOpen: true,
        cuenta: cuentaCompleta
      });
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error al obtener datos de la cuenta:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la información de la cuenta",
      });
    }
  };

  const handleSaveMarcarPagada = async (cuentaActualizada) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar/marcar-como-pagada-calendario`, {
        method: "POST",
        body: JSON.stringify({
          id: cuentaActualizada.id,
          montoPago: cuentaActualizada.montoPago,
          formaPago: cuentaActualizada.formaPago,
          usuarioId: 1,
        }),
      });

      if (response.status === 204) {
        await reloadCalendarEvents();
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Cuenta marcada como pagada correctamente",
        });
      }
    } catch (error) {
      console.error("Error al marcar como pagada:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al marcar la cuenta como pagada",
      });
    }

    setModalMarcarPagada({ isOpen: false, cuenta: null });
  };

  const reloadCalendarEvents = async () => {
    if (!selectedUser) return;

    const calendarApi = calendarRef.current?.getApi();
    let start, end;

    if (calendarApi) {
      const view = calendarApi.view;
      start = view.activeStart.toISOString();
      end = view.activeEnd.toISOString();
    } else {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();
    }

    let url;
    if (userRol === "ADMINISTRADOR" || userRol === "GESTOR") {
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
            id: event.id,
            tipo: event.tipo,
            asignadoA: event.asignadoA,
            trato: event.trato,
            tratoId: event.tratoId,
            modalidad: event.modalidad,
            medio: event.medio,
            numeroSim: event.numeroSim,
            imei: event.imei,
            numeroCuenta: event.numeroCuenta,
            cliente: event.cliente,
            estado: event.estado,
            esquema: event.esquema,
            monto: event.monto,
            nota: event.nota,
            plataformaNombre: event.plataformaNombre,
            clienteEquipo: event.clienteEquipo
          }
        };

        if (!event.allDay && event.fin) {
          eventConfig.end = new Date(event.fin);
        }

        return eventConfig;
      });

      setEvents(processedEvents);
    } catch (error) {
      console.error("ERROR al recargar eventos:", error);
    }
  };

  const closeModalMarcarPagada = () => {
    setModalMarcarPagada({ isOpen: false, cuenta: null });
  };

  const fetchSimDetails = async (numeroSim) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/sims`);
      const sims = await response.json();
      return sims.find(sim => sim.numero === numeroSim);
    } catch (error) {
      console.error("Error fetching SIM details:", error);
      return null;
    }
  };

  const fetchEquipos = async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/equipos`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching equipos:", error);
      return [];
    }
  };

  const handleSimNumberClick = async (numeroSim) => {
    try {
      const [simData, equiposData] = await Promise.all([
        fetchSimDetails(numeroSim),
        fetchEquipos()
      ]);

      if (simData) {
        setEquipos(equiposData);
        setSimDetailsModal({
          isOpen: true,
          sim: simData
        });
        // Cerrar el modal del evento
        setIsEventModalOpen(false);
        setSelectedEvent(null);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo encontrar la SIM"
        });
      }
    } catch (error) {
      console.error("Error loading SIM details:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los detalles de la SIM"
      });
    }
  };

  const closeSimDetailsModal = () => {
    setSimDetailsModal({
      isOpen: false,
      sim: null
    });
  };

  const handleTratoClick = (tratoId) => {
    if (tratoId) {
      navigate(`/detallestrato/${tratoId}`);
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const eventosFiltrados = events.filter(evento => {
    const categoria = evento.extendedProps?.categoria;
    if (!categoria) return true; // Mostrar eventos sin categoría
    return filtrosCategoria[categoria];
  });

  return (
    <>
      <div className="page-with-header">
        <Header />
        {isLoading && (
          <div className="calendario-loading">
            <div className="spinner"></div>
            <p>Cargando calendario...</p>
          </div>
        )}
        <div className="ts-calendar-container">
          <div className="ts-calendar-header">

            <div className="ts-calendar-filters-wrapper">
              {(userRol === "ADMINISTRADOR" || userRol === "GESTOR") && (
                <div className="ts-calendar-user-filter">
                  <select
                    value={selectedUser || ""}
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

              <div className="ts-calendar-filters">
                <label className="ts-calendar-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filtrosCategoria.CRM}
                    onChange={(e) => setFiltrosCategoria({ ...filtrosCategoria, CRM: e.target.checked })}
                  />
                  <span>CRM</span>
                </label>
                <label className="ts-calendar-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filtrosCategoria.ADMON}
                    onChange={(e) => setFiltrosCategoria({ ...filtrosCategoria, ADMON: e.target.checked })}
                  />
                  <span>ADMON</span>
                </label>
                <label className="ts-calendar-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filtrosCategoria.EQUIPOS}
                    onChange={(e) => setFiltrosCategoria({ ...filtrosCategoria, EQUIPOS: e.target.checked })}
                  />
                  <span>EQUIPOS</span>
                </label>
              </div>
            </div>

            <div className="ts-calendar-header-center">
              <div className="ts-calendar-view-buttons">
                {["Día", "Semana", "Mes"].map((view) => {
                  const viewMap = { "Día": "timeGridDay", "Semana": "timeGridWeek", "Mes": "dayGridMonth" };
                  return (
                    <button
                      key={view}
                      className={`ts-calendar-view-btn ${currentView === viewMap[view] ? "active" : ""}`}
                      onClick={() => handleViewChange(view)}
                    >
                      {view}
                    </button>
                  );
                })}
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
              initialView="dayGridMonth"
              events={eventosFiltrados}
              eventClick={handleEventClick}
              height="100%"
              selectable={true}
              locale="es"
              headerToolbar={false}

              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              expandRows={true}
              dayMaxEvents={4}
              dayMaxEventRows={4}
              moreLinkClick="popover"
              moreLinkClassNames="custom-popover-fixed"
              moreLinkText={(num) => `+${num} more`}
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
              dayHeaderFormat={
                currentView === "timeGridWeek"
                  ? { weekday: 'short', day: 'numeric' }
                  : { weekday: 'short' }
              }
              allDayText="Todo el día"
              popoverClassNames="custom-popover"
              datesSet={(dateInfo) => {
                // Se ejecuta cuando cambia el rango visible (navegación o cambio de vista)
                setCurrentDate(dateInfo.start);
              }}
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
                          <strong>Hora:</strong>
                          {selectedEvent.start ? new Date(selectedEvent.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                          {selectedEvent.end ? ` - ${new Date(selectedEvent.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
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
                          <strong>Trato:</strong>
                          {selectedEvent.trato ? (
                            <span
                              onClick={() => handleTratoClick(selectedEvent.tratoId)}
                              style={{
                                color: '#3b82f6',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginLeft: '5px'
                              }}
                              onMouseOver={(e) => e.target.style.color = '#1d4ed8'}
                              onMouseOut={(e) => e.target.style.color = '#3b82f6'}
                            >
                              {selectedEvent.trato}
                            </span>
                          ) : (
                            <span style={{ marginLeft: '5px' }}>No especificado</span>
                          )}
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
                        <strong>Monto:</strong> ${selectedEvent.monto ? Number(selectedEvent.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : 'No disponible'}
                      </div>
                      <div className="ts-calendar-modal-field">
                        <strong>Estatus:</strong> {selectedEvent.estado || 'No disponible'}
                      </div>
                      <div className="ts-calendar-modal-field">
                        <strong>Cuenta:</strong> {selectedEvent.cliente}
                      </div>
                      {selectedEvent.numeroSim && (
                        <div className="ts-calendar-modal-field">
                          <strong>Número SIM:</strong>
                          <span
                            onClick={() => handleSimNumberClick(selectedEvent.numeroSim)}
                            style={{
                              color: '#3b82f6',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              marginLeft: '5px'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#1d4ed8'}
                            onMouseOut={(e) => e.target.style.color = '#3b82f6'}
                          >
                            {selectedEvent.numeroSim}
                          </span>
                        </div>
                      )}
                      {/* Botón para marcar como pagada */}
                      {selectedEvent.estado !== "Pagado" && (
                        <div className="ts-calendar-modal-actions" style={{
                          marginTop: '15px',
                          textAlign: 'center',
                          borderTop: '1px solid #e5e7eb',
                          paddingTop: '15px'
                        }}>
                          <button
                            className="ts-calendar-btn-pagar"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMarcarComoPagadaDesdeCalendario(selectedEvent);
                            }}
                            style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                          >
                            Marcar como Pagada
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {selectedEvent.tipo === "Expiración de Equipo" && (
                    <>
                      <div className="ts-calendar-modal-field">
                        <strong>IMEI:</strong> {selectedEvent.imei}
                      </div>
                      <div className="ts-calendar-modal-field">
                        <strong>Fecha de Expiración:</strong> {new Date(selectedEvent.start).toLocaleDateString('es-ES')}
                      </div>
                      <div className="ts-calendar-modal-field">
                        <strong>Plataforma:</strong> {selectedEvent.plataformaNombre}
                      </div>
                      <div className="ts-calendar-modal-field">
                        <strong>Cliente:</strong> {selectedEvent.clienteEquipo}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <MarcarPagadaModal
          isOpen={modalMarcarPagada.isOpen}
          onClose={closeModalMarcarPagada}
          onSave={handleSaveMarcarPagada}
          cuenta={modalMarcarPagada.cuenta}
          formasPago={formasPago}
        />
        <SimDetailsModal
          isOpen={simDetailsModal.isOpen}
          onClose={closeSimDetailsModal}
          sim={simDetailsModal.sim}
          equipos={equipos}
        />
      </div>
    </>
  );
};

export default Calendario;