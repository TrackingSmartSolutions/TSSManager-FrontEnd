import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Mapa.css";
import Header from "../Header/Header";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import carIcon from "../../assets/icons/car.png";
import redMarker from "../../assets/icons/marcador-rojo.png";
import blackMarker from "../../assets/icons/marcador.png";

// Define íconos personalizados para los marcadores
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

// Componente para centrar el mapa en las coordenadas especificadas
const MapCenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && (center[0] !== 19.4326 || center[1] !== -99.1332)) {
            console.log('MapCenter setting view to:', center); // Depuración
            map.setView(center, 13);
        }
    }, [center, map]);
    return null;
};

// Componente para manejar marcadores con interacción de clic
const MarkerWithClick = ({ company, coordinatesCache, selectedMarker, setSelectedMarker }) => {
    const map = useMap();
    const isSelected = company.id === selectedMarker?.id;
    const position = coordinatesCache[company.id];

    // Maneja el clic en un marcador para seleccionarlo y centrar el mapa
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
    const navigate = useNavigate();
    const { companies, selectedCompany } = location.state || {};

    // Estados para manejar caché de coordenadas, marcador seleccionado, errores y carga
    const [coordinatesCache, setCoordinatesCache] = useState({});
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false);

    // Función para obtener coordenadas de una dirección usando Nominatim
    const geocodeAddress = async (address) => {
        if (coordinatesCache[address]) {
            return coordinatesCache[address];
        }

        const formattedAddress = address.endsWith(", México") ? address : `${address}, México`;

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formattedAddress)}&limit=1`
            );
            if (!response.ok) {
                throw new Error("Error fetching coordinates from Nominatim");
            }
            const data = await response.json();

            if (data.length > 0) {
                const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                setCoordinatesCache((prev) => ({ ...prev, [address]: coords }));
                return coords;
            } else {
                throw new Error(`No se encontraron coordenadas para: ${address}`);
            }
        } catch (err) {
            setError(`Error geocoding: ${err.message}`);
            return null;
        }
    };

    // Obtiene coordenadas para todas las empresas al cargar el componente
    useEffect(() => {
        const fetchCoordinates = async () => {
            if (!companies) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const promises = companies.map(async (company) => {
                if (company.domicilioFisico) {
                    const coords = await geocodeAddress(company.domicilioFisico);
                    return { id: company.id, coords };
                }
                return { id: company.id, coords: null };
            });

            const results = await Promise.all(promises);
            const newCache = results.reduce((acc, { id, coords }) => {
                if (coords) {
                    acc[id] = coords;
                }
                return acc;
            }, {});

            setCoordinatesCache((prev) => ({ ...prev, ...newCache }));
            setIsLoading(false);
        };

        fetchCoordinates();
    }, [companies]);

    // Actualiza el marcador seleccionado cuando cambia la empresa seleccionada
    useEffect(() => {
        if (selectedCompany && !coordinatesCache[selectedCompany.id] && !isLoading) {
            geocodeAddress(selectedCompany.domicilioFisico).then((coords) => {
                if (coords) {
                    setCoordinatesCache((prev) => ({ ...prev, [selectedCompany.id]: coords }));
                    setSelectedMarker(selectedCompany);
                }
            });
        } else if (selectedCompany && coordinatesCache[selectedCompany.id]) {
            setSelectedMarker(selectedCompany);
        }
    }, [selectedCompany, coordinatesCache, isLoading]);

    // Controla la interacción del mapa cuando el menú desplegable está abierto
    useEffect(() => {
        const mapElement = document.querySelector('.leaflet-map');
        if (mapElement) {
            mapElement.style.pointerEvents = isCrmDropdownOpen ? 'none' : 'auto';
        }
    }, [isCrmDropdownOpen]);

    // Centro por defecto del mapa (Ciudad de México)
    const defaultCenter = [19.4326, -99.1332];
    const center = selectedCompany && coordinatesCache[selectedCompany?.id] ? coordinatesCache[selectedCompany.id] : defaultCenter;

    // Filtra empresas con coordenadas válidas
    const companiesWithCoords = companies?.filter(
        (company) => coordinatesCache[company.id] && company.domicilioFisico
    ) || [];

    // Mapas para traducir estados y sectores a texto legible
    const statusMap = {
        POR_CONTACTAR: "Por Contactar",
        EN_PROCESO: "En Proceso",
        CONTACTAR_MAS_ADELANTE: "Contactar Más Adelante",
        PERDIDO: "Perdido",
        CLIENTE: "Cliente",
    };

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
        SALUD: "(62) Servicios de health y de asistencia social",
        ESPARCIMIENTO: "(71) Servicios de esparcimiento culturales y deportivos",
        ALOJAMIENTO: "(72) Servicios de alojamiento temporal y de preparación de alimentos",
        OTROS_SERVICIOS: "(81) Otros servicios excepto actividades gubernamentales",
        GUBERNAMENTAL: "(93) Actividades legislativas, gubernamentales, de impartición de justicia",
    };

    const getStatusText = (status) => statusMap[status] || status;
    const getSectorText = (sector) => sectorMap[sector] || sector || "N/A";

    // Abre Google Maps para obtener direcciones al marcador seleccionado
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
                    <p>Cargando mapa...</p>
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
                    <MapContainer center={center} zoom={13} className="leaflet-map" style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <MapCenter center={center} />
                        {companiesWithCoords.map((company) => (
                            <MarkerWithClick
                                key={company.id}
                                company={company}
                                coordinatesCache={coordinatesCache}
                                selectedMarker={selectedMarker}
                                setSelectedMarker={setSelectedMarker}
                            />
                        ))}
                    </MapContainer>
                </div>
                <div className="mapa-sidebar">
                    {selectedMarker ? (
                        <>
                            <h3>{selectedMarker.nombre}</h3>
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
                                <p><strong>Sector:</strong> {getSectorText(selectedMarker.sector)}</p>
                                <p><strong>Domicilio Físico:</strong> {selectedMarker.domicilioFisico}</p>
                            </div>
                            <div className="mapa-directions-button">
                                <button onClick={handleGetDirections} className="mapa-btn mapa-btn-directions" title="Obtener direcciones">
                                    <img src={carIcon} alt="Obtener direcciones" className="mapa-car-icon" />
                                </button>
                            </div>
                            <button className="mapa-btn mapa-btn-secondary" onClick={() => setSelectedMarker(null)}>
                                Cerrar
                            </button>
                        </>
                    ) : (
                        <p>Selecciona un marcador para ver los detalles</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Mapa