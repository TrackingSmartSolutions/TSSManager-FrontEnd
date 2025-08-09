import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Admin_Cotizaciones.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import deleteIcon from "../../assets/icons/eliminar.png"
import addIcon from "../../assets/icons/agregar.png"
import editIcon from "../../assets/icons/editar.png"
import downloadIcon from "../../assets/icons/descarga.png";
import receivableIcon from "../../assets/icons/cuenta-cobrar.png"
import { API_BASE_URL } from "../Config/Config";


const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token")
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const response = await fetch(url, { ...options, headers })
  if (!response.ok) throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`)
  return response
}

// Función para convertir números a letras
const numeroALetras = (numero) => {
  const unidades = [
    "",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ]

  const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]

  const centenas = [
    "",
    "ciento",
    "doscientos",
    "trescientos",
    "cuatrocientos",
    "quinientos",
    "seiscientos",
    "setecientos",
    "ochocientos",
    "novecientos",
  ]

  if (numero === 0) return "cero pesos 00/100 M.N."
  if (numero === 1) return "un peso 00/100 M.N."

  let entero = Math.floor(numero)
  const centavos = Math.round((numero - entero) * 100)

  const convertirGrupo = (num) => {
    if (num === 0) return ""
    if (num < 20) return unidades[num]
    if (num < 100) {
      const dec = Math.floor(num / 10)
      const uni = num % 10
      if (uni === 0) return decenas[dec]
      if (dec === 2) return "veinti" + unidades[uni]
      return decenas[dec] + (uni > 0 ? " y " + unidades[uni] : "")
    }

    const cen = Math.floor(num / 100)
    const resto = num % 100
    let resultado = ""

    if (cen === 1 && resto === 0) resultado = "cien"
    else resultado = centenas[cen]

    if (resto > 0) resultado += " " + convertirGrupo(resto)
    return resultado
  }

  let resultado = ""

  if (entero >= 1000000) {
    const millones = Math.floor(entero / 1000000)
    if (millones === 1) resultado += "un millón "
    else resultado += convertirGrupo(millones) + " millones "
    entero %= 1000000
  }

  if (entero >= 1000) {
    const miles = Math.floor(entero / 1000)
    if (miles === 1) resultado += "mil "
    else resultado += convertirGrupo(miles) + " mil "
    entero %= 1000
  }

  if (entero > 0) {
    resultado += convertirGrupo(entero)
  }

  resultado = resultado.trim()
  if (Math.floor(numero) === 1) {
    resultado += " peso"
  } else {
    resultado += " pesos"
  }

  resultado += ` ${centavos.toString().padStart(2, "0")}/100 M.N.`

  return resultado.charAt(0).toUpperCase() + resultado.slice(1)
}

// Componente Modal Base
const Modal = ({ isOpen, onClose, title, children, size = "md", canClose = true, closeOnOverlayClick = true }) => {
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
    sm: "cotizaciones-modal-sm",
    md: "cotizaciones-modal-md",
    lg: "cotizaciones-modal-lg",
    xl: "cotizaciones-modal-xl",
  }

  return (
    <div className="cotizaciones-modal-overlay" onClick={closeOnOverlayClick ? onClose : () => { }}>
      <div className={`cotizaciones-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="cotizaciones-modal-header">
          <h2 className="cotizaciones-modal-title">{title}</h2>
          {canClose && (
            <button className="cotizaciones-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="cotizaciones-modal-body">{children}</div>
      </div>
    </div>
  )
}

// Modal para Nuevo Concepto
const NuevoConceptoModal = ({ isOpen, onClose, onSave, concepto }) => {
  const [formData, setFormData] = useState({
    cantidad: "",
    unidad: "Servicios",
    concepto: "",
    precioUnitario: "",
    descuento: "0",
  });
  const [errors, setErrors] = useState({});

  const conceptosPredefinidos = [
    "Servicio de instalación profesional y venta de equipos de localización antenas GPS/GPRS",
    "Servicio anual de localización de equipos GPS y plataforma de monitoreo web y móvil para 1 usuario con frecuencia de auto-reporte cada 1 minuto",
    "Servicio de instalación profesional y venta de equipos Dashcam con localización antenas GPS/GPRS botón de pánico, apagado de motor (incluye botón de pánico y relevadores para apagado)",
    "Servicio mensual de localización de 1 equipo GPS servicio de datos y plataforma de monitoreo web y móvil correspondiente al mes de",
  ];

  useEffect(() => {
    if (isOpen) {
      if (concepto) {
        // Si hay un concepto (modo edición), prellenar el formulario
        setFormData({
          cantidad: concepto.cantidad.toString(),
          unidad: concepto.unidad,
          concepto: concepto.concepto,
          precioUnitario: concepto.precioUnitario.toString(),
          descuento: concepto.descuento.toString(),
        });
      } else {
        // Si es nuevo concepto, reiniciar valores
        setFormData({
          cantidad: "",
          unidad: "Servicios",
          concepto: "",
          precioUnitario: "",
          descuento: "0",
        });
      }
      setErrors({});
    }
  }, [isOpen, concepto]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cantidad || Number.parseFloat(formData.cantidad) <= 0) {
      newErrors.cantidad = "La cantidad debe ser mayor a 0";
    }
    if (!formData.unidad.trim()) {
      newErrors.unidad = "La unidad es obligatoria";
    }
    if (!formData.concepto) {
      newErrors.concepto = "El concepto es obligatorio";
    }
    if (!formData.precioUnitario || Number.parseFloat(formData.precioUnitario) <= 0) {
      newErrors.precioUnitario = "El precio unitario debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateImporteTotal = () => {
    const cantidad = Number.parseFloat(formData.cantidad) || 0;
    const precioUnitario = Number.parseFloat(formData.precioUnitario) || 0;
    const descuentoPorcentaje = Number.parseFloat(formData.descuento) || 0;
    const descuentoMonto = (precioUnitario * descuentoPorcentaje / 100) * cantidad;
    return (cantidad * precioUnitario) - descuentoMonto;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const conceptoData = {
        id: concepto?.id,
        cantidad: Number.parseFloat(formData.cantidad),
        unidad: formData.unidad,
        concepto: formData.concepto,
        precioUnitario: Number.parseFloat(formData.precioUnitario),
        descuento: Number.parseFloat(formData.descuento),
        importeTotal: calculateImporteTotal(),
      };
      onSave(conceptoData);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo concepto" size="md" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="cotizaciones-form">
        <div className="cotizaciones-form-group">
          <label htmlFor="cantidad">Cantidad  <span className="required"> *</span></label>
          <input
            type="number"
            id="cantidad"
            value={formData.cantidad}
            onChange={(e) => handleInputChange("cantidad", e.target.value)}
            className={`cotizaciones-form-control ${errors.cantidad ? "error" : ""}`}
            step="1"
            min="1"
          />
          {errors.cantidad && <span className="cotizaciones-error-message">{errors.cantidad}</span>}
        </div>

        <div className="cotizaciones-form-group">
          <label htmlFor="unidad">Unidad  <span className="required"> *</span></label>
          <select
            id="unidad"
            value={formData.unidad}
            onChange={(e) => handleInputChange("unidad", e.target.value)}
            className={`cotizaciones-form-control ${errors.unidad ? "error" : ""}`}
          >
            <option value="">Ninguna seleccionada</option>
            <option value="Servicios">Servicios</option>
            <option value="Equipos">Equipos</option>
            <option value="Instalaciones">Instalaciones</option>
          </select>
          {errors.unidad && <span className="cotizaciones-error-message">{errors.unidad}</span>}
        </div>

        <div className="cotizaciones-form-group">
          <label htmlFor="concepto">Concepto <span className="required"> *</span></label>
          <select
            id="concepto-select"
            onChange={(e) => handleInputChange("concepto", e.target.value)}
            className="cotizaciones-form-control"
            value={formData.concepto}
          >
            <option value="">Seleccionar concepto</option>
            {conceptosPredefinidos.map((concepto, index) => (
              <option key={index} value={concepto}>
                {concepto.length > 50 ? `${concepto.substring(0, 50)}...` : concepto}
              </option>
            ))}
          </select>

          <textarea
            id="concepto"
            value={formData.concepto}
            onChange={(e) => handleInputChange("concepto", e.target.value)}
            className={`cotizaciones-form-control cotizaciones-concepto-textarea ${errors.concepto ? "error" : ""}`}
            rows="3"
            placeholder="O escribe tu propio concepto"
          />
          {errors.concepto && <span className="cotizaciones-error-message">{errors.concepto}</span>}
        </div>

        <div className="cotizaciones-form-group">
          <label htmlFor="precioUnitario">Precio Unitario  <span className="required"> *</span></label>
          <div className="cotizaciones-input-with-symbol">
            <span className="cotizaciones-currency-symbol">$</span>
            <input
              type="number"
              id="precioUnitario"
              value={formData.precioUnitario}
              onChange={(e) => handleInputChange("precioUnitario", e.target.value)}
              className={`cotizaciones-form-control ${errors.precioUnitario ? "error" : ""}`}
              step="0.01"
              min="0"
            />
          </div>
          {errors.precioUnitario && <span className="cotizaciones-error-message">{errors.precioUnitario}</span>}
        </div>

        <div className="cotizaciones-form-group">
          <label htmlFor="descuento">Descuento (%)</label>
          <div className="cotizaciones-input-with-symbol">
            <span className="cotizaciones-currency-symbol">%</span>
            <input
              type="number"
              id="descuento"
              value={formData.descuento}
              onChange={(e) => handleInputChange("descuento", e.target.value)}
              className="cotizaciones-form-control"
              step="0.01"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="cotizaciones-form-group">
          <label>Importe total</label>
          <div className="cotizaciones-input-with-symbol">
            <span className="cotizaciones-currency-symbol">$</span>
            <input
              type="text"
              value={calculateImporteTotal().toFixed(2)}
              className="cotizaciones-form-control"
              readOnly
            />
          </div>
        </div>

        <div className="cotizaciones-form-actions">
          <button type="button" onClick={onClose} className="cotizaciones-btn cotizaciones-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="cotizaciones-btn cotizaciones-btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para Nueva/Editar Cotización
const CotizacionModal = ({ isOpen, onClose, onSave, cotizacion = null, clientes, modals, setModals, users }) => {
  const [formData, setFormData] = useState({
    cliente: "",
    conceptos: [],
  });
  const [showConceptoModal, setShowConceptoModal] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState(null);
  const [errors, setErrors] = useState({});

  const isEditing = !!cotizacion;

  useEffect(() => {
    if (isOpen) {
      if (cotizacion) {
        setFormData({
          cliente: cotizacion.clienteNombre || "",
          conceptos: Array.isArray(cotizacion.unidades) ? cotizacion.unidades.map((c) => ({
            id: c.id,
            cantidad: c.cantidad,
            unidad: c.unidad,
            concepto: c.concepto,
            precioUnitario: c.precioUnitario,
            descuento: c.descuento,
            importeTotal: c.importeTotal,
          })) : [],
          empresaData: cotizacion.empresaData || null,
        });
      } else {
        setFormData({
          cliente: "",
          conceptos: [],
          empresaData: null,
        });
      }
      setErrors({});
    }
  }, [isOpen, cotizacion]);


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateImporteTotalForConcepto = (concepto) => {
    const cantidad = Number.parseFloat(concepto.cantidad) || 0;
    const precioUnitario = Number.parseFloat(concepto.precioUnitario) || 0;
    const descuentoPorcentaje = Number.parseFloat(concepto.descuento) || 0;
    const descuentoMonto = (precioUnitario * descuentoPorcentaje / 100) * cantidad;
    return (cantidad * precioUnitario) - descuentoMonto;
  };

  const handleAddConcepto = (conceptoData) => {
    if (editingConcepto !== null) {
      setFormData((prev) => ({
        ...prev,
        conceptos: prev.conceptos.map((concepto, index) =>
          index === editingConcepto ? {
            ...conceptoData,
            importeTotal: calculateImporteTotalForConcepto(conceptoData)
          } : concepto
        ),
      }));
      setEditingConcepto(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        conceptos: [...prev.conceptos, {
          ...conceptoData,
          importeTotal: calculateImporteTotalForConcepto(conceptoData)
        }],
      }));
    }
    setShowConceptoModal(false);
  };

  const handleEditConcepto = (index) => {
    setEditingConcepto(index);
    setShowConceptoModal(true);
  };

  const handleDeleteConcepto = (index) => {
    setFormData((prev) => ({
      ...prev,
      conceptos: prev.conceptos.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.conceptos.reduce((sum, concepto) => sum + concepto.importeTotal, 0);
    const iva = subtotal * 0.16;
    let isrEstatal = 0;
    let isrFederal = 0;

    if (formData.empresaData && formData.empresaData.regimenFiscal === "601") {
      const domicilioFiscal = (formData.empresaData.domicilioFiscal || "").toLowerCase();
      const hasGuanajuato = domicilioFiscal.includes("gto") || domicilioFiscal.includes("guanajuato");
      const cpMatch = domicilioFiscal.match(/\b(36|37|38)\d{4}\b/);

      if (cpMatch || hasGuanajuato) {
        isrEstatal = subtotal * 0.02;
        isrFederal = subtotal * 0.0125;
      } else if (!cpMatch && !hasGuanajuato) {
        isrFederal = subtotal * 0.0125;
      }
    }

    const total = subtotal + iva;
    return { subtotal, iva, isrEstatal, isrFederal, total };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cliente) {
      newErrors.cliente = "El cliente es obligatorio";
    }
    if (formData.conceptos.length === 0) {
      newErrors.conceptos = "Debe agregar al menos un concepto";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const { subtotal, iva, total } = calculateTotals();
      const cotizacionData = {
        id: cotizacion?.id,
        cliente: formData.cliente,
        conceptos: formData.conceptos,
        cantidadTotal: formData.conceptos
          .filter(concepto => concepto.unidad === "Equipos")
          .reduce((sum, concepto) => sum + concepto.cantidad, 0),
        conceptosCount: new Set(formData.conceptos.map((c) => c.concepto)).size,
        subtotal,
        iva,
        isrEstatal: calculateTotals().isrEstatal,
        isrFederal: calculateTotals().isrFederal,
        total,
        importeConLetra: numeroALetras(total),
        fecha: cotizacion?.fecha || new Date().toLocaleDateString("es-MX"),
        empresaData: formData.empresaData,
      };
      onSave(cotizacionData);
      onClose();
    }
  };

  const { subtotal, iva, total } = calculateTotals();

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? "Editar cotización" : "Nueva cotización"}
        size="lg"
        closeOnOverlayClick={false}
      >
        <form onSubmit={handleSubmit} className="cotizaciones-form">
          <div className="cotizaciones-form-group">
            <label htmlFor="cliente">Cliente  <span className="required"> *</span></label>
            <select
              id="cliente"
              value={formData.cliente}
              onChange={(e) => handleInputChange("cliente", e.target.value)}
              className={`cotizaciones-form-control ${errors.cliente ? "error" : ""}`}
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.nombre}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
            {errors.cliente && <span className="cotizaciones-error-message">{errors.cliente}</span>}
          </div>

          <div className="cotizaciones-form-group">
            <div className="cotizaciones-conceptos-header">
              <label>Conceptos  <span className="required"> *</span></label>
              <button
                type="button"
                onClick={() => setShowConceptoModal(true)}
                className="cotizaciones-btn cotizaciones-btn-add-concepto"
              >
                Agregar
                <img src={addIcon || "/placeholder.svg"} alt="Agregar" className="cotizaciones-btn-icon" />
              </button>
            </div>

            {formData.conceptos.length > 0 ? (
              <div className="cotizaciones-conceptos-list">
                {formData.conceptos.map((concepto, index) => (
                  <div key={concepto.id} className="cotizaciones-concepto-item">
                    <div className="cotizaciones-concepto-info">
                      <div className="cotizaciones-concepto-row">
                        <span className="cotizaciones-concepto-label">Cantidad:</span>
                        <span>{concepto.cantidad}</span>
                      </div>
                      <div className="cotizaciones-concepto-row">
                        <span className="cotizaciones-concepto-label">Unidad:</span>
                        <span>{concepto.unidad}</span>
                      </div>
                      <div className="cotizaciones-concepto-row">
                        <span className="cotizaciones-concepto-label">Concepto:</span>
                        <span className="cotizaciones-concepto-text">{concepto.concepto}</span>
                      </div>
                      <div className="cotizaciones-concepto-row">
                        <span className="cotizaciones-concepto-label">Precio:</span>
                        <span>${concepto.precioUnitario.toFixed(2)}</span>
                      </div>
                      <div className="cotizaciones-concepto-row">
                        <span className="cotizaciones-concepto-label">Descuento:</span>
                        <span>{concepto.descuento}%</span>
                      </div>
                      <div className="cotizaciones-concepto-row">
                        <span className="cotizaciones-concepto-label">Total:</span>
                        <span className="cotizaciones-concepto-total">${concepto.importeTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="cotizaciones-concepto-actions">
                      <button
                        type="button"
                        onClick={() => handleEditConcepto(index)}
                        className="cotizaciones-action-btn cotizaciones-edit-btn"
                        title="Editar"
                      >
                        <img
                          src={editIcon || "/placeholder.svg"}
                          alt="Editar"
                          className="cotizaciones-action-icon"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConcepto(index)}
                        className="cotizaciones-action-btn cotizaciones-delete-btn"
                        title="Eliminar"
                      >
                        <img
                          src={deleteIcon || "/placeholder.svg"}
                          alt="Eliminar"
                          className="cotizaciones-action-icon"
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cotizaciones-no-conceptos">No hay conceptos agregados</div>
            )}
            {errors.conceptos && <span className="cotizaciones-error-message">{errors.conceptos}</span>}
          </div>

          <div className="cotizaciones-totals-section">
            <div className="cotizaciones-form-group">
              <label>Subtotal:</label>
              <div className="cotizaciones-input-with-symbol">
                <span className="cotizaciones-currency-symbol">$</span>
                <input type="text" value={subtotal.toFixed(2)} className="cotizaciones-form-control" readOnly />
              </div>
            </div>

            <div className="cotizaciones-form-group">
              <label>IVA(16%)  <span className="required"> *</span></label>
              <div className="cotizaciones-input-with-symbol">
                <span className="cotizaciones-currency-symbol">$</span>
                <input type="text" value={iva.toFixed(2)} className="cotizaciones-form-control" readOnly />
              </div>
            </div>

            <div className="cotizaciones-form-group">
              <label>Total</label>
              <div className="cotizaciones-input-with-symbol">
                <span className="cotizaciones-currency-symbol">$</span>
                <input type="text" value={total.toFixed(2)} className="cotizaciones-form-control" readOnly />
              </div>
            </div>


            <div className="cotizaciones-form-group">
              <label>Importe con Letra</label>
              <textarea
                value={numeroALetras(total)}
                className="cotizaciones-form-control cotizaciones-importe-letra"
                readOnly
                rows="2"
              />
            </div>
          </div>

          <div className="cotizaciones-form-actions">
            <button type="button" onClick={onClose} className="cotizaciones-btn cotizaciones-btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="cotizaciones-btn cotizaciones-btn-primary">
              {isEditing ? "Guardar cambios" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>

      <NuevoConceptoModal
        isOpen={showConceptoModal}
        onClose={() => {
          setShowConceptoModal(false);
          setEditingConcepto(null);
        }}
        onSave={handleAddConcepto}
        concepto={editingConcepto !== null ? formData.conceptos[editingConcepto] : null}
      />
    </>
  );
};

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación" size="sm" closeOnOverlayClick={false}>
      <div className="cotizaciones-confirmar-eliminacion">
        <div className="cotizaciones-confirmation-content">
          <p className="cotizaciones-confirmation-message">
            ¿Seguro que quieres eliminar esta cotización de forma permanente?
          </p>
          <div className="cotizaciones-modal-form-actions">
            <button type="button" onClick={onClose} className="cotizaciones-btn cotizaciones-btn-cancel">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} className="cotizaciones-btn cotizaciones-btn-confirm">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Modal para Crear Cuentas por Cobrar
const CrearCuentasModal = ({ isOpen, onClose, onSave, cotizacion }) => {
  const [formData, setFormData] = useState({
    cotizacionId: "",
    clienteNombre: "",
    noEquipos: "",
    esquema: "ANUAL",
    numeroPagos: "1",
    fechaInicial: "",
    conceptos: [],
  });
  const [errors, setErrors] = useState({});

  const esquemas = [
    { value: "ANUAL", label: "Anual", editablePagos: true },
    { value: "MENSUAL", label: "Mensual", editablePagos: true },
    { value: "DISTRIBUIDOR", label: "Distribuidor - 1 solo pago", editablePagos: false },
    { value: "VITALICIA", label: "Vitalicia - 1 solo pago", editablePagos: false },
  ];

  useEffect(() => {
    if (isOpen && cotizacion) {
      setFormData({
        cotizacionId: cotizacion.id || "",
        clienteNombre: cotizacion.clienteNombre || "",
        noEquipos: cotizacion.unidades ? cotizacion.unidades.reduce((sum, u) => sum + u.cantidad, 0) : 0,
        esquema: "ANUAL",
        numeroPagos: "1",
        fechaInicial: new Date().toISOString().split('T')[0],
        conceptos: cotizacion.unidades ? cotizacion.unidades.map(u => ({ text: u.concepto, selected: true })) : [],
      });
      setErrors({});
    }
  }, [isOpen, cotizacion]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "esquema") {
        const esquemaSeleccionado = esquemas.find((e) => e.value === value);
        if (esquemaSeleccionado.editablePagos) {
          newData.numeroPagos = value === "MENSUAL" ? "12" : "1";
        } else {
          newData.numeroPagos = "1";
        }
      }
      return newData;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

  };
  const validateForm = () => {
  const newErrors = {};
  if (!formData.clienteNombre) newErrors.clienteNombre = "El cliente es obligatorio";
  if (!formData.esquema) newErrors.esquema = "El esquema es obligatorio";
  if (!formData.numeroPagos || Number.parseInt(formData.numeroPagos) <= 0) {
    newErrors.numeroPagos = "El número de pagos debe ser mayor a 0";
  }
  if (!formData.fechaInicial) newErrors.fechaInicial = "La fecha inicial es obligatoria"; // AGREGAR ESTA LÍNEA
  if (formData.conceptos.filter(c => c.selected).length === 0) {
    newErrors.conceptos = "Debe seleccionar al menos un concepto";
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const conceptosSeleccionados = formData.conceptos.filter(c => c.selected).map(c => c.text);
    if (conceptosSeleccionados.length === 0) {
      setErrors((prev) => ({ ...prev, conceptos: "Debe seleccionar al menos un concepto" }));
      return;
    }
    try {
      const queryParams = new URLSearchParams();
      conceptosSeleccionados.forEach(concepto => queryParams.append('conceptosSeleccionados', concepto));
      queryParams.append('numeroPagos', formData.numeroPagos);
      const url = `${API_BASE_URL}/cuentas-por-cobrar/from-cotizacion/${formData.cotizacionId}?esquema=${formData.esquema}&fechaInicial=${formData.fechaInicial}&${queryParams.toString()}`;

      const response = await fetchWithToken(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const savedCuentas = await response.json();
      onSave(savedCuentas);
      onClose();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cuenta/s por Cobrar" size="md" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="cuentascobrar-form">
        <div className="cuentascobrar-form-group">
          <label htmlFor="cliente">Cliente</label>
          <input type="text" id="cliente" value={formData.clienteNombre} className="cuentascobrar-form-control" readOnly />
        </div>
        <div className="cuentascobrar-form-group">
          <label htmlFor="noEquipos">Número de Equipos</label>
          <input type="number" id="noEquipos" value={formData.noEquipos} className="cuentascobrar-form-control" readOnly />
        </div>
        <div className="cuentascobrar-form-group">
          <label htmlFor="esquema">Esquema <span className="required"> *</span></label>
          <select
            id="esquema"
            value={formData.esquema}
            onChange={(e) => handleInputChange("esquema", e.target.value)}
            className={`cuentascobrar-form-control cuentascobrar-select-contained ${errors.esquema ? "error" : ""}`}
          >
            {esquemas.map((esquema) => (
              <option key={esquema.value} value={esquema.value}>{esquema.label}</option>
            ))}
          </select>
          {errors.esquema && <span className="cuentascobrar-error-message">{errors.esquema}</span>}
        </div>
        <div className="cuentascobrar-form-group">
          <label htmlFor="numeroPagos">Número de Pagos</label>
          <input
            type="number"
            id="numeroPagos"
            value={formData.numeroPagos}
            onChange={(e) => {
              const esquemaSeleccionado = esquemas.find(e => e.value === formData.esquema);
              if (esquemaSeleccionado.editablePagos) {
                handleInputChange("numeroPagos", e.target.value);
              }
            }}
            className="cuentascobrar-form-control"
            readOnly={!esquemas.find(e => e.value === formData.esquema)?.editablePagos}
            min="1"
          />
          {errors.numeroPagos && <span className="cuentascobrar-error-message">{errors.numeroPagos}</span>}
        </div>
        <div className="cuentascobrar-form-group">
          <label htmlFor="fechaInicial">Fecha Inicial <span className="required"> *</span></label>
          <input
            type="date"
            id="fechaInicial"
            value={formData.fechaInicial}
            onChange={(e) => handleInputChange("fechaInicial", e.target.value)}
            className={`cuentascobrar-form-control ${errors.fechaInicial ? "error" : ""}`}
            required
          />
          {errors.fechaInicial && <span className="cuentascobrar-error-message">{errors.fechaInicial}</span>}
        </div>
        <div className="cuentascobrar-form-group">
          <label>Concepto/s</label>
          {formData.conceptos.map((concepto, index) => (
            <div key={index} className="cuentascobrar-concepto-item">
              <input
                type="checkbox"
                checked={concepto.selected}
                onChange={(e) => {
                  const updatedConceptos = [...formData.conceptos];
                  updatedConceptos[index].selected = e.target.checked;
                  setFormData((prev) => ({ ...prev, conceptos: updatedConceptos }));
                }}
              />
              <span className="cuentascobrar-concepto-text">{concepto.text}</span>
            </div>
          ))}
          {errors.conceptos && <span className="cuentascobrar-error-message">{errors.conceptos}</span>}
        </div>
        <div className="cuentascobrar-form-actions">
          <button type="button" onClick={onClose} className="cuentascobrar-btn cuentascobrar-btn-cancel">Cancelar</button>
          <button type="submit" className="cuentascobrar-btn cuentascobrar-btn-primary">Generar</button>
        </div>
      </form>
    </Modal>
  );
};

// Componente Principal
const AdminCotizaciones = () => {
  const navigate = useNavigate()

  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [users, setUsers] = useState([]);
  const [emisores, setEmisores] = useState([]);
  const [filterReceptor, setFilterReceptor] = useState("");

  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modals, setModals] = useState({
    cotizacion: { isOpen: false, cotizacion: null },
    confirmarEliminacion: { isOpen: false, cotizacion: null },
    crearCuentas: { isOpen: false, cotizacion: null },
  });


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clientesClienteResp, clientesEnProcesoResp, cotizacionesResp, usersResp, emisoresResp, cuentasResp] = await Promise.all([
          fetchWithToken(`${API_BASE_URL}/empresas?estatus=CLIENTE`),
          fetchWithToken(`${API_BASE_URL}/empresas?estatus=EN_PROCESO`),
          fetchWithToken(`${API_BASE_URL}/cotizaciones`),
          fetchWithToken(`${API_BASE_URL}/auth/users`),
          fetchWithToken(`${API_BASE_URL}/solicitudes-factura-nota/emisores`),
          fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar`),
        ]);

        const clientesClienteData = await clientesClienteResp.json();
        const clientesEnProcesoData = await clientesEnProcesoResp.json();
        const cotizacionesData = await cotizacionesResp.json();
        const usersData = await usersResp.json();
        const emisoresData = await emisoresResp.json();
        const cuentasData = await cuentasResp.json();

        const clientesCliente = Array.isArray(clientesClienteData) ? clientesClienteData.map(c => ({ id: c.id, nombre: c.nombre, estatus: c.estatus })) : clientesClienteData.data?.map(c => ({ id: c.id, nombre: c.nombre, estatus: c.estatus })) || [];
        const clientesEnProceso = Array.isArray(clientesEnProcesoData) ? clientesEnProcesoData.map(c => ({ id: c.id, nombre: c.nombre, estatus: c.estatus })) : clientesEnProcesoData.data?.map(c => ({ id: c.id, nombre: c.nombre, estatus: c.estatus })) || [];
        const clientes = [...clientesCliente, ...clientesEnProceso];
        const cotizaciones = Array.isArray(cotizacionesData) ? cotizacionesData : cotizacionesData.data || [];
        const users = Array.isArray(usersData) ? usersData : usersData.data || [];
        const emisores = Array.isArray(emisoresData) ? emisoresData : emisoresData.data || [];
        const cuentasPorCobrar = Array.isArray(cuentasData) ? cuentasData : cuentasData.data || [];

        setClientes(clientes);
        setCotizaciones(cotizaciones);
        setUsers(users);
        setEmisores(emisores);
        setCuentasPorCobrar(cuentasPorCobrar);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos: " + error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
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

  const handleMenuNavigation = (menuItem) => {
    switch (menuItem) {
      case "balance":
        navigate("/admin_balance")
        break
      case "transacciones":
        navigate("/admin_transacciones")
        break
      case "cotizaciones":
        navigate("/admin_cotizaciones")
        break
      case "facturacion":
        navigate("/admin_facturacion")
        break
      case "cuentas-cobrar":
        navigate("/admin_cuentas_cobrar")
        break
      case "cuentas-pagar":
        navigate("/admin_cuentas_pagar")
        break
      case "caja-chica":
        navigate("/admin_caja_chica")
        break
      default:
        break
    }
  }

  const handleSaveCotizacion = async (cotizacionData) => {
    try {
      const url = cotizacionData.id
        ? `${API_BASE_URL}/cotizaciones/${cotizacionData.id}`
        : `${API_BASE_URL}/cotizaciones`;
      const method = cotizacionData.id ? "PUT" : "POST";

      const response = await fetchWithToken(url, {
        method,
        body: JSON.stringify({
          clienteNombre: cotizacionData.cliente,
          unidades: cotizacionData.conceptos.map((c) => ({
            cantidad: c.cantidad,
            unidad: c.unidad,
            concepto: c.concepto,
            precioUnitario: c.precioUnitario,
            descuento: c.descuento,
            importeTotal: c.importeTotal,
          })),
          empresaData: cotizacionData.empresaData,
        }),
      });

      const data = await response.json();
      if (cotizacionData.id) {
        setCotizaciones((prev) =>
          prev.map((c) => (c.id === cotizacionData.id ? { ...c, ...data } : c))
        );
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Cotización actualizada correctamente",
        });
      } else {
        setCotizaciones((prev) => [...prev, data]);
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Cotización creada correctamente",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar la cotización: " + error.message,
      });
    }
  };

  const handleDeleteCotizacion = (cotizacion) => {
    openModal("confirmarEliminacion", { cotizacion });
  };

  const handleConfirmDelete = async () => {
    const cotizacionId = modals.confirmarEliminacion.cotizacion?.id;

    try {
      // Primero verificar si la cotización está vinculada a alguna cuenta por cobrar
      const checkResponse = await fetchWithToken(`${API_BASE_URL}/cotizaciones/${cotizacionId}/check-vinculada`);
      const checkData = await checkResponse.json();

      if (checkData.vinculada) {
        closeModal("confirmarEliminacion");
        Swal.fire({
          icon: "warning",
          title: "No se puede eliminar",
          text: "No se puede eliminar la cotización porque está vinculada a una o más cuentas por cobrar",
          confirmButtonText: "Entendido"
        });
        return;
      }

      // Si no está vinculada, proceder con la eliminación
      const deleteResponse = await fetchWithToken(`${API_BASE_URL}/cotizaciones/${cotizacionId}`, {
        method: "DELETE"
      });

      if (deleteResponse.ok) {
        setCotizaciones((prev) => prev.filter((c) => c.id !== cotizacionId));
        closeModal("confirmarEliminacion");
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Cotización eliminada correctamente",
        });
      } else {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || "Error al eliminar la cotización");
      }

    } catch (error) {
      closeModal("confirmarEliminacion");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo eliminar la cotización",
      });
    }
  };

  const handleSaveCuenta = (cuenta) => {
    setCuentasPorCobrar((prev) =>
      prev.map((c) => (c.id === cuenta.id ? { ...c, ...cuenta } : c))
    );
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Cuenta/s por cobrar actualizada correctamente",
    });
  };


  const handleDownloadCotizacionPDF = async (cotizacionId) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cotizaciones/${cotizacionId}/download-pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      if (!response.ok) throw new Error('Error downloading PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `COTIZACION_${cotizacionId}_${new Date().toLocaleDateString('es-MX')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo descargar la cotización: ' + error.message,
      });
    }
  };

  return (
    <>
      <Header />
      {isLoading && (
        <div className="cotizaciones-loading">
          <div className="spinner"></div>
          <p>Cargando cotizaciones...</p>
        </div>
      )}
      <main className="cotizaciones-main-content">
        <div className="cotizaciones-container">
          <section className="cotizaciones-sidebar">
            <div className="cotizaciones-sidebar-header">
              <h3 className="cotizaciones-sidebar-title">Administración</h3>
            </div>
            <div className="cotizaciones-sidebar-menu">
              <div className="cotizaciones-menu-item" onClick={() => handleMenuNavigation("balance")}>
                Balance
              </div>
              <div className="cotizaciones-menu-item" onClick={() => handleMenuNavigation("transacciones")}>
                Transacciones
              </div>
              <div
                className="cotizaciones-menu-item cotizaciones-menu-item-active"
                onClick={() => handleMenuNavigation("cotizaciones")}
              >
                Cotizaciones
              </div>
              <div className="cotizaciones-menu-item" onClick={() => handleMenuNavigation("facturacion")}>
                Facturas/Notas
              </div>
              <div className="cotizaciones-menu-item" onClick={() => handleMenuNavigation("cuentas-cobrar")}>
                Cuentas por Cobrar
              </div>
              <div className="cotizaciones-menu-item" onClick={() => handleMenuNavigation("cuentas-pagar")}>
                Cuentas por Pagar
              </div>
              <div className="cotizaciones-menu-item" onClick={() => handleMenuNavigation("caja-chica")}>
                Caja chica
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="cotizaciones-content-panel">
            <div className="cotizaciones-header">

              <div className="cotizaciones-header-info">
                <h3 className="cotizaciones-page-title">Cotizaciones</h3>
                <p className="cotizaciones-subtitle">Gestión de cotizaciones para clientes</p>
              </div>
              <div className="cotizaciones-header-actions">
                <button
                  className="cotizaciones-btn cotizaciones-btn-primary"
                  onClick={() => openModal("cotizacion", { cotizacion: null })}
                >
                  Crear cotización
                </button>
              </div>
            </div>

            <div className="cotizaciones-filter">
              <label htmlFor="filterReceptor">Filtrar por Receptor: </label>
              <input
                type="text"
                id="filterReceptor"
                value={filterReceptor}
                onChange={(e) => setFilterReceptor(e.target.value)}
                placeholder="Escribe el nombre del receptor"
                className="cotizaciones-form-control"
              />
            </div>

            {/* Tabla de Cotizaciones */}
            <div className="cotizaciones-table-card">
              <h4 className="cotizaciones-table-title">Cotizaciones</h4>

              <div className="cotizaciones-table-container">
                <table className="cotizaciones-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Receptor</th>
                      <th className="cotizaciones-equipos-column-header">Total de equipos</th>
                      <th>Concepto</th>
                      <th>Subtotal</th>
                      <th>IVA</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizaciones.length > 0 ? (
                      cotizaciones
                        .filter((cotizacion) =>
                          cotizacion.clienteNombre
                            ?.toLowerCase()
                            .includes(filterReceptor.toLowerCase())
                        )
                        .map((cotizacion, index) => (
                          <tr key={cotizacion.id}>
                            <td>{index + 1}</td>
                            <td>{cotizacion.clienteNombre}</td>
                            <td className="cotizaciones-equipos-column">{cotizacion.cantidadTotal || 0}</td>
                            <td>{cotizacion.conceptosCount === 1 ? "1 concepto" : cotizacion.conceptosCount > 0 ? `${cotizacion.conceptosCount} conceptos` : "0 conceptos"}</td>
                            <td>${cotizacion.subtotal?.toFixed(2) || '0.00'}</td>
                            <td>${cotizacion.iva?.toFixed(2) || '0.00'}</td>
                            <td className="cotizaciones-total-cell">${cotizacion.total?.toFixed(2) || '0.00'}</td>
                            <td>
                              <div className="cotizaciones-actions">
                                <button
                                  className="cotizaciones-action-btn cotizaciones-edit-btn"
                                  onClick={() => openModal("cotizacion", { cotizacion })}
                                  title="Editar"
                                >
                                  <img
                                    src={editIcon || "/placeholder.svg"}
                                    alt="Editar"
                                    className="cotizaciones-action-icon"
                                  />
                                </button>
                                <button
                                  className="cotizaciones-action-btn cotizaciones-delete-btn"
                                  onClick={() => handleDeleteCotizacion(cotizacion)}
                                  title="Eliminar"
                                >
                                  <img
                                    src={deleteIcon || "/placeholder.svg"}
                                    alt="Eliminar"
                                    className="cotizaciones-action-icon"
                                  />
                                </button>
                                <button
                                  className="cotizaciones-action-btn cotizaciones-download-btn"
                                  onClick={() => handleDownloadCotizacionPDF(cotizacion.id)}
                                  title="Descargar Cotización en PDF"
                                >
                                  <img
                                    src={downloadIcon || "/placeholder.svg"}
                                    alt="Descargar"
                                    className="cotizaciones-action-icon"
                                  />
                                </button>
                                <button
                                  className="cotizaciones-action-btn cotizaciones-receivable-btn"
                                  onClick={async () => {
                                    const response = await fetchWithToken(`${API_BASE_URL}/cotizaciones/${cotizacion.id}/check-vinculada`);
                                    const { vinculada } = await response.json();
                                    if (vinculada) {
                                      Swal.fire({
                                        icon: "warning",
                                        title: "Alerta",
                                        text: "Ya se generaron las cuentas por cobrar",
                                      });
                                    } else {
                                      openModal("crearCuentas", { cotizacion: cotizacion });
                                    }
                                  }}
                                  title="Generar Cuenta por Cobrar"
                                >
                                  <img
                                    src={receivableIcon || "/placeholder.svg"}
                                    alt="Generar Cuenta"
                                    className="cotizaciones-action-icon"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="cotizaciones-no-data">
                          No hay cotizaciones registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Modales */}
        <CotizacionModal
          isOpen={modals.cotizacion.isOpen}
          onClose={() => closeModal("cotizacion")}
          onSave={handleSaveCotizacion}
          cotizacion={modals.cotizacion.cotizacion}
          clientes={clientes}
          modals={modals}
          setModals={setModals}
          users={users}
        />
        <ConfirmarEliminacionModal
          isOpen={modals.confirmarEliminacion.isOpen}
          onClose={() => closeModal("confirmarEliminacion")}
          onConfirm={handleConfirmDelete}
          cotizacion={modals.confirmarEliminacion.cotizacion}
        />
        <CrearCuentasModal
          isOpen={modals.crearCuentas?.isOpen || false}
          onClose={() => closeModal("crearCuentas")}
          onSave={(savedCuentas) => {
            setCuentasPorCobrar((prev) => [...prev, ...savedCuentas]);
            handleSaveCuenta(savedCuentas[0]);
            Swal.fire({
              icon: "success",
              title: "Éxito",
              text: "Cuenta/s por cobrar creada correctamente",
            });
            closeModal("crearCuentas");
          }}
          cotizacion={modals.crearCuentas?.cotizacion}
        />

      </main>
    </>
  )
}

export default AdminCotizaciones
