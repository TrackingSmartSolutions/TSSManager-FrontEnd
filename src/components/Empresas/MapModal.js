import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
const MapModal = ({ isOpen, onClose, onLocationSelect, initialAddress }) => {
    const [position, setPosition] = useState([21.1269, -101.6968]);
    const [searchQuery, setSearchQuery] = useState(initialAddress || '');
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [address, setAddress] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const mapRef = useRef(null);

    const createCustomIcon = () => {
        const svgIcon = `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 7.2 12.5 28.5 12.5 28.5s12.5-21.3 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#e74c3c"/>
        <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
        <circle cx="12.5" cy="12.5" r="3" fill="#e74c3c"/>
      </svg>
    `;

        const iconUrl = 'data:image/svg+xml;base64,' + btoa(svgIcon);

        return window.L.icon({
            iconUrl: iconUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            shadowSize: [41, 41]
        });
    };

    useEffect(() => {
        if (isOpen && !leafletLoaded) {
            const loadLeaflet = async () => {
                if (!window.L) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
                    document.head.appendChild(link);

                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';

                    script.onload = () => {
                        setTimeout(() => {
                            setLeafletLoaded(true);
                        }, 100);
                    };
                    document.head.appendChild(script);
                } else {
                    setLeafletLoaded(true);
                }
            };

            loadLeaflet();
        }
    }, [isOpen, leafletLoaded]);

    useEffect(() => {
        if (isOpen && leafletLoaded && mapRef.current && !map) {
            setTimeout(() => {
                try {
                    const newMap = window.L.map(mapRef.current, {
                        center: position,
                        zoom: 13,
                        dragging: true,
                        touchZoom: true,
                        doubleClickZoom: true,
                        scrollWheelZoom: true,
                        boxZoom: true,
                        keyboard: true,
                        zoomControl: true,
                        tap: false,
                        tapTolerance: 15,
                        trackResize: true,
                        inertia: true,
                        inertiaDeceleration: 3000,
                        inertiaMaxSpeed: Infinity,
                        easeLinearity: 0.2,
                        worldCopyJump: false,
                        maxBoundsViscosity: 0.0
                    });

                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19
                    }).addTo(newMap);

                    const handleMapClick = (e) => {
                        if (e.originalEvent) {
                            e.originalEvent.stopPropagation();
                        }

                        handleLocationSelect(e.latlng);
                    };

                    newMap.on('click', handleMapClick);
                    newMap.on('tap', handleMapClick);
                    newMap.on('dragstart', () => {
                        if (mapRef.current) {
                            mapRef.current.style.cursor = 'grabbing';
                        }
                    });

                    newMap.on('dragend', () => {
                        if (mapRef.current) {
                            mapRef.current.style.cursor = 'grab';
                        }
                    });
                    newMap.scrollWheelZoom.enable();

                    // Esperar a que el mapa esté completamente cargado
                    newMap.whenReady(() => {
                        newMap.invalidateSize();
                        // Forzar que el mapa tome el control de los eventos
                        const container = newMap.getContainer();
                        container.style.cursor = 'grab';

                        // Re-habilitar todas las interacciones
                        newMap.dragging.enable();
                        newMap.scrollWheelZoom.enable();
                        newMap.doubleClickZoom.enable();
                        newMap.boxZoom.enable();
                        newMap.keyboard.enable();

                        console.log('Mapa listo y eventos habilitados');
                    });

                    setMap(newMap);

                    // Invalidaciones adicionales por si acaso
                    setTimeout(() => {
                        if (newMap) {
                            newMap.invalidateSize();
                            newMap.dragging.enable();
                        }
                    }, 200);
                    setTimeout(() => {
                        if (newMap) {
                            newMap.invalidateSize();
                            newMap.dragging.enable();
                        }
                    }, 500);

                } catch (error) {
                    console.error('Error al crear el mapa:', error);
                }
            }, 100);
        }

        return () => {
            if (map && !isOpen) {
                map.remove();
                setMap(null);
                setMarker(null);
            }
        };
    }, [isOpen, leafletLoaded, map]);

    useEffect(() => {
        if (map && position) {
            map.setView(position, 13);
        }
    }, [map, position]);

    useEffect(() => {
        if (map && selectedPosition && leafletLoaded) {
            try {
                if (marker) {
                    marker.setLatLng(selectedPosition);
                } else {
                    const customIcon = createCustomIcon();
                    const newMarker = window.L.marker(selectedPosition, {
                        icon: customIcon,
                        draggable: true,
                        autoPan: true,
                        bubblingMouseEvents: true,
                        zIndexOffset: 1000
                    }).addTo(map);

                    newMarker.on('dragstart', () => {
                    });

                    newMarker.on('drag', (e) => {
                    });

                    newMarker.on('dragend', (e) => {
                        const newPos = e.target.getLatLng();
                        handleLocationSelect(newPos);
                    });

                    setMarker(newMarker);
                }
            } catch (error) {
                console.error('Error al crear/actualizar marcador:', error);
            }
        }
    }, [map, selectedPosition, marker, leafletLoaded]);

    const handleLocationSelect = (latlng) => {
        const pos = [latlng.lat, latlng.lng];
        setSelectedPosition(pos);
        reverseGeocode(latlng.lat, latlng.lng);
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
            );
            const data = await response.json();
            if (data.display_name) {
                setAddress(data.display_name);
            }
        } catch (error) {
            console.error('Error en geocodificación inversa:', error);
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    };

    const searchLocation = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=mx`
            );
            const data = await response.json();

            if (data.length > 0) {
                const location = data[0];
                const lat = parseFloat(location.lat);
                const lng = parseFloat(location.lon);
                const newPos = [lat, lng];

                setPosition(newPos);
                setSelectedPosition(newPos);
                setAddress(location.display_name);
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Ubicación no encontrada',
                    text: 'No se encontró la ubicación. Intenta con una dirección más específica.',
                    confirmButtonColor: '#f27100'
                });
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de búsqueda',
                text: 'Error al buscar la ubicación. Verifica tu conexión e intenta nuevamente.',
                confirmButtonColor: '#f27100'
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleConfirm = () => {
        if (selectedPosition && address) {
            onLocationSelect({
                address,
                latitude: selectedPosition[0],
                longitude: selectedPosition[1]
            });
            onClose();
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Selecciona una ubicación',
                text: 'Por favor selecciona una ubicación haciendo clic en el mapa.',
                confirmButtonColor: '#f27100'
            });
        }
    };

    const handleModalClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={handleModalClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
        >
            <div
                className="modal-content modal-xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    maxWidth: '900px',
                    width: '90vw',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
            >
                <div className="modal-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    borderBottom: '1px solid #e0e0e0'
                }}>
                    <h2 className="modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                        Buscar en Mapa
                    </h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '0',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '20px' }}>
                    <div className="map-search-container" style={{ marginBottom: '16px' }}>
                        <div className="search-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar dirección (ej: Calle Miguel Hidalgo 123, León, Guanajuato)"
                                className="map-search-input"
                                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                            <button
                                onClick={searchLocation}
                                disabled={isSearching}
                                className="btn btn-primary"
                                style={{
                                    backgroundColor: '#f27100',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: isSearching ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    minWidth: '120px'
                                }}
                            >
                                {isSearching ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>

                        {address && (
                            <div className="selected-address" style={{
                                padding: '8px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}>
                                <strong>Dirección seleccionada:</strong> {address}
                            </div>
                        )}
                    </div>

                    <div
                        className="map-container"
                        style={{
                            height: '400px',
                            width: '100%',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'grab',
                            zIndex: 10
                        }}
                    >
                        <div
                            ref={mapRef}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseMove={(e) => e.stopPropagation()}
                            onWheel={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                height: '100%',
                                width: '100%',
                                cursor: 'grab',
                                touchAction: 'none'
                            }}
                        />
                    </div>

                    <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#1565c0'
                    }}>
                        💡 <strong>Instrucciones:</strong>
                        <br />
                        • <strong>Arrastrar mapa:</strong> Mantén presionado y arrastra para mover el mapa
                        <br />
                    </div>
                </div>

                <div className="modal-form-actions" style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    padding: '20px',
                    borderTop: '1px solid #e0e0e0',
                    backgroundColor: '#fafafa'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            minWidth: '120px'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="btn btn-primary"
                        disabled={!selectedPosition}
                        style={{
                            backgroundColor: selectedPosition ? '#f27100' : '#ccc',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: selectedPosition ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            minWidth: '120px'
                        }}
                    >
                        Confirmar Ubicación
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapModal;