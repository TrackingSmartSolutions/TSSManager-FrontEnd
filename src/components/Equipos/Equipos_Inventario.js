import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Equipos_Inventario.css";
import Header from "../Header/Header";
import Swal from "sweetalert2";
import editIcon from "../../assets/icons/editar.png";
import deleteIcon from "../../assets/icons/eliminar.png";
import detailsIcon from "../../assets/icons/lupa.png";
import activateIcon from "../../assets/icons/activar.png";
import renewIcon from "../../assets/icons/renovar.png";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { API_BASE_URL } from "../Config/Config";

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
const Modal = ({ isOpen, onClose, title, children, size = "md", canClose = true }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "inventario-modal-sm",
    md: "inventario-modal-md",
    lg: "inventario-modal-lg",
    xl: "inventario-modal-xl",
  };

  return (
    <div className="inventario-modal-overlay" onClick={canClose ? onClose : () => { }}>
      <div className={`inventario-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="inventario-modal-header">
          <h2 className="inventario-modal-title">{title}</h2>
          {canClose && <button className="inventario-modal-close" onClick={onClose}>✕</button>}
        </div>
        <div className="inventario-modal-body">{children}</div>
      </div>
    </div>
  );
};

// Modal para Agregar/Editar Equipo
const EquipoFormModal = ({ isOpen, onClose, equipo = null, onSave, modelos, equipos, proveedores, clientes }) => {
  const [formData, setFormData] = useState({
    imei: "",
    nombre: "",
    modeloId: "",
    clienteId: null,
    clienteDefault: null,
    proveedorId: "",
    tipo: "ALMACEN",
    estatus: "INACTIVO",
    tipoActivacion: "ANUAL",
    plataforma: "TRACK_SOLID",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (equipo) {
        setFormData({
          imei: equipo.imei || "",
          nombre: equipo.nombre || "",
          modeloId: equipo.modeloId || "",
          clienteId: equipo.clienteId || null,
          clienteDefault: equipo.clienteDefault || null,
          proveedorId: equipo.proveedorId || "",
          tipo: equipo.tipo || "ALMACEN",
          estatus: equipo.estatus || "INACTIVO",
          tipoActivacion: equipo.tipoActivacion || "ANUAL",
          plataforma: equipo.plataforma || "TRACK_SOLID",
        });
        if (equipo.clienteId === null && equipo.clienteDefault) {
          setFormData((prev) => ({
            ...prev,
            clienteId: equipo.clienteDefault,
          }));
        }
      } else {
        setFormData({
          imei: "",
          nombre: "",
          modeloId: "",
          clienteId: null,
          clienteDefault: null,
          proveedorId: "",
          tipo: "ALMACEN",
          estatus: "INACTIVO",
          tipoActivacion: "ANUAL",
          plataforma: "TRACK_SOLID",
        });
      }
      setErrors({});
    }
  }, [isOpen, equipo]);

  useEffect(() => {
    if (formData.modeloId && formData.imei && !equipo) {
      if (formData.imei.length >= 5) {
        const ultimosCincoDigitos = formData.imei.slice(-5);
        const modeloNombre = modelos.find(m => m.id === parseInt(formData.modeloId))?.nombre || "";
        const nombreGenerado = `${modeloNombre}-${ultimosCincoDigitos}`;
        setFormData((prev) => ({ ...prev, nombre: nombreGenerado }));
      }
    }
  }, [formData.modeloId, formData.imei, equipo, modelos]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.imei.trim()) newErrors.imei = "El IMEI es obligatorio";
    else if (!/^\d{15}$/.test(formData.imei.trim())) newErrors.imei = "El IMEI debe tener exactamente 15 dígitos";
    else {
      const isDuplicate = equipos.some((e) =>
        e.imei === formData.imei && (!equipo || e.id !== equipo.id)
      );
      if (isDuplicate) newErrors.imei = "El IMEI ya está en uso por otro equipo";
    }
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.modeloId) newErrors.modeloId = "El modelo es obligatorio";
    if (!formData.proveedorId) newErrors.proveedorId = "El proveedor es obligatorio";
    if (!formData.tipo) newErrors.tipo = "El tipo es obligatorio";
    if (!formData.estatus) newErrors.estatus = "El estatus es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const url = equipo ? `${API_BASE_URL}/equipos/${equipo.id}` : `${API_BASE_URL}/equipos`;
        const method = equipo ? "PUT" : "POST";
        const submitData = { ...formData };
        if (submitData.clienteId === "AG" || submitData.clienteId === "BN" || submitData.clienteId === "PERDIDO") {
          submitData.clienteDefault = submitData.clienteId;
          submitData.clienteId = null;
        }
        const response = await fetchWithToken(url, {
          method,
          body: JSON.stringify(submitData),
        });
        const savedEquipo = await response.json();
        onSave(savedEquipo);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      }
      onClose();
    }
  };


  const isTipoActivacionDisabled = formData.estatus === "INACTIVO";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipo ? "Editar equipo" : "Nuevo equipo"} size="md">
      <form onSubmit={handleSubmit} className="inventario-form">
        <div className="inventario-form-group">
          <label htmlFor="imei" className="inventario-form-label">IMEI <span className="required"> *</span></label>
          <input
            type="text"
            id="imei"
            name="imei"
            value={formData.imei}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.imei ? "inventario-form-control-error" : ""}`}
            placeholder="Ingrese el IMEI (15 dígitos)"
            maxLength="15"
          />
          {errors.imei && <span className="inventario-form-error">{errors.imei}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="modeloId" className="inventario-form-label">Modelo <span className="required"> *</span></label>
          <select
            id="modeloId"
            name="modeloId"
            value={formData.modeloId}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.modeloId ? "inventario-form-control-error" : ""}`}
          >
            <option value="">Seleccione un modelo</option>
            {modelos.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          {errors.modeloId && <span className="inventario-form-error">{errors.modeloId}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="nombre" className="inventario-form-label">Nombre <span className="required"> *</span></label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.nombre ? "inventario-form-control-error" : ""}`}
            placeholder="Nombre del equipo"
          />
          <small className="inventario-help-text">Se genera automáticamente como "[Modelo] + últimos 5 dígitos del IMEI" al crear, pero es editable</small>
          {errors.nombre && <span className="inventario-form-error">{errors.nombre}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="clienteId" className="inventario-form-label">Cliente</label>
          <select
            id="clienteId"
            name="clienteId"
            value={formData.clienteId || ""}
            onChange={handleInputChange}
            className="inventario-form-control"
          >
            <option value="">Seleccione un cliente</option>
            <option value="AG">AG</option>
            <option value="BN">BN</option>
            <option value="PERDIDO">PERDIDO</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="inventario-form-group">
          <label htmlFor="proveedorId" className="inventario-form-label">Proveedor <span className="required"> *</span></label>
          <select
            id="proveedorId"
            name="proveedorId"
            value={formData.proveedorId}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.proveedorId ? "inventario-form-control-error" : ""}`}
          >
            <option value="">Seleccione un proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          {errors.proveedorId && <span className="inventario-form-error">{errors.proveedorId}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="tipo" className="inventario-form-label">Tipo <span className="required"> *</span></label>
          <select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.tipo ? "inventario-form-control-error" : ""}`}
          >
            <option value="ALMACEN">Almacen</option>
            <option value="DEMO">Demo</option>
            <option value="VENDIDO">Vendido</option>
          </select>
          {errors.tipo && <span className="inventario-form-error">{errors.tipo}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="estatus" className="inventario-form-label">Estatus <span className="required"> *</span></label>
          <select
            id="estatus"
            name="estatus"
            value={formData.estatus}
            onChange={handleInputChange}
            className={`inventario-form-control ${errors.estatus ? "inventario-form-control-error" : ""}`}
          >
            <option value="INACTIVO">Inactivo</option>
            <option value="ACTIVO">Activo</option>
          </select>
          {errors.estatus && <span className="inventario-form-error">{errors.estatus}</span>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="tipoActivacion" className="inventario-form-label">Tipo Activación <span className="required"> *</span></label>
          <select
            id="tipoActivacion"
            name="tipoActivacion"
            value={formData.tipoActivacion}
            onChange={handleInputChange}
            className="inventario-form-control"
            disabled={isTipoActivacionDisabled}
          >
            <option value="ANUAL">Anual</option>
            <option value="VITALICIA">Vitalicia</option>
          </select>
          {isTipoActivacionDisabled && <small className="inventario-help-text">Deshabilitado cuando el estatus es "INACTIVO"</small>}
        </div>

        <div className="inventario-form-group">
          <label htmlFor="plataforma" className="inventario-form-label">Plataforma <span className="required"> *</span></label>
          <select
            id="plataforma"
            name="plataforma"
            value={formData.plataforma}
            onChange={handleInputChange}
            className="inventario-form-control"
          >
            <option value="TRACK_SOLID">Track Solid</option>
            <option value="WHATSGPS">Whats GPS</option>
            <option value="TRACKERKING">Trackerking</option>
            <option value="JOINTCLOUD">Joint Cloud</option>
          </select>
        </div>

        <div className="inventario-form-actions">
          <button type="button" onClick={onClose} className="inventario-btn inventario-btn-cancel">Cancelar</button>
          <button type="submit" className="inventario-btn inventario-btn-primary">{equipo ? "Guardar cambios" : "Agregar"}</button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Detalles de Equipo
const DetallesEquipoModal = ({ isOpen, onClose, equipo, modelos, proveedores, clientes, sims }) => {
  if (!equipo) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(`${dateString}T00:00:00-06:00`);
    return date.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles equipo" size="md">
      <div className="inventario-detalles-content">
        <div className="inventario-detalles-grid">
          <div className="inventario-detalle-item"><label>IMEI:</label><span>{equipo.imei || "N/A"}</span></div>
          <div className="inventario-detalle-item"><label>Nombre:</label><span>{equipo.nombre || "N/A"}</span></div>
          <div className="inventario-detalle-item"><label>Modelo:</label><span>{equipo.modeloId ? modelos.find(m => m.id === equipo.modeloId)?.nombre : "N/A"}</span></div>
          <div className="inventario-detalle-item"><label>Cliente:</label><span>
            {equipo.clienteId ? (
              clientes.find(c => c.id === equipo.clienteId)?.nombre || equipo.clienteId
            ) : equipo.clienteDefault ? (
              equipo.clienteDefault
            ) : (
              "N/A"
            )}
          </span></div>
          <div className="inventario-detalle-item"><label>Proveedor:</label><span>{equipo.proveedorId ? proveedores.find(p => p.id === equipo.proveedorId)?.nombre : "N/A"}</span></div>
          <div className="inventario-detalle-item"><label>Tipo:</label><span>{equipo.tipo || "N/A"}</span></div>
          <div className="inventario-detalle-item"><label>Estatus:</label><span>{equipo.estatus || "N/A"}</span></div>
          <div className="inventario-detalle-item"><label>Tipo Activación:</label><span>{equipo.tipoActivacion || "N/A"}</span></div>
          <div className="inventario-detalle-item"><label>Fecha activación:</label><span>{formatDate(equipo.fechaActivacion)}</span></div>
          <div className="inventario-detalle-item"><label>Fecha expiración:</label><span>{formatDate(equipo.fechaExpiracion)}</span></div>
          <div className="inventario-detalle-item"><label>Plataforma:</label><span>{equipo.plataforma || "N/A"}</span></div>
          <div className="inventario-detalle-item"><label>SIM Referenciada:</label><span>{equipo.simReferenciada ? sims.find(s => s.id === equipo.simReferenciada.id)?.numero : "N/A"}</span></div>
        </div>
        <div className="inventario-form-actions">
          <button type="button" onClick={onClose} className="inventario-btn inventario-btn-primary">Cerrar</button>
        </div>
      </div>
    </Modal>
  );
};

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, onConfirm, equipo, hasSimVinculada = false }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={hasSimVinculada ? "Error al eliminar registro" : "Confirmar eliminación"} size="sm">
      <div className="inventario-confirmar-eliminacion">
        {hasSimVinculada ? (
          <div className="inventario-warning-content">
            <p className="inventario-warning-message">No se puede eliminar el equipo porque tiene una SIM vinculada. Desvincule la SIM primero.</p>
            <div className="inventario-form-actions">
              <button type="button" onClick={onClose} className="inventario-btn inventario-btn-primary">Continuar</button>
            </div>
          </div>
        ) : (
          <div className="inventario-confirmation-content">
            <p className="inventario-confirmation-message">¿Seguro que quieres eliminar este equipo?</p>
            <div className="inventario-form-actions">
              <button type="button" onClick={onClose} className="inventario-btn inventario-btn-cancel">Cancelar</button>
              <button type="button" onClick={handleConfirm} className="inventario-btn inventario-btn-confirm">Confirmar</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Modal de Confirmación de Activación
const ConfirmarActivacionModal = ({ isOpen, onClose, onConfirm, equipo }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar activación" size="sm">
      <div className="inventario-confirmar-eliminacion">
        <div className="inventario-confirmation-content">
          <p className="inventario-confirmation-message">¿Seguro que quieres activar el equipo?</p>
          <div className="inventario-form-actions">
            <button type="button" onClick={onClose} className="inventario-btn inventario-btn-cancel">Cancelar</button>
            <button type="button" onClick={handleConfirm} className="inventario-btn inventario-btn-primary">Confirmar</button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Componente Principal
const EquiposInventario = () => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [sims, setSims] = useState([]);
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [filterNombre, setFilterNombre] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [modals, setModals] = useState({
    form: { isOpen: false, equipo: null },
    detalles: { isOpen: false, equipo: null },
    confirmDelete: { isOpen: false, equipo: null, hasSimVinculada: false },
    confirmActivate: { isOpen: false, equipo: null },
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const tipoFilterOptions = [
    { value: "", label: "Todos los tipos" },
    { value: "ALMACEN", label: "Almacen" },
    { value: "DEMO", label: "Demo" },
    { value: "VENDIDO", label: "Vendido" },
  ];

  const clienteFilterOptions = [
    { value: "", label: "Todos los clientes" },
    { value: "AG", label: "AG" },
    { value: "BN", label: "BN" },
    { value: "PERDIDO", label: "PERDIDO" },
    ...clientes
      .map(cliente => ({ value: cliente.id, label: cliente.nombre }))
      .sort((a, b) => a.label.localeCompare(b.label))
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [equiposResponse, modelosResponse, proveedoresResponse, empresasResponse, simsResponse] = await Promise.all([
        fetchWithToken(`${API_BASE_URL}/equipos`),
        fetchWithToken(`${API_BASE_URL}/modelos`),
        fetchWithToken(`${API_BASE_URL}/proveedores`),
        fetchWithToken(`${API_BASE_URL}/empresas`),
        fetchWithToken(`${API_BASE_URL}/sims`),
      ]);
      const equiposData = await equiposResponse.json();
      const modelosData = await modelosResponse.json();
      setEquipos(equiposData);
      setModelos(modelosData); // Asegúrate de que modelos se actualice
      setProveedores(await proveedoresResponse.json());
      const empresas = await empresasResponse.json();
      const filteredClientes = empresas.filter(emp => ["CLIENTE", "EN_PROCESO"].includes(emp.estatus));
      setClientes(filteredClientes);
      setSims(await simsResponse.json());
      // No llames a generateChartData aquí, lo manejaremos en useEffect
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

  // Generar la gráfica cuando cambien equipos o modelos
  useEffect(() => {
    if (equipos.length > 0 && modelos.length > 0) {
      generateChartData();
    }
  }, [equipos, modelos]);

  const generateChartData = () => {
    const usos = [...new Set(equipos.map(e => {
      const modelo = modelos.find(m => m.id === e.modeloId);
      return modelo ? modelo.uso : "Desconocido";
    }))].filter(uso => uso !== "Desconocido");

    const tipos = ["ALMACEN", "DEMO", "VENDIDO"];

    // Inicializar datos para cada tipo
    const datasets = tipos.map(tipo => ({
      label: tipo,
      data: usos.map(() => 0),
      backgroundColor: tipo === "ALMACEN" ? "#2563eb" : tipo === "DEMO" ? "#f59e0b" : "#10b981",
    }));

    // Contar equipos por uso y tipo
    equipos.forEach(equipo => {
      const modelo = modelos.find(m => m.id === equipo.modeloId);
      const uso = modelo ? modelo.uso : "Desconocido";
      const tipo = equipo.tipo;
      const usoIndex = usos.indexOf(uso);
      const tipoIndex = tipos.indexOf(tipo);
      if (usoIndex !== -1 && tipoIndex !== -1) {
        datasets[tipoIndex].data[usoIndex]++;
      }
    });

    // Filtrar datasets vacíos y actualizar chartData
    const filteredDatasets = datasets.filter(dataset => dataset.data.some(value => value > 0));
    const newChartData = {
      labels: usos,
      datasets: filteredDatasets,
    };
    setChartData(newChartData);
  };

  const filteredEquipos = equipos.filter((equipo) => {
    const matchesTipo = !filterTipo || equipo.tipo === filterTipo;
    const matchesCliente = !filterCliente ||
      (equipo.clienteId && equipo.clienteId.toString() === filterCliente) ||
      (equipo.clienteDefault && equipo.clienteDefault === filterCliente);
    const matchesNombre = !filterNombre ||
      equipo.nombre?.toLowerCase().includes(filterNombre.toLowerCase()) ||
      equipo.imei?.includes(filterNombre);
    return matchesTipo && matchesCliente && matchesNombre;
  });

  const needsRenewal = (equipo) => {
    if (!equipo.fechaExpiracion || equipo.estatus !== "ACTIVO") return false;
    const today = new Date();
    const expirationDate = new Date(equipo.fechaExpiracion);
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration >= 0;
  };

  const isExpired = (equipo) => {
    if (!equipo.fechaExpiracion) return false;
    const today = new Date();
    const expirationDate = new Date(equipo.fechaExpiracion);
    return expirationDate < today;
  };

  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({ ...prev, [modalType]: { isOpen: true, ...data } }));
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({ ...prev, [modalType]: { isOpen: false } }));
  };

  const handleMenuNavigation = (menuItem) => {
    switch (menuItem) {
      case "estatus-plataforma": navigate("/equipos_estatusplataforma"); break;
      case "modelos": navigate("/equipos_modelos"); break;
      case "proveedores": navigate("/equipos_proveedores"); break;
      case "inventario": navigate("/equipos_inventario"); break;
      case "sim": navigate("/equipos_sim"); break;
      default: break;
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveEquipo = (equipoData) => {
    if (isSaving) return;
    setIsSaving(true);

    fetchData()
      .then(() => {
        setEquipos((prev) =>
          equipoData.id
            ? prev.map((e) => (e.id === equipoData.id ? equipoData : e))
            : [...prev, equipoData]
        );
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: equipoData.id ? "Equipo actualizado correctamente" : "Equipo agregado correctamente",
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleDeleteEquipo = () => {
    const equipoId = modals.confirmDelete.equipo?.id;
    fetchWithToken(`${API_BASE_URL}/equipos/${equipoId}`, { method: "DELETE" })
      .then(() => {
        setEquipos((prev) => prev.filter((e) => e.id !== equipoId));
        generateChartData(equipos.filter((e) => e.id !== equipoId));
        Swal.fire({ icon: "success", title: "Éxito", text: "Equipo eliminado correctamente" });
      })
      .catch((error) => Swal.fire({ icon: "error", title: "Error", text: error.message }));
    closeModal("confirmDelete");
  };

  const handleActivateEquipo = (equipoId) => {
    const equipo = equipos.find((e) => e.id === equipoId);
    if (equipo) openModal("confirmActivate", { equipo });
  };

  const handleConfirmActivateEquipo = () => {
    const equipoId = modals.confirmActivate.equipo?.id;
    fetchWithToken(`${API_BASE_URL}/equipos/${equipoId}/activar`, { method: "POST" })
      .then(() => fetchData())
      .then(() => Swal.fire({ icon: "success", title: "Éxito", text: "Equipo activado correctamente" }))
      .catch((error) => Swal.fire({ icon: "error", title: "Error", text: error.message }));
  };

  const handleRenewEquipo = (equipoId) => {
    fetchWithToken(`${API_BASE_URL}/equipos/${equipoId}/renovar`, { method: "POST" })
      .then(() => fetchData())
      .then(() => Swal.fire({ icon: "success", title: "Éxito", text: "Equipo renovado correctamente" }))
      .catch((error) => Swal.fire({ icon: "error", title: "Error", text: error.message }));
  };


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
      title: { display: true, text: "Equipos por Tipo y Uso", font: { size: 16, weight: "bold" }, padding: { bottom: 20 } },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 10 } } },
  };

  return (
    <>
      <Header />
      {isLoading && (
        <div className="inventario-loading">
          <div className="spinner"></div>
          <p>Cargando inventario de equipos...</p>
        </div>
      )}
      <main className="inventario-main-content">
        <div className="inventario-container">
          <section className="inventario-sidebar">
            <div className="inventario-sidebar-header">
              <h3 className="inventario-sidebar-title">Equipos</h3>
            </div>
            <div className="inventario-sidebar-menu">
              <div className="inventario-menu-item" onClick={() => handleMenuNavigation("estatus-plataforma")}>Estatus plataforma</div>
              <div className="inventario-menu-item" onClick={() => handleMenuNavigation("modelos")}>Modelos</div>
              <div className="inventario-menu-item" onClick={() => handleMenuNavigation("proveedores")}>Proveedores</div>
              <div className="inventario-menu-item inventario-menu-item-active" onClick={() => handleMenuNavigation("inventario")}>Inventario de equipos</div>
              <div className="inventario-menu-item" onClick={() => handleMenuNavigation("sim")}>SIM</div>
            </div>
          </section>

          <section className="inventario-content-panel">
            <div className="inventario-header">
              <h3 className="inventario-page-title">Inventario de equipos</h3>
              <p className="inventario-subtitle">Gestión de inventario de equipos</p>
            </div>

            <div className="inventario-chart-card">
              <div className="inventario-chart-container">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="inventario-table-card">
              <div className="inventario-table-header">
                <h4 className="inventario-table-title">Inventario de Equipos</h4>
                <div className="inventario-table-controls">
                  <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="inventario-filter-select">
                    {tipoFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={filterNombre}
                    onChange={(e) => setFilterNombre(e.target.value)}
                    placeholder="Buscar por nombre o IMEI..."
                    className="inventario-filter-input"
                  />

                  <select value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} className="inventario-filter-select">
                    {clienteFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button className="inventario-btn inventario-btn-primary" onClick={() => openModal("form", { equipo: null })}>Agregar equipo</button>
                </div>
              </div>

              <div className="inventario-table-container">
                <table className="inventario-table">
                  <thead>
                    <tr>
                      <th>IMEI</th>
                      <th>Nombre</th>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th>Estatus</th>
                      <th>SIM</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipos.length > 0 ? (
                      filteredEquipos.map((equipo) => (
                        <tr key={equipo.id}>
                          <td>{equipo.imei}</td>
                          <td>{equipo.nombre}</td>
                          <td>
                            {equipo.clienteId ? (
                              clientes.find(c => c.id === equipo.clienteId)?.nombre || equipo.clienteId
                            ) : equipo.clienteDefault ? (
                              equipo.clienteDefault
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>{equipo.tipo}</td>
                          <td>
                            <span className={`inventario-status-badge inventario-status-${isExpired(equipo) ? "expirado" : equipo.estatus?.toLowerCase()}`}>
                              {isExpired(equipo) ? "Expirado" : equipo.estatus}
                            </span>
                          </td>
                          <td>{equipo.simReferenciada ? sims.find(s => s.id === equipo.simReferenciada.id)?.numero : "N/A"}</td>
                          <td>
                            <div className="inventario-action-buttons">
                              <button className="inventario-btn-action inventario-edit" onClick={() => openModal("form", { equipo })} title="Editar">
                                <img src={editIcon || "/placeholder.svg"} alt="Editar" />
                              </button>
                              <button className="inventario-btn-action inventario-delete" onClick={() => {
                                const hasSimVinculada = equipo.simReferenciada !== null;
                                openModal("confirmDelete", { equipo, hasSimVinculada });
                              }} title="Eliminar">
                                <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" />
                              </button>
                              <button className="inventario-btn-action inventario-details" onClick={() => openModal("detalles", { equipo })} title="Detalles">
                                <img src={detailsIcon || "/placeholder.svg"} alt="Detalles" />
                              </button>
                              {equipo.estatus === "INACTIVO" && (
                                <button className="inventario-btn inventario-btn-activate" onClick={() => handleActivateEquipo(equipo.id)} title="Activar">
                                  <img src={activateIcon || "/placeholder.svg"} alt="Activar" className="inventario-action-icon" /> Activar
                                </button>
                              )}
                              {needsRenewal(equipo) && (
                                <button className="inventario-btn inventario-btn-renew" onClick={() => handleRenewEquipo(equipo.id)} title="Renovar">
                                  <img src={renewIcon || "/placeholder.svg"} alt="Renovar" className="inventario-action-icon" /> Renovar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="inventario-no-data">No se encontraron equipos</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <EquipoFormModal
          isOpen={modals.form.isOpen}
          onClose={() => closeModal("form")}
          onSave={handleSaveEquipo}
          equipo={modals.form.equipo}
          modelos={modelos}
          proveedores={proveedores}
          clientes={clientes}
          equipos={equipos}
        />

        <DetallesEquipoModal
          isOpen={modals.detalles.isOpen}
          onClose={() => closeModal("detalles")}
          equipo={modals.detalles.equipo}
          modelos={modelos}
          proveedores={proveedores}
          clientes={clientes}
          sims={sims}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmDelete.isOpen}
          onClose={() => closeModal("confirmDelete")}
          onConfirm={handleDeleteEquipo}
          equipo={modals.confirmDelete.equipo}
          hasSimVinculada={modals.confirmDelete.hasSimVinculada}
        />

        <ConfirmarActivacionModal
          isOpen={modals.confirmActivate.isOpen}
          onClose={() => closeModal("confirmActivate")}
          onConfirm={handleConfirmActivateEquipo}
          equipo={modals.confirmActivate.equipo}
        />
      </main>
    </>
  );
};

export default EquiposInventario