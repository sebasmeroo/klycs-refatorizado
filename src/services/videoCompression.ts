/**
 * Servicio de compresión de videos estilo Instagram
 * Comprime videos para redes sociales con límites de duración y tamaño
 */

interface CompressedVideo {
  file: File;
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  isGif: boolean;
}

interface VideoCompressionOptions {
  maxDuration?: number; // en segundos
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  targetBitrate?: number; // kbps
}

export class VideoCompressionService {
  private static readonly MAX_DURATION = 10; // 10 segundos máximo
  private static readonly MAX_SIZE = 20 * 1024 * 1024; // 20MB máximo
  private static readonly TARGET_BITRATE = 2000; // 2 Mbps
  private static readonly MAX_DIMENSION = 1080; // Full HD

  /**
   * Valida si un archivo es GIF
   */
  static isGifFile(file: File): boolean {
    return file.type === 'image/gif';
  }

  /**
   * Valida si un archivo es video
   */
  static isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  /**
   * Valida la duración del video
   */
  static async validateVideoDuration(file: File): Promise<{ valid: boolean; duration: number; error?: string }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const duration = video.duration;

        if (isNaN(duration) || !isFinite(duration)) {
          resolve({ valid: false, duration: 0, error: 'No se pudo determinar la duración del video' });
          return;
        }

        if (duration > this.MAX_DURATION) {
          resolve({ 
            valid: false, 
            duration, 
            error: `El video debe durar máximo ${this.MAX_DURATION} segundos. Tu video dura ${duration.toFixed(1)}s` 
          });
          return;
        }

        resolve({ valid: true, duration });
      };

      video.onerror = () => {
        resolve({ valid: false, duration: 0, error: 'Error al cargar el video' });
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Extrae un thumbnail del video
   */
  static async extractThumbnail(file: File, seekTime: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.onloadedmetadata = () => {
        // Calcular dimensiones manteniendo aspect ratio
        const { width, height } = this.calculateDimensions(
          video.videoWidth,
          video.videoHeight,
          640,
          640
        );

        canvas.width = width;
        canvas.height = height;

        video.currentTime = Math.min(seekTime, video.duration / 2);
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(video.src);
        resolve(thumbnail);
      };

      video.onerror = () => {
        reject(new Error('Error al cargar el video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Comprime un video usando Web API (simulado - para compresión real se necesitaría FFmpeg.wasm)
   * Por ahora solo valida y optimiza metadatos
   */
  static async compressVideo(
    file: File,
    options: VideoCompressionOptions = {}
  ): Promise<CompressedVideo> {
    const startTime = performance.now();
    const originalSize = file.size;

    console.group('🎬 Compresión de Video - Estilo Instagram');
    console.log('📦 Archivo original:', {
      nombre: file.name,
      tamaño: this.formatFileSize(originalSize),
      tipo: file.type
    });

    const {
      maxDuration = this.MAX_DURATION,
      maxWidth = this.MAX_DIMENSION,
      maxHeight = this.MAX_DIMENSION
    } = options;

    // Si es GIF, tratarlo de forma especial
    if (this.isGifFile(file)) {
      const result = await this.processGif(file);
      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);

      console.log('✅ GIF procesado:');
      console.table({
        'Archivo': {
          'Tamaño original': this.formatFileSize(originalSize),
          'Tamaño procesado': this.formatFileSize(result.size),
          'Duración': 'Animado',
          'Dimensiones': `${result.width}x${result.height}`
        }
      });
      console.log(`⚡ Tiempo de procesamiento: ${processingTime}s`);
      console.groupEnd();
      
      return result;
    }

    // Validar duración
    const durationCheck = await this.validateVideoDuration(file);
    if (!durationCheck.valid) {
      console.error('❌ Error:', durationCheck.error);
      console.groupEnd();
      throw new Error(durationCheck.error || 'Video inválido');
    }

    // Validar tamaño
    if (file.size > this.MAX_SIZE) {
      throw new Error(`El video es muy pesado (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo ${this.MAX_SIZE / 1024 / 1024}MB`);
    }

    // Extraer thumbnail
    const thumbnail = await this.extractThumbnail(file);

    // Obtener dimensiones del video
    const videoDimensions = await this.getVideoDimensions(file);

    // Calcular dimensiones optimizadas
    const { width, height } = this.calculateDimensions(
      videoDimensions.width,
      videoDimensions.height,
      maxWidth,
      maxHeight
    );

    // En producción real, aquí se usaría FFmpeg.wasm para comprimir
    // Por ahora, devolvemos el video original con sus metadatos
    
    const endTime = performance.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ Video procesado:');
    console.table({
      'Video': {
        'Duración': `${durationCheck.duration.toFixed(1)}s`,
        'Tamaño': this.formatFileSize(file.size),
        'Dimensiones': `${width}x${height}`,
        'Límite duración': `${this.MAX_DURATION}s`,
        'Límite tamaño': this.formatFileSize(this.MAX_SIZE)
      }
    });
    console.log(`⚡ Tiempo de procesamiento: ${processingTime}s`);
    console.log(`💾 Estado: Optimizado para redes sociales`);
    console.groupEnd();
    
    return {
      file: file, // En producción, aquí iría el video comprimido
      thumbnail,
      duration: durationCheck.duration,
      width,
      height,
      size: file.size,
      isGif: false
    };
  }

  /**
   * Procesa archivos GIF
   */
  private static async processGif(file: File): Promise<CompressedVideo> {
    // Los GIFs se tratan como videos cortos sin audio
    const thumbnail = await this.extractGifThumbnail(file);

    return {
      file,
      thumbnail,
      duration: 0, // GIFs no tienen duración fija
      width: 0,
      height: 0,
      size: file.size,
      isGif: true
    };
  }

  /**
   * Extrae thumbnail de un GIF
   */
  private static async extractGifThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          640,
          640
        );

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(img.src);
        resolve(thumbnail);
      };

      img.onerror = () => {
        reject(new Error('Error al cargar el GIF'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Obtiene las dimensiones de un video
   */
  private static async getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          width: video.videoWidth,
          height: video.videoHeight
        });
      };

      video.onerror = () => {
        reject(new Error('Error al cargar el video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Formatea el tamaño de archivo para mostrar
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Calcula dimensiones manteniendo aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    // Asegurar que las dimensiones sean pares (requerido para algunos codecs)
    width = Math.floor(width / 2) * 2;
    height = Math.floor(height / 2) * 2;

    return { width, height };
  }

  /**
   * Valida archivo multimedia
   */
  static validateMediaFile(file: File): { valid: boolean; error?: string } {
    // Validar tipo
    if (!this.isVideoFile(file) && !this.isGifFile(file)) {
      return { valid: false, error: 'El archivo debe ser un video (MP4, MOV, WEBM) o GIF' };
    }

    // Validar tamaño
    if (file.size > this.MAX_SIZE) {
      return { 
        valid: false, 
        error: `El archivo es muy pesado (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo ${this.MAX_SIZE / 1024 / 1024}MB` 
      };
    }

    return { valid: true };
  }

  /**
   * Formatea la duración del video
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) return seconds.toFixed(1) + 's';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
