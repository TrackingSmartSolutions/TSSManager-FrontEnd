"use client"

import { useState, useEffect } from "react"
import "./Tratos.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import expandIcon from "../../assets/icons/expandir.png"
import contractIcon from "../../assets/icons/contraer.png"
import calendarFilter from "../../assets/icons/calendario3.png"
import deploy from "../../assets/icons/desplegar.png"
import addActivity from "../../assets/icons/agregar.png"
import activityCall from "../../assets/icons/llamada.png"
import activityMeeting from "../../assets/icons/reunion.png"
import activityTask from "../../assets/icons/tarea.png"
import neglectedTreatment from "../../assets/icons/desatendido.png"

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

// Componente Modal Base
const Modal = ({ isOpen, onClose, title, children, size = "md", canClose = true }) => {
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
    <div className="tratos-modal-overlay" onClick={canClose ? onClose : () => {}}>
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
  )
}

// Modal para crear nuevo trato
const NuevoTratoModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombreTrato: "",
    nombreEmpresa: "",
    nombreContacto: "",
    ingresosEsperados: "",
    numeroUnidades: "",
    descripcion: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombreTrato: "",
        nombreEmpresa: "",
        nombreContacto: "",
        ingresosEsperados: "",
        numeroUnidades: "",
        descripcion: "",
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
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Trato" size="md">
      <form onSubmit={handleSubmit} className="modal-form">
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
            placeholder="Nombre del trato"
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
              <option value="">Ninguna seleccionada</option>
              <option value="Empresa 1">Empresa 1</option>
              <option value="Empresa 2">Empresa 2</option>
              <option value="Empresa 3">Empresa 3</option>
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
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Agregar trato
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Modal para programar llamada
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
    <Modal isOpen={isOpen} onClose={onClose} title="Programar llamada" size="md">
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
    </Modal>
  )
}

// Modal para programar reunión
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
    <Modal isOpen={isOpen} onClose={onClose} title="Programar reunión" size="md">
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
    </Modal>
  )
}

// Modal para programar tarea
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
    <Modal isOpen={isOpen} onClose={onClose} title="Programar tarea" size="md">
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
    </Modal>
  )
}

const TratoCard = ({ trato, onDragStart, onDragEnd, onTratoClick, onActivityAdded }) => {
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
    } else if (trato.hasActivities) {
      // Si tiene actividades, mostrar el ícono correspondiente al tipo de actividad más reciente
      const iconMap = {
        llamada: activityCall,
        reunion: activityMeeting,
        tarea: activityTask,
      }
      return (
        <img
          src={iconMap[trato.lastActivityType] || addActivity}
          alt="Actividad Programada"
          className="activity-icon"
        />
      )
    } else {
      return (
        <img
          src={addActivity || "/placeholder.svg"}
          alt="Agregar Actividad"
          className="activity-icon add-activity-btn"
          onClick={(e) => {
            e.stopPropagation() // Evitar que se active el clic de la tarjeta
            onActivityAdded && onActivityAdded(trato.id)
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
      <div className="trato-header">
        <h4 className="trato-nombre">{trato.nombre}</h4>
        <div className="trato-actions">
          <div className="trato-activity-icon">{getActivityIcon()}</div>
        </div>
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
  const [dateRangeText, setDateRangeText] = useState("Rango de fecha del trato")
  const [columnas, setColumnas] = useState([])
  const [draggedTrato, setDraggedTrato] = useState(null)

  // Estados para modales
  const [modals, setModals] = useState({
    nuevoTrato: { isOpen: false },
    seleccionarActividad: { isOpen: false, tratoId: null },
    programarLlamada: { isOpen: false },
    programarReunion: { isOpen: false },
    programarTarea: { isOpen: false },
  })

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
            hasActivities: false,
            lastActivityType: null,
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
            hasActivities: false,
            lastActivityType: null,
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
            hasActivities: false,
            lastActivityType: null,
          },
          {
            id: 4,
            nombre: "Nombre Trato 4",
            propietario: "Propietario D",
            fechaCierre: "2025-08-10",
            empresa: "Empresa W",
            numero: "TRT-004",
            isNeglected: false,
            hasActivities: false,
            lastActivityType: null,
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
            hasActivities: false,
            lastActivityType: null,
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
            hasActivities: false,
            lastActivityType: null,
          },
          {
            id: 7,
            nombre: "Nombre Trato 7",
            propietario: "Propietario G",
            fechaCierre: "2025-09-20",
            empresa: "Empresa T",
            numero: "TRT-007",
            isNeglected: false,
            hasActivities: false,
            lastActivityType: null,
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
            hasActivities: false,
            lastActivityType: null,
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
            hasActivities: false,
            lastActivityType: null,
          },
          {
            id: 10,
            nombre: "Nombre Trato 10",
            propietario: "Propietario J",
            fechaCierre: "2025-10-15",
            empresa: "Empresa Q",
            numero: "TRT-010",
            isNeglected: false,
            hasActivities: false,
            lastActivityType: null,
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
    openModal("nuevoTrato")
  }

  const handleActivityAdded = (tratoId) => {
    openModal("seleccionarActividad", { tratoId })
  }

  const handleSelectActivity = (tipo) => {
    const modalMap = {
      llamada: "programarLlamada",
      reunion: "programarReunion",
      tarea: "programarTarea",
    }
    openModal(modalMap[tipo])
  }

  const handleSaveNuevoTrato = (data) => {
    console.log("Nuevo trato:", data)
    Swal.fire({
      title: "¡Trato creado!",
      text: "El trato se ha creado exitosamente",
      icon: "success",
    })
  }

  const handleSaveActividad = (data, tipo) => {
    console.log(`Nueva ${tipo}:`, data)

    // Actualizar el trato para mostrar que tiene actividades
    const tratoId = modals.seleccionarActividad.tratoId
    if (tratoId) {
      setColumnas((prev) =>
        prev.map((columna) => ({
          ...columna,
          tratos: columna.tratos.map((trato) =>
            trato.id === tratoId ? { ...trato, hasActivities: true, lastActivityType: tipo } : trato,
          ),
        })),
      )
    }

    Swal.fire({
      title: `¡${tipo.charAt(0).toUpperCase() + tipo.slice(1)} programada!`,
      text: `La ${tipo} se ha programado exitosamente`,
      icon: "success",
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

  // Determinar si todas las columnas están expandidas
  const allExpanded = expandedColumns.length === columnas.length

  const handleToggleAllColumns = () => {
    if (allExpanded) {
      setExpandedColumns([])
    } else {
      const allColumnIds = columnas.map((columna) => columna.id)
      setExpandedColumns(allColumnIds)
    }
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

                <div className="column-content" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, columna.id)}>
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

        {/* Modales */}
        <NuevoTratoModal
          isOpen={modals.nuevoTrato.isOpen}
          onClose={() => closeModal("nuevoTrato")}
          onSave={handleSaveNuevoTrato}
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
          onSave={(data) => handleSaveActividad(data, "reunion")}
        />

        <ProgramarTareaModal
          isOpen={modals.programarTarea.isOpen}
          onClose={() => closeModal("programarTarea")}
          onSave={(data) => handleSaveActividad(data, "tarea")}
        />
      </main>
    </>
  )
}

export default Tratos
