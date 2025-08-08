import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Equipos_EstatusPlataforma.css";
import Header from "../Header/Header";
import Swal from "sweetalert2";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { API_BASE_URL } from "../Config/Config";
import html2pdf from "html2pdf.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


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

// Componente Modal Base
const Modal = ({ isOpen, onClose, title, children, size = "md", canClose = true, closeOnOverlayClick = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "estatusplataforma-modal-sm",
    md: "estatusplataforma-modal-md",
    lg: "estatusplataforma-modal-lg",
    xl: "estatusplataforma-modal-xl",
  };

  return (
    <div className="estatusplataforma-modal-overlay" onClick={closeOnOverlayClick ? onClose: () => { }}>
      <div className={`estatusplataforma-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="estatusplataforma-modal-header">
          <h2 className="estatusplataforma-modal-title">{title}</h2>
          {canClose && (
            <button className="estatusplataforma-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="estatusplataforma-modal-body">{children}</div>
      </div>
    </div>
  );
};

const processEstatusPorCliente = (equipos, estatusData, clientes) => {
  const clienteIds = [...new Set(equipos.map(e => e.clienteId || e.clienteDefault || null))].filter(id => id !== null);

  // Obtener la fecha más reciente de los datos de estatus
  const fechaUltimoCheck = estatusData.length > 0
    ? Math.max(...estatusData.map(es => new Date(es.fechaCheck).getTime()))
    : null;

  const fechaUltimoCheckStr = fechaUltimoCheck
    ? new Date(fechaUltimoCheck).toISOString().split('T')[0]
    : null;

  return clienteIds.map(clienteId => {
    const equiposCliente = equipos.filter(e => e.clienteId === clienteId || e.clienteDefault === clienteId);

    // Filtrar solo los estatus de la fecha más reciente
    const estatus = estatusData.filter(es =>
      equiposCliente.some(e => e.id === es.equipoId) &&
      es.fechaCheck === fechaUltimoCheckStr
    );

    const enLinea = estatus.filter(es => es.estatus === "REPORTANDO").length;
    const fueraLinea = estatus.filter(es => es.estatus === "NO_REPORTANDO").length;

    const clienteNombre = clientes.find(c => c.id === clienteId)?.nombre ||
      (clienteId === "AG" || clienteId === "BN" || clienteId === "PERDIDO" ? clienteId : "Sin Cliente");

    return { cliente: clienteNombre, enLinea, fueraLinea };
  });
};

const processEquiposPorPlataforma = (equipos) => {
  const plataformaMap = {
    TRACK_SOLID: "Track Solid",
    WHATSGPS: "WhatsGPS",
    TRACKERKING: "TrackerKing",
    JOINTCLOUD: "JointCloud"
  };
  const uniquePlatforms = [...new Set(equipos.map(e => e.plataforma))].filter(p => p);
  return uniquePlatforms.map(p => ({
    plataforma: plataformaMap[p] || p,
    cantidad: equipos.filter(e => e.plataforma === p).length,
  })).filter(p => p.cantidad > 0);
};

const processEquiposOffline = (equipos, estatusData, clientes) => {
  if (!estatusData.length) return [];

  // Obtener la fecha más reciente
  const fechaUltimo = Math.max(...estatusData.map(es => new Date(es.fechaCheck).getTime()));
  const fechaUltimoStr = new Date(fechaUltimo).toISOString().split('T')[0];

  // Filtrar solo los equipos offline de la fecha más reciente
  const offline = estatusData.filter(es =>
    es.estatus === "NO_REPORTANDO" &&
    es.fechaCheck === fechaUltimoStr
  );

  return offline.map(es => {
    const equipo = equipos.find(e => e.id === es.equipoId);


    let clienteNombre = "N/A";

    if (equipo.clienteId) {

      const cliente = clientes.find(c => c.id === equipo.clienteId);
      clienteNombre = cliente?.nombre || `Cliente ID: ${equipo.clienteId}`;
    } else if (equipo.clienteDefault) {
      clienteNombre = equipo.clienteDefault;
    }

    return {
      cliente: clienteNombre,
      nombre: equipo.nombre,
      plataforma: equipo.plataforma,
      motivo: es.motivo,
    };
  });
};

const processEquiposPorMotivo = (equiposOffline) => {
  const motivoCount = {};
  
  equiposOffline.forEach(equipo => {
    const motivo = equipo.motivo || 'Sin motivo especificado';
    motivoCount[motivo] = (motivoCount[motivo] || 0) + 1;
  });
  
  return Object.entries(motivoCount)
    .map(([motivo, cantidad]) => ({ motivo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad); // Ordenar por cantidad descendente
};

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

// Panel Lateral Deslizante para Check Equipos
const CheckEquiposSidePanel = ({
  isOpen,
  onClose,
  equipos,
  setModals,
  closeModal,
  fetchData,
  lastCheckTime,
  setLastCheckTime,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState("Todos");
  const [equiposStatus, setEquiposStatus] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const platformMap = {
    TRACKERKING: "TrackerKing",
    TRACK_SOLID: "Track Solid",
    WHATSGPS: "WhatsGPS",
    JOINTCLOUD: "JointCloud"

  };

  const fixedPlatforms = ["TRACKERKING", "TRACK_SOLID", "WHATSGPS", "JOINTCLOUD"];
  const dynamicPlatforms = [...new Set(equipos.map(e => e.plataforma))].filter(p => p && !fixedPlatforms.includes(p));
  const plataformas = ["Todos", ...fixedPlatforms, ...dynamicPlatforms];

  useEffect(() => {
    if (isOpen && equipos.length > 0) {
      setEquiposStatus(prevStatus => {
        const newStatus = { ...prevStatus };
        equipos.forEach((equipo) => {
          if (!newStatus[equipo.id]) {
            newStatus[equipo.id] = {
              status: null,
              motivo: "",
            };
          }
        });
        return newStatus;
      });
    }
  }, [isOpen, equipos]);

  const filteredEquipos = equipos
    .filter((equipo) => selectedPlatform === "Todos" || equipo.plataforma === selectedPlatform)
    .sort((a, b) => {
      // Ordena por nombre del equipo alfabéticamente
      const nombreA = a.nombre ? a.nombre.toLowerCase() : '';
      const nombreB = b.nombre ? b.nombre.toLowerCase() : '';
      return nombreA.localeCompare(nombreB);
    });

  const handleStatusChange = (equipoId, newStatus) => {
    const equipo = equipos.find(e => e.id === equipoId);
    setModals(prev => ({
      ...prev,
      confirmarCambio: {
        isOpen: true,
        equipoNombre: equipo.nombre,
        nuevoEstatus: newStatus ? "REPORTANDO" : "NO_REPORTANDO",
        motivo: newStatus ? "" : equiposStatus[equipoId]?.motivo || "",
        onConfirm: (selectedMotivo) => {
          if (newStatus === false && !selectedMotivo.trim()) {
            Swal.fire({
              icon: "warning",
              title: "Advertencia",
              text: "Debe seleccionar un motivo para equipos no reportando.",
            });
            return;
          }
          setEquiposStatus(prev => ({
            ...prev,
            [equipoId]: { status: newStatus, motivo: selectedMotivo || "" },
          }));
          closeModal("confirmarCambio");
        },
      },
    }));
  };


  const handleSaveChecklist = async () => {
    const equiposConStatus = Object.entries(equiposStatus)
      .filter(([_, data]) => data.status !== null)
      .map(([equipoId, data]) => ({
        equipoId: Number.parseInt(equipoId),
        status: data.status ? "REPORTANDO" : "NO_REPORTANDO",
        motivo: data.motivo || null,
      }));


    if (equiposConStatus.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Debes asignar un estatus a al menos un equipo antes de guardar.",
      });
      return;
    }

    const equiposSinMotivo = equiposConStatus.filter(e =>
      e.status === "NO_REPORTANDO" && (!e.motivo || e.motivo.trim() === "")
    );

    if (equiposSinMotivo.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Todos los equipos marcados como 'NO_REPORTANDO' deben tener un motivo.",
      });
      return;
    }

    setIsSaving(true);

    try {
      await fetchWithToken(`${API_BASE_URL}/equipos/estatus`, {
        method: "POST",
        body: JSON.stringify(equiposConStatus),
      });

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Se ha guardado el checklist de ${equiposConStatus.length} equipos.`,
      });

      const todayStart = getTodayStart();
      setLastCheckTime(todayStart);
      fetchData();
      closeModal("checkEquipos");
    } catch (error) {
      console.error("Error al guardar checklist:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Error al guardar el checklist",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const canCheck = !lastCheckTime || (Date.now() - lastCheckTime >= 24 * 60 * 60 * 1000);

  return (
    <>
      {isOpen && <div className="estatusplataforma-side-panel-overlay" onClick={onClose}></div>}

      <div className={`estatusplataforma-side-panel ${isOpen ? "estatusplataforma-side-panel-open" : ""}`}>
        <div className="estatusplataforma-side-panel-header">
          <h2 className="estatusplataforma-side-panel-title">Selecciona la plataforma</h2>
          <button className="estatusplataforma-side-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="estatusplataforma-side-panel-content">
          <div className="estatusplataforma-side-panel-form-group">
            <label htmlFor="plataforma">Plataforma</label>
            <select
              id="plataforma"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="estatusplataforma-side-panel-form-control"
            >
              {plataformas.map((plataforma) => (
                <option key={plataforma} value={plataforma}>
                  {platformMap[plataforma] || plataforma || "Sin Plataforma"}
                </option>
              ))}
            </select>
          </div>

          <div className="estatusplataforma-side-panel-form-group">
            <div className="estatusplataforma-progress-info">
              <span>Progreso total: {Object.values(equiposStatus).filter(s => s.status !== null).length} / {equipos.length} equipos</span>
            </div>
          </div>

          <div className="estatusplataforma-side-panel-table-container">
            <table className="estatusplataforma-side-panel-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Reportando</th>
                  <th>No Reportando</th>
                </tr>
              </thead>
              <tbody>
                {canCheck ? (
                  filteredEquipos.length > 0 ? (
                    filteredEquipos.map((equipo) => (
                      <tr key={equipo.id}>
                        <td>
                          <div className="estatusplataforma-equipo-info">
                            <div className="estatusplataforma-equipo-nombre">{equipo.codigo}</div>
                            <div className="estatusplataforma-equipo-detalle">{equipo.nombre}</div>
                          </div>
                        </td>
                        <td className="estatusplataforma-status-cell">
                          <div className="estatusplataforma-status-radio-container">
                            <input
                              type="radio"
                              name={`status-${equipo.id}`}
                              checked={equiposStatus[equipo.id]?.status === true}
                              onChange={() => handleStatusChange(equipo.id, true)}
                              className="estatusplataforma-status-radio estatusplataforma-status-radio-green"
                            />
                            <span className="estatusplataforma-status-checkmark estatusplataforma-green">✓</span>
                          </div>
                        </td>
                        <td className="estatusplataforma-status-cell">
                          <div className="estatusplataforma-status-radio-container">
                            <input
                              type="radio"
                              name={`status-${equipo.id}`}
                              checked={equiposStatus[equipo.id]?.status === false}
                              onChange={() => handleStatusChange(equipo.id, false)}
                              className="estatusplataforma-status-radio estatusplataforma-status-radio-red"
                            />
                            <span className="estatusplataforma-status-checkmark estatusplataforma-red">✗</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="estatusplataforma-no-data">
                        No hay equipos para check
                      </td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan="3" className="estatusplataforma-no-data">
                      El checklist ya se realizó hoy. Espera al siguiente día para volver a cargarlos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="estatusplataforma-side-panel-footer">
          <button
            type="button"
            onClick={handleSaveChecklist}
            className="estatusplataforma-btn estatusplataforma-btn-primary estatusplataforma-btn-full-width"
            disabled={!canCheck || filteredEquipos.length === 0 || isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar checklist"}
          </button>
        </div>
      </div>
    </>
  );
};

// Modal de Confirmación de Cambio de Estatus
const ConfirmarCambioEstatusModal = ({
  isOpen,
  onClose,
  onConfirm,
  equipoNombre,
  nuevoEstatus,
  motivo,
  onMotivoChange,
}) => {
  const motivosOptions = [
    "Batería interna baja",
    "Desconexión de fuente",
    "Zona de baja cobertura",
    "Sin saldo",
    "Perdido",
    "Expirado",
    "Apagado",
    "En reparación",
    "Falla del equipo",
    "Sin Plataforma"
  ];

  const handleConfirm = () => {
    onConfirm(motivo);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar cambio de estatus" size="sm" closeOnOverlayClick={false}>
      <div className="estatusplataforma-confirmar-eliminacion">
        <div className="estatusplataforma-confirmation-content">
          <p className="estatusplataforma-confirmation-message">
            ¿Seguro que quieres cambiar el estatus de reporte de {equipoNombre} a {nuevoEstatus}?
          </p>

          {nuevoEstatus === "NO_REPORTANDO" && (
            <div className="estatusplataforma-modal-form-group" style={{ width: "100%", marginTop: "1rem" }}>
              <label htmlFor="motivo">Motivo: <span style={{ color: "red" }}>*</span></label>
              <select
                id="motivo"
                value={motivo || ""}
                onChange={(e) => onMotivoChange(e.target.value)}
                className="estatusplataforma-modal-form-control"
                required
              >
                <option value="">Seleccionar motivo</option>
                {motivosOptions.map((motivoOption) => (
                  <option key={motivoOption} value={motivoOption}>
                    {motivoOption}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="estatusplataforma-modal-form-actions">
            <button type="button" onClick={onClose} className="estatusplataforma-btn estatusplataforma-btn-cancel">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="estatusplataforma-btn estatusplataforma-btn-confirm"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Componente Principal
const EquiposEstatusPlataforma = () => {
  const navigate = useNavigate();
  const chartRefs = useRef({});

  const [equiposData, setEquiposData] = useState({
    estatusPorCliente: [],
    equiposPorPlataforma: [],
    equiposOffline: [],
    equiposPorMotivo: [],
    equiposParaCheck: [],
    fechaUltimoCheck: null,
  });

  const [modals, setModals] = useState({
    checkEquipos: { isOpen: false },
    confirmarCambio: {
      isOpen: false,
      equipoNombre: "",
      nuevoEstatus: "",
      motivo: "",
      onConfirm: null,
    },
  });

  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [equiposResponse, estatusResponse, clientesResponse] = await Promise.all([
        fetchWithToken(`${API_BASE_URL}/equipos`),
        fetchWithToken(`${API_BASE_URL}/equipos/estatus`),
        fetchWithToken(`${API_BASE_URL}/empresas`),
      ]);

      const equipos = await equiposResponse.json();
      const estatusData = await estatusResponse.json();
      const empresas = await clientesResponse.json();
      const clientes = empresas.filter(emp => ["CLIENTE", "EN_PROCESO"].includes(emp.estatus));

      // Obtener la fecha más reciente correctamente
      let fechaUltimoCheck = new Date().toISOString().split("T")[0];
      let lastCheckTimestamp = null;

      if (estatusData.length > 0) {
        // Encontrar la fecha más reciente
        const fechaMasReciente = Math.max(...estatusData.map(es => new Date(es.fechaCheck).getTime()));
        fechaUltimoCheck = new Date(fechaMasReciente).toISOString().split("T")[0];
        lastCheckTimestamp = fechaMasReciente;
      }

      setLastCheckTime(lastCheckTimestamp);

      const equiposParaCheck = equipos.filter(e => ["VENDIDO", "DEMO"].includes(e.tipo));

      setEquiposData({
        estatusPorCliente: processEstatusPorCliente(equipos, estatusData, clientes),
        equiposPorPlataforma: processEquiposPorPlataforma(equipos),
        equiposOffline: processEquiposOffline(equipos, estatusData, clientes),
        equiposPorMotivo: processEquiposPorMotivo(processEquiposOffline(equipos, estatusData, clientes)),
        equiposParaCheck,
        fechaUltimoCheck,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los datos",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: true, ...data },
    }));
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: false },
    }));
  };

  const handleCheckEquipos = () => {
    openModal("checkEquipos");
  };

  const handleSaveChecklist = async (equiposConStatus) => {
    try {
      await fetchWithToken(`${API_BASE_URL}/equipos/estatus`, {
        method: "POST",
        body: JSON.stringify(equiposConStatus),
      });
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  const handleGeneratePDF = async () => {
  const element = document.createElement("div");
  const chartImages = await Promise.all([
    getChartImage("estatusClienteChart"),
    getChartImage("plataformaChart"),
  ]);

  const currentDate = new Date().toLocaleDateString('es-MX', { 
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  element.innerHTML = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.4;">
      <!-- PÁGINA 1: Encabezado y Gráficas -->
      <div style="page-break-after: always; padding: 20px; min-height: 100vh; display: flex; flex-direction: column;">
        <!-- Encabezado Principal -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; color: #1e40af; font-weight: bold;">
            Reporte de Estatus de Plataforma
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; color: #6b7280;">
            Generado el ${currentDate}
          </p>
        </div>

        <!-- Contenedor de Gráficas -->
        <div style="flex: 1; display: flex; flex-direction: column; gap: 25px;">
          <!-- Gráfica 1 -->
          <div style="flex: 1; display: flex; flex-direction: column;">
            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #374151; text-align: center; 
                       background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
                       padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              📊 Estatus por Cliente
            </h2>
            <div style="flex: 1; display: flex; justify-content: center; align-items: center; 
                        background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                        padding: 15px;">
              <img src="${chartImages[0]}" style="max-width: 100%; max-height: 300px; height: auto; object-fit: contain;" />
            </div>
          </div>

          <!-- Gráfica 2 -->
          <div style="flex: 1; display: flex; flex-direction: column;">
            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #374151; text-align: center; 
                       background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
                       padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
              🖥️ Equipos por Plataforma
            </h2>
            <div style="flex: 1; display: flex; justify-content: center; align-items: center; 
                        background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                        padding: 15px;">
              <img src="${chartImages[1]}" style="max-width: 100%; max-height: 300px; height: auto; object-fit: contain;" />
            </div>
          </div>
        </div>

        <!-- Pie de página 1 -->
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af; 
                    border-top: 1px solid #e5e7eb; padding-top: 15px;">
          Página 1 de 2 - Análisis Gráfico
        </div>
      </div>

      <!-- PÁGINA 2: Tabla de Equipos Offline -->
      <div style="padding: 20px; min-height: 100vh; display: flex; flex-direction: column;">
        <!-- Encabezado de Página 2 -->
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #ef4444; padding-bottom: 15px;">
          <h2 style="margin: 0; font-size: 24px; color: #dc2626; font-weight: bold;">
            ⚠️ Equipos Offline - Detalle
          </h2>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
            Total de equipos sin conexión: ${equiposData.equiposOffline.length}
          </p>
        </div>

        <!-- Sección de Motivos de Desconexión -->
<div style="margin-bottom: 25px;">
  <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #7c2d12; 
             background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); 
             padding: 10px; border-radius: 6px; border-left: 4px solid #ea580c; text-align: center;">
    📈 Distribución por Motivos de Desconexión
  </h3>
  
  ${equiposData.equiposPorMotivo.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; font-size: 12px; 
                  background: #ffffff; border-radius: 8px; overflow: hidden; 
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <thead>
        <tr style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e;">
          <th style="border: 1px solid #f59e0b; padding: 12px 8px; font-weight: bold; text-align: left;">
            Motivo
          </th>
          <th style="border: 1px solid #f59e0b; padding: 12px 8px; font-weight: bold; text-align: center; width: 100px;">
            Cantidad
          </th>
          <th style="border: 1px solid #f59e0b; padding: 12px 8px; font-weight: bold; text-align: center; width: 100px;">
            Porcentaje
          </th>
        </tr>
      </thead>
      <tbody>
        ${equiposData.equiposPorMotivo.map((item, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#fffbeb'}; 
                     border-bottom: 1px solid #fde68a;">
            <td style="border: 1px solid #fde68a; padding: 10px 8px; 
                       word-wrap: break-word; vertical-align: top;">
              ${item.motivo}
            </td>
            <td style="border: 1px solid #fde68a; padding: 10px 8px; text-align: center; 
                       font-weight: bold; color: #dc2626; vertical-align: top;">
              ${item.cantidad}
            </td>
            <td style="border: 1px solid #fde68a; padding: 10px 8px; text-align: center; 
                       color: #7c2d12; vertical-align: top;">
              ${((item.cantidad / equiposData.equiposOffline.length) * 100).toFixed(1)}%
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `
    <div style="text-align: center; color: #6b7280; font-style: italic; padding: 20px; 
                background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db;">
      No hay datos de motivos disponibles
    </div>
  `}
</div>

        <!-- Tabla -->
        <div style="flex: 1; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; 
                        background: #ffffff; border-radius: 8px; overflow: hidden; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #991b1b;">
                <th style="border: 1px solid #f87171; padding: 12px 8px; font-weight: bold; 
                           text-align: left; width: 18%;">Cliente</th>
                <th style="border: 1px solid #f87171; padding: 12px 8px; font-weight: bold; 
                           text-align: left; width: 25%;">Nombre del Equipo</th>
                <th style="border: 1px solid #f87171; padding: 12px 8px; font-weight: bold; 
                           text-align: center; width: 15%;">Plataforma</th>
                <th style="border: 1px solid #f87171; padding: 12px 8px; font-weight: bold; 
                           text-align: center; width: 12%;">Estado</th>
                <th style="border: 1px solid #f87171; padding: 12px 8px; font-weight: bold; 
                           text-align: left; width: 30%;">Motivo</th>
              </tr>
            </thead>
            <tbody>
              ${equiposData.equiposOffline.map((e, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#fef2f2'}; 
                           border-bottom: 1px solid #fee2e2;">
                  <td style="border: 1px solid #fecaca; padding: 10px 8px; 
                             word-wrap: break-word; vertical-align: top; font-weight: 500;">
                    ${e.cliente}
                  </td>
                  <td style="border: 1px solid #fecaca; padding: 10px 8px; 
                             word-wrap: break-word; vertical-align: top;">
                    ${e.nombre}
                  </td>
                  <td style="border: 1px solid #fecaca; padding: 10px 8px; 
                             text-align: center; vertical-align: top; font-weight: 500;">
                    ${e.plataforma}
                  </td>
                  <td style="border: 1px solid #fecaca; padding: 10px 8px; 
                             text-align: center; vertical-align: top;">
                    <span style="color: #dc2626; font-size: 16px; font-weight: bold;">✗</span>
                  </td>
                  <td style="border: 1px solid #fecaca; padding: 10px 8px; 
                             word-wrap: break-word; vertical-align: top; color: #7f1d1d;">
                    ${e.motivo}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pie de página 2 -->
        <div style="margin-top: 25px; text-align: center; font-size: 12px; color: #9ca3af; 
                    border-top: 1px solid #e5e7eb; padding-top: 15px;">
          <div>Página 2 de 2 - Detalle de Equipos Offline</div>
          <div style="margin-top: 5px; font-size: 10px;">
            Reporte generado automáticamente - ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
          </div>
        </div>
      </div>
    </div>
  `;

  const opt = {
    margin: [0.3, 0.3, 0.3, 0.3], 
    filename: `reporte_estatus_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      letterRendering: true,
      logging: false
    },
    jsPDF: { 
      unit: 'in', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(element).save();
};


  const getChartImage = (chartId) => {
    return new Promise((resolve) => {
      const chartInstance = chartRefs.current[chartId];
      if (chartInstance) {
        const canvas = chartInstance.canvas;
        const ctx = canvas.getContext('2d');
        const tempCanvas = document.createElement('canvas');
        const scale = 4;
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;

        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.scale(scale, scale);

        chartInstance.draw();
        tempCtx.drawImage(canvas, 0, 0);

        resolve(tempCanvas.toDataURL('image/png', 1.0));
      } else {
        const canvas = document.querySelector(`#${chartId} canvas`);
        if (canvas) {
          resolve(canvas.toDataURL('image/png', 1.0));
        } else {
          resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        }
      }
    });
  };

  const estatusClienteChartData = {
    labels: equiposData.estatusPorCliente.map((item) => {
      return item.cliente.length > 18 ?
        item.cliente.substring(0, 18) + '...' :
        item.cliente;
    }),
    datasets: [
      {
        label: "En Línea",
        data: equiposData.estatusPorCliente.map((item) => item.enLinea),
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
        borderWidth: 1,
      },
      {
        label: "Fuera de Línea",
        data: equiposData.estatusPorCliente.map((item) => item.fueraLinea),
        backgroundColor: "#f44336",
        borderColor: "#f44336",
        borderWidth: 1,
      },
    ],
  };

  const plataformaChartData = {
    labels: equiposData.equiposPorPlataforma.map((item) => item.plataforma),
    datasets: [
      {
        label: "Cantidad de Equipos",
        data: equiposData.equiposPorPlataforma.map((item) => item.cantidad),
        backgroundColor: ["#037ce0", "#4CAF50", "#FF9800"],
        borderColor: ["#037ce0", "#4CAF50", "#FF9800"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            const index = context[0].dataIndex;
            const fullName = equiposData.estatusPorCliente[index]?.cliente;
            return fullName || context[0].label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 2,
          font: {
            size: 12,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
          padding: 5,
          autoSkip: false,
          maxTicksLimit: false,
          callback: function (value, index, values) {
            const label = this.getLabelForValue(value);
            if (typeof label === 'string') {
              return label.length > 18 ? label.substring(0, 18) + '...' : label;
            }
            return label;
          }
        },
        display: true,
      },
    },
    animation: {
      onComplete: function () {
        const chartId = this.canvas.parentElement.id;
        if (chartId) {
          chartRefs.current[chartId] = this;
        }
      }
    },
    layout: {
      padding: {
        bottom: 20,
        left: 10,
        right: 10,
        top: 10
      }
    }
  };

  const handleMenuNavigation = (menuItem) => {
    switch (menuItem) {
      case "estatus-plataforma":
        navigate("/equipos_estatusplataforma");
        break;
      case "modelos":
        navigate("/equipos_modelos");
        break;
      case "proveedores":
        navigate("/equipos_proveedores");
        break;
      case "inventario":
        navigate("/equipos_inventario");
        break;
      case "sim":
        navigate("/equipos_sim");
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Header />
      {isLoading && (
        <div className="estatusplataforma-loading">
          <div className="spinner"></div>
          <p>Cargando datos de equipos...</p>
        </div>
      )}
      <main className="estatusplataforma-main-content">
        <div className="estatusplataforma-container">
          <section className="estatusplataforma-sidebar">
            <div className="estatusplataforma-sidebar-header">
              <h3 className="estatusplataforma-sidebar-title">Equipos</h3>
            </div>
            <div className="estatusplataforma-sidebar-menu">
              <div
                className="estatusplataforma-menu-item estatusplataforma-menu-item-active"
                onClick={() => handleMenuNavigation("estatus-plataforma")}
              >
                Estatus plataforma
              </div>
              <div className="estatusplataforma-menu-item" onClick={() => handleMenuNavigation("modelos")}>
                Modelos
              </div>
              <div className="estatusplataforma-menu-item" onClick={() => handleMenuNavigation("proveedores")}>
                Proveedores
              </div>
              <div className="estatusplataforma-menu-item" onClick={() => handleMenuNavigation("inventario")}>
                Inventario de equipos
              </div>
              <div className="estatusplataforma-menu-item" onClick={() => handleMenuNavigation("sim")}>
                SIM
              </div>
            </div>
          </section>

          <section className="estatusplataforma-content-panel">
            <div className="estatusplataforma-header">
              <h3 className="estatusplataforma-page-title">Estatus plataforma</h3>
              <div className="estatusplataforma-header-actions">
                <button className="estatusplataforma-btn estatusplataforma-btn-primary" onClick={handleCheckEquipos}>
                  Check equipos
                </button>
              </div>
            </div>

            <p className="estatusplataforma-subtitle">Monitoreo de equipos por cliente</p>

            {equiposData.fechaUltimoCheck && (
              <p className="estatusplataforma-data-date">Datos actualizados: {equiposData.fechaUltimoCheck}</p>
            )}

            <div className="estatusplataforma-charts-grid">
              <div className="estatusplataforma-chart-card">
                <h4 className="estatusplataforma-chart-title">Estatus de equipos por cliente</h4>
                <div
                  id="estatusClienteChart"
                  className="estatusplataforma-chart-container"
                  style={{
                    height: '450px',
                    minHeight: '450px',
                    width: '100%'
                  }}
                >
                  <Bar data={estatusClienteChartData} options={chartOptions} />
                </div>
              </div>

              <div className="estatusplataforma-chart-card">
                <h4 className="estatusplataforma-chart-title">Equipos por Plataforma</h4>
                <div id="plataformaChart" className="estatusplataforma-chart-container">
                  <Bar data={plataformaChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="estatusplataforma-table-card">
              <h4 className="estatusplataforma-table-title">Equipos Offline</h4>
              <div className="estatusplataforma-table-container">
                <table className="estatusplataforma-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Nombre</th>
                      <th>Plataforma</th>
                      <th>Reportando</th>
                      <th>Motivo de no Reporte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equiposData.equiposOffline.length > 0 ? (
                      equiposData.equiposOffline.map((equipo, index) => (
                        <tr key={index}>
                          <td>{equipo.cliente}</td>
                          <td>{equipo.nombre}</td>
                          <td>{equipo.plataforma}</td>
                          <td>
                            <span className="estatusplataforma-status-cross">✗</span>
                          </td>
                          <td>{equipo.motivo}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="estatusplataforma-no-data">
                          No hay equipos offline
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="estatusplataforma-pdf-button-container">
              <button className="estatusplataforma-btn estatusplataforma-btn-pdf" onClick={handleGeneratePDF}>
                Crear PDF
              </button>
            </div>
          </section>
        </div>

        <CheckEquiposSidePanel
          isOpen={modals.checkEquipos.isOpen}
          onClose={() => closeModal("checkEquipos")}
          equipos={equiposData.equiposParaCheck}
          equiposData={equiposData}
          setModals={setModals}
          closeModal={closeModal}
          fetchData={fetchData}
          onSaveChecklist={handleSaveChecklist}
          lastCheckTime={lastCheckTime}
          setLastCheckTime={setLastCheckTime}
        />

        <ConfirmarCambioEstatusModal
          isOpen={modals.confirmarCambio.isOpen}
          onClose={() => closeModal("confirmarCambio")}
          onConfirm={modals.confirmarCambio.onConfirm}
          equipoNombre={modals.confirmarCambio.equipoNombre}
          nuevoEstatus={modals.confirmarCambio.nuevoEstatus}
          motivo={modals.confirmarCambio.motivo}
          onMotivoChange={(motivo) =>
            setModals((prev) => ({
              ...prev,
              confirmarCambio: { ...prev.confirmarCambio, motivo },
            }))
          }
        />
      </main>
    </>
  );
};

export default EquiposEstatusPlataforma