import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import "./Mapa.css";
import Header from "../Header/Header";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import carIcon from "../../assets/icons/car.png";
import redMarker from "../../assets/icons/marcador-rojo.png";
import blackMarker from "../../assets/icons/marcador.png";
import { API_BASE_URL } from "../Config/Config";

const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
    }

    return response;
};

const redIcon = new L.Icon({
    iconUrl: redMarker,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

const blackIcon = new L.Icon({
    iconUrl: blackMarker,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
});

const MapCenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && (center[0] !== 21.1269 || center[1] !== -101.6968)) {
            map.setView(center, 13);
        }
    }, [center, map]);
    return null;
};

const MarkerWithClick = ({ company, selectedMarker, setSelectedMarker }) => {
    const map = useMap();
    const isSelected = company.id === selectedMarker?.id;
    const position = company.latitud && company.longitud ? [company.latitud, company.longitud] : null;

    const handleClick = () => {
        setSelectedMarker(company);
        if (position) {
            map.setView(position, 13);
        }
    };

    return position ? (
        <Marker
            key={company.id}
            position={position}
            icon={isSelected ? redIcon : blackIcon}
            eventHandlers={{
                click: handleClick,
            }}
        >
            <Popup>{company.nombre}</Popup>
        </Marker>
    ) : null;
};

const Mapa = () => {
    const location = useLocation();
    const { companies: initialCompanies, selectedCompany } = location.state || {};
    const [companies, setCompanies] = useState(initialCompanies || []);

    const [selectedMarker, setSelectedMarker] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false);
    const [sectores, setSectores] = useState([]);
    const [selectedSector, setSelectedSector] = useState("TODOS");
    const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

    const loadSectores = async () => {
        try {
            const response = await fetchWithToken(`${API_BASE_URL}/sectores`);
            if (response.ok) {
                const sectoresData = await response.json();
                setSectores(sectoresData);
            }
        } catch (error) {
            console.error('Error loading sectores:', error);
        }
    };

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                setIsLoading(true);
                await loadSectores();

                if (initialCompanies && initialCompanies.length > 0) {
                    setCompanies(initialCompanies);
                } else {
                    const response = await fetchWithToken(`${API_BASE_URL}/coordenadas/empresas`);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const companiesData = await response.json();
                    setCompanies(companiesData);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading companies:', error);
                setError('Error cargando empresas: ' + error.message);
                setIsLoading(false);
            }
        };

        loadCompanies();
    }, [initialCompanies]);

    useEffect(() => {
        if (selectedCompany) {
            if (selectedCompany.latitud && selectedCompany.longitud) {
                setSelectedMarker(selectedCompany);
            } else {
                console.log(`Empresa ${selectedCompany.nombre} no tiene coordenadas.`);
            }
        }
    }, [selectedCompany]);

    useEffect(() => {
        const mapElement = document.querySelector('.leaflet-map');
        if (mapElement) {
            mapElement.style.pointerEvents = isCrmDropdownOpen ? 'none' : 'auto';
        }
    }, [isCrmDropdownOpen]);


    // Centro por defecto del mapa (Leon gto)
    const defaultCenter = [21.1269, -101.6968];
    const center = selectedMarker && selectedMarker.latitud && selectedMarker.longitud
        ? [selectedMarker.latitud, selectedMarker.longitud]
        : defaultCenter;

    // Filtra empresas con coordenadas válidas y por sector seleccionado
    const companiesWithCoords = useMemo(() => {
        return companies?.filter(
            (company) =>
                company.latitud &&
                company.longitud &&
                (selectedSector === "TODOS" || company.sectorId === parseInt(selectedSector))
        ) || [];
    }, [companies, selectedSector]);

    const displayedCompanies = useMemo(() => {
        // Si hay muchos marcadores, mostrar solo algunos en zoom bajo
        if (companiesWithCoords.length > 100) {
            const filtered = companiesWithCoords.filter((_, index) => index % 2 === 0);

            // ASEGURAR que la empresa seleccionada siempre esté incluida
            if (selectedMarker && !filtered.find(c => c.id === selectedMarker.id)) {
                const selectedCompany = companiesWithCoords.find(c => c.id === selectedMarker.id);
                if (selectedCompany) {
                    filtered.push(selectedCompany);
                }
            }

            return filtered;
        }
        return companiesWithCoords;
    }, [companiesWithCoords, selectedMarker]);

    // Mapas para traducir estados a texto legible
    const statusMap = {
        POR_CONTACTAR: "Por Contactar",
        EN_PROCESO: "En Proceso",
        CONTACTAR_MAS_ADELANTE: "Contactar Más Adelante",
        PERDIDO: "Perdido",
        CLIENTE: "Cliente",
    };

    const getStatusText = (status) => statusMap[status] || status;
    const getSectorText = (sectorId) => {
        if (!sectorId) return "N/A";
        const sector = sectores.find(s => s.id === sectorId);
        return sector ? sector.nombreSector : "N/A";
    };

    const handleGetDirections = () => {
        if (selectedMarker?.domicilioFisico && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const origin = `${latitude},${longitude}`;
                    const destination = encodeURIComponent(selectedMarker.domicilioFisico);
                    const googleMapsUrl = `https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&travelmode=driving`;
                    window.open(googleMapsUrl, "_blank");
                },
                (err) => {
                    console.error("Geolocation error for directions:", err);
                    const destination = encodeURIComponent(selectedMarker.domicilioFisico);
                    const googleMapsUrl = `https://maps.google.com/maps?daddr=${destination}&travelmode=driving`;
                    window.open(googleMapsUrl, "_blank");
                }
            );
        } else if (selectedMarker?.domicilioFisico) {
            const destination = encodeURIComponent(selectedMarker.domicilioFisico);
            const googleMapsUrl = `https://maps.google.com/maps?daddr=${destination}&travelmode=driving`;
            window.open(googleMapsUrl, "_blank");
        }
    };

    // Muestra un indicador de carga mientras se obtienen las coordenadas
    if (isLoading) {
        return (
            <div className="mapa-screen">
                <Header isCrmDropdownOpen={isCrmDropdownOpen} setIsCrmDropdownOpen={setIsCrmDropdownOpen} />
                <div className="mapa-content">
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>Cargando empresas...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Renderiza el mapa y la barra lateral con detalles del marcador seleccionado
    return (

        <div className="mapa-screen">
            <Header isCrmDropdownOpen={isCrmDropdownOpen} setIsCrmDropdownOpen={setIsCrmDropdownOpen} />
            <div className="mapa-content">
                {error && <div className="mapa-error">{error}</div>}
                <div className="mapa-container">
                    <div className="mapa-filter">
                        {/* Header principal del filtro */}
                        <div className="mapa-filter-header">
                            <button
                                className="mapa-collapse-btn mapa-main-collapse"
                                onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                            >
                                <span className="collapse-icon">{isFilterCollapsed ? '📍' : '✕'}</span>
                                <span className="collapse-text">Filtros</span>
                            </button>
                        </div>

                        {/* Contenido colapsable principal */}
                        <div className={`mapa-filter-content ${isFilterCollapsed ? 'collapsed' : 'expanded'}`}>
                            {/* Sección del filtro de sector */}
                            <div className="mapa-sector-section">
                                <div className="mapa-sector-header">
                                    <label htmlFor="sectorFilter" className="sector-label">
                                        <span className="label-icon">🏢</span>
                                        Filtrar por Sector:
                                    </label>
                                </div>
                                <select
                                    id="sectorFilter"
                                    value={selectedSector}
                                    onChange={(e) => setSelectedSector(e.target.value)}
                                    className="mapa-filter-select"
                                >
                                    <option value="TODOS">📋 Todos los Sectores</option>
                                    {sectores.map((sector) => (
                                        <option key={sector.id} value={sector.id}>
                                            {sector.nombreSector}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Información adicional */}
                            <div className="mapa-stats">
                                <div className="stat-item">
                                    <span className="stat-icon">📍</span>
                                    <span className="stat-text">
                                        {companiesWithCoords.length} empresas visibles
                                    </span>
                                </div>
                                {selectedSector !== "TODOS" && (
                                    <div className="stat-item">
                                        <span className="stat-icon">🏷️</span>
                                        <span className="stat-text">
                                            Sector: {sectores.find(s => s.id === parseInt(selectedSector))?.nombreSector || selectedSector}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <MapContainer center={center} zoom={13} className="leaflet-map" style={{ height: "calc(100% - 40px)", width: "100%" }}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
                            subdomains="abcd"
                            tileSize={256}
                            keepBuffer={2}
                            preferCanvas={true}
                            zoomSnap={0.5}
                            zoomDelta={0.5}
                            wheelPxPerZoomLevel={60}
                            maxZoom={16}
                            minZoom={9}
                        />
                        <MapCenter center={center} />
                        {displayedCompanies.map((company) => (
                            <MarkerWithClick
                                key={company.id}
                                company={company}
                                selectedMarker={selectedMarker}
                                setSelectedMarker={setSelectedMarker}
                            />
                        ))}
                    </MapContainer>
                </div>
                <div className="mapa-sidebar">
                    {selectedMarker ? (
                        <>
                            <div className="mapa-sidebar-header">
                                <h3>{selectedMarker.nombre}</h3>
                            </div>

                            <div className="mapa-details">
                                <p><strong>Estatus:</strong> {getStatusText(selectedMarker.estatus)}</p>
                                <p>
                                    <strong>Sitio Web:</strong>{" "}
                                    {selectedMarker.sitioWeb ? (
                                        <a href={selectedMarker.sitioWeb} target="_blank" rel="noopener noreferrer">
                                            {selectedMarker.sitioWeb}
                                        </a>
                                    ) : (
                                        "N/A"
                                    )}
                                </p>
                                <p><strong>Sector:</strong> {getSectorText(selectedMarker.sectorId)}</p>
                                <p><strong>Domicilio Físico:</strong> {selectedMarker.domicilioFisico}</p>
                            </div>

                            <div className="mapa-sidebar-footer">
                                <button onClick={handleGetDirections} className="mapa-btn mapa-btn-directions" title="Ir a la dirección">
                                    <img src={carIcon} alt="Obtener direcciones" className="mapa-car-icon" />
                                    <span>Dirección</span>
                                </button>
                                <button className="mapa-btn mapa-btn-secondary" onClick={() => setSelectedMarker(null)}>
                                    Cerrar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="mapa-empty-state">
                            <div className="mapa-empty-icon">📍</div>
                            <h3>Sin empresa seleccionada</h3>
                            <p>Haz clic en un marcador del mapa para ver sus detalles completos aquí.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Mapa;