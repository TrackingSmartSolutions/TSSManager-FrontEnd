import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Admin_CuentasCobrar.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import deleteIcon from "../../assets/icons/eliminar.png"
import downloadIcon from "../../assets/icons/descarga.png"
import editIcon from "../../assets/icons/editar.png"
import requestIcon from "../../assets/icons/cotizacion.png"
import checkIcon from "../../assets/icons/check.png"
import { API_BASE_URL } from "../Config/Config";

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = new Headers();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.append("Content-Type", "application/json");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
    if (response.status === 204) return response;
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La operación tardó demasiado tiempo. Verifique su conexión.');
    }
    throw error;
  }
};

const fetchFileWithToken = async (url, options = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const config = {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };

  return fetch(url, config);
};

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
    sm: "cuentascobrar-modal-sm",
    md: "cuentascobrar-modal-md",
    lg: "cuentascobrar-modal-lg",
    xl: "cuentascobrar-modal-xl",
  }

  return (
    <div className="cuentascobrar-modal-overlay" onClick={closeOnOverlayClick ? onClose : () => { }}>
      <div className={`cuentascobrar-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="cuentascobrar-modal-header">
          <h2 className="cuentascobrar-modal-title">{title}</h2>
          {canClose && (
            <button className="cuentascobrar-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="cuentascobrar-modal-body">{children}</div>
      </div>
    </div>
  )
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

// Modal para Agregar Comprobante de Pago
const ComprobanteModal = ({ isOpen, onClose, onSave, cuenta }) => {
  const [formData, setFormData] = useState({
    fechaPago: "",
    comprobantePago: null,
  });
  const [errors, setErrors] = useState({});

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fechaPago: new Date().toISOString().split("T")[0],
        comprobantePago: null,
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validación de tipo de archivo (solo PDF)
      const validTypes = ["application/pdf"];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          comprobantePago: "El archivo debe ser un PDF.",
        }));
        return;
      }

      // Validación de tamaño (máximo 5 MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          comprobantePago: "El archivo no debe exceder 5MB.",
        }));
        return;
      }

      // Si pasa las validaciones, asignar el archivo
      setFormData((prev) => ({ ...prev, comprobantePago: file }));
      setErrors((prev) => ({ ...prev, comprobantePago: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fechaPago) newErrors.fechaPago = "La fecha de pago es obligatoria";
    if (!formData.comprobantePago) newErrors.comprobantePago = "El comprobante de pago es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    if (validateForm()) {
      const formDataToSend = new FormData();
      formDataToSend.append("fechaPago", formData.fechaPago);
      formDataToSend.append("comprobante", formData.comprobantePago);

      try {
        Swal.fire({
          title: 'Procesando...',
          text: 'Marcando como pagado y subiendo comprobante',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          }
        });

        const updatedCuenta = await fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar/${cuenta.id}/marcar-pagada`, {
          method: "POST",
          body: formDataToSend,
        });

        Swal.close();
        onSave(updatedCuenta);
        onClose();

        if (updatedCuenta.comprobantePagoUrl === "ERROR_UPLOAD") {
          Swal.fire({
            icon: "warning",
            title: "Parcialmente completado",
            text: "La cuenta se marcó como pagada, pero hubo un error al subir el comprobante. Puede intentar subirlo nuevamente más tarde."
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: "Cuenta marcada como pagada correctamente"
          });
        }
      } catch (error) {
        Swal.close();
        Swal.fire({ icon: "error", title: "Error", text: error.message });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Comprobante de Cobro" size="md" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="cuentascobrar-form">
        <div className="cuentascobrar-form-group">
          <label htmlFor="fechaPago">Fecha Pago <span className="required"> *</span></label>
          <input
            type="date"
            id="fechaPago"
            value={formData.fechaPago}
            onChange={(e) => handleInputChange("fechaPago", e.target.value)}
            className={`cuentascobrar-form-control ${errors.fechaPago ? "error" : ""}`}
          />
          {errors.fechaPago && <span className="cuentascobrar-error-message">{errors.fechaPago}</span>}
        </div>

        <div className="cuentascobrar-form-group">
          <label htmlFor="comprobantePago">Comprobante de pago <span className="required"> *</span></label>
          <div className="cuentascobrar-file-upload">
            <input type="file" id="comprobantePago" onChange={handleFileChange} accept="application/pdf" className="cuentascobrar-file-input" />
            <div className="cuentascobrar-file-upload-area">
              <div className="cuentascobrar-file-upload-icon">📁</div>
              <div className="cuentascobrar-file-upload-text">
                {formData.comprobantePago ? formData.comprobantePago.name : "Arrastra y suelta tu archivo aquí"}
              </div>
              <div className="cuentascobrar-file-upload-subtext">PDF máx. 5MB</div>
            </div>
          </div>
          {errors.comprobantePago && <span className="cuentascobrar-error-message">{errors.comprobantePago}</span>}
        </div>

        <div className="cuentascobrar-form-actions">
          <button type="button" onClick={onClose} className="cuentascobrar-btn cuentascobrar-btn-cancel">
            Cancelar
          </button>
          <button
            type="submit"
            className="cuentascobrar-btn cuentascobrar-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, onConfirm, cuenta }) => {
  const handleConfirmDelete = async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar/${cuenta.id}`, {
        method: "DELETE",
      });
      if (response.status === 204) {
        onConfirm(cuenta.id);
        onClose();
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Cuenta por cobrar eliminada correctamente",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se puede eliminar la cuenta por cobrar porque está vinculada a una solicitud de factura/nota.",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación" size="sm" closeOnOverlayClick={false}>
      <div className="cuentascobrar-confirmar-eliminacion">
        <div className="cuentascobrar-confirmation-content">
          <p className="cuentascobrar-confirmation-message">
            ¿Seguro que quieres eliminar la cuenta por cobrar de forma permanente?
          </p>
          <div className="cuentascobrar-modal-form-actions">
            <button type="button" onClick={onClose} className="cuentascobrar-btn cuentascobrar-btn-cancel">
              Cancelar
            </button>
            <button type="button" onClick={handleConfirmDelete} className="cuentascobrar-btn cuentascobrar-btn-confirm">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const SolicitudModal = ({ isOpen, onClose, onSave, cotizaciones, cuentasPorCobrar, emisores, preloadedCotizacion, preloadedCuenta }) => {
  const [formData, setFormData] = useState({
    id: null,
    cotizacion: "",
    fechaEmision: new Date().toLocaleDateString('en-CA'),
    metodoPago: "",
    formaPago: "",
    tipo: "",
    claveProductoServicio: "20121910",
    claveUnidad: "E48",
    emisor: "",
    cuentaPorCobrar: "",
    subtotal: "",
    iva: "",
    total: "",
    importeLetra: "",
    usoCfdi: "",
  });
  const [errors, setErrors] = useState({});

  const isEditing = !!preloadedCotizacion?.id;

  const usosCfdi = [
    { value: "G01", label: "G01 - Adquisición de mercancías" },
    { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
    { value: "G03", label: "G03 - Gastos en General" },
    { value: "I01", label: "I01 - Construcciones" },
    { value: "I02", label: "I02 - Mobiliario y Equipo de Oficina por inversiones" },
    { value: "I03", label: "I03 - Equipo de transporte" },
    { value: "I04", label: "I04 - Equipo de cómputo y accesorios" },
    { value: "I05", label: "I05 - Dados, troqueles, moldes, matrices y herramientas" },
    { value: "I06", label: "I06 - Comunicaciones telefónicas" },
    { value: "I07", label: "I07 - Comunicaciones satelitales" },
    { value: "I08", label: "I08 - Otra maquinaria y equipo" },
    { value: "D01", label: "D01 - Honorarios médicos, dentales y hospitalarios" },
    { value: "D02", label: "D02 - Gastos médicos por incapacidad o discapacidad" },
    { value: "D03", label: "D03 - Gastos funerales" },
    { value: "D04", label: "D04 - Donativos" },
    { value: "D05", label: "D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)" },
    { value: "D06", label: "D06 - Aportaciones voluntarias al SAR" },
    { value: "D07", label: "D07 - Primas por seguros de gastos médicos" },
    { value: "D08", label: "D08 - Gastos por transportación escolar obligatoria" },
    { value: "D09", label: "D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones" },
    { value: "D10", label: "D10 - Pagos por servicios educativos (colegiaturas)" },
    { value: "P01", label: "P01 - Por definir" },
  ];

  const metodosPago = [
    { value: "PUE", label: "Pago en una sola exhibición (PUE)" },
    { value: "PPD", label: "Pago en parcialidades o diferido (PPD)" },
  ];

  const formasPago = [
    { value: "01", label: "01: Efectivo" },
    { value: "07", label: "07: Con Saldo Acumulado" },
    { value: "03", label: "03: Transferencia electrónica de fondos" },
    { value: "04", label: "04: Tarjeta de crédito" },
    { value: "28", label: "28: Tarjeta de débito" },
    { value: "30", label: "30: Aplicación de anticipos" },
    { value: "99", label: "99: Por definir" },
    { value: "02", label: "02: Tarjeta spin" },
  ];

  const tipos = [
    { value: "SOLICITUD_DE_FACTURA", label: "Solicitud de Factura" },
    { value: "NOTA", label: "Nota" },
  ];

  const clavesProductoServicio = [
    { value: "25173108", label: "25173108 - Sistemas de navegación vehicular (Sistema GPS)" },
    { value: "25173107", label: "25173107 - Sistemas de posicionamiento global de vehículos" },
    { value: "43211710", label: "43211710 - Dispositivos de identificación de radio frecuencia" },
    { value: "43212116", label: "43212116 - Impresoras de etiquetas de identificación de radio frecuencia rfid" },
    { value: "81111810", label: "81111810 - Servicios de codificación de software" },
    { value: "81111501", label: "81111501 - Diseño de aplicaciones de software de la unidad central" },
    { value: "81111510", label: "81111510 - Servicios de desarrollo de aplicaciones para servidores" },
    { value: "81112106", label: "81112106 - Proveedores de servicios de aplicación" },
    { value: "81112105", label: "81112105 - Servicios de hospedaje de operación de sitios web" },
    { value: "20121910", label: "20121910 - Sistemas de telemetría" },
  ];

  const clavesUnidad = [
    { value: "H87", label: "H87 - Pieza" },
    { value: "E48", label: "E48 - Unidad de servicio" },
    { value: "ACT", label: "ACT - Actividad" },
    { value: "MON", label: "MON - Mes" },
    { value: "LOT", label: "LOT - Lote" },
  ];

  useEffect(() => {
    if (isOpen) {
      if (preloadedCotizacion) {
        setFormData({
          id: null,
          cotizacion: preloadedCotizacion.id,
          fechaEmision: new Date().toLocaleDateString('en-CA'),
          metodoPago: "",
          formaPago: "",
          tipo: "",
          claveProductoServicio: "20121910",
          claveUnidad: "E48",
          emisor: emisores.length > 0 ? emisores[0].id : "",
          cuentaPorCobrar: preloadedCuenta ? preloadedCuenta.id : "",
          subtotal: preloadedCotizacion.subtotal !== undefined ? String(preloadedCotizacion.subtotal) : "",
          iva: preloadedCotizacion.iva !== undefined ? String(preloadedCotizacion.iva) : "",
          total: preloadedCotizacion.total !== undefined ? String(preloadedCotizacion.total) : "",
          importeLetra: preloadedCotizacion.importeConLetra || "",
          usoCfdi: "",
        });
        const empresaData = preloadedCotizacion.empresaData || {};
        const requiredFields = ["domicilioFiscal", "rfc", "razonSocial", "regimenFiscal"];
        const hasAllFiscalData = requiredFields.every((field) => !!empresaData[field]);
        if (!hasAllFiscalData) {
          setFormData((prev) => ({
            ...prev,
            tipo: "NOTA",
          }));
        }
      } else {
        setFormData({
          id: null,
          cotizacion: "",
          fechaEmision: new Date().toLocaleDateString('en-CA'),
          metodoPago: "",
          formaPago: "",
          tipo: "",
          claveProductoServicio: "20121910",
          claveUnidad: "E48",
          emisor: emisores.length > 0 ? emisores[0].id : "",
          cuentaPorCobrar: "",
          subtotal: "",
          iva: "",
          total: "",
          importeLetra: "",
          usoCfdi: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, preloadedCotizacion, preloadedCuenta, emisores]);

  useEffect(() => {
    if (formData.cotizacion && cotizaciones) {
      const cotizacionSeleccionada = cotizaciones.find((c) => c.id === parseInt(formData.cotizacion));
      if (cotizacionSeleccionada) {
        setFormData((prev) => ({
          ...prev,
          subtotal: cotizacionSeleccionada.subtotal !== undefined ? String(cotizacionSeleccionada.subtotal) : "",
          iva: cotizacionSeleccionada.iva !== undefined ? String(cotizacionSeleccionada.iva) : "",
          total: cotizacionSeleccionada.total !== undefined ? String(cotizacionSeleccionada.total) : "",
          importeLetra: cotizacionSeleccionada.importeConLetra || "",
        }));
      }
    }
  }, [formData.cotizacion, cotizaciones]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.metodoPago) newErrors.metodoPago = "El método de pago es obligatorio";
    if (!formData.formaPago) newErrors.formaPago = "La forma de pago es obligatoria";
    if (!formData.tipo) newErrors.tipo = "El tipo es obligatorio";
    if (!formData.claveProductoServicio) newErrors.claveProductoServicio = "La clave producto/servicio es obligatoria";
    if (!formData.claveUnidad) newErrors.claveUnidad = "La clave unidad es obligatoria";
    if (!formData.emisor) newErrors.emisor = "El emisor es obligatorio";
    if (!formData.cuentaPorCobrar) newErrors.cuentaPorCobrar = "La cuenta por cobrar es obligatoria";
    if (formData.tipo === "SOLICITUD_DE_FACTURA" && (!formData.usoCfdi || formData.usoCfdi === "")) {
      newErrors.usoCfdi = "El uso de CFDI es obligatorio para solicitudes de factura";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmpresaFiscal = () => {
    if (formData.tipo === "SOLICITUD_DE_FACTURA") {
      if (preloadedCotizacion && preloadedCotizacion.empresaData) {
        const requiredFields = ["domicilioFiscal", "rfc", "razonSocial", "regimenFiscal"];
        const hasAllFiscalData = requiredFields.every((field) => !!preloadedCotizacion.empresaData[field]);
        return hasAllFiscalData;
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (!validateEmpresaFiscal()) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se puede generar la Solicitud de Factura porque la empresa no tiene completos los datos fiscales requeridos.",
        });
        return;
      }

      const cotizacionSeleccionada = cotizaciones.find((c) => c.id === parseInt(formData.cotizacion));
      let isrEstatal = 0;
      let isrFederal = 0;
      let total = parseFloat(formData.total) || 0;
      let subtotal = parseFloat(formData.subtotal) || 0;

      if (formData.tipo === "SOLICITUD_DE_FACTURA" && cotizacionSeleccionada?.empresaData?.regimenFiscal === "601") {
        const domicilioFiscal = (cotizacionSeleccionada.empresaData.domicilioFiscal || "").toLowerCase();
        const hasGuanajuato = domicilioFiscal.includes("gto") || domicilioFiscal.includes("guanajuato") || domicilioFiscal.includes("Gto") || domicilioFiscal.includes("Guanajuato");
        const cpMatch = domicilioFiscal.match(/\b(36|37|38)\d{4}\b/);

        if (cpMatch || hasGuanajuato) {
          isrEstatal = subtotal * 0.02;
          isrFederal = subtotal * 0.0125;
        } else if (!cpMatch && !hasGuanajuato) {
          isrFederal = subtotal * 0.0125;
        }
        total = subtotal + parseFloat(formData.iva) - isrEstatal - isrFederal;
      }

      const cuentaPorCobrarData = cuentasPorCobrar.find((c) => c.id === formData.cuentaPorCobrar);
      const clienteId = cuentaPorCobrarData?.cliente?.id || null;

      const solicitudData = {
        cotizacion: { id: formData.cotizacion },
        fechaEmision: formData.fechaEmision,
        metodoPago: formData.metodoPago,
        formaPago: formData.formaPago,
        tipo: formData.tipo,
        claveProductoServicio: formData.claveProductoServicio,
        claveUnidad: formData.claveUnidad,
        emisor: { id: formData.emisor },
        cuentaPorCobrar: { id: formData.cuentaPorCobrar },
        cliente: { id: clienteId },
        subtotal: formData.subtotal,
        iva: formData.iva,
        isrEstatal: isrEstatal.toFixed(2),
        isrFederal: isrFederal.toFixed(2),
        total: total.toFixed(2),
        importeLetra: numeroALetras(total),
        usoCfdi: formData.usoCfdi,
      };

      try {
        const savedSolicitud = await fetchWithToken(`${API_BASE_URL}/solicitudes-factura-nota`, {
          method: "POST",
          body: JSON.stringify(solicitudData),
          headers: { "Content-Type": "application/json" },
        });

        onSave(savedSolicitud);
        onClose();
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Solicitud creada correctamente",
        });
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Solicitud de Factura/Nota" : "Nueva Solicitud de Factura/Nota"}
      size="md"
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="facturacion-form">
        <div className="facturacion-form-group">
          <label htmlFor="cotizacion">Cotización <span className="required"> *</span></label>
          <select
            id="cotizacion"
            value={formData.cotizacion}
            onChange={(e) => handleInputChange("cotizacion", e.target.value)}
            className="facturacion-form-control"
            disabled={!!preloadedCotizacion}
          >
            <option value="">Ninguna seleccionada</option>
            {cotizaciones.map((cotizacion) => (
              <option key={cotizacion.id} value={cotizacion.id}>{cotizacion.clienteNombre} - {cotizacion.id}</option>
            ))}
          </select>
        </div>
        <div className="facturacion-form-group">
          <label htmlFor="metodoPago">Método de pago <span className="required"> *</span></label>
          <select
            id="metodoPago"
            value={formData.metodoPago}
            onChange={(e) => handleInputChange("metodoPago", e.target.value)}
            className={`facturacion-form-control ${errors.metodoPago ? "error" : ""}`}
          >
            <option value="">Seleccione un método</option>
            {metodosPago.map((metodo) => (
              <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
            ))}
          </select>
          {errors.metodoPago && <span className="facturacion-error-message">{errors.metodoPago}</span>}
        </div>
        <div className="facturacion-form-group">
          <label htmlFor="formaPago">Forma de pago <span className="required"> *</span></label>
          <select
            id="formaPago"
            value={formData.formaPago}
            onChange={(e) => handleInputChange("formaPago", e.target.value)}
            className={`facturacion-form-control ${errors.formaPago ? "error" : ""}`}
          >
            <option value="">Seleccione una forma</option>
            {formasPago.map((forma) => (
              <option key={forma.value} value={forma.value}>{forma.label}</option>
            ))}
          </select>
          {errors.formaPago && <span className="facturacion-error-message">{errors.formaPago}</span>}
        </div>
        <div className="facturacion-form-group">
          <label htmlFor="tipo">Tipo <span className="required"> *</span></label>
          <select
            id="tipo"
            value={formData.tipo}
            onChange={(e) => handleInputChange("tipo", e.target.value)}
            className={`facturacion-form-control ${errors.tipo ? "error" : ""}`}
          >
            <option value="">Seleccione un tipo</option>
            {tipos.map((tipo) => {
              const empresaData = preloadedCotizacion?.empresaData || {};
              const requiredFields = ["domicilioFiscal", "rfc", "razonSocial", "regimenFiscal"];
              const hasAllFiscalData = requiredFields.every((field) => !!empresaData[field]);
              return (
                <option
                  key={tipo.value}
                  value={tipo.value}
                  disabled={!hasAllFiscalData && tipo.value === "SOLICITUD_DE_FACTURA"}
                >
                  {tipo.label}
                </option>
              );
            })}
          </select>
          {!preloadedCotizacion?.empresaData?.domicilioFiscal && (
            <small className="help-text">
              Debe completar los datos fiscales (domicilio fiscal, RFC, razón social, régimen fiscal) de la empresa para poder generar una solicitud de factura.
            </small>
          )}
          {errors.tipo && <span className="facturacion-error-message">{errors.tipo}</span>}
        </div>
        <div className="facturacion-form-group">
          <label htmlFor="claveProductoServicio">Clave Producto/Servicio <span className="required"> *</span></label>
          <select
            id="claveProductoServicio"
            value={formData.claveProductoServicio}
            onChange={(e) => handleInputChange("claveProductoServicio", e.target.value)}
            className={`facturacion-form-control ${errors.claveProductoServicio ? "error" : ""}`}
          >
            {clavesProductoServicio.map((clave) => (
              <option key={clave.value} value={clave.value}>{clave.label}</option>
            ))}
          </select>
          {errors.claveProductoServicio && <span className="facturacion-error-message">{errors.claveProductoServicio}</span>}
        </div>
        <div className="facturacion-form-group">
          <label htmlFor="claveUnidad">Clave Unidad <span className="required"> *</span></label>
          <select
            id="claveUnidad"
            value={formData.claveUnidad}
            onChange={(e) => handleInputChange("claveUnidad", e.target.value)}
            className={`facturacion-form-control ${errors.claveUnidad ? "error" : ""}`}
          >
            {clavesUnidad.map((clave) => (
              <option key={clave.value} value={clave.value}>{clave.label}</option>
            ))}
          </select>
          {errors.claveUnidad && <span className="facturacion-error-message">{errors.claveUnidad}</span>}
        </div>
        <div className="facturacion-form-group">
          <label htmlFor="emisor">Emisor <span className="required"> *</span></label>
          <select
            id="emisor"
            value={formData.emisor}
            onChange={(e) => handleInputChange("emisor", e.target.value)}
            className={`facturacion-form-control ${errors.emisor ? "error" : ""}`}
          >
            <option value="">Seleccione un emisor</option>
            {emisores.map((emisor) => (
              <option key={emisor.id} value={emisor.id}>{emisor.nombre}</option>
            ))}
          </select>
          {errors.emisor && <span className="facturacion-error-message">{errors.emisor}</span>}
        </div>
        <div className="facturacion-form-group">
          <label htmlFor="cuentaPorCobrar">Cuenta por Cobrar <span className="required"> *</span></label>
          <select
            id="cuentaPorCobrar"
            value={formData.cuentaPorCobrar}
            onChange={(e) => handleInputChange("cuentaPorCobrar", e.target.value)}
            className={`facturacion-form-control ${errors.cuentaPorCobrar ? "error" : ""}`}
            disabled={!!preloadedCuenta}
          >
            <option value="">Ninguna seleccionada</option>
            {cuentasPorCobrar.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>{cuenta.folio}</option>
            ))}
          </select>
          {errors.cuentaPorCobrar && <span className="facturacion-error-message">{errors.cuentaPorCobrar}</span>}
        </div>
        <div className="facturacion-form-group">
          <label htmlFor="usoCfdi">Uso de CFDI <span className="required"> *</span></label>
          <select
            id="usoCfdi"
            value={formData.usoCfdi}
            onChange={(e) => handleInputChange("usoCfdi", e.target.value)}
            className={`facturacion-form-control ${errors.usoCfdi ? "error" : ""}`}
            disabled={formData.tipo !== "SOLICITUD_DE_FACTURA"}
          >
            <option value="">Seleccione un uso</option>
            {usosCfdi.map((uso) => (
              <option key={uso.value} value={uso.value}>{uso.label}</option>
            ))}
          </select>
          {errors.usoCfdi && <span className="facturacion-error-message">{errors.usoCfdi}</span>}
        </div>
        <div className="facturacion-form-actions">
          <button type="button" onClick={onClose} className="facturacion-btn facturacion-btn-cancel">Cancelar</button>
          <button type="submit" className="facturacion-btn facturacion-btn-primary">
            {isEditing ? "Guardar cambios" : "Crear"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para Editar Cuenta Por Cobrar
const EditarCuentaModal = ({ isOpen, onClose, onSave, cuenta }) => {
  const [formData, setFormData] = useState({
    fechaPago: "",
    cantidadCobrar: "",
    conceptos: [],
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cuenta) {
      setFormData({
        fechaPago: cuenta.fechaPago || "",
        cantidadCobrar: cuenta.cantidadCobrar || "",
        conceptos: cuenta.conceptos || [],
      });
      setErrors({});
    }
  }, [isOpen, cuenta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedCuenta = await fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar/${cuenta.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fechaPago: formData.fechaPago,
          cantidadCobrar: parseFloat(formData.cantidadCobrar),
          conceptos: formData.conceptos,
        }),
        headers: { "Content-Type": "application/json" },
      });
      onSave(updatedCuenta);
      onClose();
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Cuenta por cobrar actualizada correctamente",
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Cuenta por Cobrar" size="md">
      <form onSubmit={handleSubmit} className="cuentascobrar-form">
        <div className="cuentascobrar-form-group">
          <label htmlFor="fechaPago">Fecha de Pago <span className="required"> *</span></label>
          <input
            type="date"
            id="fechaPago"
            value={formData.fechaPago}
            onChange={(e) => setFormData(prev => ({ ...prev, fechaPago: e.target.value }))}
            className="cuentascobrar-form-control"
          />
        </div>

        <div className="cuentascobrar-form-group">
          <label htmlFor="cantidadCobrar">Cantidad a Cobrar <span className="required"> *</span></label>
          <input
            type="number"
            step="0.01"
            id="cantidadCobrar"
            value={formData.cantidadCobrar}
            onChange={(e) => setFormData(prev => ({ ...prev, cantidadCobrar: e.target.value }))}
            className="cuentascobrar-form-control"
          />
        </div>

        <div className="cuentascobrar-form-actions">
          <button type="button" onClick={onClose} className="cuentascobrar-btn cuentascobrar-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="cuentascobrar-btn cuentascobrar-btn-primary" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Componente Principal
const AdminCuentasCobrar = () => {
  const navigate = useNavigate();

  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [emisores, setEmisores] = useState([]);
  const [cuentasVinculadas, setCuentasVinculadas] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstatus, setFiltroEstatus] = useState("Todas");

  const [modals, setModals] = useState({
    crearCuentas: { isOpen: false },
    editarCuenta: { isOpen: false, cuenta: null },
    comprobante: { isOpen: false, cuenta: null },
    confirmarEliminacion: { isOpen: false, cuenta: null },
    crearSolicitud: { isOpen: false, cotizacion: null, cuenta: null },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clientesData, cuentasData, cotizacionesData, emisoresData] = await Promise.all([
          fetchWithToken(`${API_BASE_URL}/empresas?estatus=CLIENTE`),
          fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar`),
          fetchWithToken(`${API_BASE_URL}/cotizaciones`),
          fetchWithToken(`${API_BASE_URL}/solicitudes-factura-nota/emisores`),
        ]);
        setClientes(clientesData);
        setCuentasPorCobrar(cuentasData);
        setCotizaciones(cotizacionesData);
        setEmisores(emisoresData);

        await verificarVinculaciones(cuentasData);
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los datos" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const verificarVinculaciones = async (cuentas) => {
    const vinculacionesPromises = cuentas.map(async (cuenta) => {
      try {
        const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar/${cuenta.id}/check-vinculada`);
        return { id: cuenta.id, vinculada: response.vinculada };
      } catch (error) {
        return { id: cuenta.id, vinculada: false };
      }
    });

    const vinculaciones = await Promise.all(vinculacionesPromises);
    const cuentasVinculadasIds = new Set(
      vinculaciones.filter(v => v.vinculada).map(v => v.id)
    );
    setCuentasVinculadas(cuentasVinculadasIds);
  };

  useEffect(() => {
    const actualizarEstatus = () => {
      const hoy = new Date();
      setCuentasPorCobrar((prev) =>
        prev.map((cuenta) => {
          if (cuenta.estatus === "PAGADO") return cuenta;

          const fechaPago = new Date(cuenta.fechaPago);
          const diasDiferencia = Math.floor((hoy - fechaPago) / (1000 * 60 * 60 * 24));

          let nuevoEstatus = "PENDIENTE";
          if (diasDiferencia > 15) {
            nuevoEstatus = "VENCIDA";
          }

          return { ...cuenta, estatus: nuevoEstatus };
        })
      );
    };

    actualizarEstatus();
    const interval = setInterval(actualizarEstatus, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (modalType, data = {}) => {
    if (modalType === "crearSolicitud" && data.cuenta) {
      // Busca la cotización asociada a la cuenta por cobrar
      const cotizacionAsociada = cotizaciones.find(
        (c) => c.id === data.cuenta.cotizacionId
      );
      setModals((prev) => ({
        ...prev,
        [modalType]: {
          isOpen: true,
          cotizacion: cotizacionAsociada || null,
          cuenta: data.cuenta,
        },
      }));
    } else {
      setModals((prev) => ({
        ...prev,
        [modalType]: { isOpen: true, ...data },
      }));
    }
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
        navigate("/admin_balance");
        break;
      case "transacciones":
        navigate("/admin_transacciones");
        break;
      case "cotizaciones":
        navigate("/admin_cotizaciones");
        break;
      case "facturacion":
        navigate("/admin_facturacion");
        break;
      case "cuentas-cobrar":
        navigate("/admin_cuentas_cobrar");
        break;
      case "cuentas-pagar":
        navigate("/admin_cuentas_pagar");
        break;
      case "caja-chica":
        navigate("/admin_caja_chica");
        break;
      default:
        break;
    }
  };


  const handleMarcarPagada = async (updatedCuenta) => {
    setCuentasPorCobrar((prev) =>
      prev.map((c) => (c.id === updatedCuenta.id ? { ...c, ...updatedCuenta } : c))
    );

    const solicitudVinculada = solicitudes.find(
      (s) => s.cuentaPorCobrar?.id === updatedCuenta.id
    );
    if (solicitudVinculada) {
      try {
        const cotizacionVinculada = cotizaciones.find(
          (c) => c.id === solicitudVinculada.cotizacion?.id
        );
        const transaccionData = {
          fecha: new Date().toISOString().split("T")[0],
          tipo: "INGRESO",
          categoria: { id: 1 },
          cuenta: { id: updatedCuenta.clienteId },
          monto: updatedCuenta.cantidadCobrar,
          esquema: "UNICA",
          fechaPago: updatedCuenta.fechaRealPago || new Date().toISOString().split("T")[0],
          formaPago: solicitudVinculada.formaPago,
          notas: "Transacción generada automáticamente desde Cuentas por Cobrar",
        };

        await fetchWithToken(`${API_BASE_URL}/transacciones/crear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaccionData),
        });

        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Cuenta marcada como pagada y transacción generada automáticamente",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "La cuenta fue marcada como pagada, pero no se pudo generar la transacción: " + error.message,
        });
      }
    } else {
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Cuenta marcada como pagada y transacción generada automáticamente",
      });
    }
  };

  const handleDeleteCuenta = async (cuenta) => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar/${cuenta.id}/check-vinculada`);
      if (data.vinculada) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se puede eliminar la cuenta por cobrar porque está vinculada a una solicitud de factura o nota.",
        });
        return;
      }
      openModal("confirmarEliminacion", { cuenta });
    } catch (error) {
      console.error("Error verifying vinculation:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo verificar la vinculación de la cuenta por cobrar.",
      });
    }
  };

  const handleConfirmDelete = (cuentaId) => {
    setCuentasPorCobrar((prev) => prev.filter((cuenta) => cuenta.id !== cuentaId));
    closeModal("confirmarEliminacion");
  };

  const handleCheckMarcarCompletada = async (cuenta) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-cobrar/${cuenta.id}/check-vinculada`);
      if (!response.vinculada) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "La cuenta por cobrar no está vinculada a una solicitud de factura. No se puede marcar como completada.",
        });
        return;
      }
      openModal("comprobante", { cuenta });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo verificar la vinculación: " + error.message,
      });
    }
  };

  const handleDescargarComprobante = async (cuenta) => {
    if (!cuenta.id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró el ID de la cuenta por cobrar.",
      });
      return;
    }

    if (!cuenta.comprobantePagoUrl) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró un comprobante de pago asociado a esta cuenta.",
      });
      return;
    }

    try {
      const response = await fetchFileWithToken(`${API_BASE_URL}/cuentas-por-cobrar/${cuenta.id}/download-comprobante`, {
        method: "GET",
      });

      if (!response.ok) throw new Error(`Error al descargar el archivo: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cuenta.comprobantePagoUrl.split("/").pop() || "comprobante_pago.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Descarga Completada",
        text: "El comprobante de pago se ha descargado correctamente.",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo descargar el comprobante: ${error.message}`,
      });
    }
  };

  const getEstatusClass = (estatus) => {
    switch (estatus) {
      case "PAGADO":
        return "cuentascobrar-estatus-pagado";
      case "VENCIDA":
        return "cuentascobrar-estatus-vencida";
      case "PENDIENTE":
      default:
        return "cuentascobrar-estatus-pendiente";
    }
  };

  const cuentasFiltradas = cuentasPorCobrar.filter((cuenta) => {
    if (filtroEstatus === "Todas") return true;
    return cuenta.estatus === filtroEstatus;
  });

  const cuentasOrdenadas = cuentasFiltradas.sort((a, b) => {
    const fechaA = new Date(a.fechaPago);
    const fechaB = new Date(b.fechaPago);
    return fechaA - fechaB;
  });

  return (
    <>
      <Header />
      {isLoading && (
        <div className="cuentascobrar-loading">
          <div className="spinner"></div>
          <p>Cargando datos de cuentas por cobrar...</p>
        </div>
      )}
      <main className="cuentascobrar-main-content">
        <div className="cuentascobrar-container">
          <section className="cuentascobrar-sidebar">
            <div className="cuentascobrar-sidebar-header">
              <h3 className="cuentascobrar-sidebar-title">Administración</h3>
            </div>
            <div className="cuentascobrar-sidebar-menu">
              <div className="cuentascobrar-menu-item" onClick={() => handleMenuNavigation("balance")}>
                Balance
              </div>
              <div className="cuentascobrar-menu-item" onClick={() => handleMenuNavigation("transacciones")}>
                Transacciones
              </div>
              <div className="cuentascobrar-menu-item" onClick={() => handleMenuNavigation("cotizaciones")}>
                Cotizaciones
              </div>
              <div className="cuentascobrar-menu-item" onClick={() => handleMenuNavigation("facturacion")}>
                Facturas/Notas
              </div>
              <div
                className="cuentascobrar-menu-item cuentascobrar-menu-item-active"
                onClick={() => handleMenuNavigation("cuentas-cobrar")}
              >
                Cuentas por Cobrar
              </div>
              <div className="cuentascobrar-menu-item" onClick={() => handleMenuNavigation("cuentas-pagar")}>
                Cuentas por Pagar
              </div>
              <div className="cuentascobrar-menu-item" onClick={() => handleMenuNavigation("caja-chica")}>
                Caja chica
              </div>
            </div>
          </section>

          <section className="cuentascobrar-content-panel">
            <div className="cuentascobrar-header">
              <div className="cuentascobrar-header-info">
                <h3 className="cuentascobrar-page-title">Cuentas por Cobrar</h3>
                <p className="cuentascobrar-subtitle">Gestión de cobros pendientes</p>
              </div>
            </div>

            <div className="cuentascobrar-table-card">
              <div className="cuentascobrar-table-header">
                <h4 className="cuentascobrar-table-title">Cuentas por cobrar</h4>
                <div className="cuentascobrar-filter-container">
                  <label htmlFor="filtroEstatus">Filtrar por estatus:</label>
                  <select
                    id="filtroEstatus"
                    value={filtroEstatus}
                    onChange={(e) => setFiltroEstatus(e.target.value)}
                    className="cuentascobrar-filter-select"
                  >
                    <option value="Todas">Todas</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="VENCIDA">Vencida</option>
                    <option value="PAGADO">Pagado</option>
                  </select>
                </div>
              </div>

              <div className="cuentascobrar-table-container">
                <table className="cuentascobrar-table">
                  <thead className="cuentascobrar-table-header-fixed">
                    <tr>
                      <th>Folio</th>
                      <th>Fecha de Pago</th>
                      <th>Cliente</th>
                      <th>Estatus</th>
                      <th>Esquema</th>
                      <th>Monto a Cobrar</th>
                      <th>Concepto/s</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuentasOrdenadas.length > 0 ? (
                      cuentasOrdenadas.map((cuenta) => (
                        <tr key={cuenta.id}>
                          <td>{cuenta.folio}</td>
                          <td>{cuenta.fechaPago}</td>
                          <td>{cuenta.clienteNombre || cuenta.cliente}</td>
                          <td>
                            <span className={`cuentascobrar-estatus-badge ${getEstatusClass(cuenta.estatus)}`}>
                              {cuenta.estatus}
                            </span>
                          </td>
                          <td>{cuenta.esquema}</td>
                          <td>${cuenta.cantidadCobrar}</td>
                          <td className="cuentascobrar-concepto-cell">
                            {cuenta.conceptos.length > 1
                              ? `${cuenta.conceptos.length} conceptos`
                              : cuenta.conceptos[0]?.substring(0, 50) + "..."}
                          </td>
                          <td>
                            <div className="cuentascobrar-actions">
                              <button
                                className="cuentascobrar-action-btn cuentascobrar-delete-btn"
                                onClick={() => handleDeleteCuenta(cuenta)}
                                title="Eliminar"
                              >
                                <img
                                  src={deleteIcon || "/placeholder.svg"}
                                  alt="Eliminar"
                                  className="cuentascobrar-action-icon"
                                />
                              </button>
                              {cuenta.estatus !== "PAGADO" && (
                                <button
                                  className="cuentascobrar-action-btn cuentascobrar-edit-btn"
                                  onClick={() => openModal("editarCuenta", { cuenta })}
                                  title="Editar cuenta"
                                >
                                  <img
                                    src={editIcon}
                                    alt="Editar"
                                    className="cuentascobrar-action-icon"
                                  />
                                </button>
                              )}
                              {cuenta.estatus !== "PAGADO" && (
                                <button
                                  className="cuentascobrar-action-btn cuentascobrar-check-btn"
                                  onClick={() => handleCheckMarcarCompletada(cuenta)}
                                  title="Marcar como completado"
                                >
                                  <img
                                    src={checkIcon || "/placeholder.svg"}
                                    alt="Completar"
                                    className="cuentascobrar-action-icon"
                                  />
                                </button>
                              )}
                              {cuenta.estatus === "PAGADO" && cuenta.comprobantePagoUrl && (
                                <button
                                  className="cuentascobrar-action-btn cuentascobrar-download-btn"
                                  onClick={() => handleDescargarComprobante(cuenta)}
                                  title="Descargar comprobante de pago"
                                >
                                  <img
                                    src={downloadIcon || "/placeholder.svg"}
                                    alt="Descargar"
                                    className="cuentascobrar-action-icon"
                                  />
                                </button>
                              )}
                              <button
                                className={`cuentascobrar-action-btn cuentascobrar-download-btn ${cuentasVinculadas.has(cuenta.id)
                                  ? 'cuentascobrar-request-btn-vinculada'
                                  : 'cuentascobrar-request-btn-disponible'
                                  }`}
                                onClick={async () => {
                                  if (cuentasVinculadas.has(cuenta.id)) {
                                    Swal.fire({
                                      icon: "warning",
                                      title: "Alerta",
                                      text: "Ya se generó su solicitud de factura/nota",
                                    });
                                  } else {
                                    openModal("crearSolicitud", { cuenta: cuenta });
                                  }
                                }}
                                title={
                                  cuentasVinculadas.has(cuenta.id)
                                    ? "Solicitud ya generada"
                                    : "Generar Solicitud de Factura o Nota"
                                }
                              >
                                <img
                                  src={requestIcon || "/placeholder.svg"}
                                  alt="Emitir"
                                  className="cuentascobrar-action-icon"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="cuentascobrar-no-data">
                          {filtroEstatus === "Todas"
                            ? "No hay cuentas por cobrar registradas"
                            : `No hay cuentas por cobrar con estatus "${filtroEstatus}"`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <SolicitudModal
          isOpen={modals.crearSolicitud.isOpen}
          onClose={() => closeModal("crearSolicitud")}
          onSave={(savedSolicitud) => {
            setSolicitudes((prev) => [...prev, savedSolicitud]);
            const cuentaId = modals.crearSolicitud.cuenta?.id;
            if (cuentaId) {
              setCuentasVinculadas(prev => new Set([...prev, cuentaId]));
            }
            Swal.fire({
              icon: "success",
              title: "Éxito",
              text: "Solicitud creada correctamente",
            });
            closeModal("crearSolicitud");
          }}
          cotizaciones={cotizaciones}
          cuentasPorCobrar={cuentasPorCobrar}
          emisores={emisores}
          preloadedCotizacion={modals.crearSolicitud.cotizacion}
          preloadedCuenta={modals.crearSolicitud.cuenta}
        />

        <ComprobanteModal
          isOpen={modals.comprobante.isOpen}
          onClose={() => closeModal("comprobante")}
          onSave={handleMarcarPagada}
          cuenta={modals.comprobante.cuenta}
        />

        <EditarCuentaModal
          isOpen={modals.editarCuenta.isOpen}
          onClose={() => closeModal("editarCuenta")}
          onSave={(updatedCuenta) => {
            setCuentasPorCobrar(prev =>
              prev.map(c => c.id === updatedCuenta.id ? updatedCuenta : c)
            );
            closeModal("editarCuenta");
          }}
          cuenta={modals.editarCuenta.cuenta}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmarEliminacion.isOpen}
          onClose={() => closeModal("confirmarEliminacion")}
          onConfirm={handleConfirmDelete}
          cuenta={modals.confirmarEliminacion.cuenta}
        />
      </main>
    </>
  );
};

export default AdminCuentasCobrar