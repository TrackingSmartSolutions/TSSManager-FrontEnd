import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Equipos_Sim.css";
import Header from "../Header/Header";
import Swal from "sweetalert2";
import editIcon from "../../assets/icons/editar.png";
import deleteIcon from "../../assets/icons/eliminar.png";
import detailsIcon from "../../assets/icons/lupa.png";
import balancesIcon from "../../assets/icons/check-saldos.png";
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

const Modal = ({ isOpen, onClose, title, children, size = "md", canClose = true, closeOnOverlayClick = true }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "sim-modal-sm",
    md: "sim-modal-md",
    lg: "sim-modal-lg",
    xl: "sim-modal-xl",
  };

  return (
    <div className="sim-modal-overlay" onClick={closeOnOverlayClick ? onClose : () => { }}>
      <div className={`sim-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="sim-modal-header">
          <h2 className="sim-modal-title">{title}</h2>
          {canClose && <button className="sim-modal-close" onClick={onClose}>✕</button>}
        </div>
        <div className="sim-modal-body">{children}</div>
      </div>
    </div>
  );
};

const SimFormModal = ({ isOpen, onClose, sim = null, onSave, equipos, gruposDisponibles, sims }) => {
  const [formData, setFormData] = useState({
    numero: "",
    tarifa: "POR_SEGUNDO",
    vigencia: new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }).split("/").reverse().join("-"),
    recarga: 50,
    responsable: "TSS",
    principal: "NO",
    grupo: "",
    equipo: "",
    contrasena: "tss2025",
  });
  const [errors, setErrors] = useState({});
  const [existingSims, setExistingSims] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (sim) {
        setFormData({
          numero: sim.numero || "",
          tarifa: sim.tarifa || "POR_SEGUNDO",
          vigencia: sim.vigencia ? new Date(sim.vigencia).toISOString().split("T")[0] : "",
          recarga: sim.recarga ? sim.recarga.toString() : "50",
          responsable: sim.responsable || "TSS",
          principal: sim.principal || "NO",
          grupo: sim.grupo?.toString() || "",
          equipo: sim.equipoImei || "",
          contrasena: sim.contrasena || "tss2025",
        });
      } else {
        const hasAvailableGroups = gruposDisponibles.length > 0;
        setFormData({
          numero: "",
          tarifa: "POR_SEGUNDO",
          vigencia: new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }).split("/").reverse().join("-"),
          recarga: "50",
          responsable: "TSS",
          principal: hasAvailableGroups ? "NO" : "SI",
          grupo: "",
          equipo: "",
          contrasena: "tss2025",
        });
      }
      setErrors({});
      fetchExistingSims();
    }
  }, [isOpen, sim, gruposDisponibles]);

  const fetchExistingSims = async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/sims`);
      const simsData = await response.json();
      setExistingSims(simsData.map((s) => s.numero));
    } catch (error) {
      console.error("Error fetching existing SIMs:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'numero') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const currentDate = new Date().toISOString().split('T')[0];

    // Validación del número
    if (!formData.numero.trim()) {
      newErrors.numero = "El número es obligatorio";
    } else if (!/^\d{10}$/.test(formData.numero)) {
      newErrors.numero = "El número debe tener exactamente 10 dígitos";
    } else if (existingSims.includes(formData.numero) && (!sim || sim.numero !== formData.numero)) {
      newErrors.numero = "El número ya está en uso por otra SIM";
    }

    if (formData.equipo && formData.equipo !== "0") {
      if (!formData.equipo) newErrors.equipo = "El equipo es obligatorio";
    }

    if (formData.responsable === "TSS" && formData.principal === "NO" && !formData.grupo) {
      newErrors.grupo = "El grupo es obligatorio cuando no es principal";
    } else if (formData.tarifa === "M2M_GLOBAL_15" && formData.grupo !== "0") {
      newErrors.grupo = "Las SIMs M2M Global 15 deben ir en el Grupo 0";
    }

    if (formData.responsable === "TSS" && formData.vigencia && formData.vigencia < currentDate) {
      newErrors.vigencia = "La vigencia no puede ser en el pasado";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Determinar el grupo correcto
    let grupoFinal = null;
    if (formData.responsable === "TSS") {
      if (formData.principal === "SI") {
        grupoFinal = sim ? sim.grupo : null;
      } else {
        grupoFinal = parseInt(formData.grupo) || null;
      }
    } else {
      grupoFinal = null;
    }

    // Enviar IMEI en lugar de ID
    let equipoData = null;
    if (formData.equipo && formData.equipo !== "0") {
      const equipoSeleccionado = equipos.find(eq => eq.imei === formData.equipo);
      if (equipoSeleccionado) {
        equipoData = {
          imei: equipoSeleccionado.imei,
          id: equipoSeleccionado.id
        };
      }
    }

    const simData = {
      numero: formData.numero,
      tarifa: formData.tarifa,
      vigencia: formData.responsable === "TSS" ? formData.vigencia : null,
      recarga: formData.responsable === "TSS" ? parseFloat(formData.recarga) : null,
      responsable: formData.responsable,
      principal: formData.principal,
      grupo: grupoFinal,
      equipo: equipoData,
      contrasena: formData.responsable === "TSS" ? formData.contrasena : null,
    };


    try {
      const url = sim ? `${API_BASE_URL}/sims/${sim.id}` : `${API_BASE_URL}/sims`;
      const method = sim ? "PUT" : "POST";
      const response = await fetchWithToken(url, {
        method,
        body: JSON.stringify(simData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;

        try {
          // Intentar parsear la respuesta como JSON para obtener más detalles
          const errorData = await response.json();

          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = `${errorData.error}: ${errorData.message || 'Error desconocido'}`;
          }
        } catch (parseError) {
          // Si no es JSON, obtener como texto
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += `: ${errorText}`;
            }
          } catch (textError) {
            console.error("Error obteniendo texto de error:", textError);
          }
        }

        throw new Error(errorMessage);
      }

      const savedSim = await response.json();
      onSave(savedSim);
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: sim ? "SIM actualizada correctamente" : "SIM agregada correctamente",
      });

    } catch (error) {
      console.error("Error completo:", error);

      // Mostrar error más específico
      let errorText = error.message;

      // Errores comunes que podemos manejar mejor
      if (errorText.includes("IllegalStateException")) {
        errorText = "No se puede agregar la SIM: posiblemente el grupo está completo o ya existe una SIM principal en ese grupo";
      } else if (errorText.includes("EntityNotFoundException")) {
        errorText = "Equipo no encontrado. Verifique que el equipo existe y está disponible";
      } else if (errorText.includes("IllegalArgumentException")) {
        errorText = "Los datos enviados no son válidos. Verifique todos los campos";
      }

      Swal.fire({
        icon: "error",
        title: "Error al guardar SIM",
        text: errorText,
        showConfirmButton: true
      });
    }
    onClose();
  };

  const isTssResponsable = formData.responsable === "TSS";
  const isPrincipal = formData.principal === "SI";

  const availableEquipos = equipos.filter(
    (equipo) =>
      (equipo.tipo === "DEMO" || equipo.tipo === "VENDIDO") &&
      !equipo.simReferenciada &&
      equipo.estatus !== "ALMACEN"
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sim ? "Editar SIM" : "Nueva SIM"} size="md" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="sim-form">
        <div className="sim-form-group">
          <label htmlFor="numero" className="sim-form-label">
            Número <span className="required"> *</span>
          </label>
          <input
            type="tel"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleInputChange}
            className={`sim-form-control ${errors.numero ? "sim-form-control-error" : ""}`}
            placeholder="Ingrese el número de SIM"
            maxLength="10"
          />
          {errors.numero && <span className="sim-form-error">{errors.numero}</span>}
        </div>
        <div className="sim-form-group">
          <label htmlFor="tarifa" className="sim-form-label">
            Tarifa <span className="required"> *</span>
          </label>
          <select
            id="tarifa"
            name="tarifa"
            value={formData.tarifa}
            onChange={handleInputChange}
            className="sim-form-control"
          >
            <option value="POR_SEGUNDO">Por segundo</option>
            <option value="SIN_LIMITE">Sin límite</option>
            <option value="M2M_GLOBAL_15">M2M Global 15</option>
          </select>
        </div>

        <div className="sim-form-group">
          <label htmlFor="responsable" className="sim-form-label">
            Responsable <span className="required"> *</span>
          </label>
          <select
            id="responsable"
            name="responsable"
            value={formData.responsable}
            onChange={handleInputChange}
            className="sim-form-control"
          >
            <option value="TSS">TSS</option>
            <option value="CLIENTE">Cliente</option>
          </select>
        </div>

        {isTssResponsable && (
          <>
            <div className="sim-form-group">
              <label htmlFor="vigencia" className="sim-form-label">
                Vigencia <span className="required"> *</span>
              </label>
              <input
                type="date"
                id="vigencia"
                name="vigencia"
                value={formData.vigencia}
                onChange={handleInputChange}
                className="sim-form-control"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="sim-form-group">
              <label htmlFor="recarga" className="sim-form-label">
                Recarga <span className="required"> *</span>
              </label>
              <input
                type="number"
                id="recarga"
                name="recarga"
                value={formData.recarga}
                onChange={handleInputChange}
                className="sim-form-control"
                min="0"
                step="0.01"
              />
            </div>

            <div className="sim-form-group">
              <label htmlFor="principal" className="sim-form-label">
                Principal <span className="required"> *</span>
              </label>
              <select
                id="principal"
                name="principal"
                value={formData.principal}
                onChange={handleInputChange}
                className="sim-form-control"
                disabled={!gruposDisponibles.length}
              >
                <option value="SI">Sí</option>
                <option value="NO" disabled={!gruposDisponibles.length}>No</option>
              </select>
            </div>

            <div className="sim-form-group">
              <label htmlFor="grupo" className="sim-form-label">
                Grupo <span className="required"> *</span>
              </label>
              <select
                id="grupo"
                name="grupo"
                value={formData.grupo}
                onChange={handleInputChange}
                className={`sim-form-control ${errors.grupo ? "sim-form-control-error" : ""}`}
                disabled={isPrincipal}
                required={!isPrincipal}
              >
                <option value="">Seleccionar grupo</option>
                {!isPrincipal &&
                  (formData.tarifa === "M2M_GLOBAL_15" ? (
                    <option value="0">Grupo 0 (M2M)</option>
                  ) : (
                    gruposDisponibles.map((grupo) => {
                      const simsInGroup = (sims || []).filter((s) => s.grupo === grupo);
                      const principalCount = simsInGroup.filter((s) => s.principal === "SI").length;
                      const nonPrincipalCount = simsInGroup.filter((s) => s.principal === "NO").length;
                      const remaining = 6 - (principalCount + nonPrincipalCount);
                      return (
                        <option key={grupo} value={grupo}>
                          Grupo {grupo} ({remaining}/6)
                        </option>
                      );
                    })
                  ))}
              </select>
              {!isPrincipal && <small className="sim-help-text">Seleccione un grupo disponible</small>}
              {errors.grupo && <span className="sim-form-error">{errors.grupo}</span>}
            </div>

            <div className="sim-form-group">
              <label htmlFor="contrasena" className="sim-form-label">
                Contraseña <span className="required"> *</span>
              </label>
              <input
                type="text"
                id="contrasena"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleInputChange}
                className="sim-form-control"
                placeholder="Contraseña de la SIM"
              />
            </div>
          </>
        )}

        <div className="sim-form-group">
          <label htmlFor="equipo" className="sim-form-label">
            Equipo <span className="required"> *</span>
          </label>
          <select
            id="equipo"
            name="equipo"
            value={formData.equipo}
            onChange={handleInputChange}
            className={`sim-form-control ${errors.equipo ? "sim-form-control-error" : ""}`}
          >
            <option value="0">Sin equipo</option>
            {availableEquipos.map((equipo) => (
              <option key={equipo.imei} value={equipo.imei}>
                {equipo.nombre} ({equipo.tipo}) - IMEI: {equipo.imei}
              </option>
            ))}
            {/* Para equipos ya vinculados en edición */}
            {sim && sim.equipoImei && !availableEquipos.find((e) => e.imei === sim.equipoImei) && (
              <option key={sim.equipoImei} value={sim.equipoImei}>
                {sim.equipoNombre} - IMEI: {sim.equipoImei} [Vinculado]
              </option>
            )}
          </select>
          <small className="sim-help-text">
            {sim
              ? "Equipos disponibles (DEMO o VENDIDO) sin SIM, o el equipo actual vinculado"
              : "Solo equipos (DEMO o VENDIDO) sin SIM"}
          </small>
          {errors.equipo && <span className="sim-form-error">{errors.equipo}</span>}
        </div>

        <div className="sim-form-actions">
          <button type="button" onClick={onClose} className="sim-btn sim-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="sim-btn sim-btn-primary">
            {sim ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const SimDetailsModal = ({ isOpen, onClose, sim = null, equipos }) => {
  if (!sim) return null;

  const equipo = equipos.find(eq => eq.imei === sim.equipoImei);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles de SIM" size="md" closeOnOverlayClick={false}>
      <div className="sim-form">
        <div className="sim-form-group">
          <label className="sim-form-label">Número</label>
          <input
            type="text"
            value={sim.numero || ""}
            className="sim-form-control"
            readOnly
          />
        </div>

        <div className="sim-form-group">
          <label className="sim-form-label">Tarifa</label>
          <input
            type="text"
            value={sim.tarifa === "POR_SEGUNDO" ? "Por segundo" :
              sim.tarifa === "SIN_LIMITE" ? "Sin límite" : "M2M Global 15"}
            className="sim-form-control"
            readOnly
          />
        </div>

        <div className="sim-form-group">
          <label className="sim-form-label">Compañía</label>
          <input
            type="text"
            value={sim.tarifa === "M2M_GLOBAL_15" ? "M2M" : "Telcel"}
            className="sim-form-control"
            readOnly
          />
        </div>

        <div className="sim-form-group">
          <label className="sim-form-label">Responsable</label>
          <input
            type="text"
            value={sim.responsable || ""}
            className="sim-form-control"
            readOnly
          />
        </div>

        {sim.responsable === "TSS" && (
          <>
            <div className="sim-form-group">
              <label className="sim-form-label">Vigencia</label>
              <input
                type="text"
                value={sim.vigencia ? new Date(sim.vigencia + "T00:00:00-06:00").toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" }) : "N/A"}
                className="sim-form-control"
                readOnly
              />
            </div>

            <div className="sim-form-group">
              <label className="sim-form-label">Recarga</label>
              <input
                type="text"
                value={sim.recarga ? `$${sim.recarga}` : "N/A"}
                className="sim-form-control"
                readOnly
              />
            </div>

            <div className="sim-form-group">
              <label className="sim-form-label">Principal</label>
              <input
                type="text"
                value={sim.principal || ""}
                className="sim-form-control"
                readOnly
              />
            </div>

            <div className="sim-form-group">
              <label className="sim-form-label">Grupo</label>
              <input
                type="text"
                value={sim.grupo !== null && sim.grupo !== undefined ? `Grupo ${sim.grupo}` : "N/A"}
                className="sim-form-control"
                readOnly
              />
            </div>

            <div className="sim-form-group">
              <label className="sim-form-label">Contraseña</label>
              <input
                type="text"
                value={sim.contrasena || "N/A"}
                className="sim-form-control"
                readOnly
              />
            </div>
          </>
        )}

        <div className="sim-form-group">
          <label className="sim-form-label">Equipo</label>
          <input
            type="text"
            value={equipo ? `${equipo.nombre} (${equipo.tipo}) - IMEI: ${equipo.imei}` : "Sin equipo"}
            className="sim-form-control"
            readOnly
          />
        </div>

        <div className="sim-form-actions">
          <button type="button" onClick={onClose} className="sim-btn sim-btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

const SaldosSidePanel = ({ isOpen, onClose, sim, onSaveSaldo }) => {
  const [formData, setFormData] = useState({
    saldoActual: "",
    datos: "",
    fecha: new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }).split("/").reverse().join("-"),
  });
  const [historialSaldos, setHistorialSaldos] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && sim) {
      setFormData({
        saldoActual: "",
        datos: "",
        fecha: new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }).split("/").reverse().join("-"),
      });
      setErrors({});
      // Cargar el historial al abrir el modal
      fetchHistorialSaldos(sim.id);
    }
  }, [isOpen, sim]);

  const fetchHistorialSaldos = async (simId) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/sims/${simId}/historial`);
      const data = await response.json();
      setHistorialSaldos(data);
    } catch (error) {
      console.error("Error fetching historial saldos:", error);
      setHistorialSaldos([]);
    }
  };

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
    if (sim.tarifa === "POR_SEGUNDO" && !formData.saldoActual) newErrors.saldoActual = "El saldo actual es obligatorio";
    if ((sim.tarifa === "SIN_LIMITE" || sim.tarifa === "M2M_GLOBAL_15") && !formData.datos) newErrors.datos = "Los datos son obligatorios";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const saldoData = {
      saldoActual: sim.tarifa === "POR_SEGUNDO" ? parseFloat(formData.saldoActual).toFixed(2) : null,
      datos: (sim.tarifa === "SIN_LIMITE" || sim.tarifa === "M2M_GLOBAL_15") ? parseFloat(formData.datos) : null,
      fecha: formData.fecha,
    };

    onSaveSaldo(sim.id, saldoData);
    setFormData({
      saldoActual: "",
      datos: "",
      fecha: new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }).split("/").reverse().join("-"),
    });
  };

  if (!sim) return null;

  return (
    <>
      {isOpen && <div className="sim-side-panel-overlay" onClick={onClose}></div>}
      <div className={`sim-side-panel ${isOpen ? "sim-side-panel-open" : ""}`}>
        <div className="sim-side-panel-header">
          <h2 className="sim-side-panel-title">Reporte Saldos</h2>
          <button className="sim-side-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="sim-side-panel-content">
          <form onSubmit={handleSubmit} className="sim-saldos-form">
            <div className="sim-side-panel-form-group">
              <label htmlFor="numero" className="sim-form-label">Número  <span className="required"> *</span></label>
              <input type="text" id="numero" value={sim.numero} className="sim-side-panel-form-control" readOnly />
            </div>
            {sim.tarifa === "POR_SEGUNDO" && (
              <div className="sim-side-panel-form-group">
                <label htmlFor="saldoActual" className="sim-form-label">Saldo Actual  <span className="required"> *</span></label>
                <div className="sim-input-group">
                  <span className="sim-input-prefix">$</span>
                  <input
                    type="number"
                    id="saldoActual"
                    name="saldoActual"
                    value={formData.saldoActual}
                    onChange={handleInputChange}
                    className={`sim-side-panel-form-control ${errors.saldoActual ? "sim-form-control-error" : ""}`}
                    placeholder="0.00"
                    step="any"
                    min="0"
                  />
                </div>
                {errors.saldoActual && <span className="sim-form-error">{errors.saldoActual}</span>}
              </div>
            )}
            {(sim.tarifa === "SIN_LIMITE" || sim.tarifa === "M2M_GLOBAL_15") && (
              <div className="sim-side-panel-form-group">
                <label htmlFor="datos" className="sim-form-label">Datos  <span className="required"> *</span></label>
                <div className="sim-input-group">
                  <input
                    type="number"
                    id="datos"
                    name="datos"
                    value={formData.datos}
                    onChange={handleInputChange}
                    className={`sim-side-panel-form-control ${errors.datos ? "sim-form-control-error" : ""}`}
                    placeholder="0"
                    min="0"
                    step="any"

                  />
                  <span className="sim-input-suffix">MB</span>
                </div>
                {errors.datos && <span className="sim-form-error">{errors.datos}</span>}
              </div>
            )}
            <div className="sim-side-panel-form-group">
              <label htmlFor="fecha" className="sim-form-label">Fecha:</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                className="sim-side-panel-form-control"
                readOnly
              />
            </div>
            <div className="sim-side-panel-form-actions">
              <button type="submit" className="sim-btn sim-btn-primary sim-btn-full-width">
                Guardar
              </button>
            </div>
          </form>
          <div className="sim-historial-section">
            <h4 className="sim-historial-title">Historial de saldos</h4>
            <div className="sim-side-panel-table-container">
              <table className="sim-side-panel-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    {sim.tarifa === "POR_SEGUNDO" && <th>Saldo Actual</th>}
                    {(sim.tarifa === "SIN_LIMITE" || sim.tarifa === "M2M_GLOBAL_15") && <th>Datos</th>}
                  </tr>
                </thead>
                <tbody>
                  {historialSaldos.length > 0 ? (
                    historialSaldos.map((registro, index) => (
                      <tr key={index}>
                        <td>{new Date(registro.fecha + "T00:00:00-06:00").toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}</td>
                        {sim.tarifa === "POR_SEGUNDO" && <td>${registro.saldoActual}</td>}
                        {(sim.tarifa === "SIN_LIMITE" || sim.tarifa === "M2M_GLOBAL_15") && <td>{registro.datos} MB</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={sim.tarifa === "POR_SEGUNDO" ? 2 : 2} className="sim-no-data">
                        No hay registros de saldos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ConfirmarEliminacionModal = ({ isOpen, onClose, sim, onConfirm, hasEquipoVinculado = false }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hasEquipoVinculado ? "Error al eliminar el registro" : "Confirmar eliminación"}
      size="sm"
      closeOnOverlayClick={false}
    >
      <div className="sim-confirmar-eliminacion">
        {hasEquipoVinculado ? (
          <div className="sim-warning-content">
            <p className="sim-warning-message">
              No se puede eliminar la SIM porque está vinculada a un equipo. Desvincule la SIM primero.
            </p>
            <div className="sim-form-actions">
              <button type="button" onClick={onClose} className="sim-btn sim-btn-primary">
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <div className="sim-confirmation-content">
            <p className="sim-confirmation-message">¿Seguro que quieres eliminar esta SIM?</p>
            <div className="sim-form-actions">
              <button type="button" onClick={onClose} className="sim-btn sim-btn-cancel">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirm} className="sim-btn sim-btn-confirm">
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const EquiposSim = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("ADMINISTRADOR");
  const [sims, setSims] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [filterGrupo, setFilterGrupo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filterNumero, setFilterNumero] = useState("");
  const [modals, setModals] = useState({
    form: { isOpen: false, sim: null },
    saldos: { isOpen: false, sim: null },
    confirmDelete: { isOpen: false, sim: null, hasEquipoVinculado: false },
    details: { isOpen: false, sim: null },
  });

  useEffect(() => {
    const userRoleFromStorage = localStorage.getItem("userRol");
    setUserRole(userRoleFromStorage === "ADMINISTRADOR" ? "ADMINISTRADOR" : userRoleFromStorage || "ADMINISTRADOR");
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [simsResponse, equiposResponse, gruposResponse] = await Promise.all([
        fetchWithToken(`${API_BASE_URL}/sims`),
        fetchWithToken(`${API_BASE_URL}/equipos`),
        fetchWithToken(`${API_BASE_URL}/sims/grupos-disponibles`),
      ]);
      const simsData = await simsResponse.json();
      const equiposData = await equiposResponse.json();
      const gruposData = await gruposResponse.json();

      const simsWithEquipo = simsData.map((sim) => {
        const equipo = equiposData.find((e) => e.id === sim.equipoId);
        return {
          ...sim,
          equipo: equipo ? { id: equipo.id, nombre: equipo.nombre, tipo: equipo.tipo } : null,
        };
      });

      setSims(simsWithEquipo);
      setEquipos(equiposData);
      setGruposDisponibles(gruposData);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los datos" });
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (modalType, data = {}) => {
    setModals((prev) => ({ ...prev, [modalType]: { isOpen: true, ...data } }));
  };

  const closeModal = (modalType) => {
    setModals((prev) => ({ ...prev, [modalType]: { isOpen: false } }));
  };

  const handleMenuNavigation = (menuItem) => {
    switch (menuItem) {
      case "estatus-plataforma":
        navigate("/equipos_estatusplataforma");
        break;
      case "modelos":
        navigate("/equipos_modelos");
        break;
      case "proveedores":
        navigate("/equipos_proveedores");
        break;
      case "inventario":
        navigate("/equipos_inventario");
        break;
      case "sim":
        navigate("/equipos_sim");
        break;
      default:
        break;
    }
  };

  const handleSaveSim = (simData) => {
    setSims((prev) => {
      const updatedSims = prev.map((sim) =>
        sim.id === simData.id
          ? {
            ...sim,
            ...simData,
            compañia: simData.tarifa === "M2M_GLOBAL_15" ? "M2M" : "Telcel",
          }
          : sim
      );
      // Remapear el equipo usando la lista completa de equipos
      return updatedSims.map((sim) => {
        const equipo = equipos.find((e) => e.id === sim.equipoId);
        return {
          ...sim,
          equipo: equipo ? { id: equipo.id, nombre: equipo.nombre, tipo: equipo.tipo } : null,
        };
      });
    });
    fetchData();
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: simData.id ? "SIM actualizada correctamente" : "SIM agregada correctamente",
    });
  };

  const handleDeleteSim = async () => {
    const simId = modals.confirmDelete.sim?.id;
    try {
      await fetchWithToken(`${API_BASE_URL}/sims/${simId}`, { method: "DELETE" });
      fetchData();
      Swal.fire({ icon: "success", title: "Éxito", text: "SIM eliminada correctamente" });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
    closeModal("confirmDelete");
  };

  const handleSaveSaldo = async (simId, registroSaldo) => {
    try {
      const params = new URLSearchParams();
      if (registroSaldo.saldoActual) params.append("saldoActual", registroSaldo.saldoActual);
      if (registroSaldo.datos) params.append("datos", registroSaldo.datos);
      if (registroSaldo.fecha) params.append("fecha", registroSaldo.fecha);
      const response = await fetchWithToken(`${API_BASE_URL}/sims/${simId}/saldo?${params.toString()}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Error al guardar el saldo");
      const data = await response.json();

      // Recargar el historial específico del SIM
      const historialResponse = await fetchWithToken(`${API_BASE_URL}/sims/${simId}/historial`);
      const historialData = await historialResponse.json();
      setModals((prev) => {
        const currentSim = prev.saldos.sim;
        if (currentSim && currentSim.id === simId) {
          return {
            ...prev,
            saldos: {
              ...prev.saldos,
              sim: { ...currentSim, historialSaldos: historialData },
            },
          };
        }
        return prev;
      });

      fetchData();
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: data.message || "Saldo registrado correctamente",
      });
      closeModal("saldos");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString + "T00:00:00-06:00").toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" }) : "N/A";
  };

  return (
    <>
      <Header />
      {isLoading && (
        <div className="sim-loading">
          <div className="spinner"></div>
          <p>Cargando datos de SIM...</p>
        </div>
      )}
      <main className="sim-main-content">
        <div className="sim-container">
          <section className="sim-sidebar">
            <div className="sim-sidebar-header">
              <h3 className="sim-sidebar-title">Equipos</h3>
            </div>
            <div className="sim-sidebar-menu">
              <div className="sim-menu-item" onClick={() => handleMenuNavigation("estatus-plataforma")}>
                Estatus plataforma
              </div>
              <div className="sim-menu-item" onClick={() => handleMenuNavigation("modelos")}>
                Modelos
              </div>
              <div className="sim-menu-item" onClick={() => handleMenuNavigation("proveedores")}>
                Proveedores
              </div>
              <div className="sim-menu-item" onClick={() => handleMenuNavigation("inventario")}>
                Inventario de equipos
              </div>
              <div className="sim-menu-item sim-menu-item-active" onClick={() => handleMenuNavigation("sim")}>
                SIM
              </div>
            </div>
          </section>

          <section className="sim-content-panel">
            <div className="sim-header">
              <div className="sim-header-info">
                <h3 className="sim-page-title">SIM</h3>
                <p className="sim-subtitle">Gestión de SIMs asociadas a equipos</p>
              </div>
            </div>

            <div className="sim-table-card">
              <div className="sim-table-header">
                <h4 className="sim-table-title">SIMs</h4>
                <div className="sim-table-controls">
                  <input
                    type="text"
                    placeholder="Buscar por número..."
                    value={filterNumero}
                    onChange={(e) => setFilterNumero(e.target.value)}
                    className="sim-filter-input"
                  />
                  <select
                    value={filterGrupo}
                    onChange={(e) => setFilterGrupo(e.target.value)}
                    className="sim-filter-select"
                  >
                    <option value="">Todos los grupos</option>
                    {[...new Set(sims.map((sim) => sim.grupo))]
                      .sort((a, b) => Number(a) - Number(b))
                      .map((grupo) => (
                        <option key={grupo} value={grupo}>
                          Grupo {grupo}
                        </option>
                      ))}
                  </select>
                  <button className="sim-btn sim-btn-primary" onClick={() => openModal("form", { sim: null })}>
                    Agregar SIM
                  </button>
                </div>
              </div>
              <div className="sim-table-container">
                <table className="sim-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Tarifa</th>
                      <th>Compañía</th>
                      <th>Vigencia</th>
                      <th>Recarga</th>
                      <th>Responsable</th>
                      <th>Grupo</th>
                      <th>Principal</th>
                      <th>Equipo</th>
                      <th>Contraseña</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sims
                      .filter((sim) => {
                        const matchesGrupo = !filterGrupo || sim.grupo?.toString() === filterGrupo;
                        const matchesNumero = !filterNumero || sim.numero?.toLowerCase().includes(filterNumero.toLowerCase());
                        return matchesGrupo && matchesNumero;
                      })
                      .sort((a, b) => {

                        if (filterGrupo) {
                          if (a.principal === "SI" && b.principal === "NO") return -1;
                          if (a.principal === "NO" && b.principal === "SI") return 1;
                        }
                        return 0;
                      })
                      .map((sim) => (
                        <tr key={sim.id}>
                          <td>{sim.numero}</td>
                          <td>{sim.tarifa}</td>
                          <td>{sim.tarifa === "M2M_GLOBAL_15" ? "M2M" : sim.compañia || "Telcel"}</td>
                          <td>{formatDate(sim.vigencia)}</td>
                          <td>{sim.recarga ? `$${sim.recarga}` : "N/A"}</td>
                          <td>{sim.responsable}</td>
                          <td>{sim.grupo !== null && sim.grupo !== undefined ? `Grupo ${sim.grupo}` : "N/A"}</td>
                          <td>
                            <span className={sim.principal === "SI" ? "sim-principal-si" : "sim-principal-no"}>
                              {sim.principal}
                            </span>
                          </td>
                          <td>{sim.equipo?.nombre || "N/A"}</td>
                          <td>{sim.contrasena || "N/A"}</td>
                          <td>
                            <div className="sim-action-buttons">
                              <button
                                className="sim-btn-action sim-edit"
                                onClick={() => openModal("form", { sim })}
                                title="Editar"
                              >
                                <img src={editIcon} alt="Editar" />
                              </button>
                              <button
                                className="sim-btn-action sim-details"
                                onClick={() => openModal("details", { sim })}
                                title="Ver detalles"
                              >
                                <img src={detailsIcon} alt="Ver detalles" />
                              </button>
                              {userRole === "ADMINISTRADOR" && (
                                <button
                                  className="sim-btn-action sim-delete"
                                  onClick={() => {
                                    const hasEquipoVinculado = sim.equipo !== null;
                                    openModal("confirmDelete", { sim, hasEquipoVinculado });
                                  }}
                                  title="Eliminar"
                                >
                                  <img src={deleteIcon} alt="Eliminar" />
                                </button>
                              )}
                              <button
                                className="sim-btn-action sim-saldos"
                                onClick={() => openModal("saldos", { sim })}
                                title="Saldos"
                              >
                                <img src={balancesIcon} alt="Saldos" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {sims.filter((sim) => {
                      const matchesGrupo = !filterGrupo || sim.grupo?.toString() === filterGrupo;
                      const matchesNumero = !filterNumero || sim.numero?.toLowerCase().includes(filterNumero.toLowerCase());
                      return matchesGrupo && matchesNumero;
                    }).length === 0 && (
                        <tr>
                          <td colSpan="11" className="sim-no-data">
                            No se encontraron SIMs
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <SimFormModal
          isOpen={modals.form.isOpen}
          onClose={() => closeModal("form")}
          sim={modals.form.sim}
          onSave={handleSaveSim}
          equipos={equipos}
          gruposDisponibles={gruposDisponibles}
          sims={sims}
        />
        <SaldosSidePanel
          isOpen={modals.saldos.isOpen}
          onClose={() => closeModal("saldos")}
          sim={modals.saldos.sim}
          onSaveSaldo={handleSaveSaldo}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmDelete.isOpen}
          onClose={() => closeModal("confirmDelete")}
          sim={modals.confirmDelete.sim}
          onConfirm={handleDeleteSim}
          hasEquipoVinculado={modals.confirmDelete.hasEquipoVinculado}
        />
        <SimDetailsModal
          isOpen={modals.details.isOpen}
          onClose={() => closeModal("details")}
          sim={modals.details.sim}
          equipos={equipos}
        />
      </main>
    </>
  );
};

export default EquiposSim
export { SimDetailsModal };