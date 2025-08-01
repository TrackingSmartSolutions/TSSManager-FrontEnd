class GeocodeService {
    constructor() {
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessing = false;
        this.lastRequestTime = 0;
        this.RATE_LIMIT_DELAY = 1000; 
        this.MAX_RETRIES = 3;
        this.TIMEOUT_MS = 10000;
    }

    // Función principal para geocodificar con rate limiting
    async geocode(address) {
        if (!address) return null;

        // Verificar caché
        if (this.cache.has(address)) {
            return this.cache.get(address);
        }

        // Agregar a la cola y procesar
        return new Promise((resolve) => {
            this.requestQueue.push({ address, resolve });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const { address, resolve } = this.requestQueue.shift();
            
            // Respetar rate limit
            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
                await this.sleep(this.RATE_LIMIT_DELAY - timeSinceLastRequest);
            }

            try {
                const result = await this.fetchCoordinates(address);
                this.cache.set(address, result);
                resolve(result);
            } catch (error) {
                console.error(`Error geocoding ${address}:`, error);
                this.cache.set(address, null);
                resolve(null);
            }

            this.lastRequestTime = Date.now();
        }

        this.isProcessing = false;
    }

    // Fetch con timeout y reintentos
    async fetchCoordinates(address) {
        let lastError;

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const result = await Promise.race([
                    this.nominatimRequest(address),
                    this.timeoutPromise()
                ]);

                if (result) return result;
                
            } catch (error) {
                lastError = error;
                console.warn(`Intento ${attempt} falló para ${address}:`, error.message);
                
                if (attempt < this.MAX_RETRIES) {
                    await this.sleep(1000 * attempt); 
                }
            }
        }

        throw lastError || new Error('Max reintento alcanzado');
    }

    async nominatimRequest(address) {
        const cleanAddress = this.cleanAddress(address);
        const query = encodeURIComponent(cleanAddress);
        
        const url = `https://nominatim.openstreetmap.org/search?` +
                   `format=json&q=${query}&limit=1&countrycodes=mx&` +
                   `addressdetails=1&bounded=1&` +
                   `viewbox=-105.0,19.0,-98.0,22.5`; 

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CRM-Mapa-App/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                return [lat, lon];
            }
        }

        return null;
    }

    // Limpiar dirección para mejor geocodificación
    cleanAddress(address) {
        let cleaned = address.trim();
        
        // Eliminar caracteres especiales
        cleaned = cleaned.replace(/[〒]/g, '');
        
        // Normalizar separadores
        cleaned = cleaned.replace(/\s*[,;]\s*/g, ', ');
        
        // Limpiar espacios múltiples
        cleaned = cleaned.replace(/\s+/g, ' ');
        
        // Asegurar que termine con México si no lo tiene
        if (!cleaned.toLowerCase().includes('méxico') && !cleaned.toLowerCase().includes('mexico')) {
            cleaned += ', México';
        }

        return cleaned;
    }

    // Promise de timeout
    timeoutPromise() {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), this.TIMEOUT_MS);
        });
    }

    // Utilidad para sleep
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Limpiar caché
    clearCache() {
        this.cache.clear();
    }

    // Obtener estadísticas
    getStats() {
        return {
            cacheSize: this.cache.size,
            queueLength: this.requestQueue.length,
            isProcessing: this.isProcessing
        };
    }
}

const geocodeService = new GeocodeService();

export default geocodeService;