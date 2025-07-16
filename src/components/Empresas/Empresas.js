import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Empresas.css"
import Header from "../Header/Header"
import editIcon from "../../assets/icons/editar.png"
import deleteIcon from "../../assets/icons/eliminar.png"
import detailsIcon from "../../assets/icons/lupa.png"
import { API_BASE_URL } from "../Config/Config"
import Swal from "sweetalert2"
import stringSimilarity from "string-similarity";

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
    <div className="modal-overlay" onClick={canClose ? onClose : () => { }}>
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

// Modal de Empresa (Agregar/Editar)
const EmpresaModal = ({ isOpen, onClose, onSave, empresa, mode, onCompanyCreated, users, hasTratos, existingCompanies }) => {
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

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

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
  }

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
  ]

  const sectores = Object.entries(sectorMap).map(([value, label]) => ({ value, label }))

  const estatusOptions = [
    { value: "POR_CONTACTAR", label: "Por Contactar" },
    { value: "EN_PROCESO", label: "En Proceso" },
    { value: "CONTACTAR_MAS_ADELANTE", label: "Contactar Más Adelante" },
    { value: "PERDIDO", label: "Perdido" },
    { value: "CLIENTE", label: "Cliente" },
  ]

  useEffect(() => {
    if (empresa && mode === "edit") {
      setFormData({
        nombre: empresa.nombre || "",
        estatus: empresa.estatus || "POR_CONTACTAR",
        sitioWeb: empresa.sitioWeb || "",
        sector: empresa.sector || "",
        domicilioFisico: empresa.domicilioFisico || "",
        domicilioFiscal: empresa.domicilioFiscal || "",
        rfc: empresa.rfc || "",
        razonSocial: empresa.razonSocial || "",
        regimenFiscal: empresa.regimenFiscal || "",
        propietarioId: empresa.propietario?.id || null,
      });
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
    }
    setErrors({});
  }, [empresa, mode, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "Este campo es obligatorio";
    } else if (mode === "add") {
      const similarityThreshold = 0.60;
      const existingNames = existingCompanies
        ? existingCompanies.map((c) => c.nombre?.toLowerCase() || "")
        : [];
      const newName = formData.nombre.toLowerCase();


      if (existingNames.length > 0) {
        const similarities = existingNames.map((name) =>
          stringSimilarity.compareTwoStrings(newName, name)
        );
        const maxSimilarity = Math.max(...similarities, 0);


        if (maxSimilarity >= similarityThreshold) {
          newErrors.nombre = "Esta empresa parece ser un duplicado. Verifica el nombre.";
        }
      }
    }

    // Validación Sitio Web: URL válida si se proporciona
    if (formData.sitioWeb) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlRegex.test(formData.sitioWeb)) {
        newErrors.sitioWeb = "Este campo debe ser una URL válida (ej. https://ejemplo.com)";
      }
    }

    // Validación Domicilio Físico: No vacío y caracteres válidos
    if (!formData.domicilioFisico.trim()) {
      newErrors.domicilioFisico = "Este campo es obligatorio";
    } else if (!/^[A-Za-z0-9\s,.\-ÁÉÍÓÚáéíóúÑñ]+$/.test(formData.domicilioFisico.trim())) {
      newErrors.domicilioFisico = "Este campo contiene caracteres no permitidos";
    }

    // Validaciones para estatus CLIENTE
    if (formData.estatus === "CLIENTE") {
      // Domicilio Fiscal
      if (!formData.domicilioFiscal?.trim()) {
        newErrors.domicilioFiscal = "Este campo es obligatorio para estatus Cliente";
      } else if (!/^[A-Za-z0-9\s,.\-ÁÉÍÓÚáéíóúÑñ]+$/.test(formData.domicilioFiscal.trim())) {
        newErrors.domicilioFisico = "Este campo contiene caracteres no permitidos";
      }

      // RFC: Solo letras mayúsculas, números y &
      if (!formData.rfc?.trim()) {
        newErrors.rfc = "Este campo es obligatorio para estatus Cliente";
      } else if (!/^[A-Z0-9&]+$/.test(formData.rfc.trim())) {
        newErrors.rfc = "Este campo solo debe contener letras mayúsculas, números y &";
      } else if (formData.rfc.trim().length > 13) {
        newErrors.rfc = "El RFC no puede tener más de 13 caracteres";
      }

      // Razón Social: Solo letras (mayúsculas, minúsculas, Ñ/ñ, acentos)
      if (!formData.razonSocial?.trim()) {
        newErrors.razonSocial = "Este campo es obligatorio para estatus Cliente";
      } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.razonSocial.trim())) {
        newErrors.razonSocial = "Este campo solo debe contener letras";
      }

      // Régimen Fiscal: Debe estar seleccionado
      if (!formData.regimenFiscal) {
        newErrors.regimenFiscal = "Este campo es obligatorio para estatus Cliente";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (mode === "edit") {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Los cambios se guardarán.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) {
        return;
      }
    }
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
      ...(mode === "edit" && { propietarioId: formData.propietarioId || null }),
    };

    setIsLoading(true)
    try {
      let response;
      if (mode === "add") {
        response = await fetchWithToken(`${API_BASE_URL}/empresas`, {
          method: "POST",
          body: JSON.stringify(empresaData),
        });
      } else {
        response = await fetchWithToken(`${API_BASE_URL}/empresas/${empresa.id}`, {
          method: "PUT",
          body: JSON.stringify(empresaData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar la empresa");
      }

      const savedEmpresa = await response.json();
      onSave(savedEmpresa);

      if (mode === "add") {
        onCompanyCreated(savedEmpresa);
      }
      setIsLoading(false)
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
      setIsLoading(false)
    }
  };


  const isCliente = formData.estatus === "CLIENTE"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "add" ? "Nueva Empresa" : "Editar Empresa"} size="lg">
      <form onSubmit={handleSubmit} className="modal-form">
        {mode === "edit" && (
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
        )}

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

          <div className="modal-form-row">
            <div className="modal-form-group">
              <label htmlFor="estatus">
                Estatus <span className="required">*</span>
              </label>
              <select
                id="estatus"
                value={formData.estatus}
                onChange={(e) => handleInputChange("estatus", e.target.value)}
                className="modal-form-control"
                disabled={mode === "edit" && hasTratos}
              >
                {estatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {mode === "edit" && hasTratos && (
                <small className="help-text">El estatus no puede editarse porque la empresa tiene tratos asociados.</small>
              )}
            </div>
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
              Por favor, usa el formato: Calle y Número, Colonia, Código Postal, Ciudad, Estado, País. Evita detalles como "Local
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
                  maxLength={13}
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
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {mode === "add" ? "Creando..." : "Guardando..."}
              </>
            ) : (
              mode === "add" ? "Crear Empresa" : "Guardar"
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Modal de Contacto (Agregar/Editar)
const ContactoModal = ({
  isOpen,
  onClose,
  onSave,
  contacto,
  empresaId,
  empresaNombre,
  mode,
  isInitialContact,
  users,
}) => {
  const [formData, setFormData] = useState({
    nombre: "",
    correos: [""],
    telefonos: [""],
    celular: "",
    rol: "RECEPCION",
  });

  const [errors, setErrors] = useState({});

  const rolesOptions = [
    "RECEPCION",
    "VENTAS",
    "MARKETING",
    "FINANZAS",
    "ASISTENTE",
    "SECRETARIO",
    "GERENTE",
    "DIRECTOR",
  ];

  useEffect(() => {
    if (contacto && mode === "edit") {
      const correos = contacto.correos?.length > 0 ? contacto.correos.map((item) => item.correo || "") : [""];
      const telefonos = contacto.telefonos?.length > 0 ? contacto.telefonos.map((item) => item.telefono || "") : [""];

      setFormData({
        nombre: contacto.nombre || "",
        correos,
        telefonos,
        celular: contacto.celular || "",
        rol: contacto.rol || "RECEPCION",
      });
    } else {
      setFormData({
        nombre: "",
        correos: [""],
        telefonos: [""],
        celular: "",
        rol: "RECEPCION",
      });
    }
    setErrors({});
  }, [contacto, mode, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
    if (errors[field]?.[index]) {
      setErrors((prev) => ({
        ...prev,
        [field]: prev[field].map((err, i) => (i === index ? "" : err)),
      }));
    }
  };

  const addArrayItem = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 1) {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
      setErrors((prev) => ({
        ...prev,
        [field]: (prev[field] || []).filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validación Nombre: Solo letras (incluye Ñ/ñ y acentos), opcional
    if (formData.nombre && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.nombre.trim())) {
      newErrors.nombre = "Este campo solo debe contener letras";
    }

    // Validación Correos
    newErrors.correos = formData.correos.map((correo) => {
      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return "Este campo debe ser un correo válido (ej. usuario@dominio.com)";
      }
      return "";
    });

    // Validación Teléfonos: 10 dígitos
    newErrors.telefonos = formData.telefonos.map((telefono) => {
      if (telefono) {
        if (!/^\d{10}$/.test(telefono)) {
          if (/[a-zA-Z]/.test(telefono)) {
            return "El número no puede contener letras.";
          }
          return "Este campo debe tener exactamente 10 dígitos.";
        }
      }
      return "";
    });

    // Validación Celular: 10 dígitos si se proporciona
    if (formData.celular) {
      if (!/^\d{10}$/.test(formData.celular)) {
        if (/[a-zA-Z]/.test(formData.celular)) {
          newErrors.celular = "El número no puede contener letras.";
        } else {
          newErrors.celular = "Este campo debe tener exactamente 10 dígitos.";
        }
      }
    }

    // Validación Rol
    if (!formData.rol) {
      newErrors.rol = "Este campo es obligatorio";
    }

    setErrors(newErrors);
    return !Object.values(newErrors)
      .flat()
      .some((error) => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Solo mostrar alerta de confirmación si estamos en modo "edit"
    if (mode === "edit") {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Los cambios se guardarán.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    let nombreFinal = formData.nombre.trim();
    if (!nombreFinal) {
      nombreFinal = `Contacto de ${formData.rol}`;
    }

    const username = localStorage.getItem("username") || "unknown";

    const contactoData = {
      nombre: nombreFinal,
      correos: formData.correos.filter((email) => email.trim()).map((email) => ({ correo: email })),
      telefonos: formData.telefonos.filter((tel) => tel.trim()).map((tel) => ({ telefono: tel })),
      celular: formData.celular || null,
      rol: formData.rol,
      modificadoPor: username,
    };

    try {
      let response;
      if (mode === "add") {
        response = await fetchWithToken(`${API_BASE_URL}/empresas/${empresaId}/contactos`, {
          method: "POST",
          body: JSON.stringify(contactoData),
        });
      } else {
        response = await fetchWithToken(`${API_BASE_URL}/empresas/contactos/${contacto.id}`, {
          method: "PUT",
          body: JSON.stringify(contactoData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar el contacto");
      }

      const savedContacto = await response.json();
      onSave(savedContacto);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isInitialContact
          ? "Agregar Contacto Inicial (Obligatorio)"
          : mode === "add"
            ? "Nuevo Contacto"
            : "Editar Contacto"
      }
      size="md"
      canClose={!isInitialContact}
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-form-row">
          <div className="modal-form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              className={`modal-form-control ${errors.nombre ? "error" : ""}`}
              placeholder="Nombre del contacto"
            />
            <small className="help-text">
              Si se deja vacío, se generará automáticamente como "Contacto de {formData.rol}"
            </small>
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>
        </div>

        {empresaNombre && (
          <div className="modal-form-row">
            <div className="modal-form-group">
              <label>Empresa</label>
              <input type="text" value={empresaNombre} className="modal-form-control readonly" readOnly />
            </div>
          </div>
        )}

        <div className="modal-form-group">
          <label>Correo/s</label>
          {formData.correos.map((correo, index) => (
            <div key={index} className="array-input-group">
              <input
                type="email"
                value={correo}
                onChange={(e) => handleArrayChange("correos", index, e.target.value)}
                className={`modal-form-control ${errors.correos?.[index] ? "error" : ""}`}
                placeholder="correo@ejemplo.com"
              />
              <div className="array-actions">
                <button
                  type="button"
                  onClick={() => addArrayItem("correos")}
                  className="btn-array-action add"
                  title="Agregar correo"
                >
                  +
                </button>
                {formData.correos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem("correos", index)}
                    className="btn-array-action remove"
                    title="Eliminar correo"
                  >
                    ✕
                  </button>
                )}
              </div>
              {errors.correos?.[index] && <span className="error-message">{errors.correos[index]}</span>}
            </div>
          ))}
        </div>

        <div className="modal-form-group">
          <label>Teléfono/s</label>
          {formData.telefonos.map((telefono, index) => (
            <div key={index} className="array-input-group">
              <input
                type="tel"
                value={telefono}
                onChange={(e) => handleArrayChange("telefonos", index, e.target.value)}
                className={`modal-form-control ${errors.telefonos?.[index] ? "error" : ""}`}
                placeholder="4771234567"
                maxLength="10"
              />
              <div className="array-actions">
                <button
                  type="button"
                  onClick={() => addArrayItem("telefonos")}
                  className="btn-array-action add"
                  title="Agregar teléfono"
                >
                  +
                </button>
                {formData.telefonos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem("telefonos", index)}
                    className="btn-array-action remove"
                    title="Eliminar teléfono"
                  >
                    ✕
                  </button>
                )}
              </div>
              {errors.telefonos?.[index] && <span className="error-message">{errors.telefonos[index]}</span>}
            </div>
          ))}
        </div>

        <div className="modal-form-row">
          <div className="modal-form-group">
            <label htmlFor="celular">Celular</label>
            <input
              type="tel"
              id="celular"
              value={formData.celular}
              onChange={(e) => handleInputChange("celular", e.target.value)}
              className={`modal-form-control ${errors.celular ? "error" : ""}`}
              placeholder="4771234567"
              maxLength="10"
            />
            {errors.celular && <span className="error-message">{errors.celular}</span>}
          </div>

          <div className="modal-form-group">
            <label htmlFor="rol">
              Rol <span className="required">*</span>
            </label>
            <select
              id="rol"
              value={formData.rol}
              onChange={(e) => handleInputChange("rol", e.target.value)}
              className={`modal-form-control ${errors.rol ? "error" : ""}`}
            >
              {rolesOptions.map((rol) => (
                <option key={rol} value={rol}>
                  {rol.charAt(0) + rol.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {errors.rol && <span className="error-message">{errors.rol}</span>}
          </div>
        </div>

        <div className="modal-form-actions">
          {isInitialContact ? (
            <button type="submit" className="btn btn-primary">
              Agregar Contacto
            </button>
          ) : (
            <>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {mode === "add" ? "Agregar" : "Guardar"}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

// Modal de Detalles de Empresa
const DetallesEmpresaModal = ({ isOpen, onClose, empresa }) => {
  if (!empresa) return null

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    })
  }

  const statusMap = {
    POR_CONTACTAR: "Por Contactar",
    EN_PROCESO: "En Proceso",
    CONTACTAR_MAS_ADELANTE: "Contactar Más Adelante",
    PERDIDO: "Perdido",
    CLIENTE: "Cliente",
  }

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
  }

  const getStatusText = (status) => statusMap[status] || status
  const getSectorText = (sector) => sectorMap[sector] || sector || "N/A"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles Empresa" size="lg">
      <div className="detalles-content">
        <div className="detalles-grid">
          <div className="detalle-item">
            <label>Propietario:</label>
            <span>{empresa.propietario?.nombreUsuario || "N/A"}</span>
          </div>
          <div className="detalle-item">
            <label>Nombre:</label>
            <span>{empresa.nombre || "N/A"}</span>
          </div>
          <div className="detalle-item">
            <label>Estatus:</label>
            <div className="status-display">
              <span className="status-indicator" style={{ backgroundColor: empresa.statusColor || "#87CEEB" }}></span>
              {getStatusText(empresa.estatus)}
            </div>
          </div>
          <div className="detalle-item">
            <label>Sitio Web:</label>
            <span>
              {empresa.sitioWeb ? (
                <a href={empresa.sitioWeb} target="_blank" rel="noopener noreferrer">
                  {empresa.sitioWeb}
                </a>
              ) : (
                "N/A"
              )}
            </span>
          </div>
          <div className="detalle-item">
            <label>Sector:</label>
            <span>{getSectorText(empresa.sector)}</span>
          </div>
          <div className="detalle-item full-width">
            <label>Domicilio Físico:</label>
            <span>{empresa.domicilioFisico || "N/A"}</span>
          </div>
          {empresa.domicilioFiscal && (
            <div className="detalle-item full-width">
              <label>Domicilio Fiscal:</label>
              <span>{empresa.domicilioFiscal}</span>
            </div>
          )}
          {empresa.rfc && (
            <div className="detalle-item">
              <label>RFC:</label>
              <span>{empresa.rfc}</span>
            </div>
          )}
          {empresa.razonSocial && (
            <div className="detalle-item">
              <label>Razón Social:</label>
              <span>{empresa.razonSocial}</span>
            </div>
          )}
          {empresa.regimenFiscal && (
            <div className="detalle-item">
              <label>Régimen Fiscal:</label>
              <span>{empresa.regimenFiscal}</span>
            </div>
          )}
        </div>
        <div className="auditoria-section">
          <h3>Información de Auditoría</h3>
          <div className="detalles-grid">
            <div className="detalle-item">
              <label>Fecha Creación:</label>
              <span>{formatDate(empresa.fechaCreacion)}</span>
            </div>
            <div className="detalle-item">
              <label>Fecha Modificación:</label>
              <span>{formatDate(empresa.fechaModificacion)}</span>
            </div>
            <div className="detalle-item">
              <label>Última Actividad:</label>
              <span>{formatDate(empresa.fechaUltimaActividad)}</span>
            </div>
          </div>
        </div>
        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Modal de Detalles de Contacto
const DetallesContactoModal = ({ isOpen, onClose, contacto }) => {
  if (!contacto) return null

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    })
  }

  const correos = contacto.correos?.map((item) => item.correo) || []
  const telefonos = contacto.telefonos?.map((item) => item.telefono) || []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles Contacto" size="md">
      <div className="detalles-content">
        <div className="detalles-grid">
          <div className="detalle-item">
            <label>Propietario:</label>
            <span>{contacto.propietario?.nombreUsuario || "N/A"}</span>
          </div>
          <div className="detalle-item">
            <label>Nombre:</label>
            <span>{contacto.nombre || "N/A"}</span>
          </div>
          <div className="detalle-item full-width">
            <label>Correo/s:</label>
            <div className="multiple-values">
              {correos.length > 0 ? (
                correos.map((correo, index) => (
                  <span key={index} className="value-item">
                    <a href={`mailto:${correo}`}>{correo}</a>
                  </span>
                ))
              ) : (
                <span>N/A</span>
              )}
            </div>
          </div>
          <div className="detalle-item full-width">
            <label>Teléfono/s:</label>
            <div className="multiple-values">
              {telefonos.length > 0 ? (
                telefonos.map((telefono, index) => (
                  <span key={index} className="value-item">
                    <a href={`tel:${telefono}`}>{telefono}</a>
                  </span>
                ))
              ) : (
                <span>N/A</span>
              )}
            </div>
          </div>
          {contacto.celular && (
            <div className="detalle-item">
              <label>Celular:</label>
              <span>
                <a href={`tel:${contacto.celular}`}>{contacto.celular}</a>
              </span>
            </div>
          )}
          <div className="detalle-item">
            <label>Rol:</label>
            <span>{contacto.rol ? contacto.rol.charAt(0) + contacto.rol.slice(1).toLowerCase() : "N/A"}</span>
          </div>
        </div>
        <div className="auditoria-section">
          <h3>Información de Auditoría</h3>
          <div className="detalles-grid">
            <div className="detalle-item">
              <label>Fecha Creación:</label>
              <span>{formatDate(contacto.fechaCreacion)}</span>
            </div>
            <div className="detalle-item">
              <label>Fecha Modificación:</label>
              <span>{formatDate(contacto.fechaModificacion)}</span>
            </div>
            <div className="detalle-item">
              <label>Última Actividad:</label>
              <span>{formatDate(contacto.fechaUltimaActividad)}</span>
            </div>
          </div>
        </div>
        <div className="modal-form-actions">
          <button type="button" onClick={onClose} className="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Modal de Confirmación de Eliminación 
const ConfirmarEliminacionModal = ({ isOpen, onClose, onConfirm, contacto, isLastContact = false }) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación" size="sm">
      <div className="confirmar-eliminacion">
        {isLastContact ? (
          <div className="warning-content">
            <p className="warning-message">
              No se puede eliminar el último contacto de la empresa. Debe haber al menos un contacto asociado.
            </p>
            <div className="modal-form-actions">
              <button type="button" onClick={onClose} className="btn btn-primary">
                Entendido
              </button>
            </div>
          </div>
        ) : (
          <div className="confirmation-content">
            <p className="confirmation-message">¿Seguro que quieres eliminar el contacto de forma permanente?</p>
            <div className="modal-form-actions">
              <button type="button" onClick={onClose} className="btn btn-cancel">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirm} className="btn btn-confirm">
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Componente Principal
const Empresas = () => {
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [contactSearch, setContactSearch] = useState("")
  const [contactRole, setContactRole] = useState("")
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const navigate = useNavigate()

  const [modals, setModals] = useState({
    empresa: { isOpen: false, mode: "add", data: null },
    contacto: { isOpen: false, mode: "add", data: null, isInitialContact: false },
    detallesEmpresa: { isOpen: false, data: null },
    detallesContacto: { isOpen: false, data: null },
    confirmarEliminacion: { isOpen: false, data: null, isLastContact: false },
  })

  const [tratos, setTratos] = useState([]);

  useEffect(() => {
    const fetchTratos = async () => {
      if (!selectedCompany?.id) return;

      try {
        const response = await fetchWithToken(
          `${API_BASE_URL}/tratos/filtrar?empresaId=${selectedCompany.id}`
        );
        if (!response.ok) throw new Error("Error al cargar los tratos");
        const data = await response.json();
        setTratos(data);
      } catch (error) {
        console.error("Error al cargar tratos:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      }
    };

    fetchTratos();
  }, [selectedCompany?.id]);

  const statusMap = {
    POR_CONTACTAR: "Por Contactar",
    EN_PROCESO: "En Proceso",
    CONTACTAR_MAS_ADELANTE: "Contactar Más Adelante",
    PERDIDO: "Perdido",
    CLIENTE: "Cliente",
  }

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
  }

  const estatusOptions = [
    { value: "POR_CONTACTAR", label: "Por Contactar" },
    { value: "EN_PROCESO", label: "En Proceso" },
    { value: "CONTACTAR_MAS_ADELANTE", label: "Contactar Más Adelante" },
    { value: "PERDIDO", label: "Perdido" },
    { value: "CLIENTE", label: "Cliente" },
  ]

  const rolesOptions = [
    "RECEPCION",
    "VENTAS",
    "MARKETING",
    "FINANZAS",
    "ASISTENTE",
    "SECRETARIO",
    "GERENTE",
    "DIRECTOR",
  ]

  const getStatusText = (status) => statusMap[status] || status
  const getSectorText = (sector) => sectorMap[sector] || sector || "N/A"

  // Obtener la lista de usuarios al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetchWithToken(`${API_BASE_URL}/auth/users`)
        if (!response.ok) throw new Error("Error al cargar los usuarios")
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("Error al cargar usuarios:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        })
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("nombre", searchTerm);
        if (filterStatus) params.append("estatus", filterStatus);

        const response = await fetchWithToken(`${API_BASE_URL}/empresas?${params.toString()}`);
        if (!response.ok) throw new Error("Error al cargar las empresas");
        const data = await response.json();

        const companiesWithColors = data.map((company) => ({
          ...company,
          statusColor: getStatusColor(company.estatus),
          domicilioFisico: company.domicilioFisico.endsWith(", México")
            ? company.domicilioFisico
            : `${company.domicilioFisico}, México`,
        }));
        setCompanies(companiesWithColors);

        if (companiesWithColors.length > 0 && !selectedCompany) {
          setSelectedCompany(companiesWithColors[0]);
        }
      } catch (error) {
        console.error("Error al cargar empresas:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      }
    };

    fetchCompanies();
  }, [searchTerm, filterStatus, selectedCompany]);


  useEffect(() => {
    const fetchContacts = async () => {
      if (!selectedCompany?.id) return

      try {
        const response = await fetchWithToken(`${API_BASE_URL}/empresas/${selectedCompany.id}/contactos`)
        if (!response.ok) throw new Error("Error al cargar los contactos")
        const contacts = await response.json()

        const normalizedContacts = contacts.map((contact) => ({
          ...contact,
          correos: contact.correos || [],
          telefonos: contact.telefonos || [],
        }))

        setSelectedCompany((prev) => ({
          ...prev,
          contacts: normalizedContacts,
        }))
      } catch (error) {
        console.error("Error al cargar contactos:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        })
      }
    }

    fetchContacts()
  }, [selectedCompany?.id])

  const filteredContacts = (selectedCompany?.contacts || []).filter((contact) => {
    const matchesSearch = contact.nombre?.toLowerCase().includes(contactSearch.toLowerCase())
    const matchesRole = !contactRole || contact.rol === contactRole
    return matchesSearch && matchesRole
  })

  const handleCompanySelect = (company) => {
    setSelectedCompany(company)
  }

  const openModal = (modalType, mode = "add", data = null, extra = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: true, mode, data, ...extra, existingCompanies: companies || [] },
    }));
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({
      ...prev,
      [modalType]: { isOpen: false, mode: "add", data: null, isInitialContact: false, isLastContact: false },
    }))
  }

  const handleAddCompany = () => {
    openModal("empresa", "add", null, { existingCompanies: [...companies] });
  };

  const handleEditCompany = async () => {
    if (selectedCompany) {
      try {
        const response = await fetchWithToken(`${API_BASE_URL}/empresas/${selectedCompany.id}/has-tratos`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response error:", errorText);
          throw new Error("Error checking tratos");
        }
        const hasTratos = await response.json();
        openModal("empresa", "edit", selectedCompany, { hasTratos, existingCompanies: companies });
      } catch (error) {
        console.error("Error checking tratos:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      }
    }
  };

  const handleCompanyDetails = () => {
    if (selectedCompany) {
      openModal("detallesEmpresa", "view", selectedCompany)
    }
  }

  const handleViewMap = () => {
    if (selectedCompany?.domicilioFisico) {
      navigate("/mapa", { state: { companies, selectedCompany } })
    } else {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "La empresa seleccionada no tiene un domicilio físico registrado.",
      })
    }
  }

  const handleAddContact = () => {
    if (selectedCompany) {
      openModal("contacto", "add", { empresaId: selectedCompany.id, empresaNombre: selectedCompany.nombre })
    }
  }

  const handleEditContact = (contactId) => {
    const contact = selectedCompany?.contacts?.find((c) => c.id === contactId)
    if (contact) {
      openModal("contacto", "edit", {
        ...contact,
        empresaId: selectedCompany.id,
        empresaNombre: selectedCompany.nombre,
      })
    }
  }

  const handleDeleteContact = (contactId) => {
    const contact = selectedCompany?.contacts?.find((c) => c.id === contactId)
    const isLastContact = selectedCompany?.contacts?.length === 1

    if (contact) {
      openModal("confirmarEliminacion", "delete", contact, { isLastContact })
    }
  }

  const handleContactDetails = (contactId) => {
    const contact = selectedCompany?.contacts?.find((c) => c.id === contactId)
    if (contact) {
      openModal("detallesContacto", "view", contact)
    }
  }

  const handleSaveEmpresa = async (empresaData) => {
    const formattedDomicilioFisico = empresaData.domicilioFisico.endsWith(", México")
      ? empresaData.domicilioFisico
      : `${empresaData.domicilioFisico}, México`

    const updatedEmpresa = {
      ...empresaData,
      domicilioFisico: formattedDomicilioFisico,
      statusColor: getStatusColor(empresaData.estatus),
      contacts: modals.empresa.mode === "edit" ? selectedCompany?.contacts || [] : [],
    }

    if (modals.empresa.mode === "add") {
      setCompanies((prev) => [...prev, updatedEmpresa])
      setSelectedCompany(updatedEmpresa)
      closeModal("empresa")
    } else {
      setCompanies((prev) => prev.map((company) => (company.id === empresaData.id ? updatedEmpresa : company)))
      setSelectedCompany(updatedEmpresa)
      closeModal("empresa")
    }
  }

  const handleCompanyCreated = (empresaData) => {
    const formattedDomicilioFisico = empresaData.domicilioFisico.endsWith(", México")
      ? empresaData.domicilioFisico
      : `${empresaData.domicilioFisico}, México`

    const newCompany = {
      ...empresaData,
      domicilioFisico: formattedDomicilioFisico,
      statusColor: getStatusColor(empresaData.estatus),
      contacts: [],
    }
    setCompanies((prev) => [...prev, newCompany])
    setSelectedCompany(newCompany)
    closeModal("empresa")
    openModal(
      "contacto",
      "add",
      { empresaId: newCompany.id, empresaNombre: newCompany.nombre },
      { isInitialContact: true },
    )
  }

  const handleSaveContacto = async (contactoData) => {
    const normalizedContacto = {
      ...contactoData,
      correos: contactoData.correos || [],
      telefonos: contactoData.telefonos || [],
    }

    if (modals.contacto.mode === "add") {
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === selectedCompany.id
            ? {
              ...company,
              contacts: [...(company.contacts || []), normalizedContacto],
              fechaUltimaActividad: new Date().toISOString(),
            }
            : company,
        ),
      )
      setSelectedCompany((prev) => ({
        ...prev,
        contacts: [...(prev.contacts || []), normalizedContacto],
        fechaUltimaActividad: new Date().toISOString(),
      }))
    } else {
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === selectedCompany.id
            ? {
              ...company,
              contacts: (company.contacts || []).map((contact) =>
                contact.id === normalizedContacto.id ? normalizedContacto : contact,
              ),
              fechaUltimaActividad: new Date().toISOString(),
            }
            : company,
        ),
      )
      setSelectedCompany((prev) => ({
        ...prev,
        contacts: (prev.contacts || []).map((contact) =>
          contact.id === normalizedContacto.id ? normalizedContacto : contact,
        ),
        fechaUltimaActividad: new Date().toISOString(),
      }))
    }
    closeModal("contacto")
  }

  const handleConfirmDeleteContact = async () => {
    const contactId = modals.confirmarEliminacion.data?.id

    if (!contactId) return

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/empresas/contactos/${contactId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al eliminar el contacto")
      }

      setCompanies((prev) =>
        prev.map((company) =>
          company.id === selectedCompany.id
            ? {
              ...company,
              contacts: (company.contacts || []).filter((contact) => contact.id !== contactId),
              fechaUltimaActividad: new Date().toISOString(),
            }
            : company,
        ),
      )

      setSelectedCompany((prev) => ({
        ...prev,
        contacts: (prev.contacts || []).filter((contact) => contact.id !== contactId),
        fechaUltimaActividad: new Date().toISOString(),
      }))

      closeModal("confirmarEliminacion")
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      })
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      POR_CONTACTAR: "#87CEEB",
      EN_PROCESO: "#0057c9",
      CONTACTAR_MAS_ADELANTE: "#FF9800",
      PERDIDO: "#F44336",
      CLIENTE: "#4CAF50",
    }
    return statusColors[status] || "#87CEEB"
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="empresas-container">
          <section className="companies-panel">
            <div className="panel-header">
              <button className="btn btn-add" onClick={handleAddCompany}>
                Agregar empresa
              </button>
            </div>

            <div className="search-section">
              <div className="search-filter-row">
                <div className="search-input-container">
                  <input
                    type="text"
                    placeholder="Buscar nombre de la empresa"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todas</option>
                  {estatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="companies-list">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className={`company-item ${selectedCompany?.id === company.id ? "selected" : ""}`}
                  onClick={() => handleCompanySelect(company)}
                >
                  <div className="company-info">
                    <h3>{company.nombre || "N/A"}</h3>
                    <div
                      className="status-indicator"
                      style={{ backgroundColor: company.statusColor || "#87CEEB" }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="company-details-panel">
            {selectedCompany ? (
              <>
                <div className="company-form">
                  <div className="form-header">
                    <h3>Datos de la Empresa</h3>
                    <div className="form-actions">
                      <button className="btn btn-add" onClick={handleEditCompany}>
                        Editar empresa
                      </button>
                      <button className="btn btn-details" onClick={handleCompanyDetails} title="Detalles empresa">
                        <img src={detailsIcon || "/placeholder.svg"} alt="Detalles" className="btn-icon" />
                      </button>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre de la empresa</label>
                      <input type="text" value={selectedCompany.nombre || "N/A"} className="form-control" readOnly />
                    </div>
                    <div className="form-group">
                      <label>Estatus</label>
                      <input
                        type="text"
                        value={getStatusText(selectedCompany.estatus)}
                        className="form-control"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Sitio web</label>
                    <input
                      type="text"
                      value={selectedCompany.sitioWeb || "N/A"}
                      className="form-control clickable"
                      readOnly
                      onClick={() => {
                        if (selectedCompany.sitioWeb) {
                          window.open(selectedCompany.sitioWeb, "_blank", "noopener,noreferrer");
                        }
                      }}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group address-group">
                      <label>Domicilio</label>
                      <input
                        type="text"
                        value={selectedCompany.domicilioFisico || "N/A"}
                        className="form-control"
                        readOnly
                      />
                      <button className="btn btn-ver-en-el-mapa" onClick={handleViewMap} title="Ver en el mapa">
                        Ver en el mapa
                      </button>
                    </div>
                  </div>
                </div>

                <div className="contacts-section">
                  <div className="contacts-header">
                    <button className="btn btn-new-contact" onClick={handleAddContact}>
                      Nuevo contacto
                    </button>

                    <div className="contacts-search-row">
                      <div className="contacts-search">
                        <label>Nombre del contacto:</label>
                        <input
                          type="text"
                          placeholder="Ingresa el nombre del contacto"
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          className="search-input small"
                        />
                      </div>

                      <div className="contacts-filter">
                        <label>Rol:</label>
                        <select
                          value={contactRole}
                          onChange={(e) => setContactRole(e.target.value)}
                          className="filter-select small"
                        >
                          <option value="">Todas</option>
                          {rolesOptions.map((rol) => (
                            <option key={rol} value={rol}>
                              {rol.charAt(0) + rol.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="contacts-table-container">
                    <table className="contacts-table">
                      <thead>
                        <tr>
                          <th>No.</th>
                          <th>Nombre del contacto</th>
                          <th>Teléfono</th>
                          <th>Correo electrónico</th>
                          <th>Rol</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.length > 0 ? (
                          filteredContacts.map((contact, index) => (
                            <tr key={contact.id}>
                              <td>{index + 1}</td>
                              <td>{contact.nombre || "N/A"}</td>
                              <td>{contact.telefonos?.[0]?.telefono || "N/A"}</td>
                              <td>{contact.correos?.[0]?.correo || "N/A"}</td>
                              <td>
                                {contact.rol ? contact.rol.charAt(0) + contact.rol.slice(1).toLowerCase() : "N/A"}
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn-action edit"
                                    onClick={() => handleEditContact(contact.id)}
                                    title="Editar"
                                  >
                                    <img src={editIcon || "/placeholder.svg"} alt="Editar" />
                                  </button>
                                  <button
                                    className="btn-action delete"
                                    onClick={() => handleDeleteContact(contact.id)}
                                    title="Eliminar"
                                  >
                                    <img src={deleteIcon || "/placeholder.svg"} alt="Eliminar" />
                                  </button>
                                  <button
                                    className="btn-action details"
                                    onClick={() => handleContactDetails(contact.id)}
                                    title="Detalles"
                                  >
                                    <img src={detailsIcon || "/placeholder.svg"} alt="Detalles" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="no-data">
                              No se encontraron contactos
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="tratos-section">
                  <div className="tratos-header">
                    <h3>Tratos de la Empresa</h3>
                  </div>

                  <div className="tratos-table-container">
                    <table className="tratos-table">
                      <thead>
                        <tr>
                          <th>No. Trato</th>
                          <th>Nombre del Trato</th>
                          <th>Nombre del Contacto</th>
                          <th>Propietario</th>
                          <th>Fase</th>
                          <th>Fecha de Cierre</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tratos.length > 0 ? (
                          tratos.map((trato, index) => (
                            <tr key={trato.id}>
                              <td>{trato.noTrato || index + 1}</td>
                              <td>{trato.nombre || "N/A"}</td>
                              <td>{trato.contacto?.nombre || "N/A"}</td>
                              <td>{trato.propietarioNombre || "N/A"}</td>
                              <td>{trato.fase || "N/A"}</td>
                              <td>
                                {trato.fechaCierre
                                  ? new Date(trato.fechaCierre).toLocaleDateString("es-MX")
                                  : "N/A"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="no-data">
                              No se encontraron tratos para esta empresa
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>Selecciona una empresa para ver sus detalles</p>
              </div>
            )}
          </section>
        </div>

        <EmpresaModal
          isOpen={modals.empresa.isOpen}
          onClose={() => closeModal("empresa")}
          onSave={handleSaveEmpresa}
          empresa={modals.empresa.data}
          mode={modals.empresa.mode}
          onCompanyCreated={handleCompanyCreated}
          users={users}
          hasTratos={modals.empresa.hasTratos}
          existingCompanies={modals.empresa.existingCompanies}
        />

        <ContactoModal
          isOpen={modals.contacto.isOpen}
          onClose={() => closeModal("contacto")}
          onSave={handleSaveContacto}
          contacto={modals.contacto.data}
          empresaId={modals.contacto.data?.empresaId}
          empresaNombre={modals.contacto.data?.empresaNombre}
          mode={modals.contacto.mode}
          isInitialContact={modals.contacto.isInitialContact}
          users={users}
        />

        <DetallesEmpresaModal
          isOpen={modals.detallesEmpresa.isOpen}
          onClose={() => closeModal("detallesEmpresa")}
          empresa={modals.detallesEmpresa.data}
        />

        <DetallesContactoModal
          isOpen={modals.detallesContacto.isOpen}
          onClose={() => closeModal("detallesContacto")}
          contacto={modals.detallesContacto.data}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmarEliminacion.isOpen}
          onClose={() => closeModal("confirmarEliminacion")}
          onConfirm={handleConfirmDeleteContact}
          contacto={modals.confirmarEliminacion.data}
          isLastContact={modals.confirmarEliminacion.isLastContact}
        />
      </main>
    </>
  )
}

export default Empresas
