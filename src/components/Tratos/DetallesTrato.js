"use client"
import { useState, useEffect } from "react"
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
import deploy from "../../assets/icons/desplegar.png"

// Modal Base Component for DetallesTrato
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
    <div className="detalles-trato-modal-overlay" onClick={canClose ? onClose : () => {}}>
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

// Modal para seleccionar tipo de actividad (copiado de tratos.js)
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

// Modal para programar llamada (copiado de tratos.js)
const ProgramarLlamadaModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    fecha: "",
    hora: "",
    finalidad: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        asignadoA: "Dagoberto Nieto",
        nombreContacto: "",
        fecha: "",
        hora: "",
        finalidad: "",
      })
      setErrors({})
    }
  }, [isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombreContacto.trim()) {
      newErrors.nombreContacto = "Este campo es obligatorio"
    }

    if (!formData.fecha.trim()) {
      newErrors.fecha = "Este campo es obligatorio"
    }

    if (!formData.hora.trim()) {
      newErrors.hora = "Este campo es obligatorio"
    }

    if (!formData.finalidad.trim()) {
      newErrors.finalidad = "Este campo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSave(formData)
    onClose()
  }

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Programar llamada" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoA">
            Asignado a: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoA"
              value={formData.asignadoA}
              onChange={(e) => handleInputChange("asignadoA", e.target.value)}
              className="modal-form-control"
            >
              <option value="Dagoberto Nieto">Dagoberto Nieto</option>
              <option value="Usuario 1">Usuario 1</option>
              <option value="Usuario 2">Usuario 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
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
              <option value="">Ninguna seleccionada</option>
              <option value="Contacto 1">Contacto 1</option>
              <option value="Contacto 2">Contacto 2</option>
              <option value="Contacto 3">Contacto 3</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContacto && <span className="error-message">{errors.nombreContacto}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="fecha">
            Fecha: <span className="required">*</span>
          </label>
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
          <label htmlFor="hora">
            Hora: <span className="required">*</span>
          </label>
          <input
            type="time"
            id="hora"
            value={formData.hora}
            onChange={(e) => handleInputChange("hora", e.target.value)}
            className={`modal-form-control ${errors.hora ? "error" : ""}`}
          />
          {errors.hora && <span className="error-message">{errors.hora}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="finalidad">
            Finalidad: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Presentación">Presentación</option>
              <option value="Negociación">Negociación</option>
              <option value="Cierre">Cierre</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Agregar llamada
          </button>
        </div>
      </form>
    </DetallesTratoModal>
  )
}

// Modal para programar reunión (copiado de tratos.js)
const ProgramarReunionModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    modalidad: "",
    finalidad: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        asignadoA: "Dagoberto Nieto",
        nombreContacto: "",
        fecha: "",
        horaInicio: "",
        horaFin: "",
        modalidad: "",
        finalidad: "",
      })
      setErrors({})
    }
  }, [isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombreContacto.trim()) {
      newErrors.nombreContacto = "Este campo es obligatorio"
    }

    if (!formData.fecha.trim()) {
      newErrors.fecha = "Este campo es obligatorio"
    }

    if (!formData.horaInicio.trim()) {
      newErrors.horaInicio = "Este campo es obligatorio"
    }

    if (!formData.horaFin.trim()) {
      newErrors.horaFin = "Este campo es obligatorio"
    }

    if (!formData.modalidad.trim()) {
      newErrors.modalidad = "Este campo es obligatorio"
    }

    if (!formData.finalidad.trim()) {
      newErrors.finalidad = "Este campo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSave(formData)
    onClose()
  }

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Programar reunión" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoA">
            Asignado a: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoA"
              value={formData.asignadoA}
              onChange={(e) => handleInputChange("asignadoA", e.target.value)}
              className="modal-form-control"
            >
              <option value="Dagoberto Nieto">Dagoberto Nieto</option>
              <option value="Usuario 1">Usuario 1</option>
              <option value="Usuario 2">Usuario 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
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
              <option value="">Ninguna seleccionada</option>
              <option value="Contacto 1">Contacto 1</option>
              <option value="Contacto 2">Contacto 2</option>
              <option value="Contacto 3">Contacto 3</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContacto && <span className="error-message">{errors.nombreContacto}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="fecha">
            Fecha: <span className="required">*</span>
          </label>
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
            <label htmlFor="horaInicio">
              Hora inicio: <span className="required">*</span>
            </label>
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
            <label htmlFor="horaFin">
              Hora fin: <span className="required">*</span>
            </label>
            <input
              type="time"
              id="horaFin"
              value={formData.horaFin}
              onChange={(e) => handleInputChange("horaFin", e.target.value)}
              className={`modal-form-control ${errors.horaFin ? "error" : ""}`}
            />
            {errors.horaFin && <span className="error-message">{errors.horaFin}</span>}
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="modalidad">
            Modalidad: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="modalidad"
              value={formData.modalidad}
              onChange={(e) => handleInputChange("modalidad", e.target.value)}
              className={`modal-form-control ${errors.modalidad ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
              <option value="Híbrida">Híbrida</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.modalidad && <span className="error-message">{errors.modalidad}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="finalidad">
            Finalidad: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              <option value="Presentación">Presentación</option>
              <option value="Negociación">Negociación</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Cierre">Cierre</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Agregar reunión
          </button>
        </div>
      </form>
    </DetallesTratoModal>
  )
}

// Modal para programar tarea (copiado de tratos.js)
const ProgramarTareaModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    fechaLimite: "",
    tipo: "",
    finalidad: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        asignadoA: "Dagoberto Nieto",
        nombreContacto: "",
        fechaLimite: "",
        tipo: "",
        finalidad: "",
      })
      setErrors({})
    }
  }, [isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombreContacto.trim()) {
      newErrors.nombreContacto = "Este campo es obligatorio"
    }

    if (!formData.fechaLimite.trim()) {
      newErrors.fechaLimite = "Este campo es obligatorio"
    }

    if (!formData.tipo.trim()) {
      newErrors.tipo = "Este campo es obligatorio"
    }

    if (!formData.finalidad.trim()) {
      newErrors.finalidad = "Este campo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSave(formData)
    onClose()
  }

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Programar tarea" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoA">
            Asignado a: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoA"
              value={formData.asignadoA}
              onChange={(e) => handleInputChange("asignadoA", e.target.value)}
              className="modal-form-control"
            >
              <option value="Dagoberto Nieto">Dagoberto Nieto</option>
              <option value="Usuario 1">Usuario 1</option>
              <option value="Usuario 2">Usuario 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
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
              <option value="">Ninguna seleccionada</option>
              <option value="Contacto 1">Contacto 1</option>
              <option value="Contacto 2">Contacto 2</option>
              <option value="Contacto 3">Contacto 3</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.nombreContacto && <span className="error-message">{errors.nombreContacto}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="fechaLimite">
            Fecha límite: <span className="required">*</span>
          </label>
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
          <label>
            Tipo: <span className="required">*</span>
          </label>
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
          <label htmlFor="finalidad">
            Finalidad: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Ninguna seleccionada</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Información">Información</option>
              <option value="Propuesta">Propuesta</option>
              <option value="Recordatorio">Recordatorio</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Agregar tarea
          </button>
        </div>
      </form>
    </DetallesTratoModal>
  )
}

// Modal para reprogramar llamada
const ReprogramarLlamadaModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    nuevaFecha: "",
    nuevaHora: "",
    finalidad: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (actividad && isOpen) {
      setFormData({
        asignadoA: actividad.responsable || "Dagoberto Nieto",
        nombreContacto: "Antonio Vazquez",
        nuevaFecha: "",
        nuevaHora: "",
        finalidad: "",
      })
    }
    setErrors({})
  }, [actividad, isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nuevaFecha.trim()) {
      newErrors.nuevaFecha = "Este campo es obligatorio"
    }

    if (!formData.nuevaHora.trim()) {
      newErrors.nuevaHora = "Este campo es obligatorio"
    }

    if (!formData.finalidad.trim()) {
      newErrors.finalidad = "Este campo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSave(formData)
    onClose()
  }

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Reprogramar llamada" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoA">
            Asignado a: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoA"
              value={formData.asignadoA}
              onChange={(e) => handleInputChange("asignadoA", e.target.value)}
              className="modal-form-control"
            >
              <option value="Dagoberto Nieto">Dagoberto Nieto</option>
              <option value="Usuario 1">Usuario 1</option>
              <option value="Usuario 2">Usuario 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
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
              className="modal-form-control"
            >
              <option value="Antonio Vazquez">Antonio Vazquez</option>
              <option value="Contacto 1">Contacto 1</option>
              <option value="Contacto 2">Contacto 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="nuevaFecha">
            Nueva fecha: <span className="required">*</span>
          </label>
          <input
            type="date"
            id="nuevaFecha"
            value={formData.nuevaFecha}
            onChange={(e) => handleInputChange("nuevaFecha", e.target.value)}
            className={`modal-form-control ${errors.nuevaFecha ? "error" : ""}`}
          />
          {errors.nuevaFecha && <span className="error-message">{errors.nuevaFecha}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="nuevaHora">
            Nueva hora: <span className="required">*</span>
          </label>
          <input
            type="time"
            id="nuevaHora"
            value={formData.nuevaHora}
            onChange={(e) => handleInputChange("nuevaHora", e.target.value)}
            className={`modal-form-control ${errors.nuevaHora ? "error" : ""}`}
          />
          {errors.nuevaHora && <span className="error-message">{errors.nuevaHora}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="finalidad">
            Finalidad: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Seleccionar finalidad</option>
              <option value="Cerrado Ganado">Cerrado Ganado</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Presentación">Presentación</option>
              <option value="Negociación">Negociación</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Confirmar cambios
          </button>
        </div>
      </form>
    </DetallesTratoModal>
  )
}

// Modal para reprogramar reunión
const ReprogramarReunionModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    nuevaFecha: "",
    nuevaHoraInicio: "",
    nuevaHoraFin: "",
    modalidad: "",
    medio: "",
    finalidad: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (actividad && isOpen) {
      setFormData({
        asignadoA: actividad.responsable || "Dagoberto Nieto",
        nombreContacto: "Antonio Vazquez",
        nuevaFecha: "",
        nuevaHoraInicio: "",
        nuevaHoraFin: "",
        modalidad: "",
        medio: "",
        finalidad: "",
      })
    }
    setErrors({})
  }, [actividad, isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nuevaFecha.trim()) {
      newErrors.nuevaFecha = "Este campo es obligatorio"
    }

    if (!formData.nuevaHoraInicio.trim()) {
      newErrors.nuevaHoraInicio = "Este campo es obligatorio"
    }

    if (!formData.nuevaHoraFin.trim()) {
      newErrors.nuevaHoraFin = "Este campo es obligatorio"
    }

    if (!formData.modalidad.trim()) {
      newErrors.modalidad = "Este campo es obligatorio"
    }

    if (!formData.medio.trim()) {
      newErrors.medio = "Este campo es obligatorio"
    }

    if (!formData.finalidad.trim()) {
      newErrors.finalidad = "Este campo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSave(formData)
    onClose()
  }

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Reprogramar reunión" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoA">
            Asignado a: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoA"
              value={formData.asignadoA}
              onChange={(e) => handleInputChange("asignadoA", e.target.value)}
              className="modal-form-control"
            >
              <option value="Dagoberto Nieto">Dagoberto Nieto</option>
              <option value="Usuario 1">Usuario 1</option>
              <option value="Usuario 2">Usuario 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
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
              className="modal-form-control"
            >
              <option value="Antonio Vazquez">Antonio Vazquez</option>
              <option value="Contacto 1">Contacto 1</option>
              <option value="Contacto 2">Contacto 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="nuevaFecha">
            Nueva Fecha: <span className="required">*</span>
          </label>
          <input
            type="date"
            id="nuevaFecha"
            value={formData.nuevaFecha}
            onChange={(e) => handleInputChange("nuevaFecha", e.target.value)}
            className={`modal-form-control ${errors.nuevaFecha ? "error" : ""}`}
          />
          {errors.nuevaFecha && <span className="error-message">{errors.nuevaFecha}</span>}
        </div>

        <div className="modal-form-row">
          <div className="modal-form-group">
            <label htmlFor="nuevaHoraInicio">
              Nueva Hora inicio: <span className="required">*</span>
            </label>
            <input
              type="time"
              id="nuevaHoraInicio"
              value={formData.nuevaHoraInicio}
              onChange={(e) => handleInputChange("nuevaHoraInicio", e.target.value)}
              className={`modal-form-control ${errors.nuevaHoraInicio ? "error" : ""}`}
            />
            {errors.nuevaHoraInicio && <span className="error-message">{errors.nuevaHoraInicio}</span>}
          </div>

          <div className="modal-form-group">
            <label htmlFor="nuevaHoraFin">
              Nueva Hora fin: <span className="required">*</span>
            </label>
            <input
              type="time"
              id="nuevaHoraFin"
              value={formData.nuevaHoraFin}
              onChange={(e) => handleInputChange("nuevaHoraFin", e.target.value)}
              className={`modal-form-control ${errors.nuevaHoraFin ? "error" : ""}`}
            />
            {errors.nuevaHoraFin && <span className="error-message">{errors.nuevaHoraFin}</span>}
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="modalidad">
            Modalidad: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="modalidad"
              value={formData.modalidad}
              onChange={(e) => handleInputChange("modalidad", e.target.value)}
              className={`modal-form-control ${errors.modalidad ? "error" : ""}`}
            >
              <option value="">Seleccionar modalidad</option>
              <option value="Virtual">Virtual</option>
              <option value="Presencial">Presencial</option>
              <option value="Híbrida">Híbrida</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.modalidad && <span className="error-message">{errors.modalidad}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="medio">
            Medio: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="medio"
              value={formData.medio}
              onChange={(e) => handleInputChange("medio", e.target.value)}
              className={`modal-form-control ${errors.medio ? "error" : ""}`}
            >
              <option value="">Seleccionar medio</option>
              <option value="Zoom">Zoom</option>
              <option value="Teams">Teams</option>
              <option value="Meet">Meet</option>
              <option value="Presencial">Presencial</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.medio && <span className="error-message">{errors.medio}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="finalidad">
            Finalidad: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Seleccionar finalidad</option>
              <option value="Negociación">Negociación</option>
              <option value="Presentación">Presentación</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Cierre">Cierre</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Confirmar cambios
          </button>
        </div>
      </form>
    </DetallesTratoModal>
  )
}

// Modal para reprogramar tarea
const ReprogramarTareaModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    nuevaFechaLimite: "",
    tipo: "",
    finalidad: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (actividad && isOpen) {
      setFormData({
        asignadoA: actividad.responsable || "Dagoberto Nieto",
        nombreContacto: "Antonio Vazquez",
        nuevaFechaLimite: "",
        tipo: "",
        finalidad: "",
      })
    }
    setErrors({})
  }, [actividad, isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nuevaFechaLimite.trim()) {
      newErrors.nuevaFechaLimite = "Este campo es obligatorio"
    }

    if (!formData.tipo.trim()) {
      newErrors.tipo = "Este campo es obligatorio"
    }

    if (!formData.finalidad.trim()) {
      newErrors.finalidad = "Este campo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSave(formData)
    onClose()
  }

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Reprogramar tarea" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label htmlFor="asignadoA">
            Asignado a: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="asignadoA"
              value={formData.asignadoA}
              onChange={(e) => handleInputChange("asignadoA", e.target.value)}
              className="modal-form-control"
            >
              <option value="Dagoberto Nieto">Dagoberto Nieto</option>
              <option value="Usuario 1">Usuario 1</option>
              <option value="Usuario 2">Usuario 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
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
              className="modal-form-control"
            >
              <option value="Antonio Vazquez">Antonio Vazquez</option>
              <option value="Contacto 1">Contacto 1</option>
              <option value="Contacto 2">Contacto 2</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
        </div>

        <div className="modal-form-group">
          <label htmlFor="nuevaFechaLimite">
            Nueva Fecha límite: <span className="required">*</span>
          </label>
          <input
            type="date"
            id="nuevaFechaLimite"
            value={formData.nuevaFechaLimite}
            onChange={(e) => handleInputChange("nuevaFechaLimite", e.target.value)}
            className={`modal-form-control ${errors.nuevaFechaLimite ? "error" : ""}`}
          />
          {errors.nuevaFechaLimite && <span className="error-message">{errors.nuevaFechaLimite}</span>}
        </div>

        <div className="modal-form-group">
          <label>
            Tipo: <span className="required">*</span>
          </label>
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
          <label htmlFor="finalidad">
            Finalidad: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="finalidad"
              value={formData.finalidad}
              onChange={(e) => handleInputChange("finalidad", e.target.value)}
              className={`modal-form-control ${errors.finalidad ? "error" : ""}`}
            >
              <option value="">Seleccionar finalidad</option>
              <option value="Cotización Propuesta">Cotización Propuesta</option>
              <option value="Seguimiento">Seguimiento</option>
              <option value="Información">Información</option>
              <option value="Recordatorio">Recordatorio</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.finalidad && <span className="error-message">{errors.finalidad}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Confirmar cambios
          </button>
        </div>
      </form>
    </DetallesTratoModal>
  )
}

// Modal para completar actividad
const CompletarActividadModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useState({
    respuesta: "",
    interes: "",
    informacion: "",
    siguienteAccion: "",
    notas: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        respuesta: "",
        interes: "",
        informacion: "",
        siguienteAccion: "",
        notas: "",
      })
    }
    setErrors({})
  }, [isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.respuesta) {
      newErrors.respuesta = "Este campo es obligatorio"
    }

    if (!formData.interes) {
      newErrors.interes = "Este campo es obligatorio"
    }

    if (!formData.informacion) {
      newErrors.informacion = "Este campo es obligatorio"
    }

    if (!formData.siguienteAccion.trim()) {
      newErrors.siguienteAccion = "Este campo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSave(formData)
    onClose()
  }

  return (
    <DetallesTratoModal isOpen={isOpen} onClose={onClose} title="Reporte de actividad" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-group">
          <label>
            Respuesta: <span className="required">*</span>
          </label>
          <div className="response-buttons">
            <button
              type="button"
              className={`btn-response ${formData.respuesta === "positiva" ? "active positive" : ""}`}
              onClick={() => handleInputChange("respuesta", "positiva")}
            >
              ✓
            </button>
            <button
              type="button"
              className={`btn-response ${formData.respuesta === "negativa" ? "active negative" : ""}`}
              onClick={() => handleInputChange("respuesta", "negativa")}
            >
              ✕
            </button>
          </div>
          {errors.respuesta && <span className="error-message">{errors.respuesta}</span>}
        </div>

        <div className="modal-form-group">
          <label>
            Interés: <span className="required">*</span>
          </label>
          <div className="interest-container">
            <div className="interest-buttons">
              <button
                type="button"
                className={`btn-interest ${formData.interes === "bajo" ? "active low" : ""}`}
                onClick={() => handleInputChange("interes", "bajo")}
              >
                ●
              </button>
              <button
                type="button"
                className={`btn-interest ${formData.interes === "medio" ? "active medium" : ""}`}
                onClick={() => handleInputChange("interes", "medio")}
              >
                ●
              </button>
              <button
                type="button"
                className={`btn-interest ${formData.interes === "alto" ? "active high" : ""}`}
                onClick={() => handleInputChange("interes", "alto")}
              >
                ●
              </button>
            </div>
            <div className="interest-labels">
              <span>Bajo</span>
              <span>Medio</span>
              <span>Alto</span>
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
              className={`btn-response ${formData.informacion === "positiva" ? "active positive" : ""}`}
              onClick={() => handleInputChange("informacion", "positiva")}
            >
              ✓
            </button>
            <button
              type="button"
              className={`btn-response ${formData.informacion === "negativa" ? "active negative" : ""}`}
              onClick={() => handleInputChange("informacion", "negativa")}
            >
              ✕
            </button>
          </div>
          {errors.informacion && <span className="error-message">{errors.informacion}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="siguienteAccion">
            Siguiente acción: <span className="required">*</span>
          </label>
          <div className="modal-select-wrapper">
            <select
              id="siguienteAccion"
              value={formData.siguienteAccion}
              onChange={(e) => handleInputChange("siguienteAccion", e.target.value)}
              className={`modal-form-control ${errors.siguienteAccion ? "error" : ""}`}
            >
              <option value="">Seleccionar acción</option>
              <option value="Regresar llamada">Regresar llamada</option>
              <option value="Enviar información">Enviar información</option>
              <option value="Programar reunión">Programar reunión</option>
              <option value="Seguimiento">Seguimiento</option>
            </select>
            <img src={deploy || "/placeholder.svg"} alt="Desplegar" className="deploy-icon" />
          </div>
          {errors.siguienteAccion && <span className="error-message">{errors.siguienteAccion}</span>}
        </div>

        <div className="modal-form-group">
          <label htmlFor="notas">Notas:</label>
          <textarea
            id="notas"
            value={formData.notas}
            onChange={(e) => handleInputChange("notas", e.target.value)}
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
  )
}

// Modal para editar trato
const EditarTratoModal = ({ isOpen, onClose, onSave, trato }) => {
  const [formData, setFormData] = useState({
    propietario: "",
    nombreTrato: "",
    nombreEmpresa: "",
    nombreContacto: "",
    ingresosEsperados: "",
    numeroUnidades: "",
    descripcion: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (trato && isOpen) {
      setFormData({
        propietario: trato.propietario || "",
        nombreTrato: trato.nombre || "",
        nombreEmpresa: trato.nombreEmpresa || "",
        nombreContacto: trato.contacto?.nombre || "",
        ingresosEsperados: trato.ingresosEsperados?.replace("$", "").replace(",", "") || "",
        numeroUnidades: trato.numeroUnidades || "",
        descripcion: trato.descripcion || "",
      })
    }
    setErrors({})
  }, [trato, isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombreTrato.trim()) {
      newErrors.nombreTrato = "Este campo es obligatorio"
    }

    if (!formData.nombreEmpresa.trim()) {
      newErrors.nombreEmpresa = "Este campo es obligatorio"
    }

    if (!formData.nombreContacto.trim()) {
      newErrors.nombreContacto = "Este campo es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onSave(formData)
    onClose()
  }

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
              <option value="Dagoberto Nieto">Dagoberto Nieto</option>
              <option value="Usuario 1">Usuario 1</option>
              <option value="Usuario 2">Usuario 2</option>
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
              onChange={(e) => handleInputChange("nombreEmpresa", e.target.value)}
              className={`modal-form-control ${errors.nombreEmpresa ? "error" : ""}`}
            >
              <option value="">Seleccionar empresa</option>
              <option value="SERINVAZ">SERINVAZ</option>
              <option value="Empresa 1">Empresa 1</option>
              <option value="Empresa 2">Empresa 2</option>
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
              <option value="">Seleccionar contacto</option>
              <option value="Antonio Vazquez">Antonio Vazquez</option>
              <option value="Contacto 1">Contacto 1</option>
              <option value="Contacto 2">Contacto 2</option>
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
  )
}

const DetallesTrato = () => {
  const params = useParams()
  const navigate = useNavigate()
  const [trato, setTrato] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeEmailTab, setActiveEmailTab] = useState("correos")
  const [nuevaNota, setNuevaNota] = useState("")
  const [filtroNotas, setFiltroNotas] = useState("recientes")
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState("")

  // Estados para modales
  const [modals, setModals] = useState({
    seleccionarActividad: { isOpen: false },
    programarLlamada: { isOpen: false },
    programarReunion: { isOpen: false },
    programarTarea: { isOpen: false },
    reprogramarLlamada: { isOpen: false, actividad: null },
    reprogramarReunion: { isOpen: false, actividad: null },
    reprogramarTarea: { isOpen: false, actividad: null },
    completarActividad: { isOpen: false, actividad: null },
    editarTrato: { isOpen: false },
  })

  // Funciones para manejar modales
  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: true, ...data },
    }))
  }

  const closeModal = (modalType) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: false },
    }))
  }

  const handleSelectActivity = (tipo) => {
    const modalMap = {
      llamada: "programarLlamada",
      reunion: "programarReunion",
      tarea: "programarTarea",
    }
    openModal(modalMap[tipo])
  }

  const handleSaveActividad = (data, tipo) => {
    console.log(`Nueva ${tipo}:`, data)
    Swal.fire({
      title: `¡${tipo.charAt(0).toUpperCase() + tipo.slice(1)} programada!`,
      text: `La ${tipo} se ha programado exitosamente`,
      icon: "success",
    })
  }

  const handleSaveReprogramar = (data, tipo) => {
    console.log(`${tipo} reprogramada:`, data)
    Swal.fire({
      title: "¡Actividad reprogramada!",
      text: `La ${tipo} se ha reprogramado exitosamente`,
      icon: "success",
    })
  }

  const handleSaveCompletarActividad = (data) => {
    console.log("Actividad completada:", data)
    Swal.fire({
      title: "¡Actividad completada!",
      text: "El reporte de actividad se ha guardado exitosamente",
      icon: "success",
    })
  }

  const handleSaveEditarTrato = (data) => {
    console.log("Trato editado:", data)
    Swal.fire({
      title: "¡Trato actualizado!",
      text: "Los cambios se han guardado exitosamente",
      icon: "success",
    })
  }

  // Datos de ejemplo del trato
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setTrato({
        id: params.id,
        nombre: "Nombre trato",
        propietario: "Dagoberto",
        numeroTrato: "1",
        descripcion: "Descripción ejemplo",
        nombreEmpresa: "Empresa 1",
        domicilio: "Estancia 175 local 6, Villa Magna, 372",
        ingresosEsperados: "$50,000",
        sitioWeb: "https://trackings.com.mx",
        sector: "Tecnología",
        fechaCreacion: "08/04/2025",
        fechaCierre: "04/06/2025",
        faseActual: "Cotización propuesta/precio",
        fases: [
          { nombre: "Primer contacto", completada: true },
          { nombre: "Envío de información", completada: true },
          { nombre: "Reunión", completada: true },
          { nombre: "Cotización propuesta/precio", completada: false, actual: true },
          { nombre: "Negociación/revisión", completada: false },
          { nombre: "Respuesta por correo", completada: false },
          { nombre: "Interés futuro", completada: false },
        ],
        contacto: {
          nombre: "Nombre del contacto",
          telefono: "477 569 76 54",
          whatsapp: "55 3042 7319",
          email: "contacto@empresa.com",
        },
        notas: [
          {
            id: 1,
            texto: "Nota de ejemplo",
            autor: "Dagoberto",
            fecha: "Mar 26 por Dagoberto",
          },
        ],
        actividadesAbiertas: {
          tareas: [],
          llamadas: [
            {
              id: 1,
              titulo: "Llamada saliente a Contacto 1",
              descripcion: "Nombre trato",
              fecha: "12/04/2025",
              hora: "10:55 AM",
              responsable: "Dagoberto Nieto",
              estado: "Completada",
              tipo: "Programada",
            },
          ],
          reuniones: [],
        },
        actividadesCerradas: {
          tareas: [],
          llamadas: [
            {
              id: 2,
              titulo: "Llamada saliente a Contacto 1",
              descripcion: "Nombre trato",
              fecha: "12/04/2025",
              hora: "10:55 AM",
              responsable: "Dagoberto Nieto",
            },
          ],
          reuniones: [],
        },
        correos: {
          correos: [],
          borradores: [],
          programados: [],
        },
      })
      setLoading(false)
    }, 1000)
  }, [params.id])

  const handleVolver = () => {
    navigate("/tratos")
  }

  // Cambiar la función handleEditarTrato para que no abra modal
  const handleEditarTrato = () => {
    openModal("editarTrato")
  }

  const handleAgregarNota = () => {
    if (nuevaNota.trim()) {
      const nuevaNotaObj = {
        id: Date.now(),
        texto: nuevaNota,
        autor: "Usuario Actual",
        fecha: new Date().toLocaleDateString(),
      }
      setTrato((prev) => ({
        ...prev,
        notas: [...prev.notas, nuevaNotaObj],
      }))
      setNuevaNota("")
    }
  }

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
    }).then((result) => {
      if (result.isConfirmed) {
        setTrato((prev) => ({
          ...prev,
          notas: prev.notas.filter((nota) => nota.id !== notaId),
        }))
      }
    })
  }

  // Cambiar la función handleAgregarActividad para usar el modal de selección
  const handleAgregarActividad = (tipo) => {
    openModal("seleccionarActividad")
  }

  // Agregar nueva función para correos electrónicos
  const handleAgregarCorreo = () => {
    Swal.fire({
      title: "Agregar Correo",
      text: "Funcionalidad en desarrollo",
      icon: "info",
    })
  }

  const handleMarcarGanado = () => {
    Swal.fire({
      title: "Marcar como Ganado",
      text: "¿Estás seguro de que quieres marcar este trato como ganado?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4caf50",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, marcar como ganado",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("¡Éxito!", "Trato marcado como ganado", "success")
      }
    })
  }

  const handleMarcarPerdido = () => {
    Swal.fire({
      title: "Marcar como Perdido",
      text: "¿Estás seguro de que quieres marcar este trato como perdido?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f44336",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, marcar como perdido",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Marcado", "Trato marcado como perdido", "info")
      }
    })
  }

  // Funciones para editar notas inline
  const handleEditarNota = (notaId) => {
    const nota = trato.notas.find((n) => n.id === notaId)
    if (nota) {
      setEditingNoteId(notaId)
      setEditingNoteText(nota.texto)
    }
  }

  const handleSaveEditNota = (notaId) => {
    if (editingNoteText.trim()) {
      setTrato((prev) => ({
        ...prev,
        notas: prev.notas.map((nota) => (nota.id === notaId ? { ...nota, texto: editingNoteText.trim() } : nota)),
      }))
      setEditingNoteId(null)
      setEditingNoteText("")
    }
  }

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
        // Aquí puedes integrar con un sistema de llamadas
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
    const actividad = { id: actividadId, tipo }
    openModal("completarActividad", { actividad })
  }

  const handleReprogramarActividad = (actividadId, tipo) => {
    const actividad = { id: actividadId, tipo }

    if (tipo === "llamada") {
      openModal("reprogramarLlamada", { actividad })
    } else if (tipo === "reunión") {
      openModal("reprogramarReunion", { actividad })
    } else if (tipo === "tarea") {
      openModal("reprogramarTarea", { actividad })
    }
  }

  const handleClickFase = (faseIndex, fase) => {
    if (fase.completada) {
      Swal.fire({
        title: "Fase Completada",
        text: `La fase "${fase.nombre}" ya está completada`,
        icon: "info",
      })
    } else if (fase.actual) {
      Swal.fire({
        title: "Fase Actual",
        text: `Actualmente en la fase: "${fase.nombre}"`,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Completar fase",
        cancelButtonText: "Cerrar",
      }).then((result) => {
        if (result.isConfirmed) {
          // Aquí puedes actualizar la fase
          Swal.fire("¡Fase completada!", `"${fase.nombre}" marcada como completada`, "success")
        }
      })
    } else {
      Swal.fire({
        title: "Fase Pendiente",
        text: `La fase "${fase.nombre}" está pendiente`,
        icon: "warning",
      })
    }
  }

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
                  className={`fase-item ${fase.completada ? "completada" : ""} ${fase.actual ? "actual" : ""}`}
                  onClick={() => handleClickFase(index, fase)}
                >
                  <span>{fase.nombre}</span>
                </button>
              ))}
            </div>
            <div className="fecha-final">
              <span>FINAL</span>
              <span className="fecha">{trato.fechaCierre}</span>
              <div className="iconos-estado">
                <button className="btn-estado ganado" onClick={handleMarcarGanado}>
                  <img src={checkIcon || "/placeholder.svg"} alt="Marcar como ganado" />
                </button>
                <button className="btn-estado perdido" onClick={handleMarcarPerdido}>
                  <img src={closeIcon || "/placeholder.svg"} alt="Marcar como perdido" />
                </button>
              </div>
            </div>
          </div>

          {/* Persona de contacto */}
          <div className="seccion persona-contacto">
            <div className="seccion-header">
              <h2>Persona de contacto</h2>
              <label className="checkbox-container">
                <input type="checkbox" />
                <span>Recibir emails de seguimiento</span>
              </label>
            </div>
            <div className="contacto-info">
              <div className="contacto-avatar">
                <div className="avatar-circle">
                  <span>{trato.contacto.nombre.charAt(0)}</span>
                </div>
                <span className="contacto-nombre">{trato.contacto.nombre}</span>
              </div>
              <div className="contacto-detalles">
                <div className="contacto-item">
                  <button
                    className="btn-contacto telefono"
                    onClick={() => handleLlamarContacto(trato.contacto.telefono)}
                    title="Llamar"
                  >
                    <img src={phoneIcon || "/placeholder.svg"} alt="Teléfono" className="contacto-icon" />
                  </button>
                  <span>{trato.contacto.telefono}</span>
                </div>
                <div className="contacto-item">
                  <button
                    className="btn-contacto whatsapp"
                    onClick={() => handleWhatsAppContacto(trato.contacto.whatsapp)}
                    title="Enviar WhatsApp"
                  >
                    <img src={whatsappIcon || "/placeholder.svg"} alt="WhatsApp" className="contacto-icon" />
                  </button>
                  <span>{trato.contacto.whatsapp}</span>
                </div>
                <div className="contacto-item">
                  <img src={emailIcon || "/placeholder.svg"} alt="Email" className="contacto-icon" />
                  <span>{trato.contacto.email}</span>
                </div>
              </div>
            </div>
          </div>

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
              <select value={filtroNotas} onChange={(e) => setFiltroNotas(e.target.value)} className="filtro-notas">
                <option value="recientes">Recientes primero</option>
                <option value="antiguas">Antiguas primero</option>
              </select>
            </div>
            <div className="notas-lista">
              {trato.notas.map((nota) => (
                <div key={nota.id} className="nota-item">
                  <div className="nota-avatar">
                    <span>{nota.autor.charAt(0)}</span>
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
                              handleSaveEditNota(nota.id)
                            } else if (e.key === "Escape") {
                              handleCancelEditNota()
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
                        <span className="nota-fecha">{nota.fecha}</span>
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
                      <div key={tarea.id} className="actividad-item">
                        {/* Contenido de tarea */}
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
                        <h4>{llamada.titulo}</h4>
                        <p>{llamada.descripcion}</p>
                        <div className="actividad-detalles">
                          <span>
                            {llamada.fecha} {llamada.hora}
                          </span>
                          <span>{llamada.responsable}</span>
                        </div>
                        <div className="actividad-badges">
                          <button
                            className="badge completada clickeable"
                            onClick={() => handleCompletarActividad(llamada.id, "llamada")}
                          >
                            {llamada.estado}
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
                      <div key={reunion.id} className="actividad-item">
                        {/* Contenido de reunión */}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actividades cerradas */}
          <div className="seccion actividades-cerradas">
            <h2>Actividades cerradas</h2>
            <div className="actividades-grid">
              <div className="actividad-columna">
                <div className="columna-header">
                  <img src={taskIcon || "/placeholder.svg"} alt="Tareas" />
                  <span>Tareas cerradas</span>
                </div>
                <div className="actividades-lista">
                  {trato.actividadesCerradas.tareas.length === 0 ? (
                    <p className="no-actividades">No se encontraron registros</p>
                  ) : (
                    trato.actividadesCerradas.tareas.map((tarea) => (
                      <div key={tarea.id} className="actividad-item">
                        {/* Contenido de tarea */}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="actividad-columna">
                <div className="columna-header">
                  <img src={callIcon || "/placeholder.svg"} alt="Llamadas" />
                  <span>Llamadas cerradas</span>
                </div>
                <div className="actividades-lista">
                  {trato.actividadesCerradas.llamadas.length === 0 ? (
                    <p className="no-actividades">No se encontraron registros</p>
                  ) : (
                    trato.actividadesCerradas.llamadas.map((llamada) => (
                      <div key={llamada.id} className="actividad-item llamada">
                        <h4>{llamada.titulo}</h4>
                        <p>{llamada.descripcion}</p>
                        <div className="actividad-detalles">
                          <span>
                            {llamada.fecha} {llamada.hora}
                          </span>
                          <span>{llamada.responsable}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="actividad-columna">
                <div className="columna-header">
                  <img src={meetingIcon || "/placeholder.svg"} alt="Reuniones" />
                  <span>Reuniones cerradas</span>
                </div>
                <div className="actividades-lista">
                  {trato.actividadesCerradas.reuniones.length === 0 ? (
                    <p className="no-actividades">No se encontraron registros</p>
                  ) : (
                    trato.actividadesCerradas.reuniones.map((reunion) => (
                      <div key={reunion.id} className="actividad-item">
                        {/* Contenido de reunión */}
                      </div>
                    ))
                  )}
                </div>
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
            <div className="correos-tabs">
              <button
                className={`tab ${activeEmailTab === "correos" ? "active" : ""}`}
                onClick={() => setActiveEmailTab("correos")}
              >
                Correos
              </button>
              <button
                className={`tab ${activeEmailTab === "borradores" ? "active" : ""}`}
                onClick={() => setActiveEmailTab("borradores")}
              >
                Borradores
              </button>
              <button
                className={`tab ${activeEmailTab === "programado" ? "active" : ""}`}
                onClick={() => setActiveEmailTab("programado")}
              >
                Programado
              </button>
            </div>
            <div className="correos-contenido">
              <p className="no-actividades">No se encontraron registros</p>
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
      />

      <SeleccionarActividadModal
        isOpen={modals.seleccionarActividad.isOpen}
        onClose={() => closeModal("seleccionarActividad")}
        onSelectActivity={handleSelectActivity}
      />

      <ProgramarLlamadaModal
        isOpen={modals.programarLlamada.isOpen}
        onClose={() => closeModal("programarLlamada")}
        onSave={(data) => handleSaveActividad(data, "llamada")}
      />

      <ProgramarReunionModal
        isOpen={modals.programarReunion.isOpen}
        onClose={() => closeModal("programarReunion")}
        onSave={(data) => handleSaveActividad(data, "reunión")}
      />

      <ProgramarTareaModal
        isOpen={modals.programarTarea.isOpen}
        onClose={() => closeModal("programarTarea")}
        onSave={(data) => handleSaveActividad(data, "tarea")}
      />

      <ReprogramarLlamadaModal
        isOpen={modals.reprogramarLlamada.isOpen}
        onClose={() => closeModal("reprogramarLlamada")}
        onSave={(data) => handleSaveReprogramar(data, "llamada")}
        actividad={modals.reprogramarLlamada.actividad}
      />

      <ReprogramarReunionModal
        isOpen={modals.reprogramarReunion.isOpen}
        onClose={() => closeModal("reprogramarReunion")}
        onSave={(data) => handleSaveReprogramar(data, "reunión")}
        actividad={modals.reprogramarReunion.actividad}
      />

      <ReprogramarTareaModal
        isOpen={modals.reprogramarTarea.isOpen}
        onClose={() => closeModal("reprogramarTarea")}
        onSave={(data) => handleSaveReprogramar(data, "tarea")}
        actividad={modals.reprogramarTarea.actividad}
      />

      <CompletarActividadModal
        isOpen={modals.completarActividad.isOpen}
        onClose={() => closeModal("completarActividad")}
        onSave={handleSaveCompletarActividad}
        actividad={modals.completarActividad.actividad}
      />
    </>
  )
}

export default DetallesTrato
