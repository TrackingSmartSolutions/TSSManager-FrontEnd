import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Mapa.css";
import Header from "../Header/Header";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import carIcon from "../../assets/icons/car.png";
import redMarker from "../../assets/icons/marcador-rojo.png";
import blackMarker from "../../assets/icons/marcador.png";
import AddressCleaner from '../Utils/AddressCleaner';


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
    const { companies, selectedCompany } = location.state || {};

    // Estados para manejar caché de coordenadas, marcador seleccionado, errores, carga y filtro de sector
    const [coordinatesCache, setCoordinatesCache] = useState({});
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false);
    const [selectedSector, setSelectedSector] = useState("TODOS");

    const addressCleaner = new AddressCleaner();


    // Mapa de sectores
    const sectorMap = {
        // SECTOR PRIMARIO
        AGRICULTURA_CULTIVOS: "(11) Agricultura - Cultivos y horticultura",
        AGRICULTURA_GANADERIA: "(11) Agricultura - Ganadería y avicultura",
        AGRICULTURA_FORESTAL: "(11) Agricultura - Forestal y silvicultura",
        AGRICULTURA_PESCA: "(11) Agricultura - Pesca y acuacultura",

        // MINERÍA
        MINERIA_PETROLEO: "(21) Minería - Petróleo y gas",
        MINERIA_MINERALES: "(21) Minería - Minerales metálicos",
        MINERIA_NO_METALICOS: "(21) Minería - Minerales no metálicos",
        MINERIA_CARBON: "(21) Minería - Carbón y otros",

        // ENERGÍA Y SERVICIOS PÚBLICOS  
        ENERGIA_ELECTRICA: "(22) Energía - Generación eléctrica",
        ENERGIA_GAS: "(22) Energía - Suministro de gas",
        ENERGIA_AGUA: "(22) Energía - Suministro de agua",
        ENERGIA_RENOVABLE: "(22) Energía - Renovables",

        // CONSTRUCCIÓN
        CONSTRUCCION_EDIFICACION: "(23) Construcción - Edificación residencial",
        CONSTRUCCION_INDUSTRIAL: "(23) Construcción - Obras industriales",
        CONSTRUCCION_INFRAESTRUCTURA: "(23) Construcción - Infraestructura",
        CONSTRUCCION_ESPECIALIZADA: "(23) Construcción - Trabajos especializados",

        // MANUFACTURA
        MANUFACTURA_ALIMENTOS: "(31) Manufactura - Alimentos y bebidas",
        MANUFACTURA_TEXTIL: "(31) Manufactura - Textil y confección",
        MANUFACTURA_MADERA: "(31) Manufactura - Madera y muebles",
        MANUFACTURA_PAPEL: "(31) Manufactura - Papel e impresión",
        MANUFACTURA_QUIMICA: "(32) Manufactura - Química y petroquímica",
        MANUFACTURA_PLASTICOS: "(32) Manufactura - Plásticos y caucho",
        MANUFACTURA_MINERALES: "(32) Manufactura - Productos minerales no metálicos",
        MANUFACTURA_METAL_BASIC: "(33) Manufactura - Industrias metálicas básicas",
        MANUFACTURA_METAL_PROD: "(33) Manufactura - Productos metálicos",
        MANUFACTURA_MAQUINARIA: "(33) Manufactura - Maquinaria y equipo",
        MANUFACTURA_ELECTRONICA: "(33) Manufactura - Electrónica y computación",
        MANUFACTURA_ELECTRICA: "(33) Manufactura - Equipo eléctrico",
        MANUFACTURA_TRANSPORTE: "(33) Manufactura - Equipo de transporte",
        MANUFACTURA_OTROS: "(33) Manufactura - Otras industrias",

        // COMERCIO AL POR MAYOR
        COMERCIO_MAYOR_AGRICOLA: "(43) Comercio mayoreo - Productos agrícolas",
        COMERCIO_MAYOR_ALIMENTOS: "(43) Comercio mayoreo - Alimentos procesados",
        COMERCIO_MAYOR_BEBIDAS: "(43) Comercio mayoreo - Bebidas y tabaco",
        COMERCIO_MAYOR_TEXTIL: "(43) Comercio mayoreo - Textiles y vestido",
        COMERCIO_MAYOR_FARMACEUTICO: "(43) Comercio mayoreo - Productos farmacéuticos",
        COMERCIO_MAYOR_QUIMICOS: "(43) Comercio mayoreo - Productos químicos",
        COMERCIO_MAYOR_PETROLEO: "(43) Comercio mayoreo - Productos de petróleo",
        COMERCIO_MAYOR_MATERIALES: "(43) Comercio mayoreo - Materiales construcción",
        COMERCIO_MAYOR_MAQUINARIA: "(43) Comercio mayoreo - Maquinaria y equipo",
        COMERCIO_MAYOR_ELECTRONICA: "(43) Comercio mayoreo - Electrónicos",
        COMERCIO_MAYOR_VEHICULOS: "(43) Comercio mayoreo - Vehículos y refacciones",
        COMERCIO_MAYOR_MUEBLES: "(43) Comercio mayoreo - Muebles y enseres",
        COMERCIO_MAYOR_OTROS: "(43) Comercio mayoreo - Otros productos",

        // COMERCIO AL POR MENOR
        COMERCIO_MENOR_ALIMENTOS: "(46) Comercio menudeo - Alimentos y bebidas",
        COMERCIO_MENOR_ABARROTES: "(46) Comercio menudeo - Abarrotes y ultramarinos",
        COMERCIO_MENOR_FARMACIA: "(46) Comercio menudeo - Farmacias",
        COMERCIO_MENOR_COMBUSTIBLES: "(46) Comercio menudeo - Combustibles",
        COMERCIO_MENOR_VESTIDO: "(46) Comercio menudeo - Ropa y calzado",
        COMERCIO_MENOR_MUEBLES: "(46) Comercio menudeo - Muebles y electrodomésticos",
        COMERCIO_MENOR_ELECTRONICA: "(46) Comercio menudeo - Electrónicos",
        COMERCIO_MENOR_FERRETERIA: "(46) Comercio menudeo - Ferretería y materiales",
        COMERCIO_MENOR_VEHICULOS: "(46) Comercio menudeo - Vehículos automotores",
        COMERCIO_MENOR_REFACCIONES: "(46) Comercio menudeo - Refacciones y accesorios",
        COMERCIO_MENOR_DEPARTAMENTAL: "(46) Comercio menudeo - Tiendas departamentales",
        COMERCIO_MENOR_OTROS: "(46) Comercio menudeo - Otros productos",

        // TRANSPORTE Y LOGÍSTICA
        TRANSPORTE_AEREO: "(48) Transporte - Aéreo",
        TRANSPORTE_FERROVIARIO: "(48) Transporte - Ferroviario",
        TRANSPORTE_MARITIMO: "(48) Transporte - Marítimo",
        TRANSPORTE_TERRESTRE_CARGA: "(48) Transporte - Terrestre de carga",
        TRANSPORTE_TERRESTRE_PASAJE: "(49) Transporte - Terrestre de pasajeros",
        TRANSPORTE_TURISTICO: "(49) Transporte - Turístico",
        TRANSPORTE_CORREOS: "(49) Servicios - Correos y paquetería",
        TRANSPORTE_ALMACENAMIENTO: "(49) Servicios - Almacenamiento",

        // MEDIOS E INFORMACIÓN
        MEDIOS_EDITORIALES: "(51) Medios - Industrias editoriales",
        MEDIOS_AUDIOVISUAL: "(51) Medios - Industrias audiovisuales",
        MEDIOS_RADIO_TV: "(51) Medios - Radio y televisión",
        MEDIOS_TELECOMUNICACIONES: "(51) Medios - Telecomunicaciones",
        MEDIOS_PROCESAMIENTO_DATOS: "(51) Medios - Procesamiento de datos",
        MEDIOS_OTROS: "(51) Medios - Otros servicios información",

        // SERVICIOS FINANCIEROS
        FINANCIERO_BANCA: "(52) Financiero - Instituciones bancarias",
        FINANCIERO_VALORES: "(52) Financiero - Actividades bursátiles",
        FINANCIERO_SEGUROS: "(52) Financiero - Seguros y fianzas",
        FINANCIERO_PENSIONES: "(52) Financiero - Fondos y pensiones",
        FINANCIERO_OTROS: "(52) Financiero - Otros servicios financieros",

        // INMOBILIARIO Y ALQUILER
        INMOBILIARIO_COMPRAVENTA: "(53) Inmobiliario - Compraventa de inmuebles",
        INMOBILIARIO_ALQUILER: "(53) Inmobiliario - Alquiler de inmuebles",
        INMOBILIARIO_MAQUINARIA: "(53) Servicios - Alquiler de maquinaria",
        INMOBILIARIO_VEHICULOS: "(53) Servicios - Alquiler de vehículos",
        INMOBILIARIO_OTROS: "(53) Servicios - Alquiler de otros bienes",

        // SERVICIOS PROFESIONALES
        PROFESIONAL_JURIDICOS: "(54) Profesional - Servicios jurídicos",
        PROFESIONAL_CONTABLES: "(54) Profesional - Servicios contables",
        PROFESIONAL_ARQUITECTURA: "(54) Profesional - Arquitectura e ingeniería",
        PROFESIONAL_DISENO: "(54) Profesional - Diseño especializado",
        PROFESIONAL_CONSULTORIA: "(54) Profesional - Consultoría",
        PROFESIONAL_INVESTIGACION: "(54) Profesional - Investigación científica",
        PROFESIONAL_PUBLICIDAD: "(54) Profesional - Publicidad y marketing",
        PROFESIONAL_VETERINARIOS: "(54) Profesional - Servicios veterinarios",
        PROFESIONAL_OTROS: "(54) Profesional - Otros servicios técnicos",

        // CORPORATIVOS
        CORPORATIVO_HOLDING: "(55) Corporativo - Tenencia de acciones",
        CORPORATIVO_MATRIZ: "(55) Corporativo - Casas matrices",

        // APOYO A NEGOCIOS
        APOYO_EMPLEO: "(56) Apoyo - Servicios de empleo",
        APOYO_ADMINISTRATIVO: "(56) Apoyo - Servicios administrativos",
        APOYO_SEGURIDAD: "(56) Apoyo - Servicios de seguridad",
        APOYO_LIMPIEZA: "(56) Apoyo - Servicios de limpieza",
        APOYO_PAISAJISMO: "(56) Apoyo - Jardinería y paisajismo",
        APOYO_VIAJES: "(56) Apoyo - Agencias de viajes",
        APOYO_INVESTIGACION: "(56) Apoyo - Servicios de investigación",
        APOYO_DESECHOS: "(56) Apoyo - Manejo de desechos",
        APOYO_OTROS: "(56) Apoyo - Otros servicios",

        // EDUCACIÓN
        EDUCACION_PREESCOLAR: "(61) Educación - Preescolar",
        EDUCACION_PRIMARIA: "(61) Educación - Primaria",
        EDUCACION_SECUNDARIA: "(61) Educación - Secundaria",
        EDUCACION_MEDIA_SUPERIOR: "(61) Educación - Media superior",
        EDUCACION_SUPERIOR: "(61) Educación - Superior",
        EDUCACION_POSGRADO: "(61) Educación - Posgrado",
        EDUCACION_TECNICA: "(61) Educación - Técnica y capacitación",
        EDUCACION_OTROS: "(61) Educación - Otros servicios educativos",

        // SALUD
        SALUD_HOSPITALES: "(62) Salud - Servicios hospitalarios",
        SALUD_AMBULATORIOS: "(62) Salud - Servicios ambulatorios",
        SALUD_ASISTENCIA_SOCIAL: "(62) Salud - Servicios de asistencia social",

        // ESPARCIMIENTO
        ESPARCIMIENTO_ARTISTICOS: "(71) Esparcimiento - Servicios artísticos",
        ESPARCIMIENTO_DEPORTIVOS: "(71) Esparcimiento - Servicios deportivos",
        ESPARCIMIENTO_RECREATIVOS: "(71) Esparcimiento - Servicios recreativos",
        ESPARCIMIENTO_MUSEOS: "(71) Esparcimiento - Museos y sitios históricos",
        ESPARCIMIENTO_OTROS: "(71) Esparcimiento - Otros servicios",

        // ALOJAMIENTO Y ALIMENTOS
        ALOJAMIENTO_HOTELES: "(72) Alojamiento - Hoteles y moteles",
        ALOJAMIENTO_TEMPORAL: "(72) Alojamiento - Otros alojamientos",
        ALIMENTOS_RESTAURANTES: "(72) Alimentos - Restaurantes con servicio",
        ALIMENTOS_LIMITADO: "(72) Alimentos - Establecimientos con servicio limitado",
        ALIMENTOS_PREPARACION: "(72) Alimentos - Servicios de preparación",

        // OTROS SERVICIOS
        OTROS_REPARACION: "(81) Otros - Reparación y mantenimiento",
        OTROS_PERSONALES: "(81) Otros - Servicios personales",
        OTROS_RELIGIOSOS: "(81) Otros - Organizaciones religiosas",
        OTROS_CIVICAS: "(81) Otros - Organizaciones cívicas",
        OTROS_PROFESIONALES: "(81) Otros - Organizaciones profesionales",
        OTROS_LABORALES: "(81) Otros - Organizaciones laborales",
        OTROS_POLITICAS: "(81) Otros - Organizaciones políticas",

        // GUBERNAMENTAL
        GUBERNAMENTAL_FEDERAL: "(93) Gubernamental - Órganos legislativos federales",
        GUBERNAMENTAL_ESTATAL: "(93) Gubernamental - Órganos legislativos estatales",
        GUBERNAMENTAL_MUNICIPAL: "(93) Gubernamental - Órganos legislativos municipales",
        GUBERNAMENTAL_JUSTICIA: "(93) Gubernamental - Impartición de justicia",
        GUBERNAMENTAL_SEGURIDAD: "(93) Gubernamental - Seguridad nacional",
        GUBERNAMENTAL_OTROS: "(93) Gubernamental - Otras actividades",

        // PARTICULAR
        PARTICULAR: "(99) Particular"
    };

    // Función para obtener coordenadas de una dirección usando Nominatim
    const geocodeAddress = async (address) => {
        if (coordinatesCache[address]) {
            return coordinatesCache[address];
        }

        // Limpiar la dirección usando AddressCleaner
        const cleanedAddress = addressCleaner.cleanAddress(address);
        console.log(`Dirección original: ${address}`);
        console.log(`Dirección limpia: ${cleanedAddress}`);

        // Verificar si ya tenemos la dirección limpia en caché
        if (coordinatesCache[cleanedAddress]) {
            // Guardar también la dirección original en caché
            setCoordinatesCache(prev => ({ ...prev, [address]: coordinatesCache[cleanedAddress] }));
            return coordinatesCache[cleanedAddress];
        }

        const formattedAddress = cleanedAddress.endsWith(", México") ? cleanedAddress : `${cleanedAddress}, México`;

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
                // Guardar en caché tanto la dirección original como la limpia
                setCoordinatesCache((prev) => ({
                    ...prev,
                    [address]: coords,
                    [cleanedAddress]: coords
                }));
                return coords;
            } else {
                // Si no se encuentra con la dirección limpia, intentar con la original
                console.log(`No se encontraron coordenadas para dirección limpia: ${cleanedAddress}`);
                console.log(`Intentando con dirección original: ${address}`);

                const originalFormattedAddress = address.endsWith(", México") ? address : `${address}, México`;
                const fallbackResponse = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originalFormattedAddress)}&limit=1`
                );

                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.length > 0) {
                        const coords = [parseFloat(fallbackData[0].lat), parseFloat(fallbackData[0].lon)];
                        setCoordinatesCache((prev) => ({ ...prev, [address]: coords }));
                        return coords;
                    }
                }

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
    const center = selectedMarker && coordinatesCache[selectedMarker?.id] ? coordinatesCache[selectedMarker.id] : defaultCenter;

    // Filtra empresas con coordenadas válidas y por sector seleccionado
    const companiesWithCoords = companies?.filter(
        (company) => coordinatesCache[company.id] && company.domicilioFisico && (selectedSector === "TODOS" || company.sector === selectedSector)
    ) || [];

    // Mapas para traducir estados a texto legible
    const statusMap = {
        POR_CONTACTAR: "Por Contactar",
        EN_PROCESO: "En Proceso",
        CONTACTAR_MAS_ADELANTE: "Contactar Más Adelante",
        PERDIDO: "Perdido",
        CLIENTE: "Cliente",
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
                    <div className="mapa-filter">
                        <label htmlFor="sectorFilter">Filtrar por Sector: </label>
                        <select
                            id="sectorFilter"
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                            className="mapa-filter-select"
                        >
                            <option value="TODOS">Todos</option>
                            {Object.keys(sectorMap).map((sector) => (
                                <option key={sector} value={sector}>
                                    {sectorMap[sector]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <MapContainer center={center} zoom={13} className="leaflet-map" style={{ height: "calc(100% - 40px)", width: "100%" }}>
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

export default Mapa;