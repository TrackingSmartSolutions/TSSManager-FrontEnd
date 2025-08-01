import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import "./DetallesTrato.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import phoneIcon from "../../assets/icons/llamada.png"
import whatsappIcon from "../../assets/icons/whatsapp.png"
import emailIcon from "../../assets/icons/correo.png"
import addIcon from "../../assets/icons/agregar.png"
import taskIcon from "../../assets/icons/tarea.png"
import callIcon from "../../assets/icons/llamada.png"
import meetingIcon from "../../assets/icons/reunion.png"
import deleteIcon from "../../assets/icons/eliminar.png"
import editIcon from "../../assets/icons/editar.png"
import checkIcon from "../../assets/icons/ganado.png"
import closeIcon from "../../assets/icons/perdido.png"
import attachIcon from "../../assets/icons/adjunto-archivo.png";
import deploy from "../../assets/icons/desplegar.png"
import { API_BASE_URL } from "../Config/Config";

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
  return response;
};


const fetchTrato = async (id) => {
  try {
    const response = await fetchWithToken(`${API_BASE_URL}/tratos/${id}`);
    if (!response.ok) throw new Error(`Error fetching trato: ${response.status} - ${response.statusText}`);
    const data = await response.json();
    if (!data || !data.id) {
      throw new Error('Datos del trato incompletos');
    }
    return data;
  } catch (error) {
    console.error('Error fetching trato:', error);
    throw error;
  }
};

// Modal Base para DetallesTrato
const DetallesTratoModal = ({ isOpen, onClose, title, children, size = "md", canClose = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: "modal-sm",
    md: "modal-md",
    lg: "modal-lg",
    xl: "modal-xl",
  }

  return (
    <div className="detalles-trato-modal-overlay" onClick={canClose ? onClose : () => { }}>
      <div className={`modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {canClose && (
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// Modal para seleccionar tipo de actividad
const SeleccionarActividadModal = ({ isOpen, onClose, onSelectActivity }) => {
  const handleSelectActivity = (tipo) => {
    onSelectActivity(tipo)
    onClose()
  }

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Selecciona el tipo de actividad" size="sm">
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
    </DetallesTratoModal>
  )
}

const generateMeetingLink = (medio) => {
  switch (medio) {
    case "MEET":
      return `https://meet.google.com/cnh-rpsw-mqx`;
    case "ZOOM":
      return `https://us05web.zoom.us/j/83706437137?pwd=AmRiXhFHbvSDXFxgltRleNbbEtKowA.1`;
    case "TEAMS":
      return `https://teams.live.com/meet/9340324739042?p=G4J8oZ2D2Nu8aWTJx3`;
    default:
      return "";
  }
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
      const fetchTrato = async () => {
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}`);
          const trato = await response.json();
          const defaultContactName = trato.contacto?.nombre || "";
          setFormData({
            asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
            nombreContacto: defaultContactName,
            fecha: "",
            horaInicio: "",
            finalidad: "",
          });
          setErrors({});
          if (trato.empresaId) fetchContactos(trato.empresaId);
        } catch (error) {
          Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar el trato" });
        }
      };
      if (tratoId) fetchTrato();
    }
  }, [isOpen, creatorId, users, tratoId]);

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
    const currentDate = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (!formData.nombreContacto.trim()) newErrors.nombreContacto = "Este campo es obligatorio";
    if (!formData.fecha.trim()) newErrors.fecha = "Este campo es obligatorio";
    else if (formData.fecha < currentDate) newErrors.fecha = "La fecha no puede ser en el pasado";
    else if (formData.fecha === currentDate && formData.horaInicio && formData.horaInicio < currentTime)
      newErrors.horaInicio = "La hora no puede ser en el pasado";
    if (!formData.horaInicio.trim()) newErrors.horaInicio = "Este campo es obligatorio";
    if (!formData.finalidad.trim()) newErrors.finalidad = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [conflictoHorario, setConflictoHorario] = useState("");

  const verificarConflictoHorario = async (fecha, hora, duracion = null) => {
    if (!fecha || !hora || !formData.asignadoAId) {
      setConflictoHorario("");
      return false;
    }

    try {
      const params = new URLSearchParams({
        asignadoAId: formData.asignadoAId,
        fecha: fecha,
        hora: hora + ":00"
      });

      if (duracion) {
        params.append('duracion', duracion);
      }

      const response = await fetchWithToken(
        `${API_BASE_URL}/tratos/verificar-conflicto-horario?${params}`
      );

      const data = await response.json();

      if (data.hayConflicto) {
        setConflictoHorario("Ya existe una actividad programada en este horario para el usuario asignado.");
        return true;
      } else {
        setConflictoHorario("");
        return false;
      }
    } catch (error) {
      console.error("Error verificando conflicto:", error);
      return false;
    }
  };

  useEffect(() => {
    if (formData.fecha && formData.horaInicio && formData.asignadoAId) {
      const timeoutId = setTimeout(() => {
        verificarConflictoHorario(formData.fecha, formData.horaInicio, formData.duracion);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.fecha, formData.horaInicio, formData.asignadoAId, formData.duracion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Verificar conflicto antes de enviar
    const hayConflicto = await verificarConflictoHorario(
      formData.fecha,
      formData.horaInicio,
      formData.duracion
    );

    if (hayConflicto) {
      return;
    }

    const horaInicio = formData.horaInicio ? `${formData.horaInicio}:00` : '';
    const actividadDTO = {
      tratoId,
      tipo: "LLAMADA",
      asignadoAId: formData.asignadoAId,
      contactoId: parseInt(formData.nombreContacto, 10),
      fechaLimite: formData.fecha,
      horaInicio: horaInicio,
      finalidad: formData.finalidad
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
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Programar llamada" size="md">
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
                  {user.nombreReal}
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
                <option key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </option>
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
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.fecha && <span className="error-message">{errors.fecha}</span>}
        </div>
        <div className="modal-form-group">
          <label htmlFor="horaInicio">Hora: <span className="required">*</span></label>
          <input
            type="time"
            id="horaInicio"
            value={formData.horaInicio}
            onChange={(e) => handleInputChange("horaInicio", e.target.value)}
            className={`modal-form-control ${errors.horaInicio ? "error" : ""}`}
            min={formData.fecha === new Date().toISOString().split('T')[0] ? (() => {
              const now = new Date();
              return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
            })() : undefined}

          />
          {errors.horaInicio && <span className="error-message">{errors.horaInicio}</span>}
        </div>

        {conflictoHorario && (
          <div className="conflict-warning">
            <span className="error-message">{conflictoHorario}</span>
          </div>
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
              <option value="SEGUIMIENTO">Seguimiento</option>
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
    </DetallesTratoModal>
  );
};

// Modal para programar reunión
const ProgramarReunionModal = ({ isOpen, onClose, onSave, tratoId, users, creatorId }) => {
  const [formData, setFormData] = useState({
    asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
    nombreContacto: "",
    fecha: "",
    horaInicio: "",
    duracion: "00:30",
    modalidad: "VIRTUAL",
    finalidad: "",
    lugarReunion: "",
    medio: "",
    enlaceReunion: "",
  });
  const [errors, setErrors] = useState({});
  const [contactos, setContactos] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [actividadCreada, setActividadCreada] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchTrato = async () => {
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}`);
          const trato = await response.json();
          const defaultContactName = trato.contacto?.nombre || "";
          setFormData({
            asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
            nombreContacto: defaultContactName,
            fecha: "",
            horaInicio: "",
            duracion: "00:30",
            modalidad: "VIRTUAL",
            finalidad: "",
            lugarReunion: "",
            medio: "",
            enlaceReunion: "",
          });
          setErrors({});
          setContactos([]);
          setEmpresa(null);
          if (trato.empresaId) {
            const empresaResponse = await fetchWithToken(`${API_BASE_URL}/empresas/${trato.empresaId}`);
            const empresaData = await empresaResponse.json();
            setEmpresa(empresaData);
            fetchContactos(trato.empresaId);
            if (defaultContactName === "" && empresaData.domicilioFisico) {
              setFormData((prev) => ({ ...prev, lugarReunion: empresaData.domicilioFisico }));
            }
          }
        } catch (error) {
          Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la empresa del trato" });
        }
      };
      if (tratoId) fetchTrato();
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
  const validateForm = () => {
    const newErrors = {};
    const currentDate = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (!formData.nombreContacto.trim()) newErrors.nombreContacto = "Este campo es obligatorio";
    if (!formData.fecha.trim()) newErrors.fecha = "Este campo es obligatorio";
    else if (formData.fecha < currentDate) newErrors.fecha = "La fecha no puede ser en el pasado";
    else if (formData.fecha === currentDate && formData.horaInicio && formData.horaInicio < currentTime)
      newErrors.horaInicio = "La hora no puede ser en el pasado";
    if (!formData.horaInicio.trim()) newErrors.horaInicio = "Este campo es obligatorio";
    if (!formData.duracion || formData.duracion.trim() === "") newErrors.duracion = "Este campo es obligatorio";
    if (!formData.modalidad.trim()) newErrors.modalidad = "Este campo es obligatorio";
    if (formData.modalidad === "PRESENCIAL" && !formData.lugarReunion.trim())
      newErrors.lugarReunion = "Lugar es obligatorio para reuniones presenciales";
    if (formData.modalidad === "VIRTUAL" && !formData.medio.trim())
      newErrors.medio = "Medio es obligatorio para reuniones virtuales";
    if (!formData.finalidad.trim()) newErrors.finalidad = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [conflictoHorario, setConflictoHorario] = useState("");

  const verificarConflictoHorario = async (fecha, hora, duracion = null) => {
    if (!fecha || !hora || !formData.asignadoAId) {
      setConflictoHorario("");
      return false;
    }

    try {
      const params = new URLSearchParams({
        asignadoAId: formData.asignadoAId,
        fecha: fecha,
        hora: hora + ":00"
      });

      if (duracion) {
        params.append('duracion', duracion);
      }

      const response = await fetchWithToken(
        `${API_BASE_URL}/tratos/verificar-conflicto-horario?${params}`
      );

      const data = await response.json();

      if (data.hayConflicto) {
        setConflictoHorario("Ya existe una actividad programada en este horario para el usuario asignado.");
        return true;
      } else {
        setConflictoHorario("");
        return false;
      }
    } catch (error) {
      console.error("Error verificando conflicto:", error);
      return false;
    }
  };

  useEffect(() => {
    if (formData.fecha && formData.horaInicio && formData.asignadoAId) {
      const timeoutId = setTimeout(() => {
        verificarConflictoHorario(formData.fecha, formData.horaInicio, formData.duracion);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.fecha, formData.horaInicio, formData.asignadoAId, formData.duracion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Verificar conflicto antes de enviar
    const hayConflicto = await verificarConflictoHorario(
      formData.fecha,
      formData.horaInicio,
      formData.duracion
    );

    if (hayConflicto) {
      return;
    }

    setIsLoading(true);

    const duracionStr = formData.duracion;
    const horaInicio = formData.horaInicio ? `${formData.horaInicio}:00` : '';

    const actividadDTO = {
      tratoId,
      tipo: "REUNION",
      asignadoAId: formData.asignadoAId,
      contactoId: formData.nombreContacto,
      fechaLimite: formData.fecha,
      horaInicio: horaInicio,
      duracion: duracionStr,
      modalidad: formData.modalidad,
      finalidad: formData.finalidad,
      lugarReunion: formData.modalidad === "PRESENCIAL" ? formData.lugarReunion : null,
      medio: formData.modalidad === "VIRTUAL" ? formData.medio : null,
      enlaceReunion: formData.modalidad === "VIRTUAL" ? formData.enlaceReunion : null
    };

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/actividades`, {
        method: "POST",
        body: JSON.stringify(actividadDTO),
      });
      const savedActividad = await response.json();

      // Guardar datos para el modal de confirmación
      setActividadCreada(savedActividad);
      setMostrarConfirmacion(true);

    } catch (error) {
      console.error("Error al programar la reunión:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Programar reunión" size="md">
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
                  {user.nombreReal}
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
                <option key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </option>
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
            min={new Date().toISOString().split('T')[0]}
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
              min={formData.fecha === new Date().toISOString().split('T')[0] ? (() => {
                const now = new Date();
                return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
              })() : undefined}
            />
            {errors.horaInicio && <span className="error-message">{errors.horaInicio}</span>}
          </div>


          <div className="modal-form-group">
            <label>Duración: <span className="required">*</span></label>
            <div className="modal-select-wrapper">
              <select
                id="duracion"
                value={formData.duracion}
                onChange={(e) => handleInputChange("duracion", e.target.value)}
                className={`modal-form-control ${errors.duracion ? "error" : ""}`}
              >
                <option value="00:30">30 minutos</option>
                <option value="01:00">1 hora</option>
                <option value="01:30">1 hora 30 minutos</option>
                <option value="02:00">2 horas</option>
                <option value="02:30">2 horas 30 minutos</option>
                <option value="03:00">3 horas</option>
              </select>
              <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
            </div>
            {errors.duracion && <span className="error-message">{errors.duracion}</span>}
          </div>
        </div>

        {conflictoHorario && (
          <div className="conflict-warning">
            <span className="error-message">{conflictoHorario}</span>
          </div>
        )}

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
          <div className="modal-form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Programando..." : "Agregar reunión"}
            </button>
          </div>
        </div>
      </form>
      <ConfirmacionEnvioModal
        isOpen={mostrarConfirmacion}
        onClose={() => {
          setMostrarConfirmacion(false);
          setActividadCreada(null);
          onClose();
        }}
        onConfirm={() => {
          Swal.fire({
            title: "¡Reunión programada!",
            text: "La reunión se ha programado exitosamente",
            icon: "success",
          });

          onSave(actividadCreada, "REUNION");
          setMostrarConfirmacion(false);
          setActividadCreada(null);
        }}
        tratoId={tratoId}
        actividadId={actividadCreada?.id}
        esReprogramacion={false}
      />
    </DetallesTratoModal>
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
    notas: ""
  });
  const [errors, setErrors] = useState({});
  const [contactos, setContactos] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchTrato = async () => {
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}`);
          const trato = await response.json();
          const defaultContactName = trato.contacto?.nombre || "";
          setFormData({
            asignadoAId: creatorId || (users.length > 0 ? users[0].id : ""),
            nombreContacto: defaultContactName,
            fechaLimite: "",
            tipo: "",
            finalidad: "",
            notas: ""
          });
          setErrors({});
          if (trato.empresaId) fetchContactos(trato.empresaId);
        } catch (error) {
          Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar el trato" });
        }
      };
      if (tratoId) fetchTrato();
    }
  }, [isOpen, creatorId, users, tratoId]);

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
    const currentDate = new Date().toISOString().split('T')[0];
    if (!formData.nombreContacto.trim()) newErrors.nombreContacto = "Este campo es obligatorio";
    if (!formData.fechaLimite.trim()) newErrors.fechaLimite = "Este campo es obligatorio";
    else if (formData.fechaLimite < currentDate) newErrors.fechaLimite = "La fecha no puede ser en el pasado";
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
      contactoId: formData.nombreContacto,
      fechaLimite: formData.fechaLimite,
      subtipoTarea: formData.tipo.toUpperCase(),
      finalidad: formData.finalidad,
      notas: formData.notas
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
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Programar tarea" size="md">
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
                  {user.nombreReal}
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
                <option key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </option>
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
            min={new Date().toISOString().split('T')[0]}
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
            <button
              type="button"
              className={`btn-tipo ${formData.tipo === "Actividad" ? "active" : ""}`}
              onClick={() => handleInputChange("tipo", "Actividad")}
            >
              Actividad
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
              <option value="SEGUIMIENTO">Seguimiento</option>
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

        <div className="modal-form-group">
          <label htmlFor="notas">Notas:</label>
          <textarea
            id="notas"
            value={formData.notas}
            onChange={(e) => handleInputChange("notas", e.target.value)}
            className="modal-form-control"
            rows="3"
            placeholder="Notas adicionales (opcional)"
          />
        </div>
        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary">Agregar tarea</button>
        </div>
      </form>
    </DetallesTratoModal>
  );
};

// Modal para reprogramar llamada
const ReprogramarLlamadaModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useState({
    asignadoAId: "",
    nombreContactoId: "",
    nuevaFecha: "",
    nuevaHora: "",
    finalidad: "",
  });
  const [errors, setErrors] = useState({});
  const [contactos, setContactos] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (actividad && isOpen) {
        try {
          const usersResponse = await fetchWithToken(`${API_BASE_URL}/auth/users`);
          const usersData = await usersResponse.json();
          setUsers(usersData.map((user) => ({ id: user.id, nombre: user.nombre })));

          const tratoResponse = await fetchWithToken(`${API_BASE_URL}/tratos/${actividad.tratoId}`);
          const trato = await tratoResponse.json();
          if (trato.empresaId) {
            const contactosResponse = await fetchWithToken(
              `${API_BASE_URL}/empresas/${trato.empresaId}/contactos`
            );
            const contactosData = await contactosResponse.json();
            setContactos(contactosData);
          }

          // Parse fechaLimite to YYYY-MM-DD
          let nuevaFecha = "";
          if (actividad.fechaLimite) {
            try {
              const date = new Date(actividad.fechaLimite);
              if (!isNaN(date.getTime())) {
                nuevaFecha = date.toISOString().split("T")[0];
              }
            } catch (error) {
              console.error("Error parsing fechaLimite:", actividad.fechaLimite, error);
            }
          }

          // Parse horaInicio to HH:mm
          let nuevaHora = "";
          if (actividad.horaInicio) {
            try {
              const timeParts = actividad.horaInicio.split(":");
              if (timeParts.length >= 2) {
                nuevaHora = `${timeParts[0]}:${timeParts[1]}`;
              }
            } catch (error) {
              console.error("Error parsing horaInicio:", actividad.horaInicio, error);
            }
          }

          setFormData({
            asignadoAId: actividad.asignadoAId || "",
            nombreContactoId: actividad.contactoId || "",
            nuevaFecha: nuevaFecha,
            nuevaHora: nuevaHora,
            finalidad: actividad.finalidad || "",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron cargar los datos iniciales",
          });
        }
      }
    };
    fetchInitialData();
  }, [actividad, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));

    if (field === "nuevaFecha" || field === "nuevaHora" || field === "asignadoAId") {
      const updatedData = { ...formData, [field]: value };
      if (updatedData.asignadoAId && updatedData.nuevaFecha && updatedData.nuevaHora) {
        verificarConflictoHorario(updatedData.asignadoAId, updatedData.nuevaFecha, updatedData.nuevaHora);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const currentDate = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (!formData.nuevaFecha.trim()) newErrors.nuevaFecha = "Este campo es obligatorio";
    else if (formData.nuevaFecha < currentDate) newErrors.nuevaFecha = "La fecha no puede ser en el pasado";
    else if (formData.nuevaFecha === currentDate && formData.nuevaHora && formData.nuevaHora < currentTime)
      newErrors.nuevaHora = "La hora no puede ser en el pasado";
    if (!formData.nuevaHora.trim()) newErrors.nuevaHora = "Este campo es obligatorio";
    if (!formData.finalidad.trim()) newErrors.finalidad = "Este campo es obligatorio";
    if (!formData.asignadoAId) newErrors.asignadoAId = "Este campo es obligatorio";
    if (!formData.nombreContactoId) newErrors.nombreContactoId = "Este campo es obligatorio";
    if (conflictoHorario) {
      newErrors.conflicto = "Ya existe una actividad programada en este horario";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [conflictoHorario, setConflictoHorario] = useState(false);

  const verificarConflictoHorario = async (asignadoAId, fecha, hora) => {
    if (!asignadoAId || !fecha || !hora) {
      setConflictoHorario(false);
      return;
    }

    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/tratos/verificar-conflicto-horario?asignadoAId=${asignadoAId}&fecha=${fecha}&hora=${hora}:00&actividadIdExcluir=${actividad.id}`
      );
      const data = await response.json();
      setConflictoHorario(data.hayConflicto);
    } catch (error) {
      console.error("Error verificando conflicto:", error);
      setConflictoHorario(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const actividadDTO = {
      id: actividad.id,
      tratoId: actividad.tratoId,
      tipo: "LLAMADA",
      asignadoAId: parseInt(formData.asignadoAId, 10),
      contactoId: parseInt(formData.nombreContactoId, 10),
      fechaLimite: formData.nuevaFecha,
      horaInicio: `${formData.nuevaHora}:00`,
      finalidad: formData.finalidad,
      estado: "Reprogramada",
    };

    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/tratos/${actividad.tratoId}/actividades/${actividad.id}`,
        {
          method: "PUT",
          body: JSON.stringify(actividadDTO),
        }
      );
      const updatedActividad = await response.json();
      onSave(updatedActividad);
      Swal.fire({
        title: "¡Llamada reprogramada!",
        text: "La llamada se ha reprogramado exitosamente",
        icon: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error al reprogramar la llamada:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Reprogramar llamada" size="md">
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
                  {user.nombre}
                </option>
              ))}
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>
        <div className="modal-form-group">
          <label htmlFor="nombreContactoId">Nombre contacto: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="nombreContactoId"
              value={formData.nombreContactoId}
              onChange={(e) => handleInputChange("nombreContactoId", e.target.value)}
              className={`modal-form-control ${errors.nombreContactoId ? "error" : ""}`}
            >
              <option value="">Seleccione un contacto</option>
              {contactos.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </option>
              ))}
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContactoId && <span className="error-message">{errors.nombreContactoId}</span>}
        </div>
        <div className="modal-form-group">
          <label htmlFor="nuevaFecha">Nueva fecha: <span className="required">*</span></label>
          <input
            type="date"
            id="nuevaFecha"
            value={formData.nuevaFecha}
            onChange={(e) => handleInputChange("nuevaFecha", e.target.value)}
            className={`modal-form-control ${errors.nuevaFecha ? "error" : ""}`}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.nuevaFecha && <span className="error-message">{errors.nuevaFecha}</span>}
        </div>
        <div className="modal-form-group">
          <label htmlFor="nuevaHora">Nueva hora: <span className="required">*</span></label>
          <input
            type="time"
            id="nuevaHora"
            value={formData.nuevaHora}
            onChange={(e) => handleInputChange("nuevaHora", e.target.value)}
            className={`modal-form-control ${errors.nuevaHora ? "error" : ""}`}
            min={formData.nuevaFecha === new Date().toISOString().split('T')[0] ? (() => {
              const now = new Date();
              return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
            })() : undefined}
          />
          {errors.nuevaHora && <span className="error-message">{errors.nuevaHora}</span>}
        </div>

        {conflictoHorario && (
          <div className="conflict-warning">
            <span className="error-message">Ya hay una actividad asignada en este horario</span>
          </div>
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
              <option value="">Seleccionar finalidad</option>
              <option value="CLASIFICACION">Clasificación</option>
              <option value="PRIMER_CONTACTO">Primer Contacto</option>
              <option value="SEGUIMIENTO">Seguimiento</option>
              <option value="REUNION">Reunión</option>
              <option value="COTIZACION_PROPUESTA_PRACTICA">Cotización Propuesta/Práctica</option>
              <option value="NEGOCIACION_REVISION">Negociación/Revisión</option>
              <option value="CERRADO_GANADO">Cerrado Ganado</option>
              <option value="RESPUESTA_POR_CORREO">Respuesta por Correo</option>
              <option value="INTERES_FUTURO">Interés Futuro</option>
              <option value="CERRADO_PERDIDO">Cerrado Perdido</option>
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>
        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary">Confirmar cambios</button>
        </div>
      </form>
    </DetallesTratoModal>
  );
};

// Modal para reprogramar reunión 
const ReprogramarReunionModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useState({
    asignadoAId: "",
    nombreContactoId: "",
    nuevaFecha: "",
    nuevaHoraInicio: "",
    duracion: "00:30",
    modalidad: "",
    medio: "",
    finalidad: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [contactos, setContactos] = useState([]);
  const [users, setUsers] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [actividadActualizada, setActividadActualizada] = useState(null);


  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (actividad && isOpen) {
        try {
          setLoading(true);
          const usersResponse = await fetchWithToken(`${API_BASE_URL}/auth/users`);
          const usersData = await usersResponse.json();
          setUsers(usersData.map((user) => ({ id: user.id, nombre: user.nombre })));

          const tratoResponse = await fetchWithToken(`${API_BASE_URL}/tratos/${actividad.tratoId}`);
          const trato = await tratoResponse.json();

          if (trato.empresaId) {
            const empresaResponse = await fetchWithToken(`${API_BASE_URL}/empresas/${trato.empresaId}`);
            const empresaData = await empresaResponse.json();
            setEmpresa(empresaData);

            const contactosResponse = await fetchWithToken(`${API_BASE_URL}/empresas/${trato.empresaId}/contactos`);
            const contactosData = await contactosResponse.json();
            setContactos(contactosData);
          }

          const duracionCompleta = actividad.duracion || "00:30";
          const initialEnlace = actividad.medio ? generateMeetingLink(actividad.medio) : "";
          const initialLugarReunion = actividad.modalidad === "PRESENCIAL" ?
            (actividad.lugarReunion || empresa?.domicilioFisico || "") : "";

          setFormData({
            asignadoAId: actividad.asignadoAId || "",
            nombreContactoId: actividad.contactoId || "",
            nuevaFecha: actividad.fechaLimite ? actividad.fechaLimite.split("T")[0] : "",
            nuevaHoraInicio: actividad.horaInicio ? actividad.horaInicio.split(":")[0] + ":" + actividad.horaInicio.split(":")[1] : "",
            duracion: duracionCompleta,
            modalidad: actividad.modalidad || "",
            medio: actividad.medio || "",
            finalidad: actividad.finalidad || "",
            lugarReunion: initialLugarReunion,
            enlaceReunion: initialEnlace,
          });
        } catch (error) {
          Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los datos iniciales" });
        } finally {
          setLoading(false);
        }
      }
    };
    fetchInitialData();
  }, [actividad, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "medio" && value) {
        newData.enlaceReunion = generateMeetingLink(value);
      }
      if (field === "modalidad") {
        if (value === "VIRTUAL") {
          newData.lugarReunion = "";
          newData.medio = "";
          newData.enlaceReunion = generateMeetingLink(newData.medio);
        } else if (value === "PRESENCIAL" && empresa?.domicilioFisico) {
          newData.lugarReunion = empresa.domicilioFisico;
          newData.medio = "";
          newData.enlaceReunion = "";
        }
      }

      if (field === "nuevaFecha" || field === "nuevaHoraInicio" || field === "asignadoAId" || field === "duracion") {
        if (newData.asignadoAId && newData.nuevaFecha && newData.nuevaHoraInicio) {
          verificarConflictoHorario(newData.asignadoAId, newData.nuevaFecha, newData.nuevaHoraInicio, newData.duracion);
        }
      }
      return newData;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const currentDate = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (!formData.nuevaFecha.trim()) newErrors.nuevaFecha = "Este campo es obligatorio";
    else if (formData.nuevaFecha < currentDate) newErrors.nuevaFecha = "La fecha no puede ser en el pasado";
    else if (formData.nuevaFecha === currentDate && formData.nuevaHoraInicio && formData.nuevaHoraInicio < currentTime)
      newErrors.nuevaHoraInicio = "La hora no puede ser en el pasado";
    if (!formData.nuevaHoraInicio.trim()) newErrors.nuevaHoraInicio = "Este campo es obligatorio";
    if (!formData.duracion || formData.duracion.trim() === "") newErrors.duracion = "Este campo es obligatorio";
    if (!formData.modalidad.trim()) newErrors.modalidad = "Este campo es obligatorio";
    if (formData.modalidad === "PRESENCIAL" && !formData.lugarReunion.trim())
      newErrors.lugarReunion = "Lugar es obligatorio para reuniones presenciales";
    if (formData.modalidad === "VIRTUAL" && !formData.medio.trim())
      newErrors.medio = "Medio es obligatorio para reuniones virtuales";
    if (!formData.finalidad.trim()) newErrors.finalidad = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [conflictoHorario, setConflictoHorario] = useState(false);

  const verificarConflictoHorario = async (asignadoAId, fecha, hora, duracion) => {
    if (!asignadoAId || !fecha || !hora) {
      setConflictoHorario(false);
      return;
    }

    try {
      const duracionParam = duracion ? `&duracion=${duracion}` : '';
      const response = await fetchWithToken(
        `${API_BASE_URL}/tratos/verificar-conflicto-horario?asignadoAId=${asignadoAId}&fecha=${fecha}&hora=${hora}:00&actividadIdExcluir=${actividad.id}`
      );
      const data = await response.json();
      setConflictoHorario(data.hayConflicto);
    } catch (error) {
      console.error("Error verificando conflicto:", error);
      setConflictoHorario(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading || isSubmittingRef.current || !validateForm()) {
      return;
    }

    setIsLoading(true);

    // Marcar como enviando
    isSubmittingRef.current = true;

    const duracionStr = formData.duracion;

    const actividadDTO = {
      id: actividad.id,
      tratoId: actividad.tratoId,
      tipo: "REUNION",
      asignadoAId: formData.asignadoAId,
      contactoId: parseInt(formData.nombreContactoId, 10),
      fechaLimite: formData.nuevaFecha,
      horaInicio: `${formData.nuevaHoraInicio}:00`,
      duracion: duracionStr,
      modalidad: formData.modalidad,
      medio: formData.modalidad === "VIRTUAL" ? formData.medio : null,
      lugarReunion: formData.modalidad === "PRESENCIAL" ? formData.lugarReunion : null,
      enlaceReunion: formData.modalidad === "VIRTUAL" ? formData.enlaceReunion : null,
      finalidad: formData.finalidad,
      estado: "Reprogramada",
    };

    try {
      setLoading(true);

      const response = await fetchWithToken(`${API_BASE_URL}/tratos/${actividad.tratoId}/actividades/${actividad.id}`, {
        method: "PUT",
        body: JSON.stringify(actividadDTO),
      });

      const updatedActividad = await response.json();


      // Guardar datos para el modal de confirmación
      setActividadActualizada(updatedActividad);
      setMostrarConfirmacion(true);

    } catch (error) {
      console.error("Error al reprogramar la reunión:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setIsLoading(false);
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Reprogramar reunión" size="md">
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
                  {user.nombre}
                </option>
              ))}
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>
        <div className="modal-form-group">
          <label htmlFor="nombreContactoId">Nombre contacto: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="nombreContactoId"
              value={formData.nombreContactoId}
              onChange={(e) => handleInputChange("nombreContactoId", e.target.value)}
              className={`modal-form-control ${errors.nombreContactoId ? "error" : ""}`}
            >
              <option value="">Seleccione un contacto</option>
              {contactos.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </option>
              ))}
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContactoId && <span className="error-message">{errors.nombreContactoId}</span>}
        </div>
        <div className="modal-form-group">
          <label htmlFor="nuevaFecha">Nueva fecha: <span className="required">*</span></label>
          <input
            type="date"
            id="nuevaFecha"
            value={formData.nuevaFecha}
            onChange={(e) => handleInputChange("nuevaFecha", e.target.value)}
            className={`modal-form-control ${errors.nuevaFecha ? "error" : ""}`}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.nuevaFecha && <span className="error-message">{errors.nuevaFecha}</span>}
        </div>
        <div className="modal-form-row">
          <div className="modal-form-group">
            <label htmlFor="nuevaHoraInicio">Nueva hora inicio: <span className="required">*</span></label>
            <input
              type="time"
              id="nuevaHoraInicio"
              value={formData.nuevaHoraInicio}
              onChange={(e) => handleInputChange("nuevaHoraInicio", e.target.value)}
              className={`modal-form-control ${errors.nuevaHoraInicio ? "error" : ""}`}
              min={formData.nuevaFecha === new Date().toISOString().split('T')[0] ? (() => {
                const now = new Date();
                return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
              })() : undefined}
            />
            {errors.nuevaHoraInicio && <span className="error-message">{errors.nuevaHoraInicio}</span>}
          </div>
          <div className="modal-form-group">
            <label>Duración: <span className="required">*</span></label>
            <div className="modal-select-wrapper">
              <select
                id="duracion"
                value={formData.duracion}
                onChange={(e) => handleInputChange("duracion", e.target.value)}
                className={`modal-form-control ${errors.duracion ? "error" : ""}`}
              >
                <option value="00:30">30 minutos</option>
                <option value="01:00">1 hora</option>
                <option value="01:30">1 hora 30 minutos</option>
                <option value="02:00">2 horas</option>
                <option value="02:30">2 horas 30 minutos</option>
                <option value="03:00">3 horas</option>
              </select>
              <img src={deploy} alt="Desplegar" className="deploy-icon" />
            </div>
            {errors.duracion && <span className="error-message">{errors.duracion}</span>}
          </div>
        </div>

        {conflictoHorario && (
          <div className="conflict-warning">
            <span className="error-message">Ya hay una actividad asignada en este horario</span>
          </div>
        )}

        <div className="modal-form-group">
          <label htmlFor="modalidad">Modalidad: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="modalidad"
              value={formData.modalidad}
              onChange={(e) => handleInputChange("modalidad", e.target.value)}
              className={`modal-form-control ${errors.modalidad ? "error" : ""}`}
            >
              <option value="">Seleccionar modalidad</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="PRESENCIAL">Presencial</option>
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
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
          <div className="modal-form-group">
            <label htmlFor="medio">Medio: <span className="required">*</span></label>
            <div className="modal-select-wrapper">
              <select
                id="medio"
                value={formData.medio}
                onChange={(e) => handleInputChange("medio", e.target.value)}
                className={`modal-form-control ${errors.medio ? "error" : ""}`}
              >
                <option value="">Seleccionar medio</option>
                <option value="MEET">Google Meet</option>
                <option value="ZOOM">Zoom</option>
                <option value="TEAMS">Microsoft Teams</option>
              </select>
              <img src={deploy} alt="Desplegar" className="deploy-icon" />
            </div>
            {errors.medio && <span className="error-message">{errors.medio}</span>}
          </div>
        )}
        {formData.modalidad === "VIRTUAL" && formData.medio && (
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
        <div className="modal-form-group">
          <label htmlFor="finalidad">Finalidad: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Seleccionar finalidad</option>
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
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>
        <div className="modal-form-actions">
          <div className="modal-form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Reprogramando..." : "Confirmar Cambios"}
            </button>
          </div>
        </div>
      </form>
      <ConfirmacionEnvioModal
        isOpen={mostrarConfirmacion}
        onClose={() => {
          setMostrarConfirmacion(false);
          setActividadActualizada(null);
          onClose();
        }}
        onConfirm={() => {
          Swal.fire({
            title: "¡Reunión reprogramada!",
            text: "La reunión se ha reprogramado exitosamente",
            icon: "success",
          });

          onSave(actividadActualizada);
          setMostrarConfirmacion(false);
          setActividadActualizada(null);
        }}
        tratoId={actividad?.tratoId}
        actividadId={actividadActualizada?.id}
        esReprogramacion={true}
      />
    </DetallesTratoModal>
  );
};

// Modal para reprogramar tarea
const ReprogramarTareaModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useState({
    asignadoAId: "",
    nombreContactoId: "",
    nuevaFechaLimite: "",
    tipo: "",
    finalidad: "",
    notas: ""
  });
  const [errors, setErrors] = useState({});
  const [contactos, setContactos] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (actividad && isOpen) {
        try {
          const usersResponse = await fetchWithToken(`${API_BASE_URL}/auth/users`);
          const usersData = await usersResponse.json();
          setUsers(usersData.map((user) => ({ id: user.id, nombre: user.nombre })));

          const tratoResponse = await fetchWithToken(`${API_BASE_URL}/tratos/${actividad.tratoId}`);
          const trato = await tratoResponse.json();
          if (trato.empresaId) {
            const contactosResponse = await fetchWithToken(
              `${API_BASE_URL}/empresas/${trato.empresaId}/contactos`
            );
            const contactosData = await contactosResponse.json();
            setContactos(contactosData);
          }

          // Parse fechaLimite to YYYY-MM-DD
          let nuevaFechaLimite = "";
          if (actividad.fechaLimite) {
            try {
              const date = new Date(actividad.fechaLimite);
              if (!isNaN(date.getTime())) {
                nuevaFechaLimite = date.toISOString().split("T")[0];
              }
            } catch (error) {
              console.error("Error parsing fechaLimite:", actividad.fechaLimite, error);
            }
          }

          setFormData({
            asignadoAId: actividad.asignadoAId || "",
            nombreContactoId: actividad.contactoId || "",
            nuevaFechaLimite: nuevaFechaLimite,
            tipo: actividad.subtipoTarea
              ? actividad.subtipoTarea.charAt(0).toUpperCase() +
              actividad.subtipoTarea.slice(1).toLowerCase()
              : "",
            finalidad: actividad.finalidad || "",
            notas: actividad.notas || ""
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron cargar los datos iniciales",
          });
        }
      }
    };
    fetchInitialData();
  }, [actividad, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const currentDate = new Date().toISOString().split('T')[0];
    if (!formData.nuevaFechaLimite.trim()) newErrors.nuevaFechaLimite = "Este campo es obligatorio";
    else if (formData.nuevaFechaLimite < currentDate) newErrors.nuevaFechaLimite = "La fecha no puede ser en el pasado";
    if (!formData.tipo.trim()) newErrors.tipo = "Este campo es obligatorio";
    if (!formData.finalidad.trim()) newErrors.finalidad = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const actividadDTO = {
      id: actividad.id,
      tratoId: actividad.tratoId,
      tipo: "TAREA",
      asignadoAId: parseInt(formData.asignadoAId, 10),
      contactoId: parseInt(formData.nombreContactoId, 10),
      fechaLimite: formData.nuevaFechaLimite,
      subtipoTarea: formData.tipo.toUpperCase(),
      finalidad: formData.finalidad,
      estado: "Reprogramada",
      notas: formData.notas
    };

    try {
      const response = await fetchWithToken(
        `${API_BASE_URL}/tratos/${actividad.tratoId}/actividades/${actividad.id}`,
        {
          method: "PUT",
          body: JSON.stringify(actividadDTO),
        }
      );
      const updatedActividad = await response.json();
      onSave(updatedActividad);
      Swal.fire({
        title: "¡Tarea reprogramada!",
        text: "La tarea se ha reprogramado exitosamente",
        icon: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error al reprogramar la tarea:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Reprogramar tarea" size="md">
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
                  {user.nombre}
                </option>
              ))}
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>
        <div className="modal-form-group">
          <label htmlFor="nombreContactoId">Nombre contacto: <span className="required">*</span></label>
          <div className="modal-select-wrapper">
            <select
              id="nombreContactoId"
              value={formData.nombreContactoId}
              onChange={(e) => handleInputChange("nombreContactoId", e.target.value)}
              className={`modal-form-control ${errors.nombreContactoId ? "error" : ""}`}
            >
              <option value="">Seleccione un contacto</option>
              {contactos.map((contacto) => (
                <option key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                </option>
              ))}
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContactoId && <span className="error-message">{errors.nombreContactoId}</span>}
        </div>
        <div className="modal-form-group">
          <label htmlFor="nuevaFechaLimite">Nueva fecha límite: <span className="required">*</span></label>
          <input
            type="date"
            id="nuevaFechaLimite"
            value={formData.nuevaFechaLimite}
            onChange={(e) => handleInputChange("nuevaFechaLimite", e.target.value)}
            className={`modal-form-control ${errors.nuevaFechaLimite ? "error" : ""}`}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.nuevaFechaLimite && <span className="error-message">{errors.nuevaFechaLimite}</span>}
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
            <button
              type="button"
              className={`btn-tipo ${formData.tipo === "Actividad" ? "active" : ""}`}
              onClick={() => handleInputChange("tipo", "Actividad")}
            >
              Actividad
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
              <option value="">Seleccionar finalidad</option>
              <option value="CLASIFICACION">Clasificación</option>
              <option value="PRIMER_CONTACTO">Primer Contacto</option>
              <option value="SEGUIMIENTO">Seguimiento</option>
              <option value="REUNION">Reunión</option>
              <option value="COTIZACION_PROPUESTA_PRACTICA">Cotización Propuesta/Práctica</option>
              <option value="NEGOCIACION_REVISION">Negociación/Revisión</option>
              <option value="CERRADO_GANADO">Cerrado Ganado</option>
              <option value="RESPUESTA_POR_CORREO">Respuesta por Correo</option>
              <option value="INTERES_FUTURO">Interés Futuro</option>
              <option value="CERRADO_PERDIDO">Cerrado Perdido</option>
            </select>
            <img src={deploy} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="notas">Notas:</label>
          <textarea
            id="notas"
            value={formData.notas}
            onChange={(e) => handleInputChange("notas", e.target.value)}
            className="modal-form-control"
            rows="3"
            placeholder="Notas adicionales (opcional)"
          />
        </div>
        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary">Confirmar cambios</button>
        </div>
      </form>
    </DetallesTratoModal>
  );
};

// Modal para completar actividad 
const CompletarActividadModal = ({ isOpen, onClose, onSave, actividad, tratoId, openModal }) => {
  const [formData, setFormData] = useState({
    respuesta: '',
    interes: '',
    informacion: '',
    siguienteAccion: '',
    notas: '',
    medio: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && actividad) {
      setFormData({
        respuesta: '',
        interes: '',
        informacion: '',
        siguienteAccion: '',
        notas: '',
        medio: actividad.medio || '',
      });
      setErrors({});
    } else if (isOpen && !actividad) {
      setFormData({
        respuesta: '',
        interes: '',
        informacion: '',
        siguienteAccion: '',
        notas: '',
        medio: '',
      });
      setErrors({});
    }
  }, [isOpen, actividad]);


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.respuesta) newErrors.respuesta = 'Este campo es obligatorio';
    if (!formData.interes) newErrors.interes = 'Este campo es obligatorio';
    if (!formData.informacion) newErrors.informacion = 'Este campo es obligatorio';
    if (!formData.siguienteAccion.trim()) newErrors.siguienteAccion = 'Este campo es obligatorio';
    if (actividad?.tipo && ['LLAMADA', 'TAREA'].includes(actividad.tipo.toUpperCase()) && !formData.medio) {
      newErrors.medio = 'Este campo es obligatorio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!actividad) {
      Swal.fire({
        title: 'Error',
        text: 'No se encontró la actividad a completar',
        icon: 'error',
      });
      return;
    }

    try {
      const actividadDTO = {
        id: actividad.id,
        tratoId: tratoId,
        tipo: actividad.tipo.toUpperCase(),
        asignadoAId: actividad.asignadoAId,
        contactoId: actividad.contactoId,
        fechaLimite: actividad.fechaLimite,
        horaInicio: actividad.horaInicio || null,
        duracion: actividad.duracion || null,
        modalidad: actividad.modalidad || null,
        medio: formData.medio || null,
        enlaceReunion: actividad.enlaceReunion || null,
        subtipoTarea: actividad.subtipoTarea || null,
        finalidad: actividad.finalidad || null,
        estatus: 'CERRADA',
        respuesta: formData.respuesta.toUpperCase(),
        interes: formData.interes.toUpperCase(),
        informacion: formData.informacion.toUpperCase(),
        siguienteAccion: formData.siguienteAccion,
        notas: formData.notas,
      };

      const response = await fetchWithToken(
        `${API_BASE_URL}/tratos/actividades/${actividad.id}/completar`,
        {
          method: 'PUT',
          body: JSON.stringify(actividadDTO),
        }
      );
      const updatedActividad = await response.json();
      onSave(updatedActividad, actividad.tipo);
      Swal.fire({
        title: '¡Actividad completada!',
        text: 'El reporte de actividad se ha guardado exitosamente',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Crear nueva actividad',
        cancelButtonText: 'Cerrar',
      }).then((result) => {
        if (result.isConfirmed) {
          openModal('seleccionarActividad', { tratoId });
        }
      });
      onClose();
    } catch (error) {
      console.error('Error al completar la actividad:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message.includes('no encontrada')
          ? 'La actividad no fue encontrada'
          : 'No se pudo completar la actividad',
      });
    }
  };

  return (
    <DetallesTratoModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Completar ${actividad?.tipo?.toLowerCase() || 'actividad'}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label>
            Respuesta: <span className="required">*</span>
          </label>
          <div className="response-buttons">
            <button
              type="button"
              className={`btn-response ${formData.respuesta === 'NO' ? 'active negative' : ''}`}
              onClick={() => handleInputChange('respuesta', 'NO')}
            >
              ✕
            </button>
            <button
              type="button"
              className={`btn-response ${formData.respuesta === 'SI' ? 'active positive' : ''}`}
              onClick={() => handleInputChange('respuesta', 'SI')}
            >
              ✓
            </button>
          </div>
          {errors.respuesta && <span className="error-message">{errors.respuesta}</span>}
        </div>

        <div className="modal-form-group">
          <label>
            Interés: <span className="required">*</span>
          </label>
          <div className="interest-container">
            <div className="interest-options">
              <div className="interest-option">
                <button
                  type="button"
                  className={`btn-interest ${formData.interes === 'BAJO' ? 'active low' : ''}`}
                  onClick={() => handleInputChange('interes', 'BAJO')}
                >
                  ●
                </button>
                <span>Bajo</span>
              </div>
              <div className="interest-option">
                <button
                  type="button"
                  className={`btn-interest ${formData.interes === 'MEDIO' ? 'active medium' : ''}`}
                  onClick={() => handleInputChange('interes', 'MEDIO')}
                >
                  ●
                </button>
                <span>Medio</span>
              </div>
              <div className="interest-option">
                <button
                  type="button"
                  className={`btn-interest ${formData.interes === 'ALTO' ? 'active high' : ''}`}
                  onClick={() => handleInputChange('interes', 'ALTO')}
                >
                  ●
                </button>
                <span>Alto</span>
              </div>
            </div>
          </div>
          {errors.interes && <span className="error-message">{errors.interes}</span>}
        </div>

        <div className="modal-form-group">
          <label>
            Información: <span className="required">*</span>
          </label>
          <div className="response-buttons">
            <button
              type="button"
              className={`btn-response ${formData.informacion === 'NO' ? 'active negative' : ''}`}
              onClick={() => handleInputChange('informacion', 'NO')}
            >
              ✕
            </button>
            <button
              type="button"
              className={`btn-response ${formData.informacion === 'SI' ? 'active positive' : ''}`}
              onClick={() => handleInputChange('informacion', 'SI')}
            >
              ✓
            </button>
          </div>
          {errors.informacion && <span className="error-message">{errors.informacion}</span>}
        </div>

        {(actividad?.tipo?.toUpperCase() === 'LLAMADA' || actividad?.tipo?.toUpperCase() === 'TAREA') && (
          <div className="modal-form-group">
            <label htmlFor="medio">
              Medio: <span className="required">*</span>
            </label>
            <div className="modal-select-wrapper">
              <select
                id="medio"
                value={formData.medio}
                onChange={(e) => handleInputChange('medio', e.target.value)}
                className={`modal-form-control ${errors.medio ? 'error' : ''}`}
              >
                <option value="">Seleccionar medio</option>
                {actividad?.tipo?.toUpperCase() === 'LLAMADA' && (
                  <>
                    <option value="TELEFONO">Teléfono</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </>
                )}
                {actividad?.tipo?.toUpperCase() === 'TAREA' && (
                  <>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="OUTLOOK">Outlook</option>
                    <option value="GMAIL">Gmail</option>
                  </>
                )}
              </select>
              <img src={deploy || '/placeholder.svg'} alt="Desplegar" className="deploy-icon" />
            </div>
            {errors.medio && <span className="error-message">{errors.medio}</span>}
          </div>
        )}

        <div className="modal-form-group">
          <label htmlFor="siguienteAccion">
            Siguiente acción: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="siguienteAccion"
              value={formData.siguienteAccion}
              onChange={(e) => handleInputChange('siguienteAccion', e.target.value)}
              className={`modal-form-control ${errors.siguienteAccion ? 'error' : ''}`}
            >
              <option value="">Seleccionar acción</option>
              <option value="REGRESAR_LLAMADA">Regresar llamada</option>
              <option value="MANDAR_MENSAJE">Mandar mensaje</option>
              <option value="MANDAR_INFORMACION">Mandar información</option>
              <option value="_1ER_SEGUIMIENTO">Primer seguimiento</option>
              <option value="_2DO_SEGUIMIENTO">Segundo seguimiento</option>
              <option value="_3ER_SEGUIMIENTO">Tercer seguimiento</option>
              <option value="REUNION">Programar reunión</option>
              <option value="MANDAR_COTIZACION">Mandar cotización</option>
              <option value="POSIBLE_PERDIDO">Posible perdido</option>
              <option value="PERDIDO">Perdido</option>
              <option value="BUSCAR_OTRO_CONTACTO">Buscar otro contacto</option>
              <option value="REALIZAR_DEMO">Realizar demo</option>
              <option value="VENTA">Venta</option>
              <option value="COBRANZA">Cobranza</option>
              <option value="INSTALACION">Instalación</option>
              <option value="REVISION_TECNICA">Revisión tecnica</option>
              <option value="VISITAR_EN_FISICO">Visitar en fisico</option>
              <option value="CONTACTAR_DESPUES">Contactar despues</option>
            </select>
            <img src={deploy || '/placeholder.svg'} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.siguienteAccion && <span className="error-message">{errors.siguienteAccion}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="notas">Notas:</label>
          <textarea
            id="notas"
            value={formData.notas}
            onChange={(e) => handleInputChange('notas', e.target.value)}
            className="modal-form-control textarea"
            placeholder="Agregar notas adicionales..."
            rows="4"
          />
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Completar actividad
          </button>
        </div>
      </form>
    </DetallesTratoModal>
  );
};

// Modal para editar trato
const EditarTratoModal = ({ isOpen, onClose, onSave, trato, users, companies }) => {
  const [formData, setFormData] = useState({
    propietario: "",
    nombreTrato: "",
    nombreEmpresa: "",
    nombreContacto: "",
    ingresosEsperados: "",
    numeroUnidades: "",
    descripcion: "",
  });
  const [errors, setErrors] = useState({});
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (trato && isOpen && trato.id && companies.length > 0) {
      setFormData({
        propietario: trato.propietario || "",
        nombreTrato: trato.nombre || "",
        nombreEmpresa: trato.nombreEmpresa || "",
        nombreContacto: trato.contacto?.nombre || "",
        ingresosEsperados: trato.ingresosEsperados ? trato.ingresosEsperados.toString().replace("$", "").replace(",", "") : "",
        numeroUnidades: trato.numeroUnidades?.toString() || "",
        descripcion: trato.descripcion || "",
      });
      loadContacts(trato.nombreEmpresa);
    }
    setErrors({});
  }, [trato, isOpen, companies]);

  const loadContacts = async (empresaNombre) => {
    try {
      const company = companies.find(c => c.nombre === empresaNombre);
      if (company) {
        const response = await fetchWithToken(`${API_BASE_URL}/empresas/${company.id}/contactos`);
        const contactsData = await response.json();
        setContacts(contactsData.map(c => ({ id: c.id, nombre: c.nombre })));
        const defaultContact = contactsData.find(c => c.nombre === trato.contacto?.nombre);
        if (defaultContact) {
          setFormData(prev => ({ ...prev, nombreContacto: defaultContact.nombre }));
        } else if (trato.contacto?.nombre) {
          setFormData(prev => ({ ...prev, nombreContacto: trato.contacto.nombre }));
        }
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "nombreEmpresa") {
      loadContacts(value);
      setFormData((prev) => ({ ...prev, nombreContacto: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombreTrato.trim()) newErrors.nombreTrato = "El nombre del trato es obligatorio";
    if (!formData.nombreEmpresa.trim()) newErrors.nombreEmpresa = "El nombre de la empresa es obligatorio";
    if (!formData.nombreContacto.trim()) newErrors.nombreContacto = "El nombre del contacto es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertToISO = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/');
    const parsedMonth = parseInt(month, 10) - 1;
    if (isNaN(day) || isNaN(month) || isNaN(year) || parsedMonth < 0 || parsedMonth > 11) {
      console.error("Formato de fecha inválido:", dateStr);
      return null;
    }

    const now = new Date();
    const date = new Date(year, parsedMonth, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    if (isNaN(date.getTime())) {
      console.error("Fecha inválida después de parsing:", dateStr);
      return null;
    }
    return date.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const company = companies.find(c => c.nombre === formData.nombreEmpresa);
      const empresaId = company ? company.id : null;
      const propietario = users.find(u => u.nombreReal === formData.propietario);
      const propietarioId = propietario ? propietario.id : null;
      const contacto = contacts.find(c => c.nombre === formData.nombreContacto);
      const contactoId = contacto ? contacto.id : null;

      const updatedTrato = {
        ...trato,
        nombre: formData.nombreTrato,
        empresaId: empresaId,
        propietarioId: propietarioId,
        contactoId: contactoId,
        ingresosEsperados: parseFloat(formData.ingresosEsperados),
        numeroUnidades: parseInt(formData.numeroUnidades, 10),
        descripcion: formData.descripcion,
        fechaCreacion: convertToISO(trato.fechaCreacion),
        fechaCierre: convertToISO(trato.fechaCierre),
      };

      if (!updatedTrato.fechaCreacion || !updatedTrato.fechaCierre || !updatedTrato.empresaId) {
        Swal.fire({
          title: "Error",
          text: "Los datos de empresa o fechas no son válidos. Por favor, verifica los datos.",
          icon: "error",
        });
        return;
      }
      try {
        await onSave(updatedTrato);
        onClose();
      } catch (error) {
        console.error("Error al guardar el trato:", error);
      }
    }
  };
  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Editar Trato" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="propietario">
            Propietario: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="propietario"
              value={formData.propietario}
              onChange={(e) => handleInputChange("propietario", e.target.value)}
              className="modal-form-control"
            >
              {users.map((user) => (
                <option key={user.id} value={user.nombre}>
                  {user.nombreReal}
                </option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="nombreTrato">
            Nombre trato: <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nombreTrato"
            value={formData.nombreTrato}
            onChange={(e) => handleInputChange("nombreTrato", e.target.value)}
            className={`modal-form-control ${errors.nombreTrato ? "error" : ""}`}
            placeholder="Trato ejemplo"
          />
          {errors.nombreTrato && <span className="error-message">{errors.nombreTrato}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="nombreEmpresa">
            Nombre empresa: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="nombreEmpresa"
              value={formData.nombreEmpresa}
              disabled
              className={`modal-form-control ${errors.nombreEmpresa ? "error" : ""}`}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.nombre}>
                  {company.nombre}
                </option>
              ))}
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreEmpresa && <span className="error-message">{errors.nombreEmpresa}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="nombreContacto">
            Nombre contacto: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="nombreContacto"
              value={formData.nombreContacto}
              onChange={(e) => handleInputChange("nombreContacto", e.target.value)}
              className={`modal-form-control ${errors.nombreContacto ? "error" : ""}`}
            >
              <option value="">Seleccione un contacto</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.nombre}>
                  {contact.nombre}
                </option>
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
              placeholder="5000"
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
            placeholder="10"
          />
        </div>

        <div className="modal-form-group">
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleInputChange("descripcion", e.target.value)}
            className="modal-form-control textarea"
            placeholder="Pequeña descripción de ejemplo"
            rows="4"
          />
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar cambios
          </button>
        </div>
      </form>
    </DetallesTratoModal>
  );
};

// Modal para crear correo
const CrearCorreoModal = ({ isOpen, onClose, onSave, tratoId, openModal, closeModal }) => {
  const [formData, setFormData] = useState({
    para: "",
    asunto: "",
    mensaje: "",
    adjuntos: [], // Archivos locales subidos
    adjuntosPlantilla: [], // URLs de archivos de plantilla
  });
  const [errors, setErrors] = useState({});
  const [plantillas, setPlantillas] = useState([]);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const loadContactoData = async () => {
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}`);
          const trato = await response.json();
          setFormData(prev => ({
            ...prev,
            para: trato.contacto?.email || "",
          }));
        } catch (error) {
          console.error("Error loading contact data:", error);
        }
      };
      loadContactoData();

      const loadPlantillas = async () => {
        setLoadingPlantillas(true);
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/plantillas`);
          const plantillasData = await response.json();
          setPlantillas(plantillasData);
        } catch (error) {
          console.error("Error loading plantillas:", error);
        } finally {
          setLoadingPlantillas(false);
        }
      };
      loadPlantillas();
    }
  }, [isOpen, tratoId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData((prev) => ({
      ...prev,
      adjuntos: [...prev.adjuntos, ...files],
    }));
  };

  const handleRemoveAttachment = (index, isTemplate = false) => {
    if (isTemplate) {
      setFormData((prev) => ({
        ...prev,
        adjuntosPlantilla: prev.adjuntosPlantilla.filter((_, i) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        adjuntos: prev.adjuntos.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.para.trim()) newErrors.para = "Debes especificar un destinatario o dejar el valor predeterminado";
    if (!formData.asunto.trim()) newErrors.asunto = "Este campo es obligatorio";
    if (!formData.mensaje.trim()) newErrors.mensaje = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetFormData = () => {
    setFormData({
      para: "",
      asunto: "",
      mensaje: "",
      adjuntos: [],
      adjuntosPlantilla: [],
    });
    setPlantillaSeleccionada(null);
    setErrors({});
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      const formDataToSend = new FormData();
      const destinatario = formData.para.trim() || "Sin destinatario";

      if (plantillaSeleccionada) {
        formDataToSend.append("destinatario", destinatario);
        formDataToSend.append("plantillaId", plantillaSeleccionada.id);
        formDataToSend.append("tratoId", tratoId);

        if (formData.mensaje !== plantillaSeleccionada.mensaje) {
          formDataToSend.append("cuerpoPersonalizado", formData.mensaje);
        }

        if (formData.adjuntos.length > 0) {
          for (const file of formData.adjuntos) {
            formDataToSend.append("archivosAdjuntosAdicionales", file);
          }
        }

        const response = await fetchWithToken(`${API_BASE_URL}/correos/plantilla`, {
          method: "POST",
          body: formDataToSend,
        });

        const emailRecord = await response.json();
        if (emailRecord.exito) {
          Swal.fire({
            title: "¡Correo enviado!",
            text: "El correo se ha enviado exitosamente usando la plantilla",
            icon: "success",
          });

          resetFormData();
          onSave();
          onClose();
        } else {
          throw new Error("Fallo al enviar el correo");
        }
      } else {
        formDataToSend.append("destinatario", destinatario);
        formDataToSend.append("asunto", formData.asunto);
        formDataToSend.append("cuerpo", formData.mensaje);
        formDataToSend.append("tratoId", tratoId);

        if (formData.adjuntos.length > 0) {
          for (const file of formData.adjuntos) {
            formDataToSend.append("archivosAdjuntos", file);
          }
        }

        const response = await fetchWithToken(`${API_BASE_URL}/correos`, {
          method: "POST",
          body: formDataToSend,
        });

        const emailRecord = await response.json();
        if (emailRecord.exito) {
          Swal.fire({
            title: "¡Correo enviado!",
            text: "El correo se ha enviado exitosamente",
            icon: "success",
          });

          resetFormData();
          onSave();
          onClose();
        } else {
          throw new Error("Fallo al enviar el correo");
        }
      }
    } catch (error) {
      console.error("Error al enviar correo:", error);
      setError(error.message || "No se pudo enviar el correo");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo enviar el correo"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUsarPlantilla = () => {
    if (loadingPlantillas || plantillas.length === 0) {
      console.log("Plantillas no cargadas aún o vacías", { loadingPlantillas, plantillas });
      return;
    }
    openModal("seleccionarPlantilla", {
      onSelectTemplate: (template) => {
        setPlantillaSeleccionada(template);
        setFormData(prev => ({
          ...prev,
          asunto: template.asunto,
          mensaje: template.mensaje,
          adjuntosPlantilla: template.adjuntos || [],
        }));
        closeModal("seleccionarPlantilla");
      },
      plantillas: plantillas,
    });
  };

  const handleLimpiarPlantilla = () => {
    setPlantillaSeleccionada(null);
    setFormData(prev => ({
      ...prev,
      asunto: "",
      mensaje: "",
      adjuntosPlantilla: [],
    }));
  };

  // Función para obtener el nombre del archivo desde una URL
  const getFileNameFromUrl = (url) => {
    try {
      const parts = url.split('/');
      let fileName = parts[parts.length - 1];
      if (fileName.includes('?')) {
        fileName = fileName.split('?')[0];
      }
      return fileName || 'archivo_adjunto';
    } catch (error) {
      return 'archivo_adjunto';
    }
  };

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Mensaje nuevo" size="lg" canClose={true}>
      <form onSubmit={handleSubmit} className="gmail-compose-form">
        <div className="gmail-compose-body">
          {/* Mostrar información de plantilla seleccionada */}
          {plantillaSeleccionada && (
            <div className="plantilla-info">
              <div className="plantilla-badge">
                <span>📝 Usando plantilla: {plantillaSeleccionada.nombre}</span>
                <button
                  type="button"
                  onClick={handleLimpiarPlantilla}
                  className="limpiar-plantilla-btn"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="gmail-field-group">
            <label className="gmail-field-label">Para</label>
            <input
              type="email"
              value={formData.para}
              onChange={(e) => handleInputChange("para", e.target.value)}
              className={`gmail-field-input ${errors.para ? "error" : ""}`}
              placeholder="Destinatarios"
            />
            {errors.para && <span className="error-message">{errors.para}</span>}
          </div>

          <div className="gmail-field-group">
            <label className="gmail-field-label">Asunto</label>
            <input
              type="text"
              value={formData.asunto}
              onChange={(e) => handleInputChange("asunto", e.target.value)}
              className={`gmail-field-input ${errors.asunto ? "error" : ""}`}
              placeholder="Asunto"
            />
            {errors.asunto && <span className="error-message">{errors.asunto}</span>}
          </div>

          <div className="gmail-message-area">
            <textarea
              value={formData.mensaje}
              onChange={(e) => handleInputChange("mensaje", e.target.value)}
              className={`gmail-message-input ${errors.mensaje ? "error" : ""}`}
              placeholder="Redactar mensaje"
              rows="12"
            />
            {errors.mensaje && <span className="error-message">{errors.mensaje}</span>}
          </div>

          {/* Mostrar archivos adjuntos de la plantilla */}
          {formData.adjuntosPlantilla.length > 0 && (
            <div className="gmail-attachments">
              <h4>Archivos de la plantilla:</h4>
              {formData.adjuntosPlantilla.map((adjunto, index) => (
                <div key={`template-${index}`} className="gmail-attachment-item template-attachment">
                  <img src={attachIcon || "/placeholder.svg"} alt="Adjunto" className="attachment-icon" />
                  <span>{getFileNameFromUrl(adjunto.adjuntoUrl)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index, true)}
                    className="gmail-remove-attachment"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mostrar archivos adjuntos adicionales */}
          {formData.adjuntos.length > 0 && (
            <div className="gmail-attachments">
              <h4>Archivos adicionales:</h4>
              {formData.adjuntos.map((archivo, index) => (
                <div key={`local-${index}`} className="gmail-attachment-item">
                  <img src={attachIcon || "/placeholder.svg"} alt="Adjunto" className="attachment-icon" />
                  <span>{archivo.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index, false)}
                    className="gmail-remove-attachment"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="gmail-compose-footer">
          <div className="gmail-footer-left">
            <button type="submit" className="gmail-btn-send" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={handleUsarPlantilla}
              className="gmail-btn-template"
              disabled={loadingPlantillas}
            >
              Usar plantilla
            </button>
          </div>
          <div className="gmail-footer-right">
            <label className="gmail-attach-btn">
              <img src={attachIcon || "/placeholder.svg"} alt="Adjuntar archivo" className="attach-icon" />
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </form>
      {loading && <div className="loading-overlay">Enviando...</div>}
      {error && <div className="error-message">{error}</div>}
    </DetallesTratoModal>
  );
};

// Modal para seleccionar plantillas
const SeleccionarPlantillaModal = ({ isOpen, onClose, onSelectTemplate, plantillas = [] }) => {

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Seleccionar plantilla" size="md">
      <div className="plantillas-list">
        {plantillas.map((plantilla) => (
          <div
            key={plantilla.id}
            className="plantilla-item"
            onClick={() => handleSelectTemplate(plantilla)}
          >
            <div className="plantilla-info">
              <h4>{plantilla.nombre}</h4>
              <p className="plantilla-asunto">{plantilla.asunto}</p>
              <p className="plantilla-preview">
                {(plantilla.mensaje || "").substring(0, 100)}...
              </p>
              {plantilla.adjuntos && plantilla.adjuntos.length > 0 && (
                <div className="plantilla-adjuntos">
                  📎 {plantilla.adjuntos.length} adjunto(s)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DetallesTratoModal>
  );
};

const ConfirmacionEnvioModal = ({ isOpen, onClose, onConfirm, tratoId, actividadId, esReprogramacion = false }) => {
  const [step, setStep] = useState(1);
  const [datosContacto, setDatosContacto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState(null); // 'correo' o 'whatsapp'

  useEffect(() => {
    if (isOpen && tratoId) {
      verificarDatosContacto();
    }
  }, [isOpen, tratoId]);

  const verificarDatosContacto = async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}/contacto/verificar-datos`);
      const datos = await response.json();
      setDatosContacto(datos);
    } catch (error) {
      console.error('Error al verificar datos del contacto:', error);
    }
  };

  const handleConfirmarEnvio = () => {
    if (!datosContacto.tieneCorreo && !datosContacto.tieneCelular) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos faltantes',
        text: 'El contacto necesita tener al menos un correo electrónico o un número de celular para enviar la confirmación.',
      });
      onClose();
      return;
    }
    setStep(2);
  };

  const handleMetodoEnvio = async (metodo) => {
    if (metodo === 'correo' && !datosContacto.tieneCorreo) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin correo electrónico',
        text: 'El contacto no tiene un correo electrónico registrado.',
      });
      return;
    }

    if (metodo === 'whatsapp' && !datosContacto.tieneCelular) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin número de celular',
        text: 'El contacto no tiene un número de celular registrado.',
      });
      return;
    }

    setLoading(true);
    setLoadingMethod(metodo);

    try {
      if (metodo === 'correo') {
        const endpoint = esReprogramacion
          ? `${API_BASE_URL}/tratos/${tratoId}/actividades/${actividadId}/enviar-notificacion-email-reprogramada`
          : `${API_BASE_URL}/tratos/${tratoId}/actividades/${actividadId}/enviar-notificacion-email`;

        await fetchWithToken(endpoint, { method: 'POST' });

        Swal.fire({
          icon: 'success',
          title: '¡Correo enviado!',
          text: `Se ha enviado la ${esReprogramacion ? 'notificación de reprogramación' : 'confirmación'} por correo electrónico.`,
        });
      } else if (metodo === 'whatsapp') {
        const response = await fetchWithToken(`${API_BASE_URL}/tratos/${tratoId}/generar-mensaje-whatsapp`, {
          method: 'POST',
          body: JSON.stringify({
            actividadId: actividadId,
            esReprogramacion: esReprogramacion ? 1 : 0
          }),
        });

        const { urlWhatsApp } = await response.json();
        window.open(urlWhatsApp, '_blank');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al enviar la notificación: ${error.message}`,
      });
    } finally {
      setLoading(false);
      setLoadingMethod(null);
      onConfirm();
      onClose();
    }
  };

  const resetModal = () => {
    setStep(1);
    setDatosContacto(null);
    setLoading(false);
    setLoadingMethod(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (step === 1) {
    return (
      <DetallesTratoModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Confirmar envío"
        size="sm"
        className="confirmacion-envio-modal"
      >
        <div className="modal-form">
          <div className="confirmacion-envio-step1">
            <div className="confirmation-icon"></div>
            <p className="confirmation-message">
              ¿Desea enviar el mensaje de {esReprogramacion ? 'reprogramación' : 'confirmación'} de la reunión?
            </p>
            <div className="modal-form-actions">
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="btn btn-secondary"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmarEnvio}
                className="btn btn-primary"
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      </DetallesTratoModal>
    );
  }

  return (
    <DetallesTratoModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Método de envío"
      size="sm"
      className="confirmacion-envio-modal"
    >
      <div className="modal-form">
        <div className="confirmacion-envio-step2">
          <div className="method-selection-header">
            <h3 className="method-selection-title">¿Cómo desea enviar la notificación?</h3>
            {datosContacto && (
              <div className="contact-info">
                <span>{datosContacto.nombreContacto}</span>
              </div>
            )}
          </div>

          <div className="method-buttons">
            <button
              type="button"
              onClick={() => handleMetodoEnvio('correo')}
              className={`btn-method email ${!datosContacto?.tieneCorreo ? 'unavailable' : ''} ${loadingMethod === 'correo' ? 'loading' : ''}`}
              disabled={loading || !datosContacto?.tieneCorreo}
            >
              <div className="method-icon"></div>
              <span className="method-label">Correo</span>
              <span className="loading-text">Enviando...</span>
            </button>

            <button
              type="button"
              onClick={() => handleMetodoEnvio('whatsapp')}
              className={`btn-method whatsapp ${!datosContacto?.tieneCelular ? 'unavailable' : ''} ${loadingMethod === 'whatsapp' ? 'loading' : ''}`}
              disabled={loading || !datosContacto?.tieneCelular}
            >
              <div className="method-icon"></div>
              <span className="method-label">WhatsApp</span>
              <span className="loading-text">Generando...</span>
            </button>
          </div>
        </div>
      </div>
    </DetallesTratoModal>
  );
};

const DetallesTrato = () => {
  const params = useParams()
  const navigate = useNavigate()
  const [trato, setTrato] = useState({
    nombre: "",
    contacto: { nombre: "", telefono: "", whatsapp: "", email: "" },
    propietario: "",
    numeroTrato: "",
    nombreEmpresa: "",
    descripcion: "",
    domicilio: "",
    ingresosEsperados: "",
    sitioWeb: "",
    sector: "",
    fechaCreacion: "",
    fechaCierre: "",
    fases: [],
    actividadesAbiertas: { tareas: [], llamadas: [], reuniones: [] },
    historialInteracciones: [],
    notas: [],
  });
  const [loading, setLoading] = useState(true)
  const [emailRecords, setEmailRecords] = useState([]);
  const [nuevaNota, setNuevaNota] = useState("")
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState("")
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [correosSeguimientoActivo, setCorreosSeguimientoActivo] = useState(false);
  const [cargandoCorreos, setCargandoCorreos] = useState(false);


  // Estados para modales
  const [modals, setModals] = useState({
    seleccionarActividad: { isOpen: false },
    programarLlamada: { isOpen: false, loading: false },
    programarReunion: { isOpen: false, loading: false },
    programarTarea: { isOpen: false, loading: false },
    reprogramarLlamada: { isOpen: false, actividad: null, loading: false },
    reprogramarReunion: { isOpen: false, actividad: null, loading: false },
    reprogramarTarea: { isOpen: false, actividad: null, loading: false },
    completarActividad: { isOpen: false, actividad: null, loading: false },
    editarTrato: { isOpen: false },
    crearNuevaActividad: { isOpen: false },
    crearCorreo: { isOpen: false },
    seleccionarPlantilla: { isOpen: false },
  })

  // Funciones para manejar modales
  const openModal = async (modalType, data = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: true, loading: true, tratoId: params.id, ...data },
    }));

    if (
      [
        'reprogramarLlamada',
        'reprogramarReunion',
        'reprogramarTarea',
        'programarLlamada',
        'programarReunion',
        'programarTarea',
        'completarActividad',
      ].includes(modalType)
    ) {
      try {
        const tratoResponse = await fetchWithToken(`${API_BASE_URL}/tratos/${params.id}`);
        const trato = await tratoResponse.json();

        let contactos = [];
        if (trato.empresaId) {
          const contactosResponse = await fetchWithToken(
            `${API_BASE_URL}/empresas/${trato.empresaId}/contactos`
          );
          const contactosData = await contactosResponse.json();
          contactos = contactosData || [];
        }

        // Actualizar el modal con los datos cargados y loading false
        setModals((prev) => ({
          ...prev,
          [modalType]: {
            ...prev[modalType],
            contactos,
            loading: false
          },
        }));

      } catch (error) {
        console.error('Error fetching contactos for modal:', error);

        setModals((prev) => ({
          ...prev,
          [modalType]: {
            ...prev[modalType],
            contactos: [],
            loading: false
          },
        }));

        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se pudieron cargar los contactos. Continúa sin contactos.',
        });
      }
    } else {
      // Para modales que no necesitan cargar datos, quitar loading inmediatamente
      setModals((prev) => ({
        ...prev,
        [modalType]: { ...prev[modalType], loading: false },
      }));
    }
  };
  const closeModal = (modalType) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: false },
    }))
  }

  // Función para obtener el estado actual de los correos de seguimiento
  const obtenerEstadoCorreosSeguimiento = async (tratoId) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/correos-seguimiento/estado/${tratoId}`);
      const activo = await response.json();
      setCorreosSeguimientoActivo(activo);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener el estado de los correos de seguimiento'
      });
    }
  };

  // Función para activar/desactivar correos de seguimiento
  const toggleCorreosSeguimiento = async (tratoId, activar) => {
    setCargandoCorreos(true);

    try {
      const endpoint = activar ? 'activar' : 'desactivar';
      const response = await fetchWithToken(`${API_BASE_URL}/correos-seguimiento/${endpoint}/${tratoId}`, {
        method: 'POST'
      });

      const mensaje = await response.text();
      setCorreosSeguimientoActivo(activar);
      Swal.fire({
        icon: 'success',
        title: activar ? 'Correos de seguimiento activados' : 'Correos de seguimiento desactivados',
        text: mensaje,
        showConfirmButton: false,
        timer: 2000
      });

    } catch (error) {
      // Revertir el estado del checkbox si hay error
      setCorreosSeguimientoActivo(!activar);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al cambiar el estado de los correos de seguimiento'
      });
    } finally {
      setCargandoCorreos(false);
    }
  };

  // Función para manejar el cambio del checkbox
  const handleCorreosSeguimientoChange = (e) => {
    const isChecked = e.target.checked;
    toggleCorreosSeguimiento(trato.id, isChecked);
  };

  // useEffect para cargar el estado inicial cuando se carga el trato
  useEffect(() => {
    if (trato && trato.id && ['ENVIO_DE_INFORMACION', 'RESPUESTA_POR_CORREO'].includes(trato.fase)) {
      obtenerEstadoCorreosSeguimiento(trato.id);
    }
  }, [trato]);


  const handleSelectActivity = (tipo) => {
    const modalMap = {
      llamada: "programarLlamada",
      reunion: "programarReunion",
      tarea: "programarTarea",
    }
    openModal(modalMap[tipo])
  }

  const handleSaveActividad = async (data, tipo) => {
    let nombreContacto = "Sin contacto";
    const modalType = tipo.toLowerCase();
    const modalState = modals[`programar${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`];

    if (data.contactoId && modalState && modalState.isOpen) {
      let contactos = modalState.contactos || [];
      if (contactos.length === 0 && modalState.tratoId) {
        try {
          const response = await fetchWithToken(`${API_BASE_URL}/tratos/${modalState.tratoId}`);
          const trato = await response.json();
          if (trato.empresaId) {
            const contactosResponse = await fetchWithToken(`${API_BASE_URL}/empresas/${trato.empresaId}/contactos`);
            contactos = await contactosResponse.json();
            setModals((prev) => ({
              ...prev,
              [modalType]: { ...prev[modalType], contactos },
            }));
          }
        } catch (error) {
          console.error("Error fetching contactos:", error);
        }
      }
      const contacto = contactos.find((c) => c.id === data.contactoId);
      nombreContacto = contacto ? contacto.nombre : "Sin contacto";
    } else if (data.contactoId && trato.contacto?.nombre) {
      nombreContacto = trato.contacto.nombre;
    }

    const actividad = {
      ...data,
      id: data.id,
      tipo: tipo.toUpperCase(),
      estado: "Programada",
      fecha: data.fechaLimite || "Sin fecha",
      hora: data.horaInicio || "Sin hora",
      nombreContacto: nombreContacto,
      asignadoA: users.find((user) => user.id === data.asignadoAId)?.nombreReal || "Sin asignado",
      modalidad: data.modalidad,
      lugarReunion: data.lugarReunion || null,
      enlaceReunion: data.enlaceReunion || null,
      duracion: data.duracion || null,
      subtipoTarea: data.subtipoTarea || null,
    };

    const normalizedTipo = tipo.toLowerCase().replace(/ñ/g, 'n');
    setTrato((prev) => ({
      ...prev,
      actividadesAbiertas: {
        ...prev.actividadesAbiertas,
        [normalizedTipo === "llamada" ? "llamadas" : normalizedTipo === "reunion" ? "reuniones" : "tareas"]: [
          ...prev.actividadesAbiertas[
          normalizedTipo === "llamada" ? "llamadas" : normalizedTipo === "reunion" ? "reuniones" : "tareas"
          ],
          actividad,
        ],
      },
    }));
    Swal.fire({
      title: `¡${tipo.charAt(0).toUpperCase() + tipo.slice(1)} programada!`,
      text: `La ${tipo} se ha programada exitosamente`,
      icon: "success",
    });
  };


  const handleSaveReprogramar = async (data, tipo, contactos) => {
    const normalizedTipo = tipo.toLowerCase().replace(/ñ/g, "n");
    const actividadReprogramada = {
      ...data,
      id: data.id,
      tipo: tipo.toUpperCase(),
      estado: "Reprogramada",
      nombreContacto: contactos.find((c) => c.id === data.contactoId)?.nombre || "Sin contacto",
      asignadoA: users.find((u) => u.id === data.asignadoAId)?.nombreReal || "Sin asignado",
      fecha: data.fechaLimite || "Sin fecha",
      hora: data.horaInicio || "Sin hora",
      subtipoTarea: data.subtipoTarea || null,
    };

    setTrato((prev) => {
      const updatedActividades = prev.actividadesAbiertas[
        normalizedTipo === "llamada" ? "llamadas" : normalizedTipo === "reunion" ? "reuniones" : "tareas"
      ].map((a) => (a.id === actividadReprogramada.id ? actividadReprogramada : a));
      return {
        ...prev,
        actividadesAbiertas: {
          ...prev.actividadesAbiertas,
          [normalizedTipo === "llamada" ? "llamadas" : normalizedTipo === "reunion" ? "reuniones" : "tareas"]:
            updatedActividades,
        },
      };
    });

    try {
      await fetchWithToken(`${API_BASE_URL}/tratos/${data.tratoId}/actividades/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      Swal.fire({
        title: "¡Actividad reprogramada!",
        text: `La ${tipo} se ha reprogramado exitosamente`,
        icon: "success",
      });
    } catch (error) {
      console.error(`Error al reprogramar la ${tipo}:`, error);
      Swal.fire({
        title: "Error",
        text: `No se pudo reprogramar la ${tipo}`,
        icon: "error",
      });
    }
  };

  const handleSaveCompletarActividad = async (updatedActividad, tipo) => {
    const normalizedTipo = tipo.toLowerCase().replace(/ñ/g, 'n');
    const actividad = modals.completarActividad.actividad;
    if (!actividad) {
      Swal.fire({
        title: 'Error',
        text: 'No se encontró la actividad a completar',
        icon: 'error',
      });
      return;
    }

    try {
      setTrato((prev) => {
        const updatedActividades = prev.actividadesAbiertas[
          normalizedTipo === 'llamada' ? 'llamadas' : normalizedTipo === 'reunion' ? 'reuniones' : 'tareas'
        ].filter((a) => a.id !== actividad.id);

        const newInteraccion = {
          id: updatedActividad.id,
          fecha: updatedActividad.fechaCompletado ? new Date(updatedActividad.fechaCompletado).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          hora: updatedActividad.horaCompletado || new Date().toLocaleTimeString(),
          responsable: users.find((u) => u.id === updatedActividad.asignadoAId)?.nombreReal || 'Sin asignado',
          tipo: updatedActividad.tipo,
          medio: !updatedActividad.medio && updatedActividad.tipo.toUpperCase() === 'REUNION'
            ? 'PRESENCIAL'
            : updatedActividad.medio || null,
          resultado: updatedActividad.respuesta === 'SI' ? 'POSITIVO' : updatedActividad.respuesta === 'NO' ? 'NEGATIVO' : 'Sin resultado',
          interes: updatedActividad.interes || 'Sin interés',
          notas: updatedActividad.notas || '',
        };
        return {
          ...prev,
          actividadesAbiertas: {
            ...prev.actividadesAbiertas,
            [normalizedTipo === 'llamada' ? 'llamadas' : normalizedTipo === 'reunion' ? 'reuniones' : 'tareas']:
              updatedActividades,
          },
          historialInteracciones: [...prev.historialInteracciones, newInteraccion],
        };
      });

      Swal.fire({
        title: '¡Actividad completada!',
        text: 'El reporte de actividad se ha guardado exitosamente',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Crear nueva actividad',
        cancelButtonText: 'Cerrar',
      }).then((result) => {
        if (result.isConfirmed) {
          openModal('seleccionarActividad', { tratoId: actividad.tratoId });
        }
      });
    } catch (error) {
      console.error('Error al completar la actividad:', error);
      Swal.fire({
        title: 'Error',
        text: error.message.includes('no encontrada')
          ? 'La actividad no fue encontrada'
          : 'No se pudo completar la actividad',
        icon: 'error',
      });
    }
  };


  const handleSaveEditarTrato = async (data) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      const loadTrato = async () => {
        const updatedData = await fetchTrato(params.id);
        const usersResponse = await fetchWithToken(`${API_BASE_URL}/auth/users`);
        const usersData = await usersResponse.json();
        const users = usersData.map((user) => ({ id: user.id, nombre: user.nombreUsuario, nombreReal: user.nombre }));

        const propietarioUser = users.find((user) => user.id === updatedData.propietarioId);
        const propietarioNombre = propietarioUser ? propietarioUser.nombre : updatedData.propietarioNombre || "";

        const mapActividad = (actividad) => {
          let nombreContacto = "Sin contacto";
          if (actividad.contactoId) {
            const contacto = companies
              .flatMap((c) => c.contactos || [])
              .find((c) => c.id === actividad.contactoId);
            nombreContacto = contacto ? contacto.nombre : "Sin contacto";
          } else if (updatedData.contacto?.nombre) {
            nombreContacto = updatedData.contacto.nombre;
          }
          return {
            ...actividad,
            nombreContacto: nombreContacto,
            asignadoA: users.find((user) => user.id === actividad.asignadoAId)?.nombreReal || "Sin asignado",
            fecha: actividad.fechaLimite || "Sin fecha",
            hora: actividad.horaInicio || "Sin hora",
            modalidad: actividad.modalidad,
            lugarReunion: actividad.lugarReunion || null,
            enlaceReunion: actividad.enlaceReunion || null,
            tipo: actividad.tipo === "TAREA" ? "TAREA" : actividad.tipo || "Sin tipo",
            subtipoTarea: actividad.subtipoTarea || null,
            finalidad: actividad.finalidad || "Sin finalidad",
          };
        };

        const mapActividadesAbiertas = (actividades) => ({
          tareas: (actividades.tareas || []).filter(a => a.estatus !== "CERRADA").map(mapActividad),
          llamadas: (actividades.llamadas || []).filter(a => a.estatus !== "CERRADA").map(mapActividad),
          reuniones: (actividades.reuniones || []).filter(a => a.estatus !== "CERRADA").map(mapActividad),
        });

        setTrato({
          ...updatedData,
          propietario: propietarioNombre,
          contacto: updatedData.contacto || { nombre: "", telefono: "", whatsapp: "", email: "" },
          ingresosEsperados: updatedData.ingresosEsperados ? `$${updatedData.ingresosEsperados.toFixed(2)}` : "",
          fechaCreacion: updatedData.fechaCreacion ? new Date(updatedData.fechaCreacion).toLocaleDateString() : "",
          fechaCierre: updatedData.fechaCierre ? new Date(updatedData.fechaCierre).toLocaleDateString() : "",
          notas: updatedData.notas.map((n) => ({
            id: n.id,
            texto: n.nota.replace(/\\"/g, '"').replace(/^"|"$/g, ''),
            autor: n.autorNombre,
            fecha: n.fechaCreacion ? new Date(n.fechaCreacion).toLocaleDateString() : "",
            editadoPor: n.editadoPorName || null,
            fechaEdicion: n.fechaEdicion ? new Date(n.fechaEdicion).toLocaleDateString() : null,
          })),
          nombreEmpresa: updatedData.empresaNombre,
          numeroTrato: updatedData.noTrato,
          actividadesAbiertas: mapActividadesAbiertas(updatedData.actividadesAbiertas),
          historialInteracciones: (updatedData.historialInteracciones || []).map((interaccion) => ({
            id: interaccion.id,
            fecha: interaccion.fechaCompletado ? new Date(interaccion.fechaCompletado).toISOString().split('T')[0] : "Sin fecha",
            hora: interaccion.fechaCompletado ? new Date(interaccion.fechaCompletado).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : "Sin hora",
            responsable: users.find((u) => u.id === interaccion.usuarioCompletadoId)?.nombre || "Sin asignado",
            tipo: interaccion.tipo,
            medio: interaccion.medio || (interaccion.modalidad === "PRESENCIAL" ? "PRESENCIAL" : interaccion.medio),
            resultado: interaccion.respuesta ? (interaccion.respuesta === "SI" ? "POSITIVO" : "NEGATIVO") : "Sin resultado",
            interes: interaccion.interes || "Sin interés",
            notas: interaccion.notas || "",
          })),
        });
      };
      await loadTrato();

      Swal.fire({
        title: "¡Trato actualizado!",
        text: "Los cambios se han guardado exitosamente",
        icon: "success",
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el trato',
        icon: 'error',
      });
      console.error("Error al guardar el trato:", error);
    }
  };

  useEffect(() => {
    const loadTrato = async () => {
      setLoading(true);
      try {
        // Cargar datos básicos primero
        const tratoData = await fetchTrato(params.id);
        const usersResponse = await fetchWithToken(`${API_BASE_URL}/auth/users`);
        const usersData = await usersResponse.json();
        const companiesResponse = await fetchWithToken(`${API_BASE_URL}/empresas`);
        const companiesData = await companiesResponse.json();


        const users = usersData.map((user) => ({
          id: user.id,
          nombre: user.nombreUsuario,
          nombreReal: user.nombre
        }));
        setUsers(users);
        setCompanies(companiesData || []);

        const propietarioUser = users.find((user) => user.id === tratoData.propietarioId);
        const propietarioNombre = propietarioUser ? propietarioUser.nombreReal : tratoData.propietarioNombre || "";

        setTrato({
          id: tratoData.id || "",
          nombre: tratoData.nombre || "",
          contacto: tratoData.contacto || { nombre: "", telefono: "", whatsapp: "", email: "" },
          propietario: propietarioNombre,
          numeroTrato: tratoData.noTrato || "",
          nombreEmpresa: tratoData.empresaNombre || "",
          descripcion: tratoData.descripcion || "",
          domicilio: tratoData.domicilio || "",
          ingresosEsperados: tratoData.ingresosEsperados ? `$${tratoData.ingresosEsperados.toFixed(2)}` : "",
          numeroUnidades: tratoData.numeroUnidades || "",
          sitioWeb: tratoData.sitioWeb || "",
          sector: tratoData.sector || "",
          fechaCreacion: tratoData.fechaCreacion ? new Date(tratoData.fechaCreacion).toLocaleDateString() : "",
          fechaCierre: tratoData.fechaCierre ? new Date(tratoData.fechaCierre).toLocaleDateString() : "",
          fase: tratoData.fase || "",
          fases: tratoData.fases || [],
          actividadesAbiertas: { tareas: [], llamadas: [], reuniones: [] },
          historialInteracciones: [],
          notas: [],
        });

        setLoading(false);

        // Cargar datos secundarios de forma asíncrona
        loadSecondaryData(tratoData, users);

      } catch (error) {
        console.error("Error fetching trato:", error);
        setLoading(false);
        Swal.fire({
          title: "Error",
          text: "No se pudo cargar el trato",
          icon: "error",
        });
      }
    };

    const loadSecondaryData = async (tratoData, users) => {
      try {
        // Solo cargar emails del trato
        const emailData = await fetchWithToken(`${API_BASE_URL}/correos/trato/${params.id}`)
          .then(res => res.status === 204 ? [] : res.json())
          .catch(() => []);

        setEmailRecords(Array.isArray(emailData) ? emailData : []);

        // Solo cargar contactos si hay actividades que los necesiten
        const allActividades = [
          ...(tratoData.actividadesAbiertas?.tareas || []),
          ...(tratoData.actividadesAbiertas?.llamadas || []),
          ...(tratoData.actividadesAbiertas?.reuniones || [])
        ];

        // Obtener IDs únicos de contactos necesarios
        const contactosNeeded = new Set();
        allActividades.forEach(actividad => {
          if (actividad.contactoId) {
            contactosNeeded.add(actividad.contactoId);
          }
        });

        // Solo cargar los contactos específicos que necesitamos
        const contactosMap = new Map();
        if (contactosNeeded.size > 0) {
          for (const contactoId of contactosNeeded) {
            try {
              const contactoResponse = await fetchWithToken(`${API_BASE_URL}/contactos/${contactoId}`);
              const contactoData = await contactoResponse.json();
              contactosMap.set(contactoId, contactoData);
            } catch (error) {
              console.warn(`No se pudo cargar contacto ${contactoId}`);
            }
          }
        }

        // Función optimizada para mapear actividades
        const mapActividad = (actividad) => {
          let nombreContacto = "Sin contacto";
          if (actividad.contactoId && contactosMap.has(actividad.contactoId)) {
            nombreContacto = contactosMap.get(actividad.contactoId).nombre;
          } else if (tratoData.contacto?.nombre) {
            nombreContacto = tratoData.contacto.nombre;
          }

          return {
            ...actividad,
            nombreContacto: nombreContacto,
            asignadoA: users.find((user) => user.id === actividad.asignadoAId)?.nombre || "Sin asignado",
            fecha: actividad.fechaLimite || "Sin fecha",
            hora: actividad.horaInicio || "Sin hora",
            modalidad: actividad.modalidad,
            lugarReunion: actividad.lugarReunion || null,
            enlaceReunion: actividad.enlaceReunion || null,
            tipo: actividad.tipo === "TAREA" ? "TAREA" : actividad.tipo || "Sin tipo",
            subtipoTarea: actividad.subtipoTarea || null,
            finalidad: actividad.finalidad || "Sin finalidad",
          };
        };

        // Actualizar el trato con los datos procesados
        setTrato(prev => ({
          ...prev,
          actividadesAbiertas: {
            tareas: (tratoData.actividadesAbiertas?.tareas || [])
              .filter(a => a.estatus !== "CERRADA")
              .map(mapActividad),
            llamadas: (tratoData.actividadesAbiertas?.llamadas || [])
              .filter(a => a.estatus !== "CERRADA")
              .map(mapActividad),
            reuniones: (tratoData.actividadesAbiertas?.reuniones || [])
              .filter(a => a.estatus !== "CERRADA")
              .map(mapActividad),
          },
          historialInteracciones: (tratoData.historialInteracciones || []).map(interaccion => ({
            id: interaccion.id,
            fecha: interaccion.fechaCompletado ? new Date(interaccion.fechaCompletado).toISOString().split('T')[0] : "Sin fecha",
            hora: interaccion.fechaCompletado ? new Date(interaccion.fechaCompletado).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : "Sin hora",
            responsable: users.find(u => u.id === interaccion.usuarioCompletadoId)?.nombreReal || "Sin asignado",
            tipo: interaccion.tipo,
            medio: interaccion.medio || (interaccion.modalidad === "PRESENCIAL" ? "PRESENCIAL" : interaccion.medio),
            resultado: interaccion.respuesta ? (interaccion.respuesta === "SI" ? "POSITIVO" : "NEGATIVO") : "Sin resultado",
            interes: interaccion.interes || "Sin interés",
            notas: interaccion.notas || "",
          })),
          notas: (tratoData.notas || []).map((n) => ({
            id: n.id,
            texto: n.nota.replace(/\\"/g, '"').replace(/^"|"$/g, ''),
            autor: n.autorNombre,
            fecha: n.fechaCreacion ? new Date(n.fechaCreacion).toLocaleDateString() : "",
            editadoPor: n.editadoPorName || null,
            fechaEdicion: n.fechaEdicion ? new Date(n.fechaEdicion).toLocaleDateString() : null,
          })),
        }));

      } catch (error) {
        console.error("Error loading secondary data:", error);
      }
    };

    loadTrato();
  }, [params.id]);

  const handleVolver = () => {
    navigate("/tratos")
  }


  const handleEditarTrato = () => {
    openModal("editarTrato");
  };

  const handleAgregarNota = async () => {
    if (nuevaNota.trim()) {
      try {
        const cleanedText = nuevaNota.replace(/\\"/g, '"').replace(/^"|"$/g, '');
        const response = await fetchWithToken(`${API_BASE_URL}/tratos/${params.id}/notas`, {
          method: 'POST',
          body: JSON.stringify(cleanedText),
        });
        const savedNota = await response.json();
        const newNota = {
          id: savedNota.id,
          texto: savedNota.nota.replace(/\\"/g, '"').replace(/^"|"$/g, ''),
          autor: savedNota.autorNombre || "Usuario Desconocido",
          fecha: new Date(savedNota.fechaCreacion).toLocaleDateString(),
          editadoPor: savedNota.editadoPorNombre || null,
          fechaEdicion: savedNota.fechaEdicion ? new Date(savedNota.fechaEdicion).toLocaleDateString() : null,
        };
        setTrato((prev) => ({
          ...prev,
          notas: [...prev.notas, newNota],
        }));
        setNuevaNota("");
        Swal.fire({
          title: "¡Éxito!",
          text: "Nota agregada correctamente",
          icon: "success",
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo agregar la nota',
          icon: 'error',
        });
        console.error(error);
      }
    }
  };

  const handleEliminarNota = (notaId) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetchWithToken(`${API_BASE_URL}/tratos/${params.id}/notas/${notaId}`, {
            method: 'DELETE',
          });
          setTrato((prev) => ({
            ...prev,
            notas: prev.notas.filter((nota) => nota.id !== notaId),
          }));
          Swal.fire({
            title: "¡Éxito!",
            text: "Nota eliminada correctamente",
            icon: "success",
          });
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar la nota',
            icon: 'error',
          });
        }
      }
    });
  };


  const handleAgregarActividad = (tipo) => {
    openModal("seleccionarActividad")
  }

  const handleAgregarCorreo = () => {
    openModal("crearCorreo")
  }

  const handleCambiarFase = async (nuevaFase) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/tratos/${params.id}/mover-fase?nuevaFase=${nuevaFase}`, {
        method: 'PUT',
      });
      const updatedTrato = await response.json();

      setTrato((prev) => ({
        ...prev,
        fase: updatedTrato.fase,
        fases: updatedTrato.fases,
        propietarioId: updatedTrato.propietarioId,
        propietarioNombre: updatedTrato.propietarioNombre
      }));

      // Verificar si el trato fue escalado
      if (updatedTrato.escalado) {
        Swal.fire({
          title: "¡Trato Escalado!",
          html: `
          <div style="text-align: left;">
            <p><strong>Fase cambiada a:</strong> ${nuevaFase.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</p>
            <p><strong>Trato transferido a:</strong> ${updatedTrato.nuevoAdministradorNombre}</p>
            <p style="margin-top: 15px; color: #666;">
              <i class="fas fa-info-circle"></i> Su trato ha sido automáticamente asignado a un administrador para su seguimiento en esta fase crítica.
            </p>
          </div>
        `,
          icon: "info",
          iconColor: "#3085d6",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#3085d6",
          allowOutsideClick: false,
          allowEscapeKey: false,
          customClass: {
            popup: 'swal-escalamiento-popup'
          }
        });
      } else {
        Swal.fire({
          title: "¡Éxito!",
          text: `Fase cambiada a ${nuevaFase.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}`,
          icon: "success",
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cambiar la fase',
        icon: 'error',
      });
      console.error(error);
    }
  };
  // Funciones para editar notas inline
  const handleEditarNota = (notaId) => {
    const nota = trato.notas.find((n) => n.id === notaId);
    if (nota) {
      setEditingNoteId(notaId);
      setEditingNoteText(nota.texto);
    }
  };

  const handleSaveEditNota = async (notaId) => {
    if (editingNoteText.trim()) {
      try {
        const cleanedText = editingNoteText.replace(/\\"/g, '"').replace(/^"|"$/g, '');
        const response = await fetchWithToken(`${API_BASE_URL}/tratos/${params.id}/notas/${notaId}`, {
          method: 'PUT',
          body: JSON.stringify(cleanedText),
        });
        const updatedNota = await response.json();
        const newNota = {
          ...trato.notas.find((n) => n.id === notaId),
          texto: updatedNota.nota,
          editadoPor: updatedNota.editadoPorNombre || null,
          fechaEdicion: updatedNota.fechaEdicion ? new Date(updatedNota.fechaEdicion).toLocaleDateString() : null,
        };
        setTrato((prev) => ({
          ...prev,
          notas: prev.notas.map((n) => (n.id === notaId ? newNota : n)),
        }));
        setEditingNoteId(null);
        setEditingNoteText("");
        Swal.fire({
          title: "¡Éxito!",
          text: "Nota editada correctamente",
          icon: "success",
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo editar la nota',
          icon: 'error',
        });
        console.error(error);
      }
    }
  };

  const handleCancelEditNota = () => {
    setEditingNoteId(null)
    setEditingNoteText("")
  }

  const handleLlamarContacto = (telefono) => {
    Swal.fire({
      title: "Realizar Llamada",
      text: `¿Deseas llamar al número ${telefono}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2196f3",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, llamar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(`tel:${telefono}`, "_self")
        Swal.fire("Llamada iniciada", `Llamando a ${telefono}`, "success")
      }
    })
  }

  const handleWhatsAppContacto = (whatsapp) => {
    Swal.fire({
      title: "Abrir WhatsApp",
      text: `¿Deseas enviar un mensaje de WhatsApp al número ${whatsapp}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#25d366",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, abrir WhatsApp",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar el número de WhatsApp (quitar espacios y caracteres especiales)
        const cleanNumber = whatsapp.replace(/\s+/g, "").replace(/[^\d]/g, "")
        const whatsappUrl = `https://wa.me/52${cleanNumber}`
        window.open(whatsappUrl, "_blank")
        Swal.fire("WhatsApp abierto", `Mensaje enviado a ${whatsapp}`, "success")
      }
    })
  }

  const handleCompletarActividad = (actividadId, tipo) => {
    const actividad = trato.actividadesAbiertas[
      tipo === "llamada" ? "llamadas" : tipo === "reunion" ? "reuniones" : "tareas"
    ].find((a) => a.id === actividadId);
    if (!actividad || !actividad.tratoId) {
      Swal.fire({
        title: 'Error',
        text: 'No se encontró la actividad o el trato asociado.',
        icon: 'error',
      });
      return;
    }
    openModal("completarActividad", { actividad, tratoId: actividad.tratoId });
  };

  const handleReprogramarActividad = (actividadId, tipo) => {
    const actividad = trato.actividadesAbiertas[
      tipo === "llamada" ? "llamadas" : tipo === "reunion" ? "reuniones" : "tareas"
    ].find((a) => a.id === actividadId);
    if (actividad && actividad.tratoId) {
      if (tipo === "llamada") {
        openModal("reprogramarLlamada", { actividad });
      } else if (tipo === "reunion") {
        openModal("reprogramarReunion", { actividad });
      } else if (tipo === "tarea") {
        openModal("reprogramarTarea", { actividad });
      }
    } else {
      console.error("Actividad or tratoId not found for reprogramming:", actividadId, tipo);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo encontrar la actividad o el trato asociado.",
      });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading-container">
          <p>Cargando detalles del trato...</p>
        </div>
      </>
    )
  }

  if (!trato) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>No se pudo cargar el trato</p>
          <button onClick={handleVolver} className="btn-volver">
            Volver a Tratos
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="detalles-trato-container">
          {/* Header con navegación */}
          <div className="detalles-header">
            <div className="header-navigation">
              <button onClick={handleVolver} className="btn-volver">
                ←
              </button>
              <h1 className="trato-titulo">{trato.nombre}</h1>
            </div>
            <button onClick={handleEditarTrato} className="btn-editar-trato">
              Editar trato
            </button>
          </div>

          {/* Breadcrumb de fases */}
          <div className="fases-breadcrumb">
            <div className="fecha-inicio">
              <span>INICIO</span>
              <span className="fecha">{trato.fechaCreacion}</span>
            </div>
            <div className="fases-container">
              {trato.fases.map((fase, index) => (
                <button
                  key={index}
                  className={`fase-item ${trato.fase === fase.nombre ? 'actual' : ''}`}
                  onClick={() => handleCambiarFase(fase.nombre)}
                >
                  <span>{fase.nombre.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
                </button>
              ))}
            </div>
            <div className="fecha-final">
              <span>FINAL</span>
              <span className="fecha">{trato.fechaCierre}</span>
              <div className="iconos-estado">
                <button
                  className={`btn-estado ganado ${trato.fase === 'CERRADO_GANADO' ? 'activo' : ''}`}
                  onClick={() => handleCambiarFase('CERRADO_GANADO')}
                >
                  <img src={checkIcon || "/placeholder.svg"} alt="Marcar como ganado" />
                </button>
                <button
                  className={`btn-estado perdido ${trato.fase === 'CERRADO_PERDIDO' ? 'activo' : ''}`}
                  onClick={() => handleCambiarFase('CERRADO_PERDIDO')}
                >
                  <img src={closeIcon || "/placeholder.svg"} alt="Marcar como perdido" />
                </button>
              </div>
            </div>
          </div>

          {/* Persona de contacto */}
          {trato.contacto && (
            <div className="seccion persona-contacto">
              <div className="seccion-header">
                <h2>Persona de contacto</h2>
                {['ENVIO_DE_INFORMACION', 'RESPUESTA_POR_CORREO'].includes(trato.fase) && (
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={correosSeguimientoActivo}
                      onChange={handleCorreosSeguimientoChange}
                      disabled={cargandoCorreos}
                    />
                    <span>
                      {cargandoCorreos ? 'Procesando...' : 'Mandar emails de seguimiento'}
                    </span>
                  </label>
                )}
              </div>
              <div className="contacto-info">
                <div className="contacto-avatar">
                  <div className="avatar-circle">
                    <span>{(trato.contacto.nombre || "").charAt(0) || "C"}</span>
                  </div>
                  <span className="contacto-nombre">{trato.contacto.nombre || "Sin contacto"}</span>
                </div>
                <div className="contacto-detalles">
                  <div className="contacto-item">
                    <button
                      className="btn-contacto telefono"
                      onClick={() => handleLlamarContacto(trato.contacto.telefono || "")}
                      title="Llamar"
                    >
                      <img src={phoneIcon || "/placeholder.svg"} alt="Teléfono" className="contacto-icon" />
                    </button>
                    <span>{trato.contacto.telefono || "N/A"}</span>
                  </div>
                  <div className="contacto-item">
                    <button
                      className="btn-contacto whatsapp"
                      onClick={() => handleWhatsAppContacto(trato.contacto.whatsapp || "")}
                      title="Enviar WhatsApp"
                    >
                      <img src={whatsappIcon || "/placeholder.svg"} alt="WhatsApp" className="contacto-icon" />
                    </button>
                    <span>{trato.contacto.whatsapp || "N/A"}</span>
                  </div>
                  <div className="contacto-item">
                    <img src={emailIcon || "/placeholder.svg"} alt="Email" className="contacto-icon" />
                    <span>{trato.contacto.email || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detalles del trato */}
          <div className="seccion detalles-trato">
            <h2>Detalles del trato</h2>
            <div className="detalles-grid">
              <div className="detalle-item">
                <label>Propietario trato</label>
                <span>{trato.propietario}</span>
              </div>
              <div className="detalle-item">
                <label>Número de trato</label>
                <span>{trato.numeroTrato}</span>
              </div>
              <div className="detalle-item">
                <label>Nombre Empresa</label>
                <span>{trato.nombreEmpresa}</span>
              </div>
              <div className="detalle-item">
                <label>Descripción</label>
                <span>{trato.descripcion}</span>
              </div>
              <div className="detalle-item">
                <label>Domicilio de la empresa</label>
                <span>{trato.domicilio}</span>
              </div>
              <div className="detalle-item">
                <label>Ingresos esperados</label>
                <span>{trato.ingresosEsperados}</span>
              </div>
              <div className="detalle-item">
                <label>Sitio web</label>
                <a href={trato.sitioWeb} target="_blank" rel="noopener noreferrer">
                  {trato.sitioWeb}
                </a>
              </div>
              <div className="detalle-item">
                <label>Sector</label>
                <span>{trato.sector}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="seccion notas">
            <div className="seccion-header">
              <h2>Notas</h2>
            </div>
            <div className="notas-lista">
              {trato.notas.map((nota) => (
                <div key={nota.id} className="nota-item">
                  <div className="nota-avatar">
                    <span>{(nota.autor || "U").charAt(0)}</span>
                  </div>
                  <div className="nota-contenido">
                    {editingNoteId === nota.id ? (
                      <div className="edit-nota-container">
                        <input
                          type="text"
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="input-nota-edit"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEditNota(nota.id);
                            } else if (e.key === "Escape") {
                              handleCancelEditNota();
                            }
                          }}
                          autoFocus
                        />
                        <div className="edit-nota-actions">
                          <button onClick={() => handleSaveEditNota(nota.id)} className="btn-save-nota">
                            Guardar
                          </button>
                          <button onClick={handleCancelEditNota} className="btn-cancel-nota">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>{nota.texto}</p>
                        <span className="nota-fecha">Creado por {nota.autor} el {nota.fecha}</span>
                        {nota.editadoPor && (
                          <span className="nota-editado">
                            Editado por {nota.editadoPor} el {nota.fechaEdicion}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {editingNoteId !== nota.id && (
                    <div className="nota-acciones">
                      <button onClick={() => handleEditarNota(nota.id)} className="btn-editar-nota">
                        <img src={editIcon || "/placeholder.svg"} alt="Editar" />
                      </button>
                      <button onClick={() => handleEliminarNota(nota.id)} className="btn-eliminar-nota">
                        <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="agregar-nota">
              <input
                type="text"
                placeholder="Agregar una nota"
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAgregarNota()}
                className="input-nota"
              />
            </div>
          </div>

          {/* Actividades abiertas */}
          <div className="seccion actividades-abiertas">
            <div className="seccion-header">
              <h2>Actividades abiertas</h2>
              <button onClick={() => handleAgregarActividad("actividad")} className="btn-agregar">
                <img src={addIcon || "/placeholder.svg"} alt="Agregar" />
              </button>
            </div>
            <div className="actividades-grid">
              <div className="actividad-columna">
                <div className="columna-header">
                  <img src={taskIcon || "/placeholder.svg"} alt="Tareas" />
                  <span>Tareas abiertas</span>
                </div>
                <div className="actividades-lista">
                  {trato.actividadesAbiertas.tareas.length === 0 ? (
                    <p className="no-actividades">No se encontraron registros</p>
                  ) : (
                    trato.actividadesAbiertas.tareas.map((tarea) => (
                      <div key={tarea.id} className="actividad-item tarea">
                        <h4>{`Tarea con ${tarea.nombreContacto}`}</h4>
                        <div className="actividad-detalles">
                          <span>Tipo: {tarea.subtipoTarea || "Sin tipo"}</span>
                          <span>Fecha límite: {tarea.fecha || "Sin fecha"}</span>
                          <span>Finalidad: {tarea.finalidad || "Sin finalidad"}</span>
                          <span>Asignado a: {tarea.asignadoA || "Sin asignado"}</span>
                        </div>
                        <div className="actividad-badges">
                          <button
                            className="badge completada clickeable"
                            onClick={() => handleCompletarActividad(tarea.id, "tarea")}
                          >
                            Completar
                          </button>
                          <button
                            className="badge reprogramar clickeable"
                            onClick={() => handleReprogramarActividad(tarea.id, "tarea")}
                          >
                            Reprogramar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="actividad-columna">
                <div className="columna-header">
                  <img src={callIcon || "/placeholder.svg"} alt="Llamadas" />
                  <span>Llamadas abiertas</span>
                </div>
                <div className="actividades-lista">
                  {trato.actividadesAbiertas.llamadas.length === 0 ? (
                    <p className="no-actividades">No se encontraron registros</p>
                  ) : (
                    trato.actividadesAbiertas.llamadas.map((llamada) => (
                      <div key={llamada.id} className="actividad-item llamada">
                        <h4>{`Llamada con ${llamada.nombreContacto}`}</h4>
                        <div className="actividad-detalles">
                          <span>Fecha: {llamada.fecha || "Sin fecha"}</span>
                          <span>Hora: {llamada.hora || "Sin hora"}</span>
                          <span>Asignado a: {llamada.asignadoA || "Sin asignado"}</span>
                        </div>
                        <div className="actividad-badges">
                          <button
                            className="badge completada clickeable"
                            onClick={() => handleCompletarActividad(llamada.id, "llamada")}
                          >
                            Completar
                          </button>
                          <button
                            className="badge reprogramar clickeable"
                            onClick={() => handleReprogramarActividad(llamada.id, "llamada")}
                          >
                            Reprogramar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="actividad-columna">
                <div className="columna-header">
                  <img src={meetingIcon || "/placeholder.svg"} alt="Reuniones" />
                  <span>Reuniones abiertas</span>
                </div>
                <div className="actividades-lista">
                  {trato.actividadesAbiertas.reuniones.length === 0 ? (
                    <p className="no-actividades">No se encontraron registros</p>
                  ) : (
                    trato.actividadesAbiertas.reuniones.map((reunion) => (
                      <div key={reunion.id} className="actividad-item reunion">
                        <h4>{`Reunión con ${reunion.nombreContacto}`}</h4>
                        <div className="actividad-detalles">
                          <span>Fecha: {reunion.fecha || "Sin fecha"}</span>
                          <span>Hora inicio: {reunion.hora || "Sin hora"}</span>
                          <span>
                            Modalidad: {reunion.modalidad}
                            {reunion.modalidad === "PRESENCIAL" && reunion.lugarReunion && ` - Lugar: ${reunion.lugarReunion}`}
                            {reunion.modalidad === "VIRTUAL" && reunion.enlaceReunion && ` - Enlace: ${reunion.enlaceReunion}`}
                          </span>
                          <span>Asignado a: {reunion.asignadoA || "Sin asignado"}</span>
                        </div>
                        <div className="actividad-badges">
                          <button
                            className="badge completada clickeable"
                            onClick={() => handleCompletarActividad(reunion.id, "reunion")}
                          >
                            Completar
                          </button>
                          <button
                            className="badge reprogramar clickeable"
                            onClick={() => handleReprogramarActividad(reunion.id, "reunion")}
                          >
                            Reprogramar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Historial de interacciones */}
          <div className="seccion historial-interacciones">
            <h2>Historial de interacciones</h2>
            <div className="historial-tabla">
              <div className="tabla-header">
                <div className="header-cell">Fecha</div>
                <div className="header-cell">Responsable</div>
                <div className="header-cell">Tipo</div>
                <div className="header-cell">Medio</div>
                <div className="header-cell">Resultado</div>
                <div className="header-cell">Interés</div>
                <div className="header-cell">Notas</div>
              </div>
              <div className="tabla-body">
                {trato.historialInteracciones && trato.historialInteracciones.length > 0 ? (
                  trato.historialInteracciones.map((interaccion) => {
                    // Mapeo para los íconos de Resultado
                    const resultadoIcono = {
                      POSITIVO: '✅',
                      NEGATIVO: '❌',
                      'Sin resultado': '—',
                    }[interaccion.resultado] || '—';

                    // Mapeo para los íconos de Interés
                    const interesIcono = {
                      ALTO: '🟢',
                      MEDIO: '🟡',
                      BAJO: '🔴',
                      'Sin interés': '—',
                    }[interaccion.interes] || '—';

                    return (
                      <div key={interaccion.id} className="tabla-row">
                        <div className="cell">
                          <div className="fecha-hora">
                            <span className="fecha">{interaccion.fecha}</span>
                            <span className="hora">{interaccion.hora}</span>
                          </div>
                        </div>
                        <div className="cell">{interaccion.responsable}</div>
                        <div className="cell">
                          <span className={`tipo-badge ${interaccion.tipo.toLowerCase()}`}>
                            {interaccion.tipo}
                          </span>
                        </div>
                        <div className="cell">{interaccion.medio}</div>
                        <div className="cell">
                          <span className={`resultado-badge ${interaccion.resultado ? interaccion.resultado.toLowerCase() : 'sin-resultado'}`}>
                            {resultadoIcono}
                          </span>
                        </div>
                        <div className="cell">
                          <span className={`interes-badge ${interaccion.interes}`}>
                            {interesIcono}
                          </span>
                        </div>
                        <div className="cell notas-cell">{interaccion.notas}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="tabla-row">
                    <div className="cell-empty" colSpan="7">
                      <p className="no-actividades">No se encontraron registros</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Correos electrónicos */}
          <div className="seccion correos-electronicos">
            <div className="seccion-header">
              <h2>Correos electrónicos</h2>
              <button onClick={() => handleAgregarCorreo()} className="btn-agregar">
                <img src={addIcon || "/placeholder.svg"} alt="Agregar" />
              </button>
            </div>
            <div className="correos-contenido">
              {emailRecords.length > 0 ? (
                emailRecords.map((email) => (
                  <div key={email.id} className="email-item">
                    <div className="email-header">
                      <div className="email-destinatario">
                        {email.destinatario}
                      </div>
                      <div className="email-fecha">
                        {new Date(email.fechaEnvio).toLocaleString()}
                      </div>
                    </div>

                    <div className="email-asunto">
                      <span className="email-asunto-label">Asunto</span>
                      <div className="email-asunto-texto">{email.asunto}</div>
                    </div>

                    <div className="email-cuerpo">
                      <span className="email-cuerpo-label">Mensaje</span>
                      <div
                        className="email-cuerpo-texto"
                        dangerouslySetInnerHTML={{ __html: email.cuerpo }}
                      />
                    </div>

                    {email.archivosAdjuntos && (
                      <div className="email-adjuntos">
                        <span className="email-adjuntos-label">Archivos adjuntos</span>
                        <div className="email-adjuntos-lista">
                          {email.archivosAdjuntos.split(",").join(", ")}
                        </div>
                      </div>
                    )}

                    <div className="email-footer">
                      <div className="email-status">Enviado</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-actividades">No se encontraron registros</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modales */}
      <EditarTratoModal
        isOpen={modals.editarTrato.isOpen}
        onClose={() => closeModal("editarTrato")}
        onSave={handleSaveEditarTrato}
        trato={trato}
        users={users}
        companies={companies}
      />

      <SeleccionarActividadModal
        isOpen={modals.seleccionarActividad.isOpen}
        onClose={() => closeModal("seleccionarActividad")}
        onSelectActivity={handleSelectActivity}
      />

      <SeleccionarActividadModal
        isOpen={modals.crearNuevaActividad.isOpen}
        onClose={() => closeModal("crearNuevaActividad")}
        onSelectActivity={handleSelectActivity}
      />

      <ProgramarLlamadaModal
        isOpen={modals.programarLlamada.isOpen}
        onClose={() => closeModal("programarLlamada")}
        onSave={(data) => handleSaveActividad(data, "llamada")}
        tratoId={modals.programarLlamada.tratoId}
        users={users}
        creatorId={modals.programarLlamada.creatorId}
      />

      <ProgramarLlamadaModal
        isOpen={modals.programarLlamada.isOpen}
        loading={modals.programarLlamada.loading}
        onClose={() => closeModal("programarLlamada")}
        onSave={(data) => handleSaveActividad(data, "llamada")}
        tratoId={modals.programarLlamada.tratoId}
        users={users}
        creatorId={modals.programarLlamada.creatorId}
      />

      <ProgramarReunionModal
        isOpen={modals.programarReunion.isOpen}
        loading={modals.programarReunion.loading}
        onClose={() => closeModal("programarReunion")}
        onSave={(data) => handleSaveActividad(data, "reunion")}
        tratoId={modals.programarReunion.tratoId}
        users={users}
        creatorId={modals.programarReunion.creatorId}
      />

      <ProgramarTareaModal
        isOpen={modals.programarTarea.isOpen}
        loading={modals.programarTarea.loading}
        onClose={() => closeModal("programarTarea")}
        onSave={(data) => handleSaveActividad(data, "tarea")}
        tratoId={modals.programarTarea.tratoId}
        users={users}
        creatorId={modals.programarTarea.creatorId}
      />

      <ReprogramarLlamadaModal
        isOpen={modals.reprogramarLlamada.isOpen}
        onClose={() => closeModal("reprogramarLlamada")}
        onSave={(data) => handleSaveReprogramar(data, "llamada", modals.reprogramarLlamada.contactos || [])}
        actividad={modals.reprogramarLlamada.actividad}
      />

      <ReprogramarReunionModal
        isOpen={modals.reprogramarReunion.isOpen}
        onClose={() => closeModal("reprogramarReunion")}
        onSave={(data) => handleSaveReprogramar(data, "reunion", modals.reprogramarReunion.contactos || [])}
        actividad={modals.reprogramarReunion.actividad}
      />

      <ReprogramarTareaModal
        isOpen={modals.reprogramarTarea.isOpen}
        onClose={() => closeModal("reprogramarTarea")}
        onSave={(data) => handleSaveReprogramar(data, "tarea", modals.reprogramarTarea.contactos || [])}
        actividad={modals.reprogramarTarea.actividad}
      />

      <CompletarActividadModal
        isOpen={modals.completarActividad.isOpen}
        loading={modals.completarActividad.loading}
        onClose={() => closeModal("completarActividad")}
        onSave={(data, tipo) => handleSaveCompletarActividad(data, tipo)}
        actividad={modals.completarActividad.actividad}
        tratoId={params.id}
        contactos={modals.completarActividad.contactos || []}
        openModal={openModal}
      />

      <CrearCorreoModal
        isOpen={modals.crearCorreo.isOpen}
        onClose={() => closeModal("crearCorreo")}
        onSave={() => {
          const loadEmails = async () => {
            const emailResponse = await fetchWithToken(`${API_BASE_URL}/correos/trato/${params.id}`);
            const emailData = await emailResponse.json();
            setEmailRecords(emailData);
          };
          loadEmails();
        }}
        tratoId={params.id}
        openModal={openModal}
        closeModal={closeModal}
      />

      <SeleccionarPlantillaModal
        isOpen={modals.seleccionarPlantilla.isOpen}
        onClose={() => closeModal("seleccionarPlantilla")}
        onSelectTemplate={modals.seleccionarPlantilla.onSelectTemplate}
        plantillas={modals.seleccionarPlantilla.plantillas || []}
      />
    </>
  )
}

export default DetallesTrato
