import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./Admin_CuentasPagar.css"
import Header from "../Header/Header"
import Swal from "sweetalert2"
import deleteIcon from "../../assets/icons/eliminar.png"
import editIcon from "../../assets/icons/editar.png"
import checkIcon from "../../assets/icons/check.png"
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
    sm: "cuentaspagar-modal-sm",
    md: "cuentaspagar-modal-md",
    lg: "cuentaspagar-modal-lg",
    xl: "cuentaspagar-modal-xl",
  }

  return (
    <div className="cuentaspagar-modal-overlay" onClick={closeOnOverlayClick ? onClose : () => { }}>
      <div className={`cuentaspagar-modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="cuentaspagar-modal-header">
          <h2 className="cuentaspagar-modal-title">{title}</h2>
          {canClose && (
            <button className="cuentaspagar-modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="cuentaspagar-modal-body">{children}</div>
      </div>
    </div>
  )
}

// Modal para Marcar como Pagada
const MarcarPagadaModal = ({ isOpen, onClose, onSave, cuenta, formasPago }) => {
  const [formData, setFormData] = useState({
    monto: "",
    formaPago: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && cuenta) {
      setFormData({
        monto: cuenta.monto.toString(),
        formaPago: cuenta.formaPago,
      });
      setErrors({});
    }
  }, [isOpen, cuenta]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.monto || Number.parseFloat(formData.monto) <= 0) {
      newErrors.monto = "El monto debe ser mayor a 0";
      if (!formData.formaPago) newErrors.formaPago = "La forma de pago es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const cuentaActualizada = {
        ...cuenta,
        estatus: "Pagado",
        monto: Number.parseFloat(formData.monto),
        formaPago: formData.formaPago,
      };

      onSave(cuentaActualizada);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Fecha de Pago" size="md" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="cuentaspagar-form">
        <div className="cuentaspagar-form-group">
          <label htmlFor="monto">Monto  <span className="required"> *</span></label>
          <div className="cuentaspagar-input-with-prefix">
            <span className="cuentaspagar-prefix">$</span>
            <input
              type="number"
              id="monto"
              step="0.01"
              value={formData.monto}
              onChange={(e) => handleInputChange("monto", e.target.value)}
              className={`cuentaspagar-form-control ${errors.monto ? "error" : ""}`}
            />
          </div>
          {errors.monto && <span className="cuentaspagar-error-message">{errors.monto}</span>}
        </div>

        <div className="cuentaspagar-form-group">
          <label htmlFor="formaPago">Forma de Pago <span className="required"> *</span></label>
          <select
            id="formaPago"
            value={formData.formaPago}
            onChange={(e) => handleInputChange("formaPago", e.target.value)}
            className={`cuentaspagar-form-control ${errors.formaPago ? "error" : ""}`}
          >
            <option value="">Seleccionar forma de pago</option>
            {Object.entries(formasPago).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          {errors.formaPago && <span className="cuentaspagar-error-message">{errors.formaPago}</span>}
        </div>

        <div className="cuentaspagar-form-actions">
          <button type="submit" className="cuentaspagar-btn cuentaspagar-btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para Editar Cuenta Por Pagar
const EditarCuentaModal = ({ isOpen, onClose, onSave, cuenta, formasPago }) => {
  const [formData, setFormData] = useState({
    fechaPago: "",
    monto: "",
    formaPago: "",
    nota: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cuenta) {
      setFormData({
        fechaPago: cuenta.fechaPago || "",
        monto: cuenta.monto.toString(),
        formaPago: cuenta.formaPago || "",
        nota: cuenta.nota || "",
      });
      setErrors({});
    }
  }, [isOpen, cuenta]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fechaPago) newErrors.fechaPago = "La fecha de pago es obligatoria";
    if (!formData.monto || Number.parseFloat(formData.monto) <= 0) {
      newErrors.monto = "El monto debe ser mayor a 0";
    }
    if (!formData.formaPago) newErrors.formaPago = "La forma de pago es obligatoria";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);

      try {
        const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar/${cuenta.id}`, {
          method: "PUT",
          body: JSON.stringify({
            fechaPago: formData.fechaPago,
            monto: Number.parseFloat(formData.monto),
            formaPago: formData.formaPago,
            nota: formData.nota,
          }),
        });

        if (response.ok) {
          const updatedCuenta = await response.json();
          onSave(updatedCuenta);
          onClose();
          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: "Cuenta por pagar actualizada correctamente",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Cuenta por Pagar" size="md" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="cuentaspagar-form">
        <div className="cuentaspagar-form-group">
          <label htmlFor="fechaPago">Fecha de Pago <span className="required"> *</span></label>
          <input
            type="date"
            id="fechaPago"
            value={formData.fechaPago}
            onChange={(e) => handleInputChange("fechaPago", e.target.value)}
            className={`cuentaspagar-form-control ${errors.fechaPago ? "error" : ""}`}
          />
          {errors.fechaPago && <span className="cuentaspagar-error-message">{errors.fechaPago}</span>}
        </div>

        <div className="cuentaspagar-form-group">
          <label htmlFor="monto">Monto <span className="required"> *</span></label>
          <div className="cuentaspagar-input-with-prefix">
            <span className="cuentaspagar-prefix">$</span>
            <input
              type="number"
              id="monto"
              step="0.01"
              value={formData.monto}
              onChange={(e) => handleInputChange("monto", e.target.value)}
              className={`cuentaspagar-form-control ${errors.monto ? "error" : ""}`}
            />
          </div>
          {errors.monto && <span className="cuentaspagar-error-message">{errors.monto}</span>}
        </div>

        <div className="cuentaspagar-form-group">
          <label htmlFor="formaPago">Forma de Pago <span className="required"> *</span></label>
          <select
            id="formaPago"
            value={formData.formaPago}
            onChange={(e) => handleInputChange("formaPago", e.target.value)}
            className={`cuentaspagar-form-control ${errors.formaPago ? "error" : ""}`}
          >
            <option value="">Seleccionar forma de pago</option>
            {Object.entries(formasPago).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          {errors.formaPago && <span className="cuentaspagar-error-message">{errors.formaPago}</span>}
        </div>

        <div className="cuentaspagar-form-group">
          <label htmlFor="nota">Nota</label>
          <textarea
            id="nota"
            value={formData.nota}
            onChange={(e) => handleInputChange("nota", e.target.value)}
            className="cuentaspagar-form-control"
            rows="3"
            placeholder="Agregar una nota opcional..."
          />
        </div>

        <div className="cuentaspagar-form-actions">
          <button type="button" onClick={onClose} className="cuentaspagar-btn cuentaspagar-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="cuentaspagar-btn cuentaspagar-btn-primary" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Confirmación de Eliminación
const ConfirmarEliminacionModal = ({ isOpen, onClose, onConfirm, cuenta }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación" size="sm" closeOnOverlayClick={false}>
      <div className="cuentaspagar-confirmar-eliminacion">
        <div className="cuentaspagar-confirmation-content">
          <p className="cuentaspagar-confirmation-message">
            ¿Seguro que quieres eliminar esta cuenta por pagar de forma permanente?
          </p>
          <div className="cuentaspagar-modal-form-actions">
            <button type="button" onClick={onClose} className="cuentaspagar-btn cuentaspagar-btn-cancel">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} className="cuentaspagar-btn cuentaspagar-btn-confirm">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// Modal de Confirmación de Regeneración
const RegenerarModal = ({ isOpen, onClose, onConfirm, cuenta }) => {
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && cuenta) {
      setNuevoMonto(cuenta.monto.toString());
      setErrors({});
    }
  }, [isOpen, cuenta]);

  const handleMontoChange = (value) => {
    setNuevoMonto(value);
    if (errors.monto) {
      setErrors(prev => ({ ...prev, monto: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!nuevoMonto || Number.parseFloat(nuevoMonto) <= 0) {
      newErrors.monto = "El monto debe ser mayor a 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      onConfirm(true, cuenta, Number.parseFloat(nuevoMonto));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generar nueva/s cuenta por pagar" size="md" closeOnOverlayClick={false}>
      <div className="cuentaspagar-confirmar-regeneracion">
        <div className="cuentaspagar-confirmation-content">
          <p className="cuentaspagar-confirmation-message">
            ¿Quiere volver a generar las cuentas por pagar para esta cuenta?
          </p>
          
          <div className="cuentaspagar-form-group" style={{ marginTop: "20px" }}>
            <label htmlFor="nuevoMonto">Monto para las nuevas cuentas <span className="required"> *</span></label>
            <div className="cuentaspagar-input-with-prefix">
              <span className="cuentaspagar-prefix">$</span>
              <input
                type="number"
                id="nuevoMonto"
                step="0.01"
                value={nuevoMonto}
                onChange={(e) => handleMontoChange(e.target.value)}
                className={`cuentaspagar-form-control ${errors.monto ? "error" : ""}`}
              />
            </div>
            {errors.monto && <span className="cuentaspagar-error-message">{errors.monto}</span>}
          </div>

          <div className="cuentaspagar-modal-form-actions" style={{ marginTop: "20px" }}>
            <button type="button" onClick={() => onConfirm(false)} className="cuentaspagar-btn cuentaspagar-btn-cancel">
              Cancelar
            </button>
            <button type="button" onClick={handleConfirm} className="cuentaspagar-btn cuentaspagar-btn-confirm">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Componente Principal
const AdminCuentasPagar = () => {
  const navigate = useNavigate();
  const [cuentasPagar, setCuentasPagar] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstatus, setFiltroEstatus] = useState("Todas");
  const [modals, setModals] = useState({
    marcarPagada: { isOpen: false, cuenta: null },
    editarCuenta: { isOpen: false, cuenta: null },
    confirmarEliminacion: { isOpen: false, cuenta: null },
    regenerar: { isOpen: false, cuenta: null },
  });

  useEffect(() => {
    const fetchCuentasPagar = async () => {
      setIsLoading(true);
      try {
        const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar`);
        const data = await response.json();
        setCuentasPagar(data);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las cuentas por pagar",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCuentasPagar();
  }, []);

  useEffect(() => {
    const actualizarEstatus = () => {
      const hoy = new Date();
      setCuentasPagar((prev) =>
        prev.map((cuenta) => {
          if (cuenta.estatus === "Pagado") return cuenta;

          const fechaPago = new Date(cuenta.fecha_pago);
          const unDiaDespues = new Date(fechaPago);
          unDiaDespues.setDate(unDiaDespues.getDate() + 1);

          let nuevoEstatus = "Pendiente";
          if (hoy > unDiaDespues) {
            nuevoEstatus = "Vencida";
          }

          return { ...cuenta, estatus: nuevoEstatus };
        }),
      );
    };

    actualizarEstatus();
    const interval = setInterval(actualizarEstatus, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formasPago = {
    "01": "Efectivo",
    "03": "Transferencia electrónica de fondos",
    "04": "Tarjeta de crédito",
    "07": "Con Saldo Acumulado",
    "28": "Tarjeta de débito",
    "30": "Aplicación de anticipos",
    "99": "Por definir",
    "02": "Tarjeta Spin"
  };

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

  const handleMarcarPagada = async (cuentaActualizada) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar/marcar-como-pagada`, {
        method: "POST",
        body: JSON.stringify({
          id: cuentaActualizada.id,
          monto: cuentaActualizada.monto,
          formaPago: cuentaActualizada.formaPago,
          usuarioId: 1,
        }),
      });

      if (response.status === 204) {
        setCuentasPagar((prev) =>
          prev.map((c) => (c.id === cuentaActualizada.id ? { ...c, ...cuentaActualizada } : c))
        );

        // Verificar si es la última cuenta Y no es esquema UNICA
        const esUltimaCuenta = cuentaActualizada.numeroPago === cuentaActualizada.totalPagos &&
          cuentaActualizada.transaccion.esquema !== "UNICA";

        if (esUltimaCuenta) {
          openModal("regenerar", { cuenta: cuentaActualizada });
        } else {
          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: "Cuenta marcada como pagada",
          });
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo marcar como pagada",
      });
    }
  };



  const handleDeleteCuenta = (cuenta) => {
    openModal("confirmarEliminacion", { cuenta });
  };

  const handleConfirmDelete = async () => {
    const cuentaId = modals.confirmarEliminacion.cuenta?.id;
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar/${cuentaId}?usuarioId=1`, {
        method: "DELETE",
      });
      if (response.status === 204) {
        setCuentasPagar((prev) => prev.filter((c) => c.id !== cuentaId));
        closeModal("confirmarEliminacion");
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Cuenta por pagar eliminada",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la cuenta",
      });
    }
  };

  const handleRegenerar = async (confirmar, cuenta, nuevoMonto = null) => {
  closeModal("regenerar");

  if (confirmar) {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar/regenerar`, {
        method: "POST",
        body: JSON.stringify({
          transaccionId: cuenta.transaccion.id,
          fechaUltimoPago: cuenta.fechaPago,
          nuevoMonto: nuevoMonto 
        }),
      });

      if (response.ok) {
        const cuentasResponse = await fetchWithToken(`${API_BASE_URL}/cuentas-por-pagar`);
        const updatedCuentas = await cuentasResponse.json();
        setCuentasPagar(updatedCuentas);

        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Nuevas cuentas por pagar generadas correctamente",
        });
      }
    } catch (error) {
      console.error("Error al regenerar cuentas:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron regenerar las cuentas por pagar",
      });
    }
  } else {
    // Si cancela, solo mostrar mensaje de éxito del pago
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Cuenta marcada como pagada",
    });
  }
};

  const handleEditarCuenta = (updatedCuenta) => {
    setCuentasPagar((prev) =>
      prev.map((c) => (c.id === updatedCuenta.id ? updatedCuenta : c))
    );
    closeModal("editarCuenta");
  };

  const getEstatusClass = (estatus) => {
    switch (estatus) {
      case "Pagado":
        return "cuentaspagar-estatus-pagado";
      case "Vencida":
        return "cuentaspagar-estatus-vencida";
      case "Pendiente":
      default:
        return "cuentaspagar-estatus-pendiente";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-MX");
  };

  const cuentasFiltradas = cuentasPagar.filter((cuenta) => {
    if (filtroEstatus === "Todas") return true;
    return cuenta.estatus === filtroEstatus;
  });

  const cuentasOrdenadas = cuentasFiltradas.sort((a, b) => {
    const fechaA = new Date(a.fecha_pago);
    const fechaB = new Date(b.fecha_pago);
    return fechaA - fechaB; // Orden ascendente (fechas más próximas primero)
  });

  const getDiasRenovacion = (esquema) => {
    const diasPorEsquema = {
      "UNICA": 0,
      "SEMANAL": 7,
      "QUINCENAL": 14,
      "MENSUAL": 30,
      "BIMESTRAL": 60,
      "TRIMESTRAL": 90,
      "SEMESTRAL": 180,
      "ANUAL": 365
    };

    return diasPorEsquema[esquema] || 0;
  };

  return (
    <>
      <Header />
      {isLoading && (
        <div className="cuentaspagar-loading">
          <div className="spinner"></div>
          <p>Cargando datos de cuentas por pagar...</p>
        </div>
      )}
      <main className="cuentaspagar-main-content">
        <div className="cuentaspagar-container">
          <section className="cuentaspagar-sidebar">
            <div className="cuentaspagar-sidebar-header">
              <h3 className="cuentaspagar-sidebar-title">Administración</h3>
            </div>
            <div className="cuentaspagar-sidebar-menu">
              <div className="cuentaspagar-menu-item" onClick={() => handleMenuNavigation("balance")}>
                Balance
              </div>
              <div className="cuentaspagar-menu-item" onClick={() => handleMenuNavigation("transacciones")}>
                Transacciones
              </div>
              <div className="cuentaspagar-menu-item" onClick={() => handleMenuNavigation("cotizaciones")}>
                Cotizaciones
              </div>
              <div className="cuentaspagar-menu-item" onClick={() => handleMenuNavigation("facturacion")}>
                Facturas/Notas
              </div>
              <div className="cuentaspagar-menu-item" onClick={() => handleMenuNavigation("cuentas-cobrar")}>
                Cuentas por Cobrar
              </div>
              <div
                className="cuentaspagar-menu-item cuentaspagar-menu-item-active"
                onClick={() => handleMenuNavigation("cuentas-pagar")}
              >
                Cuentas por Pagar
              </div>
              <div className="cuentaspagar-menu-item" onClick={() => handleMenuNavigation("caja-chica")}>
                Caja chica
              </div>
            </div>
          </section>

          <section className="cuentaspagar-content-panel">
            <div className="cuentaspagar-header">
              <div className="cuentaspagar-header-info">
                <h3 className="cuentaspagar-page-title">Cuentas por Pagar</h3>
                <p className="cuentaspagar-subtitle">Gestión de pagos pendientes</p>
              </div>
            </div>

            <div className="cuentaspagar-table-card">
              <div className="cuentaspagar-table-header">
                <h4 className="cuentaspagar-table-title">Cuentas por pagar</h4>
                <div className="cuentaspagar-filter-container">
                  <label htmlFor="filtroEstatus">Filtrar por estatus:</label>
                  <select
                    id="filtroEstatus"
                    value={filtroEstatus}
                    onChange={(e) => setFiltroEstatus(e.target.value)}
                    className="cuentaspagar-filter-select"
                  >
                    <option value="Todas">Todas</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Vencida">Vencida</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>
              </div>

              <div className="cuentaspagar-table-container">
                <table className="cuentaspagar-table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Fecha de Pago</th>
                      <th>Cuenta</th>
                      <th>Monto</th>
                      <th>Forma de Pago</th>
                      <th>Categoría</th>
                      <th>Renovación (días)</th>
                      <th>Estatus</th>
                      <th>Nota</th>
                      <th>Número de SIM</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuentasOrdenadas.length > 0 ? (
                      cuentasOrdenadas.map((cuenta) => (
                        <tr key={cuenta.id}>
                          <td>
                            {cuenta.folio}
                            {cuenta.sim && <span className="cuentaspagar-sim-id"> -{cuenta.sim.id}</span>}
                          </td>
                          <td>{cuenta.fechaPago}</td>
                          <td>{cuenta.cuenta.nombre}</td>
                          <td>{formatCurrency(cuenta.monto)}</td>
                          <td>{formasPago[cuenta.formaPago]}</td>
                          <td>{cuenta.transaccion?.categoria?.descripcion || "-"}</td>
                          <td>{getDiasRenovacion(cuenta.transaccion?.esquema)}</td>
                          <td>
                            <span className={`cuentaspagar-estatus-badge ${getEstatusClass(cuenta.estatus)}`}>
                              {cuenta.estatus}
                            </span>
                          </td>
                          <td>{cuenta.nota || "-"}</td>
                          <td>{cuenta.sim?.numero || "-"}</td>
                          <td>
                            <div className="cuentaspagar-actions">
                              {cuenta.estatus !== "Pagado" && (
                                <button
                                  className="cuentaspagar-action-btn cuentaspagar-edit-btn"
                                  onClick={() => openModal("editarCuenta", { cuenta })}
                                  title="Editar cuenta"
                                >
                                  <img
                                    src={editIcon}
                                    alt="Editar"
                                    className="cuentaspagar-action-icon"
                                  />
                                </button>
                              )}
                              {cuenta.estatus !== "Pagado" && (
                                <button
                                  className="cuentaspagar-action-btn cuentaspagar-check-btn"
                                  onClick={() => openModal("marcarPagada", { cuenta })}
                                  title="Marcar como pagada"
                                >
                                  <img
                                    src={checkIcon || "/placeholder.svg"}
                                    alt="Marcar como pagada"
                                    className="cuentaspagar-action-icon"
                                  />
                                </button>
                              )}
                              <button
                                className="cuentaspagar-action-btn cuentaspagar-delete-btn"
                                onClick={() => handleDeleteCuenta(cuenta)}
                                title="Eliminar"
                              >
                                <img
                                  src={deleteIcon || "/placeholder.svg"}
                                  alt="Eliminar"
                                  className="cuentaspagar-action-icon"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="cuentaspagar-no-data">
                          {filtroEstatus === "Todas"
                            ? "No hay cuentas por pagar registradas"
                            : `No hay cuentas por pagar con estatus "${filtroEstatus}"`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <MarcarPagadaModal
          isOpen={modals.marcarPagada.isOpen}
          onClose={() => closeModal("marcarPagada")}
          onSave={handleMarcarPagada}
          cuenta={modals.marcarPagada.cuenta}
          formasPago={formasPago}
        />

        <ConfirmarEliminacionModal
          isOpen={modals.confirmarEliminacion.isOpen}
          onClose={() => closeModal("confirmarEliminacion")}
          onConfirm={handleConfirmDelete}
          cuenta={modals.confirmarEliminacion.cuenta}
        />

        <EditarCuentaModal
          isOpen={modals.editarCuenta.isOpen}
          onClose={() => closeModal("editarCuenta")}
          onSave={handleEditarCuenta}
          cuenta={modals.editarCuenta.cuenta}
          formasPago={formasPago}
        />

        <RegenerarModal
          isOpen={modals.regenerar.isOpen}
          onClose={() => closeModal("regenerar")}
          onConfirm={handleRegenerar}
          cuenta={modals.regenerar.cuenta}
        />
      </main>
    </>
  );
};

export default AdminCuentasPagar;
export { MarcarPagadaModal };
