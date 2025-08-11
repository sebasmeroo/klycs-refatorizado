import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit3, 
  Copy, 
  Trash2, 
  Eye, 
  MoreVertical,
  Grid,
  List,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useTemplateStore } from '@/store/templateStore';
import { TemplateIOService } from '@/services/templateIO';
import { templateDistributionService } from '@/services/templateDistribution';
import type { Template, TemplateCategory, AppearIn } from '@/types/templatePack';

type ViewMode = 'grid' | 'list';

export const AdminTemplates: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado local para plantillas desde Firebase
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    appearIn: 'all'
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadTemplatesFromFirebase();
  }, []);

  // Cargar plantillas desde Firebase
  const loadTemplatesFromFirebase = async () => {
    setLoading(true);
    setError(null);
    try {
      const firebaseTemplates = await templateDistributionService.getTemplates();
      console.log('📋 Plantillas cargadas desde Firebase:', firebaseTemplates.length);
      
      // Convertir al formato esperado por el componente
      const formattedTemplates = firebaseTemplates.map((template: any) => ({
        id: template.id,
        meta: {
          name: template.name,
          description: template.description,
          category: template.category,
          version: '1.0.0',
          author: 'Admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        isPublic: template.isPublic || false,
        targetSection: template.targetSection || 'profile',
        downloadCount: template.downloads || 0,
        rating: 0,
        // Estructura adicional requerida por el componente
        component: {
          id: 'template_' + template.id,
          props: {}
        },
        editable: {
          fields: template.jsonConfig || [],
          lockedSections: []
        },
        appearIn: 'templates',
        cssGlobal: template.cssCode || '',
        sections: {
          profile: {},
          links: [],
          social: {},
          services: [],
          booking: {},
          portfolio: [],
          elements: [],
          design: {}
        }
      }));
      
      setTemplates(formattedTemplates);
    } catch (err: any) {
      console.error('Error cargando plantillas:', err);
      setError(err.message || 'Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar plantillas localmente
  const getFilteredTemplates = () => {
    return templates.filter(template => {
      // Filtro de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = template.meta.name.toLowerCase().includes(searchLower);
        const matchesDescription = template.meta.description?.toLowerCase().includes(searchLower);
        const matchesCategory = template.meta.category.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesDescription && !matchesCategory) {
          return false;
        }
      }

      // Filtro de categoría
      if (filters.category !== 'all' && template.meta.category !== filters.category) {
        return false;
      }

      // Filtro de estado
      if (filters.status !== 'all') {
        const isPublished = template.isPublic;
        if (filters.status === 'published' && !isPublished) return false;
        if (filters.status === 'draft' && isPublished) return false;
      }

      return true;
    });
  };

  const filteredTemplates = getFilteredTemplates();

  // Funciones de acciones implementadas
  const deleteTemplate = async (id: string) => {
    try {
      setLoading(true);
      const success = await templateDistributionService.deleteTemplate(id);
      if (success) {
        console.log('✅ Plantilla eliminada exitosamente');
        await loadTemplatesFromFirebase(); // Recargar después de eliminar
      } else {
        alert('❌ Error al eliminar la plantilla');
      }
    } catch (error) {
      console.error('Error eliminando plantilla:', error);
      alert('❌ Error al eliminar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const publishTemplate = async (id: string) => {
    try {
      setLoading(true);
      const success = await templateDistributionService.togglePublishStatus(id, true);
      if (success) {
        console.log('✅ Plantilla publicada exitosamente');
        await loadTemplatesFromFirebase(); // Recargar después de publicar
      } else {
        alert('❌ Error al publicar la plantilla');
      }
    } catch (error) {
      console.error('Error publicando plantilla:', error);
      alert('❌ Error al publicar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const unpublishTemplate = async (id: string) => {
    try {
      setLoading(true);
      const success = await templateDistributionService.togglePublishStatus(id, false);
      if (success) {
        console.log('✅ Plantilla despublicada exitosamente');
        await loadTemplatesFromFirebase(); // Recargar después de despublicar
      } else {
        alert('❌ Error al despublicar la plantilla');
      }
    } catch (error) {
      console.error('Error despublicando plantilla:', error);
      alert('❌ Error al despublicar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await TemplateIOService.importFromFile(file);
      
      if (result.success && result.template) {
        // TODO: Implementar importación desde pack
        console.log('Importar plantilla desde pack:', result.template);
        alert('Template imported successfully!');
        await loadTemplatesFromFirebase(); // Recargar después de importar
      } else {
        alert(`Import failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Error importing template:', error);
      alert('Error importing template');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = async (template: any) => {
    try {
      setLoading(true);
      const exportData = await templateDistributionService.exportTemplate(template.id);
      if (exportData) {
        // Crear archivo y descargarlo
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.meta.name.replace(/[^a-zA-Z0-9]/g, '_')}_template.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Plantilla exportada exitosamente');
        alert(`✅ Plantilla "${template.meta.name}" exportada como JSON`);
      } else {
        alert('❌ Error al exportar la plantilla');
      }
    } catch (error) {
      console.error('Error exporting template:', error);
      alert('❌ Error al exportar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (template: any) => {
    try {
      setLoading(true);
      const newTemplateId = await templateDistributionService.duplicateTemplate(template.id);
      if (newTemplateId) {
        console.log('✅ Plantilla duplicada exitosamente:', newTemplateId);
        alert(`✅ Plantilla "${template.meta.name}" duplicada exitosamente como borrador`);
        await loadTemplatesFromFirebase(); // Recargar para mostrar la nueva plantilla
      } else {
        alert('❌ Error al duplicar la plantilla');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('❌ Error al duplicar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: any) => {
    const confirmMessage = `⚠️ ¿Estás seguro de que quieres eliminar la plantilla "${template.meta.name}"?\n\nEsta acción NO se puede deshacer y la plantilla se eliminará permanentemente de la base de datos.`;
    
    if (confirm(confirmMessage)) {
      try {
        await deleteTemplate(template.id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleEdit = (template: any) => {
    // Navegar al editor con el ID de la plantilla
    navigate(`/admin/creator?edit=${template.id}`);
  };

  const handleTogglePublish = async (template: Template) => {
    try {
      if (template.isPublic) {
        await unpublishTemplate(template.id);
      } else {
        await publishTemplate(template.id);
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
      alert('Error updating template status');
    }
  };

  const handleAppearInChange = async (template: any, appearIn: AppearIn) => {
    try {
      // TODO: Implementar cambio de visibilidad
      console.log('Cambiar visibilidad plantilla:', template, appearIn);
      alert('Template visibility updated successfully!');
      await loadTemplatesFromFirebase(); // Recargar después de cambiar
    } catch (error) {
      console.error('Error updating template visibility:', error);
      alert('Error updating template visibility');
    }
  };

  const renderTemplateCard = (template: Template) => (
    <div key={template.id} className="admin-card rounded-xl overflow-hidden hover:shadow-xl transition-all admin-rise">
      {/* Header */}
      <div className="p-4 admin-divider">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {template.meta.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {template.meta.description || 'No description'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">
                {template.meta.category}
              </span>
              <span className={`px-2 py-1 text-xs rounded ${
                template.isPublic 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {template.isPublic ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActionMenu(showActionMenu === template.id ? null : template.id)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            {showActionMenu === template.id && (
              <div className="absolute right-0 top-8 admin-card rounded-lg shadow-lg py-1 z-10 min-w-48">
                <button
                  onClick={() => {
                    navigate(`/admin/creator?edit=${template.id}`);
                    setShowActionMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDuplicate(template);
                    setShowActionMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    handleExport(template);
                    setShowActionMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={() => {
                    handleTogglePublish(template);
                    setShowActionMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {template.isPublic ? 'Unpublish' : 'Publish'}
                </button>
                <div className="admin-divider my-1"></div>
                <button
                  onClick={() => {
                    handleDelete(template);
                    setShowActionMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Appears in:</label>
            <select
              value={template.appearIn}
              onChange={(e) => handleAppearInChange(template, e.target.value as AppearIn)}
              className="mt-1 w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
            >
              <option value="templates">Templates Only</option>
              <option value="design-presets">Design Presets Only</option>
              <option value="both">Both Sections</option>
            </select>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Component: {template.component.id}</p>
            <p>Fields: {template.editable.fields.length}</p>
            <p>Locked: {template.editable.lockedSections.length}/8</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="admin-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-white/10 border border-white/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-gray-900 dark:text-white/90" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Templates
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage and organize your templates
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleImportClick}
              disabled={importing}
              className="border-black/10 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Import JSON'}
            </Button>
            
            <Button onClick={() => navigate('/admin/creator')} className="bg-white/10 dark:bg-white/10 text-gray-900 dark:text-white border border-black/10 dark:border-white/20 hover:bg-white/20">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search templates..."
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as TemplateCategory | 'all' }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="all">All Categories</option>
              <option value="minimal">Minimal</option>
              <option value="modern">Modern</option>
              <option value="creative">Creative</option>
              <option value="luxury">Luxury</option>
              <option value="business">Business</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Appears In
            </label>
            <select
              value={filters.appearIn}
              onChange={(e) => setFilters(prev => ({ ...prev, appearIn: e.target.value as AppearIn | 'all' }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="all">All Locations</option>
              <option value="templates">Templates Only</option>
              <option value="design-presets">Design Presets Only</option>
              <option value="both">Both Sections</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`${viewMode === 'grid' ? 'admin-pill' : ''}`}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('list')}
            className={`${viewMode === 'list' ? 'admin-pill' : ''}`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.category !== 'all' || filters.status !== 'all' 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first template.'
            }
          </p>
          <Button onClick={() => navigate('/admin/creator')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredTemplates.map(renderTemplateCard)}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Click outside to close action menu */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  );
};

export default AdminTemplates;
