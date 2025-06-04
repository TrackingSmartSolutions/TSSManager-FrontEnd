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

const DetallesTrato = () => {
  const params = useParams()
  const navigate = useNavigate()
  const [trato, setTrato] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeEmailTab, setActiveEmailTab] = useState("correos")
  const [nuevaNota, setNuevaNota] = useState("")
  const [filtroNotas, setFiltroNotas] = useState("recientes")

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

  const handleEditarTrato = () => {
    Swal.fire({
      title: "Editar Trato",
      text: "Funcionalidad en desarrollo",
      icon: "info",
    })
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

  const handleAgregarActividad = (tipo) => {
    Swal.fire({
      title: `Agregar ${tipo}`,
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

  const handleEditarNota = (notaId) => {
    Swal.fire({
      title: "Editar Nota",
      text: "Funcionalidad de edición en desarrollo",
      icon: "info",
    })
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
    Swal.fire({
      title: "Completar Actividad",
      text: `¿Deseas marcar esta ${tipo} como completada?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4caf50",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, completar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("¡Completada!", `${tipo} marcada como completada`, "success")
        // Aquí puedes actualizar el estado de la actividad
      }
    })
  }

  const handleReprogramarActividad = (actividadId, tipo) => {
    Swal.fire({
      title: "Reprogramar Actividad",
      text: `¿Deseas reprogramar esta ${tipo}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ff9800",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, reprogramar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Reprogramada", `${tipo} reprogramada exitosamente`, "info")
        // Aquí puedes abrir un modal para seleccionar nueva fecha/hora
      }
    })
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
                    <p>{nota.texto}</p>
                    <span className="nota-fecha">{nota.fecha}</span>
                  </div>
                  <div className="nota-acciones">
                    <button onClick={() => handleEditarNota(nota.id)} className="btn-editar-nota">
                      <img src={editIcon || "/placeholder.svg"} alt="Editar" />
                    </button>
                    <button onClick={() => handleEliminarNota(nota.id)} className="btn-eliminar-nota">
                      <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" />
                    </button>
                  </div>
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
              <button onClick={() => handleAgregarActividad("correo")} className="btn-agregar">
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
    </>
  )
}

export default DetallesTrato
