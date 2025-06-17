import { useState, useEffect } from "react";
import "./Tratos.css";
import Header from "../Header/Header";
import Swal from "sweetalert2";
import expandIcon from "../../assets/icons/expandir.png";
import contractIcon from "../../assets/icons/contraer.png";
import calendarFilter from "../../assets/icons/calendario3.png";
import deploy from "../../assets/icons/desplegar.png";
import addActivity from "../../assets/icons/agregar.png";
import activityCall from "../../assets/icons/llamada.png";
import activityMeeting from "../../assets/icons/reunion.png";
import activityTask from "../../assets/icons/tarea.png";
import neglectedTreatment from "../../assets/icons/desatendido.png";

// Importar react-datepicker y su CSS
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInMinutes } from "date-fns";
import { useNavigate } from "react-router-dom";
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

// Componente Modal Base
const Modal = ({ isOpen, onClose, title, children, size = "md", canClose = true }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = { sm: "modal-sm", md: "modal-md", lg: "modal-lg", xl: "modal-xl" };

  return (
    <div className="tratos-modal-overlay" onClick={canClose ? onClose : () => { }}>
      <div className={`modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {canClose && <button className="modal-close" onClick={onClose}>✕</button>}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// Modal para seleccionar tipo de actividad
const SeleccionarActividadModal = ({ isOpen, onClose, onSelectActivity, tratoId }) => {
  const handleSelectActivity = (tipo) => {
    onSelectActivity(tipo, tratoId);
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Selecciona el tipo de actividad" size="sm">
      <div className="actividad-selector">
        <button className="btn-actividad-tipo" onClick={() => handleSelectActivity("llamada")}>
          Llamada
        </button>
        <button className="btn-actividad-tipo" onClick={() => handleSelectActivity("reunion")}>
          Reunión
        </button>
        <button className="btn-actividad-tipo" onClick={() => handleSelectActivity("tarea")}>
          Tarea
        </button>
      </div>
    </Modal>
  );
};

// Modal para crear nuevo trato
const NuevoTratoModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombreTrato: "",
    nombreEmpresa: "",
    nombreContacto: "",
    ingresosEsperados: "",
    numeroUnidades: "",
    descripcion: "",
  });
  const [errors, setErrors] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [contactos, setContactos] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombreTrato: "",
        nombreEmpresa: "",
        nombreContacto: "",
        ingresosEsperados: "",
        numeroUnidades: "",
        descripcion: "",
      });
      setErrors({});
      fetchEmpresas();
    }
  }, [isOpen]);

  const fetchEmpresas = async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/empresas`);
      const data = await response.json();
      setEmpresas(data);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar las empresas" });
    }
  };

  const fetchContactos = async (empresaId) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/empresas/${empresaId}/contactos`);
      const data = await response.json();
      setContactos(data);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los contactos" });
    }
  };

  useEffect(() => {
    if (formData.nombreEmpresa) {
      fetchContactos(formData.nombreEmpresa);
    } else {
      setContactos([]);
    }
  }, [formData.nombreEmpresa]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombreTrato.trim()) newErrors.nombreTrato = "Este campo es obligatorio";
    if (!formData.nombreEmpresa) newErrors.nombreEmpresa = "Este campo es obligatorio";
    if (!formData.nombreContacto) newErrors.nombreContacto = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tratoDTO = {
      nombre: formData.nombreTrato,
      empresaId: formData.nombreEmpresa,
      contactoId: formData.nombreContacto,
      ingresosEsperados: formData.ingresosEsperados || null,
      numeroUnidades: formData.numeroUnidades || null,
      descripcion: formData.descripcion,
      fase: "CLASIFICACION",
    };


    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos`, {
        method: "POST",
        body: JSON.stringify(tratoDTO),
      });
      const newTrato = await response.json();
      onSave(newTrato);
      Swal.fire({
        title: "¡Trato creado!",
        text: "El trato se ha creado exitosamente",
        icon: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error al crear el trato:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo crear el trato. Verifica los datos e intenta de nuevo.",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Trato" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="nombreTrato">Nombre trato: <span className="required">*</span></label>
          <input
            type="text"
            id="nombreTrato"
            value={formData.nombreTrato}
            onChange={(e) => handleInputChange("nombreTrato", e.target.value)}
            className={`modal-form-control ${errors.nombreTrato ? "error" : ""}`}
            placeholder="Nombre del trato"
          />
          {errors.nombreTrato && <span className="error-message">{errors.nombreTrato}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="nombreEmpresa">Nombre empresa: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="nombreEmpresa"
              value={formData.nombreEmpresa}
              onChange={(e) => handleInputChange("nombreEmpresa", e.target.value)}
              className={`modal-form-control ${errors.nombreEmpresa ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreEmpresa && <span className="error-message">{errors.nombreEmpresa}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="nombreContacto">Nombre contacto: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="nombreContacto"
              value={formData.nombreContacto}
              onChange={(e) => handleInputChange("nombreContacto", e.target.value)}
              className={`modal-form-control ${errors.nombreContacto ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              {contactos.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>{contacto.nombre}</option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContacto && <span className="error-message">{errors.nombreContacto}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="ingresosEsperados">Ingresos esperados:</label>
          <div className="input-with-prefix">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="ingresosEsperados"
              value={formData.ingresosEsperados}
              onChange={(e) => handleInputChange("ingresosEsperados", e.target.value)}
              className="modal-form-control"
              placeholder="0"
            />
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="numeroUnidades">Número de unidades:</label>
          <input
            type="number"
            id="numeroUnidades"
            value={formData.numeroUnidades}
            onChange={(e) => handleInputChange("numeroUnidades", e.target.value)}
            className="modal-form-control"
            placeholder="0"
          />
        </div>

        <div className="modal-form-group">
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleInputChange("descripcion", e.target.value)}
            className="modal-form-control textarea"
            placeholder="Descripción del trato"
            rows="4"
          />
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary">Agregar trato</button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para programar llamada
const ProgramarLlamadaModal = ({ isOpen, onClose, onSave, tratoId, users, creatorId }) => {
  const [formData, setFormData] = useState({
    asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
    nombreContacto: "",
    fecha: "",
    horaInicio: "",
    finalidad: "",
  });
  const [errors, setErrors] = useState({});
  const [contactos, setContactos] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
        nombreContacto: "",
        fecha: "",
        horaInicio: "",
        finalidad: "",
      }));
      setErrors({});
    }
  }, [isOpen, creatorId, users]);

  const fetchContactos = async (empresaId) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/empresas/${empresaId}/contactos`);
      const data = await response.json();
      setContactos(data);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los contactos" });
    }
  };

  useEffect(() => {
    const fetchEmpresaId = async () => {
      try {
        const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}`);
        const trato = await response.json();
        if (trato.empresaId) fetchContactos(trato.empresaId);
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la empresa del trato" });
      }
    };
    if (isOpen && tratoId) fetchEmpresaId();
  }, [isOpen, tratoId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombreContacto.trim()) newErrors.nombreContacto = "Este campo es obligatorio";
    if (!formData.fecha.trim()) newErrors.fecha = "Este campo es obligatorio";
    if (!formData.horaInicio.trim()) newErrors.horaInicio = "Este campo es obligatorio";
    if (!formData.finalidad.trim()) newErrors.finalidad = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const horaInicio = formData.horaInicio ? `${formData.horaInicio}:00` : '';

    const actividadDTO = {
      tratoId,
      tipo: "LLAMADA",
      asignadoAId: formData.asignadoAId,
      contacto: formData.nombreContacto,
      fechaLimite: formData.fecha,
      horaInicio: horaInicio,
      finalidad: formData.finalidad,
    };



    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/actividades`, {
        method: "POST",
        body: JSON.stringify(actividadDTO),
      });
      const savedActividad = await response.json();
      onSave(savedActividad);
      Swal.fire({
        title: "¡Llamada programada!",
        text: "La llamada se ha programado exitosamente",
        icon: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error al programar la llamada:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programar llamada" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoAId">Asignado a: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoAId"
              value={formData.asignadoAId}
              onChange={(e) => handleInputChange("asignadoAId", e.target.value)}
              className="modal-form-control"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre || user.nombreUsuario} {user.apellidos || ""}
                </option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="nombreContacto">Nombre contacto: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="nombreContacto"
              value={formData.nombreContacto}
              onChange={(e) => handleInputChange("nombreContacto", e.target.value)}
              className={`modal-form-control ${errors.nombreContacto ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              {contactos.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>{contacto.nombre}</option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContacto && <span className="error-message">{errors.nombreContacto}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="fecha">Fecha: <span className="required">*</span></label>
          <input
            type="date"
            id="fecha"
            value={formData.fecha}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            className={`modal-form-control ${errors.fecha ? "error" : ""}`}
          />
          {errors.fecha && <span className="error-message">{errors.fecha}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="hora">Hora: <span className="required">*</span></label>
          <input
            type="time"
            id="horaInicio"
            value={formData.horaInicio}
            onChange={(e) => handleInputChange("horaInicio", e.target.value)}
            className={`modal-form-control ${errors.hora ? "error" : ""}`} // Considera cambiar 'errors.hora' a 'errors.horaInicio' para consistencia
          />
          {errors.hora && <span className="error-message">{errors.hora}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="finalidad">Finalidad: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              <option value="CLASIFICACION">Clasificación</option>
              <option value="PRIMER_CONTACTO">Primer Contacto</option>
              <option value="REUNION">Reunión</option>
              <option value="COTIZACION_PROPUESTA_PRACTICA">Cotización Propuesta/Práctica</option>
              <option value="NEGOCIACION_REVISION">Negociación/Revisión</option>
              <option value="CERRADO_GANADO">Cerrado Ganado</option>
              <option value="RESPUESTA_POR_CORREO">Respuesta por Correo</option>
              <option value="INTERES_FUTURO">Interés Futuro</option>
              <option value="CERRADO_PERDIDO">Cerrado Perdido</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary">Agregar llamada</button>
        </div>
      </form>
    </Modal>
  );
};


// Modal para programar reunión
const ProgramarReunionModal = ({ isOpen, onClose, onSave, tratoId, users, creatorId }) => {
  const [formData, setFormData] = useState({
    asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
    nombreContacto: "",
    fecha: "",
    horaInicio: "",
    duracionHoras: "",
    duracionMinutos: "",
    duracionSegundos: "",
    modalidad: "VIRTUAL",
    finalidad: "",
    lugarReunion: "",
    medio: "",
    enlaceReunion: "",
  });
  const [errors, setErrors] = useState({});
  const [contactos, setContactos] = useState([]);
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
        nombreContacto: "",
        fecha: "",
        horaInicio: "",
        duracionHoras: "",
        duracionMinutos: "",
        duracionSegundos: "",
        modalidad: "VIRTUAL",
        finalidad: "",
        lugarReunion: "",
        medio: "",
        enlaceReunion: "",
      }));
      setErrors({});
      setContactos([]);
      setEmpresa(null);
      if (tratoId) {
        fetchEmpresaDetails(tratoId);
      }
    }
  }, [isOpen, creatorId, users, tratoId]);

  const fetchEmpresaDetails = async (tratoId) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}`);
      const trato = await response.json();
      if (trato.empresaId) {
        const empresaResponse = await fetchWithToken(`${API_BASE_URL}/empresas/${trato.empresaId}`);
        const empresaData = await empresaResponse.json();
        setEmpresa(empresaData);
        fetchContactos(trato.empresaId);
        if (formData.modalidad === "PRESENCIAL" && empresaData.domicilioFisico) {
          setFormData((prev) => ({ ...prev, lugarReunion: empresaData.domicilioFisico }));
        }
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la empresa del trato" });
    }
  };

  const fetchContactos = async (empresaId) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/empresas/${empresaId}/contactos`);
      const data = await response.json();
      setContactos(data);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los contactos" });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // Actualizar lugarReunion si cambia la modalidad y hay una empresa
      if (field === "modalidad" && empresa && empresa.domicilioFisico) {
        if (value === "PRESENCIAL") {
          newData.lugarReunion = empresa.domicilioFisico;
        } else if (value === "VIRTUAL") {
          newData.lugarReunion = "";
          newData.medio = "";
          newData.enlaceReunion = generateMeetingLink(newData.medio);
        }
      }
      if (field === "medio" && value) {
        newData.enlaceReunion = generateMeetingLink(value);
      }
      return newData;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const generateMeetingLink = (medio) => {
    switch (medio) {
      case "MEET":
        return `https://meet.google.com/cnh-rpsw-mqx`;
      case "ZOOM":
        return `https://www.google.com/url?q=https://us05web.zoom.us/j/83706437137?pwd%3DAmRiXhFHbvSDXFxgltRleNbbEtKowA.1&sa=D&source=calendar&usd=2&usg=AOvVaw2h8bBvVUte4lnU393Dxcm3`;
      case "TEAMS":
        return `https://teams.live.com/meet/9340324739042?p=G4J8oZ2D2Nu8aWTJx3`;
      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombreContacto.trim()) newErrors.nombreContacto = "Este campo es obligatorio";
    if (!formData.fecha.trim()) newErrors.fecha = "Este campo es obligatorio";
    if (!formData.horaInicio.trim()) newErrors.horaInicio = "Este campo es obligatorio";
    if (!formData.duracionHoras && !formData.duracionMinutos && !formData.duracionSegundos)
      newErrors.duracion = "Debe especificar al menos una unidad de tiempo";
    if (!formData.modalidad.trim()) newErrors.modalidad = "Este campo es obligatorio";
    if (formData.modalidad === "PRESENCIAL" && !formData.lugarReunion.trim())
      newErrors.lugarReunion = "Lugar es obligatorio para reuniones presenciales";
    if (formData.modalidad === "VIRTUAL" && !formData.medio.trim())
      newErrors.medio = "Medio es obligatorio para reuniones virtuales";
    if (!formData.finalidad.trim()) newErrors.finalidad = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const hours = parseInt(formData.duracionHoras) || 0;
    const minutes = parseInt(formData.duracionMinutos) || 0;
    const seconds = parseInt(formData.duracionSegundos) || 0;

    const duracionStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const horaInicio = formData.horaInicio ? `${formData.horaInicio}:00` : '';

    const actividadDTO = {
      tratoId,
      tipo: "REUNION",
      asignadoAId: formData.asignadoAId,
      contacto: formData.nombreContacto,
      fechaLimite: formData.fecha,
      horaInicio: horaInicio,
      duracion: duracionStr,
      modalidad: formData.modalidad,
      finalidad: formData.finalidad,
      lugarReunion: formData.modalidad === "PRESENCIAL" ? formData.lugarReunion : null,
      medio: formData.modalidad === "VIRTUAL" ? formData.medio : null,
      enlaceReunion: formData.modalidad === "VIRTUAL" ? formData.enlaceReunion : null,
    };

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/actividades`, {
        method: "POST",
        body: JSON.stringify(actividadDTO),
      });
      const savedActividad = await response.json();
      onSave(savedActividad, "REUNION");
      Swal.fire({
        title: "¡Reunión programada!",
        text: "La reunión se ha programada exitosamente",
        icon: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error al programar la reunión:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programar reunión" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoAId">Asignado a: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoAId"
              value={formData.asignadoAId}
              onChange={(e) => handleInputChange("asignadoAId", e.target.value)}
              className="modal-form-control"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre || user.nombreUsuario} {user.apellidos || ""}
                </option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="nombreContacto">Nombre contacto: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="nombreContacto"
              value={formData.nombreContacto}
              onChange={(e) => handleInputChange("nombreContacto", e.target.value)}
              className={`modal-form-control ${errors.nombreContacto ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              {contactos.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>{contacto.nombre}</option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContacto && <span className="error-message">{errors.nombreContacto}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="fecha">Fecha: <span className="required">*</span></label>
          <input
            type="date"
            id="fecha"
            value={formData.fecha}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            className={`modal-form-control ${errors.fecha ? "error" : ""}`}
          />
          {errors.fecha && <span className="error-message">{errors.fecha}</span>}
        </div>

        <div className="modal-form-row">
          <div className="modal-form-group">
            <label htmlFor="horaInicio">Hora inicio: <span className="required">*</span></label>
            <input
              type="time"
              id="horaInicio"
              value={formData.horaInicio}
              onChange={(e) => handleInputChange("horaInicio", e.target.value)}
              className={`modal-form-control ${errors.horaInicio ? "error" : ""}`}
            />
            {errors.horaInicio && <span className="error-message">{errors.horaInicio}</span>}
          </div>

          <div className="modal-form-group">
            <label>Duración: <span className="required">*</span></label>
            <div className="duracion-container">
              <div className="duracion-field">
                <input
                  type="number"
                  value={formData.duracionHoras}
                  onChange={(e) => handleInputChange("duracionHoras", e.target.value)}
                  className="modal-form-control duracion-input"
                  min="0"
                  max="23"
                  placeholder="0"
                />
                <label>Horas</label>
              </div>
              <div className="duracion-field">
                <input
                  type="number"
                  value={formData.duracionMinutos}
                  onChange={(e) => handleInputChange("duracionMinutos", e.target.value)}
                  className="modal-form-control duracion-input"
                  min="0"
                  max="59"
                  placeholder="0"
                />
                <label>Minutos</label>
              </div>
              <div className="duracion-field">
                <input
                  type="number"
                  value={formData.duracionSegundos}
                  onChange={(e) => handleInputChange("duracionSegundos", e.target.value)}
                  className="modal-form-control duracion-input"
                  min="0"
                  max="59"
                  placeholder="0"
                />
                <label>Segundos</label>
              </div>
            </div>
            {errors.duracion && <span className="error-message">{errors.duracion}</span>}
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="modalidad">Modalidad: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="modalidad"
              value={formData.modalidad}
              onChange={(e) => handleInputChange("modalidad", e.target.value)}
              className={`modal-form-control ${errors.modalidad ? "error" : ""}`}
            >
              <option value="VIRTUAL">Virtual</option>
              <option value="PRESENCIAL">Presencial</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.modalidad && <span className="error-message">{errors.modalidad}</span>}
        </div>

        {formData.modalidad === "PRESENCIAL" && (
          <div className="modal-form-group">
            <label htmlFor="lugarReunion">Lugar reunión: <span className="required">*</span></label>
            <input
              type="text"
              id="lugarReunion"
              value={formData.lugarReunion}
              onChange={(e) => handleInputChange("lugarReunion", e.target.value)}
              className={`modal-form-control ${errors.lugarReunion ? "error" : ""}`}
              placeholder="Domicilio físico de la empresa (editable)"
            />
            {errors.lugarReunion && <span className="error-message">{errors.lugarReunion}</span>}
          </div>
        )}

        {formData.modalidad === "VIRTUAL" && (
          <>
            <div className="modal-form-group">
              <label htmlFor="medio">Medio: <span className="required">*</span></label>
              <div className="modal-select-wrapper">
                <select
                  id="medio"
                  value={formData.medio}
                  onChange={(e) => handleInputChange("medio", e.target.value)}
                  className={`modal-form-control ${errors.medio ? "error" : ""}`}
                >
                  <option value="">Ninguna seleccionada</option>
                  <option value="MEET">Google Meet</option>
                  <option value="ZOOM">Zoom</option>
                  <option value="TEAMS">Microsoft Teams</option>
                </select>
                <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
              </div>
              {errors.medio && <span className="error-message">{errors.medio}</span>}
            </div>
            {formData.medio && (
              <div className="modal-form-group">
                <label htmlFor="enlaceReunion">Enlace de la reunión:</label>
                <input
                  type="text"
                  id="enlaceReunion"
                  value={formData.enlaceReunion}
                  readOnly
                  className="modal-form-control"
                />
              </div>
            )}
          </>
        )}

        <div className="modal-form-group">
          <label htmlFor="finalidad">Finalidad: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              <option value="CLASIFICACION">Clasificación</option>
              <option value="PRIMER_CONTACTO">Primer Contacto</option>
              <option value="REUNION">Reunión</option>
              <option value="COTIZACION_PROPUESTA_PRACTICA">Cotización Propuesta/Práctica</option>
              <option value="NEGOCIACION_REVISION">Negociación/Revisión</option>
              <option value="CERRADO_GANADO">Cerrado Ganado</option>
              <option value="RESPUESTA_POR_CORREO">Respuesta por Correo</option>
              <option value="INTERES_FUTURO">Interés Futuro</option>
              <option value="CERRADO_PERDIDO">Cerrado Perdido</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary">Agregar reunión</button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para programar tarea
const ProgramarTareaModal = ({ isOpen, onClose, onSave, tratoId, users, creatorId }) => {
  const [formData, setFormData] = useState({
    asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
    nombreContacto: "",
    fechaLimite: "",
    tipo: "",
    finalidad: "",
  });
  const [errors, setErrors] = useState({});
  const [contactos, setContactos] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
        nombreContacto: "",
        fechaLimite: "",
        tipo: "",
        finalidad: "",
      }));
      setErrors({});
    }
  }, [isOpen, creatorId, users]);

  const fetchContactos = async (empresaId) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/empresas/${empresaId}/contactos`);
      const data = await response.json();
      setContactos(data);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los contactos" });
    }
  };

  useEffect(() => {
    const fetchEmpresaId = async () => {
      try {
        const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}`);
        const trato = await response.json();
        if (trato.empresaId) fetchContactos(trato.empresaId);
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la empresa del trato" });
      }
    };
    if (isOpen && tratoId) fetchEmpresaId();
  }, [isOpen, tratoId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombreContacto.trim()) newErrors.nombreContacto = "Este campo es obligatorio";
    if (!formData.fechaLimite.trim()) newErrors.fechaLimite = "Este campo es obligatorio";
    if (!formData.tipo.trim()) newErrors.tipo = "Este campo es obligatorio";
    if (!formData.finalidad.trim()) newErrors.finalidad = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const actividadDTO = {
      tratoId,
      tipo: "TAREA",
      asignadoAId: formData.asignadoAId,
      contacto: formData.nombreContacto,
      fechaLimite: formData.fechaLimite,
      subtipoTarea: formData.tipo.toUpperCase(),
      finalidad: formData.finalidad,
    };


    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/actividades`, {
        method: "POST",
        body: JSON.stringify(actividadDTO),
      });
      const savedActividad = await response.json();
      onSave(savedActividad);
      Swal.fire({
        title: "¡Tarea programada!",
        text: "La tarea se ha programado exitosamente",
        icon: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error al programar la tarea:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programar tarea" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoAId">Asignado a: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoAId"
              value={formData.asignadoAId}
              onChange={(e) => handleInputChange("asignadoAId", e.target.value)}
              className="modal-form-control"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre || user.nombreUsuario} {user.apellidos || ""}
                </option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="nombreContacto">Nombre contacto: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="nombreContacto"
              value={formData.nombreContacto}
              onChange={(e) => handleInputChange("nombreContacto", e.target.value)}
              className={`modal-form-control ${errors.nombreContacto ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              {contactos.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>{contacto.nombre}</option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContacto && <span className="error-message">{errors.nombreContacto}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="fechaLimite">Fecha límite: <span className="required">*</span></label>
          <input
            type="date"
            id="fechaLimite"
            value={formData.fechaLimite}
            onChange={(e) => handleInputChange("fechaLimite", e.target.value)}
            className={`modal-form-control ${errors.fechaLimite ? "error" : ""}`}
          />
          {errors.fechaLimite && <span className="error-message">{errors.fechaLimite}</span>}
        </div>

        <div className="modal-form-group">
          <label>Tipo: <span className="required">*</span></label>
          <div className="tipo-buttons">
            <button
              type="button"
              className={`btn-tipo ${formData.tipo === "Correo" ? "active" : ""}`}
              onClick={() => handleInputChange("tipo", "Correo")}
            >
              Correo
            </button>
            <button
              type="button"
              className={`btn-tipo ${formData.tipo === "Mensaje" ? "active" : ""}`}
              onClick={() => handleInputChange("tipo", "Mensaje")}
            >
              Mensaje
            </button>
          </div>
          {errors.tipo && <span className="error-message">{errors.tipo}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="finalidad">Finalidad: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              <option value="CLASIFICACION">Clasificación</option>
              <option value="PRIMER_CONTACTO">Primer Contacto</option>
              <option value="REUNION">Reunión</option>
              <option value="COTIZACION_PROPUESTA_PRACTICA">Cotización Propuesta/Práctica</option>
              <option value="NEGOCIACION_REVISION">Negociación/Revisión</option>
              <option value="CERRADO_GANADO">Cerrado Ganado</option>
              <option value="RESPUESTA_POR_CORREO">Respuesta por Correo</option>
              <option value="INTERES_FUTURO">Interés Futuro</option>
              <option value="CERRADO_PERDIDO">Cerrado Perdido</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary">Agregar tarea</button>
        </div>
      </form>
    </Modal>
  );
};

const EmpresaModal = ({ isOpen, onClose, onSave, empresa, users, fetchData, tratoId }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    estatus: "POR_CONTACTAR",
    sitioWeb: "",
    sector: "",
    domicilioFisico: "",
    domicilioFiscal: "",
    rfc: "",
    razonSocial: "",
    regimenFiscal: "",
    propietarioId: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const sectorMap = {
    AGRICULTURA: "(11) Agricultura, cría y explotación de animales, aprovechamiento forestal, pesca y caza",
    MINERIA: "(21) Minería",
    ENERGIA: "(22) Generación, transmisión y distribución de energía eléctrica, suministro de agua y de gas",
    CONSTRUCCION: "(23) Construcción",
    MANUFACTURA: "(31-33) Industrias manufactureras",
    COMERCIO_MAYOR: "(43) Comercio al por mayor",
    COMERCIO_MENOR: "(46) Comercio al por menor",
    TRANSPORTE: "(48-49) Transportes, correos y almacenamiento",
    MEDIOS: "(51) Información en medios masivos",
    FINANCIERO: "(52) Servicios financieros y de seguros",
    INMOBILIARIO: "(53) Servicios inmobiliarios y de alquiler de bienes muebles e intangibles",
    PROFESIONAL: "(54) Servicios profesionales, científicos y técnicos",
    CORPORATIVO: "(55) Corporativos",
    APOYO_NEGOCIOS: "(56) Servicios de apoyo a los negocios y manejo de desechos",
    EDUCACION: "(61) Servicios educativos",
    SALUD: "(62) Servicios de salud y de asistencia social",
    ESPARCIMIENTO: "(71) Servicios de esparcimiento culturales y deportivos",
    ALOJAMIENTO: "(72) Servicios de alojamiento temporal y de preparación de alimentos",
    OTROS_SERVICIOS: "(81) Otros servicios excepto actividades gubernamentales",
    GUBERNAMENTAL: "(93) Actividades legislativas, gubernamentales, de impartición de justicia",
  };

  const regimenFiscalOptions = [
    { clave: "605", descripcion: "Sueldos y Salarios e Ingresos Asimilados a Salarios" },
    { clave: "606", descripcion: "Arrendamiento" },
    { clave: "608", descripcion: "Demás ingresos" },
    { clave: "611", descripcion: "Ingresos por Dividendos (socios y accionistas)" },
    { clave: "612", descripcion: "Personas Físicas con Actividades Empresariales y Profesionales" },
    { clave: "614", descripcion: "Ingresos por intereses" },
    { clave: "615", descripcion: "Régimen de los ingresos por obtención de premios" },
    { clave: "616", descripcion: "Sin obligaciones fiscales" },
    { clave: "621", descripcion: "Incorporación Fiscal" },
    { clave: "622", descripcion: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
    { clave: "626", descripcion: "Régimen Simplificado de Confianza (RESICO)" },
    { clave: "629", descripcion: "De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales" },
    { clave: "630", descripcion: "Enajenación de acciones en bolsa de valores" },
    { clave: "601", descripcion: "General de Ley Personas Morales" },
    { clave: "603", descripcion: "Personas Morales con Fines no Lucrativos" },
    { clave: "607", descripcion: "Régimen de Enajenación o Adquisición de Bienes" },
    { clave: "609", descripcion: "Consolidación" },
    { clave: "620", descripcion: "Sociedades Cooperativas de Producción que optan por Diferir sus Ingresos" },
    { clave: "623", descripcion: "Opcional para Grupos de Sociedades" },
    { clave: "624", descripcion: "Coordinados" },
    { clave: "628", descripcion: "Hidrocarburos" },
  ];

  const sectores = Object.entries(sectorMap).map(([value, label]) => ({ value, label }));
  const estatusOptions = [
    { value: "POR_CONTACTAR", label: "Por Contactar" },
    { value: "EN_PROCESO", label: "En Proceso" },
    { value: "CONTACTAR_MAS_ADELANTE", label: "Contactar Más Adelante" },
    { value: "PERDIDO", label: "Perdido" },
    { value: "CLIENTE", label: "Cliente" },
  ];

  useEffect(() => {
    const fetchEmpresaData = async () => {
      if (isOpen && empresa?.id) {
        setLoading(true);
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/empresas/${empresa.id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const updatedEmpresa = await response.json();
          setFormData({
            nombre: updatedEmpresa.nombre || "",
            estatus: updatedEmpresa.estatus || "POR_CONTACTAR",
            sitioWeb: updatedEmpresa.sitioWeb || "",
            sector: updatedEmpresa.sector || "",
            domicilioFisico: updatedEmpresa.domicilioFisico || "",
            domicilioFiscal: updatedEmpresa.domicilioFiscal || "",
            rfc: updatedEmpresa.rfc || "",
            razonSocial: updatedEmpresa.razonSocial || "",
            regimenFiscal: updatedEmpresa.regimenFiscal || "",
            propietarioId: updatedEmpresa.propietario?.id || null,
          });
        } catch (error) {
          console.error("Error fetching enterprise data:", error); 
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `No se pudo cargar la empresa: ${error.message}`,
          });
        } finally {
          setLoading(false);
        }
      } else {
        setFormData({
          nombre: "",
          estatus: "POR_CONTACTAR",
          sitioWeb: "",
          sector: "",
          domicilioFisico: "",
          domicilioFiscal: "",
          rfc: "",
          razonSocial: "",
          regimenFiscal: "",
          propietarioId: null,
        });
        setErrors({});
      }
    };
    fetchEmpresaData();
  }, [isOpen, empresa?.id]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
  const newErrors = {};
  if (!formData.nombre.trim()) newErrors.nombre = "Este campo es obligatorio";
  if (formData.sitioWeb) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlRegex.test(formData.sitioWeb)) {
      newErrors.sitioWeb = "Este campo debe ser una URL válida (ej. https://ejemplo.com)";
    }
  }
  if (!formData.domicilioFisico.trim()) {
    newErrors.domicilioFisico = "Este campo es obligatorio";
  } else if (!/^[A-Za-z0-9\s,.\-ÁÉÍÓÚáéíóúÑñ]+$/.test(formData.domicilioFisico.trim())) {
    newErrors.domicilioFisico = "Este campo contiene caracteres no permitidos";
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formattedDomicilioFisico = formData.domicilioFisico.endsWith(", México")
      ? formData.domicilioFisico
      : `${formData.domicilioFisico}, México`;

    const empresaData = {
      nombre: formData.nombre,
      estatus: formData.estatus,
      sitioWeb: formData.sitioWeb || null,
      sector: formData.sector || null,
      domicilioFisico: formattedDomicilioFisico,
      domicilioFiscal: formData.domicilioFiscal || null,
      rfc: formData.rfc || null,
      razonSocial: formData.razonSocial || null,
      regimenFiscal: formData.regimenFiscal || null,
      propietarioId: formData.propietarioId || null,
    };

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/empresas/${empresa.id}`, {
        method: "PUT",
        body: JSON.stringify(empresaData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar la empresa");
      }
      const savedEmpresa = await response.json();

      if (tratoId) {
        const faseResponse = await fetchWithToken(
          `${API_BASE_URL}/tratos/${tratoId}/mover-fase?nuevaFase=CERRADO_GANADO`,
          { method: "PUT" }
        );
        if (!faseResponse.ok) {
          throw new Error("No se pudo actualizar la fase del trato");
        }
      }

      onSave(savedEmpresa);
      onClose();
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  const isCliente = formData.estatus === "CLIENTE";
  const isEstatusDisabled = formData.estatus === "CLIENTE";

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Editar Empresa" size="lg" canClose={false}>
        <div className="modal-body">Cargando datos de la empresa...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Empresa" size="lg" canClose={false}>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-row">
          <div className="modal-form-group">
            <label htmlFor="propietario">
              Propietario <span className="required">*</span>
            </label>
            <select
              id="propietario"
              value={formData.propietarioId || ""}
              onChange={(e) => handleInputChange("propietarioId", e.target.value ? Number(e.target.value) : null)}
              className="modal-form-control"
            >
              <option value="">Seleccione un propietario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombreUsuario}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-form-row">
          <div className="modal-form-group">
            <label htmlFor="nombre">
              Nombre <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              className={`modal-form-control ${errors.nombre ? "error" : ""}`}
              placeholder="Nombre comercial de la empresa"
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>

          <div className="modal-form-group">
            <label htmlFor="estatus">
              Estatus <span className="required">*</span>
            </label>
            <select
              id="estatus"
              value={formData.estatus}
              onChange={(e) => handleInputChange("estatus", e.target.value)}
              className="modal-form-control"
              disabled={isEstatusDisabled}
            >
              {estatusOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={isEstatusDisabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-form-row">
          <div className="modal-form-group">
            <label htmlFor="sitioWeb">Sitio Web</label>
            <input
              type="url"
              id="sitioWeb"
              value={formData.sitioWeb}
              onChange={(e) => handleInputChange("sitioWeb", e.target.value)}
              className={`modal-form-control ${errors.sitioWeb ? "error" : ""}`}
              placeholder="https://ejemplo.com"
            />
            {errors.sitioWeb && <span className="error-message">{errors.sitioWeb}</span>}
          </div>

          <div className="modal-form-group">
            <label htmlFor="sector">Sector</label>
            <select
              id="sector"
              value={formData.sector}
              onChange={(e) => handleInputChange("sector", e.target.value)}
              className="modal-form-control"
            >
              <option value="">Seleccione un sector</option>
              {sectores.map((sector) => (
                <option key={sector.value} value={sector.value}>
                  {sector.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-form-row">
          <div className="modal-form-group full-width">
            <label htmlFor="domicilioFisico">
              Domicilio Físico <span className="required">*</span>
            </label>
            <input
              type="text"
              id="domicilioFisico"
              value={formData.domicilioFisico}
              onChange={(e) => handleInputChange("domicilioFisico", e.target.value)}
              className={`modal-form-control ${errors.domicilioFisico ? "error" : ""}`}
              placeholder="Ej: Elefante 175, Villa Magna, 37208 León de los Aldama, Guanajuato, México"
            />
            <small className="help-text">
              Por favor, usa el formato: Calle y Número, Código Postal, Ciudad, Estado, País. Evita detalles como "Local
              X" o "Depto. Y" para una mejor precisión en el mapa.
            </small>
            {errors.domicilioFisico && <span className="error-message">{errors.domicilioFisico}</span>}
          </div>
        </div>

        {isCliente && (
          <>
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label htmlFor="domicilioFiscal">
                  Domicilio Fiscal <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="domicilioFiscal"
                  value={formData.domicilioFiscal}
                  onChange={(e) => handleInputChange("domicilioFiscal", e.target.value)}
                  className={`modal-form-control ${errors.domicilioFiscal ? "error" : ""}`}
                  placeholder="Domicilio fiscal"
                />
                {errors.domicilioFiscal && <span className="error-message">{errors.domicilioFiscal}</span>}
              </div>

              <div className="modal-form-group">
                <label htmlFor="rfc">
                  RFC <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => handleInputChange("rfc", e.target.value.toUpperCase())}
                  className={`modal-form-control ${errors.rfc ? "error" : ""}`}
                  placeholder="RFC de la empresa"
                />
                {errors.rfc && <span className="error-message">{errors.rfc}</span>}
              </div>
            </div>

            <div className="modal-form-row">
              <div className="modal-form-group">
                <label htmlFor="razonSocial">
                  Razón Social <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="razonSocial"
                  value={formData.razonSocial}
                  onChange={(e) => handleInputChange("razonSocial", e.target.value)}
                  className={`modal-form-control ${errors.razonSocial ? "error" : ""}`}
                  placeholder="Razón social"
                />
                {errors.razonSocial && <span className="error-message">{errors.razonSocial}</span>}
              </div>

              <div className="modal-form-group">
                <label htmlFor="regimenFiscal">
                  Régimen Fiscal <span className="required">*</span>
                </label>
                <select
                  id="regimenFiscal"
                  value={formData.regimenFiscal}
                  onChange={(e) => handleInputChange("regimenFiscal", e.target.value)}
                  className={`modal-form-control ${errors.regimenFiscal ? "error" : ""}`}
                >
                  <option value="">Seleccione un régimen fiscal</option>
                  {regimenFiscalOptions.map((option) => (
                    <option key={option.clave} value={option.clave}>
                      {option.clave} - {option.descripcion}
                    </option>
                  ))}
                </select>
                {errors.regimenFiscal && <span className="error-message">{errors.regimenFiscal}</span>}
              </div>
            </div>
          </>
        )}

        <div className="modal-form-actions">
          <button type="button" className="btn btn-secondary" disabled>Cancelar</button>
          <button type="submit" className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
};

const TratoCard = ({ trato, onDragStart, onDragEnd, onTratoClick, onActivityAdded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData("tratoId", trato.id.toString());
    e.dataTransfer.effectAllowed = "move";
    onDragStart && onDragStart(trato);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd && onDragEnd();
  };

  const handleCardClick = (e) => {
    if (!isDragging && !e.target.closest(".trato-activity-icon")) {
      onTratoClick && onTratoClick(trato);
    }
  };

  const getActivityIcon = () => {
    const currentDate = new Date();
    // Caso 1: Trato desatendido
    if (trato.isNeglected) {
      return (
        <img
          src={neglectedTreatment || "/placeholder.svg"}
          alt="Trato Desatendido"
          className="activity-icon neglected"
          onClick={(e) => {
            e.stopPropagation();
            onActivityAdded && onActivityAdded(trato.id);
          }}
        />
      );
    }

    // Caso 2: Sin actividades
    if (!trato.hasActivities || !trato.actividades || trato.actividades.length === 0) {
      return (
        <img
          src={addActivity || "/placeholder.svg"}
          alt="Agregar Actividad"
          className="activity-icon add-activity-btn"
          onClick={(e) => {
            e.stopPropagation();
            onActivityAdded && onActivityAdded(trato.id);
          }}
        />
      );
    }

    // Caso 3: Actividad más cercana
    const nearestActivity = trato.actividades.reduce((closest, current) => {
      const closestDate = closest.fechaLimite ? new Date(closest.fechaLimite) : null;
      const currentDate = current.fechaLimite ? new Date(current.fechaLimite) : null;
      if (!closestDate) return current;
      if (!currentDate) return closest;
      return currentDate < closestDate ? current : closest;
    }, { fechaLimite: null });

    if (!nearestActivity || !nearestActivity.tipo) {
      return (
        <img
          src={addActivity || "/placeholder.svg"}
          alt="Agregar Actividad"
          className="activity-icon add-activity-btn"
          onClick={(e) => {
            e.stopPropagation();
            onActivityAdded && onActivityAdded(trato.id);
          }}
        />
      );
    }

    const activityDate = new Date(nearestActivity.fechaLimite);
    const timeDiff = (activityDate - currentDate) / (1000 * 60 * 60 * 24);
    const isOverdue = timeDiff < 0 && !nearestActivity.fecha_completado;
    const isNearDeadline = timeDiff <= 2 && timeDiff >= 0;

    const iconMap = {
      LLAMADA: activityCall,
      REUNION: activityMeeting,
      TAREA: activityTask,
    };
    const iconSrc = iconMap[nearestActivity.tipo] || addActivity;
    let iconClass = "activity-icon";

    if (isOverdue) iconClass += " activity-vencida";
    else if (isNearDeadline) iconClass += " activity-proxima";

    return (
      <img
        src={iconSrc || "/placeholder.svg"}
        alt={`${nearestActivity.tipo} Programada`}
        className={iconClass}
        onClick={(e) => {
          e.stopPropagation();
          onActivityAdded && onActivityAdded(trato.id);
        }}
      />
    );
  };

  return (
    <div
      className={`trato-card ${isDragging ? "dragging" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      style={{ cursor: isDragging ? "grabbing" : "pointer" }}
    >
      <div className="trato-header">
        <h4 className="trato-nombre">{trato.nombre}</h4>
        <div className="trato-actions">
          <div className="trato-activity-icon">{getActivityIcon()}</div>
        </div>
      </div>
      <div className="trato-details">
        <p><strong>Propietario:</strong> {trato.propietario || "Usuario"}</p>
        <p><strong>Fecha de cierre:</strong> {trato.fechaCierre}</p>
        <p><strong>Nombre empresa:</strong> {trato.empresa || "Empresa Asociada"}</p>
        <p><strong>No. Trato:</strong> {trato.numero || "Sin número"}</p>
      </div>
      {trato.ingresoEsperado && (
        <div className="trato-ingreso">
          <strong>Ingresos esperados $</strong> {trato.ingresoEsperado}
        </div>
      )}
    </div>
  );
};

const Tratos = () => {
  const navigate = useNavigate();
  const [expandedColumns, setExpandedColumns] = useState([]);
  const [selectedUser, setSelectedUser] = useState("Todos los usuarios");
  const [dateRangeText, setDateRangeText] = useState("Rango de fecha del trato");
  const [columnas, setColumnas] = useState([]);
  const [draggedTrato, setDraggedTrato] = useState(null);
  const [users, setUsers] = useState([]);
  const userRol = localStorage.getItem("userRol") || "EMPLEADO";

  const [modals, setModals] = useState({
    empresa: { isOpen: false, empresa: null },
    nuevoTrato: { isOpen: false },
    seleccionarActividad: { isOpen: false, tratoId: null },
    programarLlamada: { isOpen: false, tratoId: null, creatorId: null },
    programarReunion: { isOpen: false, tratoId: null, creatorId: null },
    programarTarea: { isOpen: false, tratoId: null, creatorId: null },
  });

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);


  const fetchData = async () => {
  try {
    const params = new URLSearchParams();
    if (selectedUser  !== "Todos los usuarios") {
      params.append("propietarioId", selectedUser );
    }
    if (startDate) {
      params.append("startDate", startDate.toISOString());
    }
    if (endDate) {
      params.append("endDate", endDate.toISOString());
    }

    const [tratosResponse, usersResponse] = await Promise.all([
      fetchWithToken(`${API_BASE_URL}/tratos/filtrar?${params.toString()}`),
      fetchWithToken(`${API_BASE_URL}/auth/users`),
    ]);

    // Verificar si las respuestas son correctas
    if (!tratosResponse.ok) {
      throw new Error(`Error al cargar tratos: ${tratosResponse.statusText}`);
    }
    if (!usersResponse.ok) {
      throw new Error(`Error al cargar usuarios: ${usersResponse.statusText}`);
    }

    const tratos = await tratosResponse.json();
    const usersData = await usersResponse.json();

    setUsers(usersData);

    const columnasData = [
      { id: 1, nombre: "Clasificación", color: "#E180F4", className: "clasificacion", tratos: [], count: 0 },
      { id: 2, nombre: "Primer contacto", color: "#C680F4", className: "primer-contacto", tratos: [], count: 0 },
      { id: 3, nombre: "Envío de información", color: "#AB80F4", className: "envio-de-informacion", tratos: [], count: 0 },
      { id: 4, nombre: "Reunión", color: "#9280F4", className: "reunion", tratos: [], count: 0 },
      { id: 5, nombre: "Cotización Propuesta", color: "#8098F4", className: "cotizacion-propuesta-practica", tratos: [], count: 0 },
      { id: 6, nombre: "Negociación/Revisión", color: "#80C0F4", className: "negociacion-revision", tratos: [], count: 0 },
      { id: 7, nombre: "Cerrado ganado", color: "#69ED95", className: "cerrado-ganado", tratos: [], count: 0 },
      { id: 8, nombre: "Respuesta por correo", color: "#EFD47B", className: "respuesta-por-correo", tratos: [], count: 0 },
      { id: 9, nombre: "Interés futuro", color: "#FFBC79", className: "interes-futuro", tratos: [], count: 0 },
      { id: 10, nombre: "Cerrado perdido", color: "#FA8585", className: "cerrado-perdido", tratos: [], count: 0 },
    ];

    const currentDate = new Date();
    tratos.forEach((trato) => {
      const lastActivityDate = trato.fechaUltimaActividad ? new Date(trato.fechaUltimaActividad) : new Date(trato.fechaCreacion);
      const minutesInactive = differenceInMinutes(currentDate, lastActivityDate);
      const isNeglected = !trato.hasActivities && minutesInactive > 10080;
      const hasActivities = trato.actividades && trato.actividades.length > 0;
      const columnaClass = trato.fase.toLowerCase().replace(/[_ ]/g, "-");
      const columna = columnasData.find((c) => c.className === columnaClass);
      if (columna) {
        columna.tratos.push({
          id: trato.id,
          nombre: trato.nombre,
          propietario: trato.propietarioNombre || "Usuario",
          fechaCierre: new Date(trato.fechaCierre).toLocaleDateString(),
          empresa: trato.empresaNombre || "Empresa Asociada",
          numero: trato.noTrato || "Sin número",
          ingresoEsperado: trato.ingresosEsperados,
          isNeglected,
          hasActivities,
          actividades: trato.actividades || [],
          lastActivityType: trato.lastActivityType || null,
          creatorId: trato.propietarioId,
          fechaUltimaActividad: lastActivityDate,
        });
        columna.count++;
      }
    });
    setColumnas(columnasData);
  } catch (error) {
    console.error("Error al cargar datos:", error);
    Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los datos" });
  }
};


  useEffect(() => {
    fetchData();
  }, [selectedUser, startDate, endDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setColumnas((prev) => {
        const updatedColumnas = [...prev];
        const currentDate = new Date();
        updatedColumnas.forEach((columna) => {
          columna.tratos = columna.tratos.map((trato) => {
            const lastActivityDate = trato.fechaUltimaActividad ? new Date(trato.fechaUltimaActividad) : new Date(trato.fechaCreacion);
            const minutesInactive = differenceInMinutes(currentDate, lastActivityDate);
            return {
              ...trato,
              isNeglected: !trato.hasActivities && minutesInactive > 10080,
            };
          });
        });
        return updatedColumnas;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      setDateRangeText(`${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`);
    } else if (startDate) {
      setDateRangeText(`${format(startDate, "dd/MM/yyyy")} - Fin de rango`);
    } else {
      setDateRangeText("Rango de fecha del trato");
    }
  }, [startDate, endDate]);

  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({ ...prev, [modalType]: { isOpen: true, ...data } }));
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({ ...prev, [modalType]: { isOpen: false } }));
  };

  const handleToggleColumn = (columnId) => {
    setExpandedColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  };

  const handleCrearTrato = () => {
    openModal("nuevoTrato");
  };

  const handleActivityAdded = (tratoId) => {
    const trato = columnas.flatMap((c) => c.tratos).find((t) => t.id === tratoId);
    openModal("seleccionarActividad", { tratoId, creatorId: trato.creatorId });
  };

  const handleSelectActivity = (tipo, tratoId) => {
    const modalMap = { llamada: "programarLlamada", reunion: "programarReunion", tarea: "programarTarea" };
    const trato = columnas.flatMap((c) => c.tratos).find((t) => t.id === tratoId);
    openModal(modalMap[tipo], { tratoId, creatorId: trato.creatorId });
  };

  const handleSaveNuevoTrato = (newTrato) => {
    setColumnas((prev) => {
      const updatedColumnas = [...prev];
      const columna = updatedColumnas.find((c) => c.className === "clasificacion");
      if (columna && !columna.tratos.some((t) => t.id === newTrato.id)) {
        columna.tratos.push({
          id: newTrato.id,
          nombre: newTrato.nombre,
          propietario: newTrato.propietarioNombre,
          fechaCierre: new Date(newTrato.fechaCierre).toLocaleDateString(),
          empresa: newTrato.empresaNombre,
          numero: newTrato.noTrato,
          ingresoEsperado: newTrato.ingresosEsperados,
          isNeglected: false,
          hasActivities: false,
          lastActivityType: null,
          creatorId: newTrato.propietarioId,
          fechaCreacion: new Date().toISOString(),
        });
        columna.count++;
      }
      return updatedColumnas;
    });
    fetchData();
  };

  const handleSaveActividad = (actividad, tipo) => {
    const tratoId = modals.seleccionarActividad.tratoId;
    setColumnas((prev) =>
      prev.map((columna) => ({
        ...columna,
        tratos: columna.tratos.map((trato) =>
          trato.id === tratoId ? { ...trato, hasActivities: true, lastActivityType: tipo, isNeglected: false, fechaUltimaActividad: new Date().toISOString() } : trato
        ),
      }))
    );
    fetchData();
  };

  const handleDragStart = (trato) => {
    setDraggedTrato(trato);
  };

  const handleDragEnd = () => {
    setDraggedTrato(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

 const handleDrop = async (e, targetColumnId) => {
  e.preventDefault();
  const tratoId = Number.parseInt(e.dataTransfer.getData("tratoId"));
  if (isNaN(tratoId)) {
    console.error("ID del trato no válido al soltar:", e.dataTransfer.getData("tratoId"));
    return;
  }

  const targetColumn = columnas.find((c) => c.id === targetColumnId);
  const sourceColumn = columnas.find((c) => c.tratos.some((t) => t.id === tratoId));
  if (!targetColumn || !sourceColumn || targetColumn.id === sourceColumn.id) return;

  const faseMap = {
    "clasificacion": "CLASIFICACION",
    "primer-contacto": "PRIMER_CONTACTO",
    "envio-de-informacion": "ENVIO_DE_INFORMACION",
    "reunion": "REUNION",
    "cotizacion-propuesta-practica": "COTIZACION_PROPUESTA_PRACTICA",
    "negociacion-revision": "NEGOCIACION_REVISION",
    "cerrado-ganado": "CERRADO_GANADO",
    "respuesta-por-correo": "RESPUESTA_POR_CORREO",
    "interes-futuro": "INTERES_FUTURO",
    "cerrado-perdido": "CERRADO_PERDIDO",
  };

  const nuevaFase = faseMap[targetColumn.className];
  if (!nuevaFase) {
    console.error("Fase no válida:", targetColumn.className);
    Swal.fire({ icon: "error", title: "Error", text: "Fase no válida" });
    return;
  }

  if (nuevaFase === "CERRADO_GANADO") {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}`);
      const trato = await response.json();
      const empresaResponse = await fetchWithToken(`${API_BASE_URL}/empresas/${trato.empresaId}`);
      let empresa = await empresaResponse.json();
      
      
      const updatedEmpresaData = {
        ...empresa,
        estatus: "CLIENTE",
      };
      console.log("Datos enviados:", updatedEmpresaData);
      const updateResponse = await fetchWithToken(`${API_BASE_URL}/empresas/${trato.empresaId}`, {
        method: "PUT",
        body: JSON.stringify(updatedEmpresaData),
      });
      if (!updateResponse.ok) {
        throw new Error("Error acutalizando el estatus de la empresa");
      }
      empresa = await updateResponse.json(); 

      setModals((prev) => ({
        ...prev,
        empresa: { isOpen: true, empresa: empresa, tratoId: tratoId },
      }));
      return;
    } catch (error) {
      console.error("Error fetching or updating empresa data in handleDrop:", error);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar o actualizar la empresa" });
    }
  }

  try {
    const response = await fetchWithToken(
      `${API_BASE_URL}/tratos/${tratoId}/mover-fase?nuevaFase=${nuevaFase}`,
      { method: "PUT" }
    );
    const updatedTrato = await response.json();
    await fetchData();
  } catch (error) {
    console.error("Error moving trato:", error);
    Swal.fire({ icon: "error", title: "Error", text: "No se pudo mover el trato" });
  }
};

  const onChangeDateRange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const handleTratoClick = (trato) => {
  navigate(`/detallestrato/${trato.id}`, { state: { trato } }); 
};

  const allExpanded = expandedColumns.length === columnas.length;
  const handleToggleAllColumns = () => {
    setExpandedColumns(allExpanded ? [] : columnas.map((c) => c.id));
  };

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="tratos-container">
          <div className="tratos-controls">
            <div className="tratos-filters">
              {userRol === "ADMINISTRADOR" && (
                <div className="filter-group">
                  <div className="filter-dropdown">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="user-select"
                    >
                      <option value="Todos los usuarios">Todos los usuarios</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.nombre || user.nombreUsuario || "Sin nombre"} {user.apellidos || ""}
                        </option>
                      ))}
                    </select>
                    <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="icon-deploy" />
                  </div>
                  <span className="filter-legend">Tratos pertenecientes a cada usuario</span>
                </div>
              )}
              <div className="filter-group">
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
                <span className="filter-legend">Filtro de tratos por un rango de tiempo</span>
              </div>
            </div>

            <div className="tratos-actions">
              <button className="btn-toggle-all" onClick={handleToggleAllColumns}>
                {allExpanded ? "Contraer Todos" : "Expandir Todos"}
              </button>
              <button className="btn-crear-trato" onClick={handleCrearTrato}>
                Crear Trato
              </button>
            </div>
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

                <div
                  className="column-content"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, columna.id)}
                >
                  {columna.tratos.length > 0 ? (
                    columna.tratos.map((trato) => (
                      <TratoCard
                        key={trato.id}
                        trato={trato}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onTratoClick={handleTratoClick}
                        onActivityAdded={handleActivityAdded}
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

        <NuevoTratoModal
          isOpen={modals.nuevoTrato.isOpen}
          onClose={() => closeModal("nuevoTrato")}
          onSave={handleSaveNuevoTrato}
        />

        <SeleccionarActividadModal
          isOpen={modals.seleccionarActividad.isOpen}
          onClose={() => closeModal("seleccionarActividad")}
          onSelectActivity={handleSelectActivity}
          tratoId={modals.seleccionarActividad.tratoId}
        />

        <ProgramarLlamadaModal
          isOpen={modals.programarLlamada.isOpen}
          onClose={() => closeModal("programarLlamada")}
          onSave={handleSaveActividad}
          tratoId={modals.programarLlamada.tratoId}
          users={users}
          creatorId={modals.programarLlamada.creatorId}
        />

        <ProgramarReunionModal
          isOpen={modals.programarReunion.isOpen}
          onClose={() => closeModal("programarReunion")}
          onSave={handleSaveActividad}
          tratoId={modals.programarReunion.tratoId}
          users={users}
          creatorId={modals.programarReunion.creatorId}
        />

        <ProgramarTareaModal
          isOpen={modals.programarTarea.isOpen}
          onClose={() => closeModal("programarTarea")}
          onSave={handleSaveActividad}
          tratoId={modals.programarTarea.tratoId}
          users={users}
          creatorId={modals.programarTarea.creatorId}
        />
        <EmpresaModal
          isOpen={modals.empresa.isOpen}
          onClose={() => setModals((prev) => ({ ...prev, empresa: { ...prev.empresa, isOpen: false } }))}
          onSave={(savedEmpresa) => {
            setModals((prev) => ({ ...prev, empresa: { ...prev.empresa, isOpen: false } }));
            fetchData();
          }}
          empresa={modals.empresa.empresa}
          users={users}
          fetchData={fetchData}
          tratoId={modals.empresa.tratoId} 
        />
      </main>
    </>
  );
};

export default Tratos;