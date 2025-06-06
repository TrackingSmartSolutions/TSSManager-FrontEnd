"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"
import "./Principal.css"
import Header from "../Header/Header"
import welcomeIcon from "../../assets/icons/empresa.png"
import phoneIcon from "../../assets/icons/llamada.png"
import meetingIcon from "../../assets/icons/reunion.png"
import emailIcon from "../../assets/icons/correo.png"

// Importar modales de DetallesTrato
import { useState as useModalState, useEffect as useModalEffect } from "react"
import Swal from "sweetalert2"
import deploy from "../../assets/icons/desplegar.png"

// Registra componentes de Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// Modal Base Component para Principal (copiado de DetallesTrato)
const PrincipalModal = ({ isOpen, onClose, title, children, size = "md", canClose = true }) => {
  useModalEffect(() => {
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

// Modal para completar actividad (copiado de DetallesTrato)
const CompletarActividadModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useModalState({
    respuesta: "",
    interes: "",
    informacion: "",
    siguienteAccion: "",
    notas: "",
  })

  const [errors, setErrors] = useModalState({})

  useModalEffect(() => {
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
    <PrincipalModal isOpen={isOpen} onClose={onClose} title="Reporte de actividad" size="md">
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
    </PrincipalModal>
  )
}

// Modal para reprogramar llamada (copiado de DetallesTrato)
const ReprogramarLlamadaModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useModalState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    nuevaFecha: "",
    nuevaHora: "",
    finalidad: "",
  })

  const [errors, setErrors] = useModalState({})

  useModalEffect(() => {
    if (actividad && isOpen) {
      setFormData({
        asignadoA: actividad.responsable || "Dagoberto Nieto",
        nombreContacto: actividad.contacto || "Nissim Mamiye Gildart",
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
    <PrincipalModal isOpen={isOpen} onClose={onClose} title="Reprogramar llamada" size="md">
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
              <option value="Nissim Mamiye Gildart">Nissim Mamiye Gildart</option>
              <option value="Ricardo Gómez Gutiérrez">Ricardo Gómez Gutiérrez</option>
              <option value="Sebastián Méndez Flores">Sebastián Méndez Flores</option>
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
    </PrincipalModal>
  )
}

// Modal para reprogramar reunión (copiado de DetallesTrato)
const ReprogramarReunionModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useModalState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    nuevaFecha: "",
    nuevaHoraInicio: "",
    nuevaHoraFin: "",
    modalidad: "",
    medio: "",
    finalidad: "",
  })

  const [errors, setErrors] = useModalState({})

  useModalEffect(() => {
    if (actividad && isOpen) {
      setFormData({
        asignadoA: actividad.responsable || "Dagoberto Nieto",
        nombreContacto: actividad.contacto || "Ricardo Gómez Gutiérrez",
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
    <PrincipalModal isOpen={isOpen} onClose={onClose} title="Reprogramar reunión" size="md">
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
              <option value="Ricardo Gómez Gutiérrez">Ricardo Gómez Gutiérrez</option>
              <option value="Nissim Mamiye Gildart">Nissim Mamiye Gildart</option>
              <option value="Sebastián Méndez Flores">Sebastián Méndez Flores</option>
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
    </PrincipalModal>
  )
}

// Modal para reprogramar tarea (copiado de DetallesTrato)
const ReprogramarTareaModal = ({ isOpen, onClose, onSave, actividad }) => {
  const [formData, setFormData] = useModalState({
    asignadoA: "Dagoberto Nieto",
    nombreContacto: "",
    nuevaFechaLimite: "",
    tipo: "",
    finalidad: "",
  })

  const [errors, setErrors] = useModalState({})

  useModalEffect(() => {
    if (actividad && isOpen) {
      setFormData({
        asignadoA: actividad.responsable || "Dagoberto Nieto",
        nombreContacto: actividad.contacto || "Sebastián Méndez Flores",
        nuevaFechaLimite: "",
        tipo: "Correo",
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
    <PrincipalModal isOpen={isOpen} onClose={onClose} title="Reprogramar tarea" size="md">
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
              <option value="Sebastián Méndez Flores">Sebastián Méndez Flores</option>
              <option value="Nissim Mamiye Gildart">Nissim Mamiye Gildart</option>
              <option value="Ricardo Gómez Gutiérrez">Ricardo Gómez Gutiérrez</option>
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
    </PrincipalModal>
  )
}

const Principal = () => {
  const navigate = useNavigate()
  const [barThickness, setBarThickness] = useState(40)
  const userName = localStorage.getItem("userName") || "Usuario"
  const userRol = localStorage.getItem("userRol") || "EMPLEADO"

  // Verifica token al cargar
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/")
    }
  }, [navigate])

  // Datos estáticos para el gráfico
  const etapas = [
    "Clasificación",
    "Primer Contacto",
    "Envío de Información",
    "Reunión",
    "Cotización Propuesta/Práctica",
    "Negociación/revisión",
    "Cerrado Ganado",
    "Respuesta por Correo",
    "Interés Futuro",
    "Cerrado Perdido",
  ]
  const datos = [5, 8, 30, 12, 7, 4, 10, 3, 6, 2]
  const colores = [
    "#af86ff",
    "#38b6ff",
    "#037ce0",
    "#0057c9",
    "#00347f",
    "#001959",
    "#00133b",
    "#f27100",
    "#9c16f7",
    "#3000b3",
  ]

  // Configuración del gráfico
  const data = {
    labels: etapas,
    datasets: [
      {
        label: "Cantidad de prospectos por etapa",
        data: datos,
        backgroundColor: colores,
        borderColor: colores,
        borderWidth: 1,
        barThickness: "flex",
        maxBarThickness: barThickness,
      },
    ],
  }

  // Estados para ajustes responsive del gráfico
  const [tickFontSizeX, setTickFontSizeX] = useState(12)
  const [tickFontSizeY, setTickFontSizeY] = useState(12)
  const [maxRotation, setMaxRotation] = useState(45)
  const [chartHeight, setChartHeight] = useState(500)

  // Estados para modales
  const [modals, setModals] = useModalState({
    completarActividad: { isOpen: false, actividad: null },
    reprogramarLlamada: { isOpen: false, actividad: null },
    reprogramarReunion: { isOpen: false, actividad: null },
    reprogramarTarea: { isOpen: false, actividad: null },
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

  const handleSaveCompletarActividad = (data) => {
    console.log("Actividad completada:", data)
    Swal.fire({
      title: "¡Actividad completada!",
      text: "El reporte de actividad se ha guardado exitosamente",
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

  // Opciones del gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...datos) + 5,
        grid: { color: "#e0e0e0" },
        ticks: {
          precision: 0,
          font: { size: tickFontSizeY, weight: "bold" },
          stepSize: 5,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          autoSkip: false,
          maxRotation: maxRotation,
          minRotation: maxRotation,
          font: { size: tickFontSizeX, weight: "bold" },
          color: "#333333",
          padding: 10,
          callback: function (value, index, values) {
            const label = this.getLabelForValue(index)
            if (label.length > 10) {
              const words = label.split(" ")
              if (words.length > 1) return words
            }
            return label
          },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#00133b",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        padding: 10,
        displayColors: false,
      },
    },
    layout: {
      padding: { top: 20, bottom: 30, left: 10, right: 10 },
    },
  }

  // Ajusta gráfico según tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 576) {
        setMaxRotation(90)
        setTickFontSizeX(10)
        setTickFontSizeY(10)
        setBarThickness(20)
        setChartHeight(400)
      } else if (width < 768) {
        setMaxRotation(90)
        setTickFontSizeX(11)
        setTickFontSizeY(11)
        setBarThickness(25)
        setChartHeight(450)
      } else if (width < 992) {
        setMaxRotation(45)
        setTickFontSizeX(12)
        setTickFontSizeY(12)
        setBarThickness(30)
        setChartHeight(500)
      } else if (width < 1200) {
        setMaxRotation(45)
        setTickFontSizeX(13)
        setTickFontSizeY(12)
        setBarThickness(35)
        setChartHeight(500)
      } else {
        setMaxRotation(45)
        setTickFontSizeX(14)
        setTickFontSizeY(13)
        setBarThickness(40)
        setChartHeight(550)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Maneja clic en completar tarea
  const handleCompleteTask = (taskTitle) => {
    const actividad = { titulo: taskTitle, tipo: "actividad" }
    openModal("completarActividad", { actividad })
  }

  // Maneja clic en reprogramar tarea
  const handleRescheduleTask = (taskTitle) => {
    let modalType = "reprogramarTarea"
    const actividad = { titulo: taskTitle, contacto: "", responsable: "Dagoberto Nieto" }

    if (taskTitle.includes("Llamada")) {
      modalType = "reprogramarLlamada"
      actividad.contacto = taskTitle.split(" - ")[0]
    } else if (taskTitle.includes("Reunión")) {
      modalType = "reprogramarReunion"
      actividad.contacto = taskTitle.split(" - ")[0]
    } else if (taskTitle.includes("Correo")) {
      modalType = "reprogramarTarea"
      actividad.contacto = taskTitle.split(" - ")[0]
    }

    openModal(modalType, { actividad })
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <h1 className="welcome-message">
          Bienvenido/a {userName}!
          <img src={welcomeIcon || "/placeholder.svg"} alt="Icono de Bienvenida" className="welcome-icon" />
        </h1>

        <div className="dashboard-container">
          <section className="tasks-panel">
            <h2>Mis tareas pendientes del día de hoy</h2>
            <div className="task-list">
              <div className="task-item">
                <div className="task-info">
                  <h3>
                    <img src={phoneIcon || "/placeholder.svg"} alt="Icono de Teléfono" className="task-icon" />
                    Nissim Mamiye Gildart - Llamada
                  </h3>
                  <div className="task-time">11:00</div>
                </div>
                <div className="task-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCompleteTask("Nissim Mamiye Gildart - Llamada")}
                  >
                    Completar
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleRescheduleTask("Nissim Mamiye Gildart - Llamada")}
                  >
                    Reprogramar
                  </button>
                </div>
              </div>
              <div className="task-item">
                <div className="task-info">
                  <h3>
                    <img src={meetingIcon || "/placeholder.svg"} alt="Icono de Reunión" className="task-icon" />
                    Ricardo Gómez Gutiérrez - Reunión
                  </h3>
                  <div className="task-time">13:00 - 14:30</div>
                </div>
                <div className="task-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCompleteTask("Ricardo Gómez Gutiérrez - Reunión")}
                  >
                    Completar
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleRescheduleTask("Ricardo Gómez Gutiérrez - Reunión")}
                  >
                    Reprogramar
                  </button>
                </div>
              </div>
              <div className="task-item">
                <div className="task-info">
                  <h3>
                    <img src={emailIcon || "/placeholder.svg"} alt="Icono de Correo" className="task-icon" />
                    Sebastián Méndez Flores - Correo
                  </h3>
                  <div className="task-time">16:00</div>
                </div>
                <div className="task-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCompleteTask("Sebastián Méndez Flores - Correo")}
                  >
                    Completar
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleRescheduleTask("Sebastián Méndez Flores - Correo")}
                  >
                    Reprogramar
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="stats-panel">
            <h2>Estadísticas de Prospectos por Etapa</h2>
            <div className="chart-container" style={{ height: `${chartHeight}px` }}>
              <Bar data={data} options={options} id="prospectsChart" />
            </div>
          </section>
        </div>
      </main>
      {/* Modales */}
      <CompletarActividadModal
        isOpen={modals.completarActividad.isOpen}
        onClose={() => closeModal("completarActividad")}
        onSave={handleSaveCompletarActividad}
        actividad={modals.completarActividad.actividad}
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
    </>
  )
}

export default Principal
