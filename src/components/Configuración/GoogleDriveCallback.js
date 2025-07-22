import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../Config/Config";

const GoogleDriveCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false); // Evita doble procesamiento

  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la solicitud: ${response.status} - ${errorText}`);
    }
    return response;
  };

  useEffect(() => {
    // Prevenir múltiples ejecuciones
    if (hasProcessed.current) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    const handleCallback = async () => {
      // Marcar como procesado inmediatamente
      hasProcessed.current = true;

      try {
        // Si Google devolvió un error (usuario canceló o negó permisos)
        if (error) {
          await Swal.fire({
            icon: "warning",
            title: "Autenticación cancelada",
            text: "No se pudo vincular la cuenta de Google Drive.",
          });
          navigate("/configuracion_copias_seguridad");
          return;
        }

        // Si no hay código, redirigir
        if (!code || !state) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Parámetros de autenticación inválidos.",
          });
          navigate("/configuracion_copias_seguridad");
          return;
        }

        console.log("Procesando callback con código:", code.substring(0, 20) + "...");
        
        const response = await fetchWithToken(
          `${API_BASE_URL}/copias-seguridad/google-drive/callback?code=${encodeURIComponent(code)}&state=${state}`,
          { method: 'GET' } // Especificar método explícitamente
        );
        
        const data = await response.json();
        
        await Swal.fire({
          icon: "success",
          title: "Cuenta vinculada",
          text: data.message || "Google Drive se ha vinculado correctamente.",
        });
        
        navigate("/configuracion_copias_seguridad");
        
      } catch (error) {
        console.error("Error al procesar callback:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo vincular la cuenta de Google Drive.",
        });
        navigate("/configuracion_copias_seguridad");
      }
    };

    handleCallback();
  }, []); // Dependencias vacías, solo se ejecuta una vez

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div>Procesando autenticación con Google Drive...</div>
      <div style={{ marginTop: '20px' }}>Por favor espere...</div>
    </div>
  );
};

export default GoogleDriveCallback;