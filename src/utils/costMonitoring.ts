/**
 * Sistema de Monitoreo de Costes de Firebase
 * Ayuda a detectar uso excesivo y prevenir gastos inesperados
 */

interface UsageStats {
  firestoreReads: number;
  firestoreWrites: number;
  storageDownloads: number;
  storageUploads: number;
  functionsInvocations: number;
  timestamp: number;
}

const STORAGE_KEY = 'firebase_usage_stats';
const ALERT_THRESHOLDS = {
  // Lecturas por hora
  firestoreReadsPerHour: 1000, // Alerta si >1000 lecturas/hora
  // Escrituras por hora
  firestoreWritesPerHour: 100,
  // Descargas por hora (MB)
  storageDownloadsPerHour: 50,
  // Funciones por hora
  functionsPerHour: 100
};

class CostMonitoringService {
  private stats: UsageStats = {
    firestoreReads: 0,
    firestoreWrites: 0,
    storageDownloads: 0,
    storageUploads: 0,
    functionsInvocations: 0,
    timestamp: Date.now()
  };

  constructor() {
    this.loadStats();
    this.startHourlyReset();
  }

  // Cargar stats del localStorage
  private loadStats() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.stats = JSON.parse(saved);

        // Reset si pasó más de 1 hora
        if (Date.now() - this.stats.timestamp > 3600000) {
          this.resetStats();
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  // Guardar stats en localStorage
  private saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  // Reset automático cada hora
  private startHourlyReset() {
    setInterval(() => {
      this.resetStats();
    }, 3600000); // 1 hora
  }

  // Resetear estadísticas
  private resetStats() {
    this.stats = {
      firestoreReads: 0,
      firestoreWrites: 0,
      storageDownloads: 0,
      storageUploads: 0,
      functionsInvocations: 0,
      timestamp: Date.now()
    };
    this.saveStats();
  }

  // Registrar lectura de Firestore
  trackFirestoreRead(count: number = 1) {
    this.stats.firestoreReads += count;
    this.saveStats();
    this.checkThresholds();
  }

  // Registrar escritura de Firestore
  trackFirestoreWrite(count: number = 1) {
    this.stats.firestoreWrites += count;
    this.saveStats();
    this.checkThresholds();
  }

  // Registrar descarga de Storage
  trackStorageDownload(sizeMB: number) {
    this.stats.storageDownloads += sizeMB;
    this.saveStats();
    this.checkThresholds();
  }

  // Registrar subida de Storage
  trackStorageUpload(sizeMB: number) {
    this.stats.storageUploads += sizeMB;
    this.saveStats();
  }

  // Registrar invocación de Function
  trackFunctionInvocation() {
    this.stats.functionsInvocations++;
    this.saveStats();
    this.checkThresholds();
  }

  // Verificar umbrales y alertar
  private checkThresholds() {
    const alerts: string[] = [];

    if (this.stats.firestoreReads > ALERT_THRESHOLDS.firestoreReadsPerHour) {
      alerts.push(
        `⚠️ Lecturas de Firestore excesivas: ${this.stats.firestoreReads}/hora (límite: ${ALERT_THRESHOLDS.firestoreReadsPerHour})`
      );
    }

    if (this.stats.firestoreWrites > ALERT_THRESHOLDS.firestoreWritesPerHour) {
      alerts.push(
        `⚠️ Escrituras de Firestore excesivas: ${this.stats.firestoreWrites}/hora`
      );
    }

    if (this.stats.storageDownloads > ALERT_THRESHOLDS.storageDownloadsPerHour) {
      alerts.push(
        `⚠️ Descargas de Storage excesivas: ${this.stats.storageDownloads.toFixed(2)}MB/hora`
      );
    }

    if (alerts.length > 0) {
      console.warn('🚨 ALERTA DE COSTES FIREBASE:', alerts.join('\n'));

      // Mostrar toast si está disponible
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast(
          `Uso excesivo detectado. Revisa la consola.`,
          'warning'
        );
      }
    }
  }

  // Obtener estadísticas actuales
  getStats(): UsageStats {
    return { ...this.stats };
  }

  // Calcular coste estimado
  getEstimatedCost(): {
    reads: number;
    writes: number;
    storage: number;
    functions: number;
    total: number;
  } {
    // Precios de Firebase (aproximados)
    const PRICE_PER_100K_READS = 0.036; // €0.036 por 100K lecturas
    const PRICE_PER_100K_WRITES = 0.108; // €0.108 por 100K escrituras
    const PRICE_PER_GB_DOWNLOAD = 0.12; // €0.12 por GB
    const PRICE_PER_100K_FUNCTIONS = 0.04; // €0.04 por 100K invocaciones

    const readsCost = (this.stats.firestoreReads / 100000) * PRICE_PER_100K_READS;
    const writesCost = (this.stats.firestoreWrites / 100000) * PRICE_PER_100K_WRITES;
    const storageCost = (this.stats.storageDownloads / 1024) * PRICE_PER_GB_DOWNLOAD;
    const functionsCost = (this.stats.functionsInvocations / 100000) * PRICE_PER_100K_FUNCTIONS;

    return {
      reads: readsCost,
      writes: writesCost,
      storage: storageCost,
      functions: functionsCost,
      total: readsCost + writesCost + storageCost + functionsCost
    };
  }

  // Log resumen en consola
  logSummary() {
    const stats = this.getStats();
    const cost = this.getEstimatedCost();

    console.group('📊 Firebase Usage Stats (última hora)');
    console.log(`🔵 Lecturas Firestore: ${stats.firestoreReads.toLocaleString()}`);
    console.log(`🟣 Escrituras Firestore: ${stats.firestoreWrites.toLocaleString()}`);
    console.log(`🟠 Descargas Storage: ${stats.storageDownloads.toFixed(2)} MB`);
    console.log(`🟢 Funciones invocadas: ${stats.functionsInvocations.toLocaleString()}`);
    console.log(`💰 Coste estimado: €${cost.total.toFixed(4)}/hora`);
    console.groupEnd();
  }
}

// Singleton
export const costMonitoring = new CostMonitoringService();

// Hook para React components
export const useCostMonitoring = () => {
  return {
    trackRead: (count?: number) => costMonitoring.trackFirestoreRead(count),
    trackWrite: (count?: number) => costMonitoring.trackFirestoreWrite(count),
    trackDownload: (sizeMB: number) => costMonitoring.trackStorageDownload(sizeMB),
    trackUpload: (sizeMB: number) => costMonitoring.trackStorageUpload(sizeMB),
    getStats: () => costMonitoring.getStats(),
    getCost: () => costMonitoring.getEstimatedCost(),
    logSummary: () => costMonitoring.logSummary()
  };
};

// Comando global para la consola
if (typeof window !== 'undefined') {
  (window as any).firebaseStats = () => costMonitoring.logSummary();
  (window as any).firebaseCost = () => {
    const cost = costMonitoring.getEstimatedCost();
    console.log(`💰 Coste estimado: €${cost.total.toFixed(4)}/hora`);
    console.log(`📊 Proyección mensual: €${(cost.total * 24 * 30).toFixed(2)}/mes`);
  };
}
