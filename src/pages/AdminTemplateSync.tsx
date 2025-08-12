import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Database,
  Users,
  Eye,
  RotateCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { templateSyncService } from '@/services/templateSync';
import { templateDistributionService } from '@/services/templateDistribution';

interface SyncStatus {
  adminCount: number;
  userCount: number;
  publicAdminCount: number;
  needsSync: boolean;
}

export const AdminTemplateSync: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [adminTemplates, setAdminTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar estado de sincronización
      const status = await templateSyncService.checkTemplateAvailability();
      setSyncStatus(status);

      // Cargar plantillas de admin
      const templates = await templateDistributionService.getTemplates();
      setAdminTemplates(templates);

      console.log('📊 Estado de plantillas:', status);
      console.log('📋 Plantillas de admin:', templates);
      
    } catch (error) {
      console.error('Error loading sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await templateSyncService.syncAllTemplates();
      setSyncResult(result);
      
      if (result.success) {
        await loadData(); // Recargar datos después de sincronizar
      }
    } catch (error: any) {
      setSyncResult({
        success: false,
        syncedCount: 0,
        errors: [error.message]
      });
    } finally {
      setSyncing(false);
    }
  };

  const StatusCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    description 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string; 
    description: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {title}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );

  const TemplateItem = ({ template }: { template: any }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {template.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {template.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
              {template.category}
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">
              {template.targetSection}
            </span>
            <span className={`px-2 py-1 text-xs rounded ${
              template.isPublic 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {template.isPublic ? 'Público' : 'Borrador'}
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>ID: {template.id}</div>
          <div>Descargas: {template.downloads || 0}</div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Cargando datos de sincronización...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔄 Sincronización de Plantillas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona la sincronización entre plantillas de admin y el sistema de usuarios
          </p>
        </div>

        {/* Status Cards */}
        {syncStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatusCard
              title="Plantillas Admin"
              value={syncStatus.adminCount}
              icon={Database}
              color="from-blue-500 to-blue-600"
              description="Total de plantillas creadas en admin"
            />
            
            <StatusCard
              title="Plantillas Públicas"
              value={syncStatus.publicAdminCount}
              icon={Eye}
              color="from-green-500 to-green-600"
              description="Plantillas admin marcadas como públicas"
            />
            
            <StatusCard
              title="Disponibles para Usuarios"
              value={syncStatus.userCount}
              icon={Users}
              color="from-purple-500 to-purple-600"
              description="Plantillas visibles en el sistema de usuarios"
            />
            
            <StatusCard
              title="Estado"
              value={syncStatus.needsSync ? 1 : 0}
              icon={syncStatus.needsSync ? AlertCircle : CheckCircle}
              color={syncStatus.needsSync ? "from-red-500 to-red-600" : "from-emerald-500 to-emerald-600"}
              description={syncStatus.needsSync ? "Requiere sincronización" : "Sincronizado correctamente"}
            />
          </div>
        )}

        {/* Sync Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Acciones de Sincronización
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sincroniza las plantillas públicas de admin con el sistema de usuarios
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadData}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refrescar
              </Button>
              
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RotateCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
              </Button>
            </div>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className={`p-4 rounded-lg border ${
              syncResult.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {syncResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className={`font-semibold ${
                  syncResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {syncResult.success ? 'Sincronización Exitosa' : 'Error en Sincronización'}
                </h3>
              </div>
              
              <p className={`text-sm mb-2 ${
                syncResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {syncResult.success 
                  ? `${syncResult.syncedCount} plantillas sincronizadas correctamente`
                  : 'Se encontraron errores durante la sincronización'
                }
              </p>
              
              {syncResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Errores:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                    {syncResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Templates List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Plantillas de Admin ({adminTemplates.length})
            </h2>
          </div>
          
          {adminTemplates.length > 0 ? (
            <div className="space-y-4">
              {adminTemplates.map((template) => (
                <TemplateItem key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                No hay plantillas de admin
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Crea algunas plantillas usando el AdminTemplateCreator
              </p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información de Debug
            </h3>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div>• Las plantillas de admin se guardan en Firebase colección: <code>userTemplates</code></div>
            <div>• Solo las plantillas marcadas como "públicas" se sincronizan</div>
            <div>• El sistema de usuarios lee de la misma colección: <code>userTemplates</code></div>
            <div>• AdminTemplates ahora lee desde Firebase en lugar de localStorage</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTemplateSync;
