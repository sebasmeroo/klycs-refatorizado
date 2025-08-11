import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Smartphone, 
  Monitor, 
  Tablet,
  RotateCcw,
  Settings,
  Code,
  Palette,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Grid,
  List,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import { templateDistributionService, Template } from '@/services/templateDistribution';

type ViewMode = 'mobile' | 'tablet' | 'desktop';

interface ViewConfig {
  width: string;
  height: string;
  label: string;
  icon: React.ReactNode;
}

const viewConfigs: Record<ViewMode, ViewConfig> = {
  mobile: {
    width: '375px',
    height: '667px',
    label: 'Móvil',
    icon: <Smartphone className="w-4 h-4" />
  },
  tablet: {
    width: '768px',
    height: '1024px',
    label: 'Tablet',
    icon: <Tablet className="w-4 h-4" />
  },
  desktop: {
    width: '100%',
    height: '600px',
    label: 'Escritorio',
    icon: <Monitor className="w-4 h-4" />
  }
};

export const AdminPreview: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  // Cargar plantillas
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const templatesData = await templateDistributionService.getTemplates();
      setTemplates(templatesData);
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar plantillas
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Auto-rotación de vista
  useEffect(() => {
    if (!isAutoRotating) return;

    const modes: ViewMode[] = ['mobile', 'tablet', 'desktop'];
    let currentIndex = modes.indexOf(viewMode);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % modes.length;
      setViewMode(modes[currentIndex]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoRotating, viewMode]);

  const categories = ['all', 'minimal', 'modern', 'creative', 'luxury', 'business', 'artistic', 'tech'];

  const CategoryBadge = ({ category }: { category: string }) => {
    const colors = {
      all: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      minimal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      modern: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      creative: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
      luxury: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      business: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      artistic: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      tech: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category as keyof typeof colors] || colors.all}`}>
        {category === 'all' ? 'Todas' : category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    );
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar de Templates */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Vista Previa de Plantillas
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredTemplates.length} plantillas disponibles
              </p>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar plantillas..."
              className="pl-10 text-sm"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center justify-between mb-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mr-2"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Todas las categorías' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  displayMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Grid className="w-3 h-3" />
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  displayMode === 'list' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <List className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Templates */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className={`space-y-3 ${displayMode === 'grid' ? 'grid grid-cols-1 gap-3' : ''}`}>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Cargando plantillas...</p>
              </div>
            ) : filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                    }`}>
                      <Palette className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <CategoryBadge category={template.category} />
                        {template.isPublic && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" title="Pública"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No se encontraron plantillas
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Prueba ajustando los filtros
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Control Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTemplate?.name || 'Selecciona una plantilla'}
                </h2>
                {selectedTemplate && (
                  <CategoryBadge category={selectedTemplate.category} />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Controles de Vista */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {Object.entries(viewConfigs).map(([mode, config]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as ViewMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    {config.icon}
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                ))}
              </div>

              {/* Auto-rotación */}
              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`p-2 rounded-lg transition-all ${
                  isAutoRotating
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title="Auto-rotación de vistas"
              >
                {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Reset */}
              <button
                onClick={loadTemplates}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
                title="Recargar plantillas"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
                
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-6 overflow-auto">
          {selectedTemplate ? (
            <div className="h-full flex items-center justify-center">
              <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transition-all duration-500 ease-in-out relative overflow-hidden"
                style={{
                  width: viewConfigs[viewMode].width,
                  height: viewConfigs[viewMode].height,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                {/* Indicador de vista activa */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-medium">
                    {viewConfigs[viewMode].icon}
                    <span>{viewConfigs[viewMode].label}</span>
                    {isAutoRotating && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>

                {/* Template Content */}
                <div className="h-full overflow-auto">
                  <TemplateRenderer
                    template={selectedTemplate}
                    editable={false}
                    previewMode={true}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Vista Previa de Plantillas
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                  Selecciona una plantilla de la lista para ver cómo se ve en diferentes dispositivos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPreview;