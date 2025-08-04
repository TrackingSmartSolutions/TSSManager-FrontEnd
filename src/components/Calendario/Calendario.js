import { useState, useEffect, useRef } from "react";
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

  const [modalMarcarPagada, setModalMarcarPagada] = useState({
    isOpen: false,
    cuenta: null
  });

  const [simDetailsModal, setSimDetailsModal] = useState({
    isOpen: false,
    sim: null
  });

  const [equipos, setEquipos] = useState([]);

  const [formasPago] = useState({
    "01": "Efectivo",
    "03": "Transferencia electrónica de fondos",
    "04": "Tarjeta de crédito",
    "06": "Dinero electrónico",
    "07": "Con Saldo Acumulado",
    "08": "Vales de despensa",
    "15": "Condonación",
    "17": "Compensación",
    "28": "Tarjeta de débito",
    "29": "Tarjeta de servicios",
    "30": "Aplicación de anticipos",
    "99": "Por definir",
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
              id: event.id,
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
              esquema: event.esquema,
              monto: event.monto,
              nota: event.nota
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

  const handleMarcarComoPagadaDesdeCalendario = (evento) => {
    // Verificar que tengamos el ID
    if (!evento.id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo identificar la cuenta por pagar",
      });
      return;
    }

    const cuenta = {
      id: parseInt(evento.id),
      folio: evento.numeroCuenta,
      fechaPago: new Date(evento.start).toISOString().split('T')[0],
      monto: evento.monto,
      formaPago: "01",
      estatus: evento.estado,
      cuenta: {
        nombre: evento.cliente
      },
      sim: evento.numeroSim ? { numero: evento.numeroSim } : null
    };

    setModalMarcarPagada({
      isOpen: true,
      cuenta: cuenta
    });
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveMarcarPagada = async (cuentaActualizada) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar/marcar-como-pagada-calendario`, {
        method: "POST",
        body: JSON.stringify({
          id: cuentaActualizada.id,
          fechaPago: cuentaActualizada.fechaPago,
          monto: cuentaActualizada.monto,
          formaPago: cuentaActualizada.formaPago,
          usuarioId: 1,
        }),
      });

      if (response.status === 204) {
        await reloadCalendarEvents();

        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Cuenta marcada como pagada y nuevas cuentas generadas automáticamente",
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
            id: event.id,
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
            esquema: event.esquema,
            monto: event.monto,
            nota: event.nota
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

            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            expandRows={true}
            dayMaxEvents={4}
            dayMaxEventRows={4}
            moreLinkClick="popover"
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
    </>
  );
};

export default Calendario;