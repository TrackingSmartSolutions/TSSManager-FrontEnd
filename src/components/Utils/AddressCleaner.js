class AddressCleaner {
    constructor() {
        this.cleaningPatterns = [
            // Eliminar caracteres especiales al inicio
            { pattern: /^[〒\s]+/, replacement: '' },
            
            // Normalizar separadores
            { pattern: /\s*[,;]\s*/g, replacement: ', ' },
            
            // Limpiar espacios múltiples
            { pattern: /\s+/g, replacement: ' ' },
            
            // Eliminar información entre paréntesis al final si es redundante
            { pattern: /\s*\([^)]*\)\s*$/, replacement: '' },
            
            // Normalizar "Col." y "Colonia"
            { pattern: /\b(Col\.?|Colonia)\s+/gi, replacement: 'Col. ' },
            
            // Normalizar "C.P." y variaciones
            { pattern: /\b(C\.?P\.?|CP)\s*/gi, replacement: 'C.P. ' },
            
            // Normalizar "Blvd" y variaciones
            { pattern: /\b(Blvrd?\.?|Boulevard)\s+/gi, replacement: 'Blvd. ' },
            
            // Normalizar "Av." y variaciones
            { pattern: /\b(Av\.?|Avenida)\s+/gi, replacement: 'Av. ' },
            
            // Normalizar "C." para calles
            { pattern: /\bC\.\s+/gi, replacement: 'Calle ' },
            
            // Eliminar información de locales/interiores duplicada
            { pattern: /\s*(local|int\.?|interior)\s*\d+[a-z]?\s*,?\s*(local|int\.?|interior)\s*\d+[a-z]?/gi, replacement: ' Local' },
        ];

        this.mexicanStates = {
            'gto': 'Guanajuato',
            'guanajuato': 'Guanajuato',
            'jal': 'Jalisco',
            'jalisco': 'Jalisco',
            'qro': 'Querétaro',
            'queretaro': 'Querétaro',
            'slp': 'San Luis Potosí',
            'san luis potosi': 'San Luis Potosí',
            'ags': 'Aguascalientes',
            'aguascalientes': 'Aguascalientes',
            'cdmx': 'Ciudad de México',
            'ciudad de mexico': 'Ciudad de México',
            'mex': 'Estado de México',
            'mexico': 'Estado de México',
            'mich': 'Michoacán',
            'michoacan': 'Michoacán',
            'col': 'Colima',
            'colima': 'Colima',
            'hgo': 'Hidalgo',
            'hidalgo': 'Hidalgo',
            'nl': 'Nuevo León',
            'nuevo leon': 'Nuevo León'
        };

        this.leonCities = [
            'León de los Aldama',
            'León',
            'Silao de la Victoria',
            'Silao',
            'Irapuato',
            'Santiago de Querétaro',
            'Querétaro',
            'San Juan de los Lagos',
            'Aguascalientes'
        ];
    }

    /**
     * Limpia y estandariza una dirección
     * @param {string} address - Dirección original
     * @returns {string} - Dirección limpia y estandarizada
     */
    cleanAddress(address) {
        if (!address || typeof address !== 'string') {
            return '';
        }

        let cleaned = address.trim();

        this.cleaningPatterns.forEach(({ pattern, replacement }) => {
            cleaned = cleaned.replace(pattern, replacement);
        });

        cleaned = this.normalizeStateAndCountry(cleaned);

        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    }

    /**
     * Normaliza el estado y asegura que la dirección termine con México
     * @param {string} address - Dirección a normalizar
     * @returns {string} - Dirección con estado normalizado
     */
    normalizeStateAndCountry(address) {
        let normalized = address;

        const statePattern = /,?\s*([a-záéíóúñ\s]+)\.?\s*,?\s*(méxico|mexico)?\s*$/i;
        const match = normalized.match(statePattern);

        if (match) {
            const stateText = match[1].toLowerCase().trim();
            const normalizedState = this.mexicanStates[stateText];
            
            if (normalizedState) {
                normalized = normalized.replace(statePattern, `, ${normalizedState}, México`);
            } else if (!normalized.toLowerCase().includes('méxico')) {
                normalized = `${normalized}, México`;
            }
        } else if (!normalized.toLowerCase().includes('méxico')) {
            normalized = `${normalized}, México`;
        }

        return normalized;
    }

    /**
     * Valida si una dirección es suficientemente específica para geocodificación
     * @param {string} address - Dirección a validar
     * @returns {boolean} - True si la dirección es válida
     */
    isValidAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }

    const trimmed = address.trim();
    
    // Rechazar direcciones muy cortas
    if (trimmed.length < 15) {
        return false;
    }

    // Solo rechazar direcciones OBVIAMENTE inválidas
    const obviouslyInvalid = [
        /^(n\/a|na|sin\s+direcci[óo]n|no\s+aplica|pendiente|tbd|por\s+definir)$/i,
        /^[.\-_\s#,;:]+$/i, // Solo símbolos
        /^\d+$/i, // Solo números
        /^[a-z]\s*$/i, // Una sola letra
        /^(león|mexico|guadalajara|querétaro)\.?\s*,?\s*(gto|mexico)?\.?\s*$/i, // Solo ciudades sin más info
        /sin\s+número/i,
        /domicilio\s+conocido/i,
        /información\s+no\s+disponible/i,
        /^qdefrgthy/i // Para tu caso específico de datos basura
    ];

    if (obviouslyInvalid.some(pattern => pattern.test(trimmed))) {
        return false;
    }

    // Si llegó hasta aquí, es válida
    return true;
}

    /**
     * Obtiene sugerencias de direcciones mejoradas
     * @param {string} address - Dirección original
     * @returns {string[]} - Array de sugerencias mejoradas
     */
    getSuggestions(address) {
        const cleaned = this.cleanAddress(address);
        const suggestions = [cleaned];

        // Si es muy vaga, intentar agregar León, Guanajuato
        if (!this.isValidAddress(cleaned)) {
            if (!cleaned.toLowerCase().includes('león')) {
                suggestions.push(`${cleaned}, León de los Aldama, Guanajuato, México`);
            }
        }

        return [...new Set(suggestions)];
    }

    /**
     * Procesa un lote de direcciones
     * @param {string[]} addresses - Array de direcciones
     * @returns {Object[]} - Array de objetos con dirección original, limpia y válida
     */
    processBatch(addresses) {
        return addresses.map(address => {
            const cleaned = this.cleanAddress(address);
            const isValid = this.isValidAddress(cleaned);
            const suggestions = this.getSuggestions(address);

            return {
                original: address,
                cleaned: cleaned,
                isValid: isValid,
                suggestions: suggestions,
                needsReview: !isValid
            };
        });
    }
}

export const createEnhancedGeocoder = () => {
    const cleaner = new AddressCleaner();
    const geocodeCache = new Map();

    return {
        /**
         * Geocodifica una dirección con limpieza previa
         * @param {string} address - Dirección a geocodificar
         * @returns {Promise<[number, number] | null>} - Coordenadas o null
         */
        geocodeWithCleaning: async (address) => {
            if (geocodeCache.has(address)) {
                return geocodeCache.get(address);
            }

            const cleaned = cleaner.cleanAddress(address);
            
            if (!cleaner.isValidAddress(cleaned)) {
                console.warn(`Dirección posiblemente inválida: ${address} -> ${cleaned}`);
                
                const suggestions = cleaner.getSuggestions(address);
                
                for (const suggestion of suggestions) {
                    if (cleaner.isValidAddress(suggestion)) {
                        const result = await this.geocodeAddress(suggestion);
                        if (result) {
                            geocodeCache.set(address, result);
                            return result;
                        }
                    }
                }
                
                geocodeCache.set(address, null);
                return null;
            }

            const result = await this.geocodeAddress(cleaned);
            geocodeCache.set(address, result);
            return result;
        },

        /**
         * Función de geocodificación usando Nominatim
         * @param {string} address - Dirección limpia
         * @returns {Promise<[number, number] | null>} - Coordenadas o null
         */
        geocodeAddress: async (address) => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=mx`
                );
                
                if (!response.ok) {
                    throw new Error("Error fetching coordinates from Nominatim");
                }
                
                const data = await response.json();

                if (data.length > 0) {
                    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                } else {
                    throw new Error(`No se encontraron coordenadas para: ${address}`);
                }
            } catch (err) {
                console.error(`Error geocoding ${address}:`, err.message);
                return null;
            }
        },

        /**
         * Limpia una dirección sin geocodificar
         * @param {string} address - Dirección a limpiar
         * @returns {string} - Dirección limpia
         */
        cleanAddress: (address) => cleaner.cleanAddress(address),

        /**
         * Valida si una dirección es geocodificable
         * @param {string} address - Dirección a validar
         * @returns {boolean} - True si es válida
         */
        isValidAddress: (address) => cleaner.isValidAddress(address),

        /**
         * Procesa un lote de direcciones para análisis
         * @param {string[]} addresses - Array de direcciones
         * @returns {Object[]} - Resultados del procesamiento
         */
        analyzeAddresses: (addresses) => cleaner.processBatch(addresses)
    };
};


export default AddressCleaner;