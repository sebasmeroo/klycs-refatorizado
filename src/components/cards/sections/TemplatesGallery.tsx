import React, { useState, useEffect } from 'react';
import { 
  Grid,
  List,
  Search,
  Filter,
  Eye,
  Download,
  Star,
  Palette,
  User,
  Link,
  Share,
  Briefcase,
  Calendar,
  Image,
  Layers,
  Settings,
  X,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { userTemplatesService, UserTemplate } from '@/services/userTemplates';
import TemplateRenderer from '@/components/templates/TemplateRenderer';

interface TemplatesGalleryProps {
  section: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
  cardId: string;
  userId: string;
  onTemplateApplied: (template: UserTemplate, data: any) => void;
  onClose: () => void;
  // Opcional: aplicar a un item concreto (por ejemplo, un enlace específico)
  targetItemId?: string;
  // Opcional: resolver/alterar el destino antes de aplicar (permite duplicar el item)
  beforeApply?: (targetItemId?: string) => Promise<string | undefined> | string | undefined;
}

const sectionInfo = {
  profile: { icon: User, label: 'Perfil', color: 'from-blue-500 to-blue-600' },
  links: { icon: Link, label: 'Enlaces', color: 'from-green-500 to-green-600' },
  social: { icon: Share, label: 'Redes Sociales', color: 'from-pink-500 to-pink-600' },
  services: { icon: Briefcase, label: 'Servicios', color: 'from-purple-500 to-purple-600' },
  booking: { icon: Calendar, label: 'Reservas', color: 'from-orange-500 to-orange-600' },
  portfolio: { icon: Image, label: 'Portfolio', color: 'from-cyan-500 to-cyan-600' },
  elements: { icon: Layers, label: 'Elementos', color: 'from-indigo-500 to-indigo-600' },
  design: { icon: Palette, label: 'Diseño', color: 'from-red-500 to-red-600' }
};

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({
  section,
  cardId,
  userId,
  onTemplateApplied,
  onClose,
  targetItemId,
  beforeApply
}) => {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<UserTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sectionData = sectionInfo[section];
  const SectionIcon = sectionData.icon;

  // Cargar plantillas
  useEffect(() => {
    loadTemplates();
  }, [section]);

  // Filtrar plantillas
  useEffect(() => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const sectionTemplates = await userTemplatesService.getTemplatesBySection(section);
      setTemplates(sectionTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (template: UserTemplate) => {
    if (!template) return;

    setApplying(true);
    try {
      // Permitir que el host duplique el item y nos devuelva un nuevo destino
      let finalTargetId = targetItemId;
      if (beforeApply) {
        const resolved = await beforeApply(targetItemId);
        if (resolved) finalTargetId = resolved;
      }

      // Crear datos iniciales basados en la configuración JSON
      // Importante: NO empujar valores genéricos que arruinen el diseño ("Valor por defecto", vacío)
      const initialData: Record<string, any> = {};
      const isGeneric = (v: any) => v === undefined || v === null || v === '' || v === 'Valor por defecto';
      const isLayoutSensitive = (id: string) => /(padding|width|height|radius|shadow|border|line|margin|gap|inset|offset)/i.test(id);
      template.jsonConfig.forEach(field => {
        const v = field.defaultValue;
        // No sembrar campos de layout/espaciado en la instancia para no alterar el diseño base del componente
        if (!isGeneric(v) && !isLayoutSensitive(field.id)) {
          initialData[field.id] = v;
        }
      });

      // Aplicar plantilla a la tarjeta o al item si se especifica
      const instance = await userTemplatesService.applyTemplateToCard(
        template.id,
        userId,
        cardId,
        initialData,
        { targetItemId: finalTargetId }
      );

      if (instance) {
        onTemplateApplied(template, initialData);
        onClose();
      }
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setApplying(false);
    }
  };

  const categories = [...new Set(templates.map(t => t.category))];

  const TemplateCard = ({ template }: { template: UserTemplate }) => (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${viewMode === 'list' ? 'flex items-center' : ''}`}>
      {/* Template Preview */}
      <div className={`${viewMode === 'list' ? 'w-32 h-24 flex-shrink-0' : 'aspect-[4/3]'} bg-gradient-to-br ${sectionData.color} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-white">
          <SectionIcon className="w-8 h-8" />
        </div>
        
        {/* Overlay con acciones */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <Button
            onClick={() => {
              setSelectedTemplate(template);
              setShowPreview(true);
            }}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white text-gray-900 border-0"
          >
            <Eye className="w-3 h-3 mr-1" />
            Vista Previa
          </Button>
          
          <Button
            onClick={() => handleApplyTemplate(template)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={applying}
          >
            {applying ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Download className="w-3 h-3 mr-1" />
            )}
            Aplicar
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {template.name}
          </h3>
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
            v{template.version}
          </span>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {template.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              template.category === 'minimal' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
              template.category === 'modern' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
              template.category === 'creative' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {template.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {template.rating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {template.downloadCount}
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            por {template.author}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${sectionData.color} rounded-xl flex items-center justify-center`}>
              <SectionIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Plantillas de {sectionData.label}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredTemplates.length} plantillas disponibles
              </p>
            </div>
          </div>

          <Button onClick={onClose} variant="outline" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar plantillas..."
                className="pl-10 w-64"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Cargando plantillas...</p>
              </div>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                : 'space-y-4'
            }`}>
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No se encontraron plantillas
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Prueba ajustando los filtros o términos de búsqueda
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl h-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vista Previa - {selectedTemplate.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleApplyTemplate(selectedTemplate)}
                    disabled={applying}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {applying ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {applying ? 'Aplicando...' : 'Aplicar Plantilla'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPreview(false);
                      setSelectedTemplate(null);
                    }}
                    variant="outline"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                <TemplateRenderer
                  template={selectedTemplate}
                  editable={false}
                  previewMode={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesGallery;