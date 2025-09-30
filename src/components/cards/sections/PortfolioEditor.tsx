import React, { useRef, useState } from 'react';
import { Card, CardPortfolioItem } from '@/types';
import {
  Image as ImageIcon,
  Video,
  Upload,
  X,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  Plus,
  Loader,
  AlertCircle
} from 'lucide-react';
import { StorageService } from '@/services/storage';
import { VideoCompressionService } from '@/services/videoCompression';
import { toast } from '@/utils/toast';

const MAX_PORTFOLIO_ITEMS = 10;

interface PortfolioEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const PortfolioEditor: React.FC<PortfolioEditorProps> = ({ card, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const portfolio = card.portfolio || {
    items: [],
    style: {
      layout: 'carousel' as const,
      columns: 1 as const,
      spacing: 'normal' as const,
      aspectRatio: 'auto' as const,
      showTitles: false,
      showDescriptions: false,
      borderRadius: '12px',
      shadow: 'md'
    },
    isVisible: true,
    showTitle: false,
    title: 'Portfolio',
    order: 4
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentCount = portfolio.items.length;
    const remainingSlots = MAX_PORTFOLIO_ITEMS - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Has alcanzado el límite de ${MAX_PORTFOLIO_ITEMS} elementos en tu portfolio`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.error(`Solo puedes agregar ${remainingSlots} elemento(s) más. Límite: ${MAX_PORTFOLIO_ITEMS}`);
    }

    setIsUploading(true);

    for (const file of filesToProcess) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      try {
        const isVideo = VideoCompressionService.isVideoFile(file);
        const isGif = VideoCompressionService.isGifFile(file);
        const isImage = file.type.startsWith('image/') && !isGif;

        if (!isVideo && !isImage && !isGif) {
          toast.error(`${file.name} no es un archivo de imagen o video válido`);
          continue;
        }

        setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));

        if (isImage) {
          const uploaded = await StorageService.uploadPortfolioImage(card.id, file, progress => {
            setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
          });

          const newItem: CardPortfolioItem = {
            id: uploaded.id,
            type: 'image',
            url: uploaded.urls.large,
            thumbnail: uploaded.urls.thumbnail,
            isVisible: true,
            order: portfolio.items.length,
            metadata: {
              width: uploaded.metadata.width,
              height: uploaded.metadata.height,
              size: uploaded.metadata.size
            }
          };

          onUpdate({
            portfolio: {
              ...portfolio,
              items: [...portfolio.items, newItem]
            }
          });

          toast.success(`✅ ${file.name} subido`);
        } else {
          const validation = VideoCompressionService.validateMediaFile(file);
          if (!validation.valid) {
            toast.error(validation.error || 'Archivo inválido');
            continue;
          }

          setUploadProgress(prev => ({ ...prev, [tempId]: 30 }));

          const durationCheck = isVideo
            ? await VideoCompressionService.validateVideoDuration(file)
            : { valid: true };
          if (!durationCheck.valid) {
            toast.error(durationCheck.error || 'Video demasiado largo');
            continue;
          }

          const compressed = await VideoCompressionService.compressVideo(file);
          setUploadProgress(prev => ({ ...prev, [tempId]: 60 }));

          const videoUrl = await StorageService.uploadPortfolioVideo(card.id, compressed.file, progress => {
            const adjusted = 60 + progress * 0.4;
            setUploadProgress(prev => ({ ...prev, [tempId]: adjusted }));
          });

          const newItem: CardPortfolioItem = {
            id: `video-${Date.now()}-${Math.random()}`,
            type: 'video',
            url: videoUrl,
            thumbnail: compressed.thumbnail,
            isVisible: true,
            order: portfolio.items.length,
            metadata: {
              size: compressed.size,
              duration: compressed.duration
            }
          };

          onUpdate({
            portfolio: {
              ...portfolio,
              items: [...portfolio.items, newItem]
            }
          });

          toast.success(`✅ ${file.name} subido`);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Error al subir ${file.name}`);
      } finally {
        setUploadProgress(prev => {
          const { [tempId]: _, ...rest } = prev;
          return rest;
        });
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleVisibility = (itemId: string) => {
    const updatedItems = portfolio.items.map(item =>
      item.id === itemId ? { ...item, isVisible: !item.isVisible } : item
    );

    onUpdate({
      portfolio: {
        ...portfolio,
        items: updatedItems
      }
    });
  };

  const deleteItem = async (item: CardPortfolioItem) => {
    try {
      await StorageService.deletePortfolioAsset(card.id, item.id);
      const updatedItems = portfolio.items.filter(existing => existing.id !== item.id);
      onUpdate({
        portfolio: {
          ...portfolio,
          items: updatedItems
        }
      });
      toast.success('Elemento eliminado');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo eliminar el elemento');
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, itemId: string) => {
    setDraggedItemId(itemId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (!draggedItemId) return;

    const draggedItem = portfolio.items.find(item => item.id === draggedItemId);
    if (!draggedItem) return;

    const filtered = portfolio.items.filter(item => item.id !== draggedItemId);
    filtered.splice(index, 0, draggedItem);

    const reordered = filtered.map((item, idx) => ({
      ...item,
      order: idx
    }));

    onUpdate({
      portfolio: {
        ...portfolio,
        items: reordered
      }
    });
  };

  const handleDragEnd = () => setDraggedItemId(null);

  const handleStyleChange = <K extends keyof Card['portfolio']['style']>(
    key: K,
    value: Card['portfolio']['style'][K]
  ) => {
    onUpdate({
      portfolio: {
        ...portfolio,
        style: {
          ...portfolio.style,
          [key]: value
        }
      }
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white">
            <ImageIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Subí imágenes o videos para mostrar tu trabajo
            </p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg shadow-sm"
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Cargando…' : 'Agregar archivo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {portfolio.items.length === 0 && !isUploading && (
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center bg-gray-50 dark:bg-gray-900/30">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Todavía no hay elementos</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Agregá imágenes o videos para que tus clientes conozcan mejor tu trabajo.
          </p>
        </div>
      )}

      {isUploading && (
        <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 p-4 flex items-center space-x-3">
          <Loader className="w-5 h-5 text-cyan-600 dark:text-cyan-300 animate-spin" />
          <div>
            <p className="text-sm font-medium text-cyan-900 dark:text-cyan-200">Subiendo archivos</p>
            <p className="text-xs text-cyan-700 dark:text-cyan-300/80">No cierres la ventana hasta finalizar el proceso.</p>
          </div>
        </div>
      )}

      {portfolio.items.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Elementos ({portfolio.items.length}/{MAX_PORTFOLIO_ITEMS})</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {portfolio.items
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((item, index) => {
                const progress = Object.values(uploadProgress)[index] ?? 0;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={event => handleDragStart(event, item.id)}
                    onDragOver={event => handleDragOver(event, index)}
                    onDragEnd={handleDragEnd}
                    className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm"
                  >
                    <div className="absolute top-2 left-2 z-20 flex items-center space-x-1">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white/90 dark:bg-black/60 text-gray-700 dark:text-gray-200 rounded-full shadow-sm">
                        #{index + 1}
                      </span>
                      <button
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white/90 dark:bg-black/60 text-gray-700 dark:text-gray-200 rounded-full shadow-sm"
                        onClick={() => toggleVisibility(item.id)}
                      >
                        {item.isVisible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {item.isVisible ? 'Visible' : 'Oculto'}
                      </button>
                    </div>

                    <button className="absolute top-2 right-2 z-20 inline-flex items-center justify-center w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full" onClick={() => deleteItem(item)}>
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {item.type === 'image' && (
                      <img
                        src={item.url}
                        alt={item.title || 'Imagen de portfolio'}
                        className="w-full h-64 object-cover"
                      />
                    )}

                    {item.type === 'video' && (
                      <video
                        src={item.url}
                        className="w-full h-64 object-cover"
                        controls
                        playsInline
                      />
                    )}

                    {progress > 0 && progress < 100 && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <Loader className="w-6 h-6 animate-spin mb-2" />
                        <span className="text-sm font-medium">Subiendo… {Math.round(progress)}%</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 z-20 inline-flex items-center px-2 py-1 text-xs bg-black/60 text-white rounded-full">
                      {item.type === 'image' ? <ImageIcon className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />} {item.type}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white">
                      <p className="text-sm font-semibold">
                        {item.title || (item.type === 'image' ? 'Imagen' : 'Video')}
                      </p>
                      {item.metadata?.size && (
                        <p className="text-xs text-white/80">
                          {(item.metadata.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      )}
                    </div>

                    <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center cursor-grab text-white bg-gradient-to-r from-black/40 via-black/10 to-transparent">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Configuración de diseño</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</span>
            <input
              type="text"
              value={portfolio.title || ''}
              onChange={event =>
                onUpdate({
                  portfolio: {
                    ...portfolio,
                    title: event.target.value
                  }
                })
              }
              className="input"
              placeholder="Portfolio"
            />
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={portfolio.isVisible}
              onChange={event =>
                onUpdate({
                  portfolio: {
                    ...portfolio,
                    isVisible: event.target.checked
                  }
                })
              }
              className="checkbox"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar sección de portfolio</span>
          </label>

          <label className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Diseño</span>
            <select
              value={portfolio.style.layout}
              onChange={event => handleStyleChange('layout', event.target.value as Card['portfolio']['style']['layout'])}
              className="input"
            >
              <option value="carousel">Carrusel</option>
              <option value="framedCarousel">Carrusel en marco</option>
              <option value="grid">Cuadrícula</option>
              <option value="masonry">Masonry</option>
              <option value="list">Lista</option>
            </select>
          </label>

          <label className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Relación de aspecto</span>
            <select
              value={portfolio.style.aspectRatio || 'auto'}
              onChange={event => handleStyleChange('aspectRatio', event.target.value as Card['portfolio']['style']['aspectRatio'])}
              className="input"
            >
              <option value="auto">Automática</option>
              <option value="square">1:1</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
            </select>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={portfolio.style.showTitles}
              onChange={event => handleStyleChange('showTitles', event.target.checked)}
              className="checkbox"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar títulos</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={portfolio.style.showDescriptions}
              onChange={event => handleStyleChange('showDescriptions', event.target.checked)}
              className="checkbox"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar descripciones</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-300 mt-1" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Compresión Automática Estilo Instagram</h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200/80 list-disc list-inside">
              <li>Imágenes: Se generan 4 tamaños optimizados (150px, 640px, 1080px, 1920px)</li>
              <li>Videos: Máximo 10 segundos, se valida duración automáticamente</li>
              <li>Compresión: 60-90% de reducción de tamaño manteniendo calidad</li>
              <li>Abre la consola (F12) para ver estadísticas detalladas de cada subida</li>
            </ul>
          </div>
        </div>

        {portfolio.items.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
              📊 Estadísticas del Portfolio
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Elementos</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{portfolio.items.length}/{MAX_PORTFOLIO_ITEMS}</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">Imágenes</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {portfolio.items.filter(i => i.type === 'image').length}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">Videos</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {portfolio.items.filter(i => i.type === 'video').length}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">Tamaño Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {((portfolio.items.reduce((acc, item) => acc + (item.metadata?.size || 0), 0)) / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioEditor;
