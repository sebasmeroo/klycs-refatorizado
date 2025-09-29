import React, { useState } from 'react';
import { Card, CardSettings } from '@/types';
import { Settings, Search, BarChart3, Share2, Tag, AlertCircle, Code, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/utils/toast';

interface AdvancedSettingsEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const AdvancedSettingsEditor: React.FC<AdvancedSettingsEditorProps> = ({ card, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'seo' | 'analytics' | 'sharing'>('seo');

  const settings: CardSettings = card.settings || {
    seo: {
      title: card.title,
      description: card.description,
      keywords: '',
      image: card.profile?.avatar,
      canonicalUrl: ''
    },
    analytics: {
      enabled: false,
      trackClicks: true,
      trackViews: true,
      googleAnalyticsId: '',
      facebookPixelId: '',
      customScripts: ''
    },
    sharing: {
      enabled: true,
      allowEmbed: false,
      customDomain: '',
      ogTitle: card.title,
      ogDescription: card.description,
      ogImage: card.profile?.avatar
    },
    branding: {
      showWatermark: true,
      customFooter: '',
      faviconUrl: ''
    },
    sectionsOrder: []
  };

  const handleUpdateSEO = <K extends keyof CardSettings['seo']>(
    field: K,
    value: CardSettings['seo'][K]
  ) => {
    onUpdate({
      settings: {
        ...settings,
        seo: {
          ...settings.seo,
          [field]: value
        }
      }
    });
  };

  const handleUpdateAnalytics = <K extends keyof CardSettings['analytics']>(
    field: K,
    value: CardSettings['analytics'][K]
  ) => {
    onUpdate({
      settings: {
        ...settings,
        analytics: {
          ...settings.analytics,
          [field]: value
        }
      }
    });
  };

  const handleUpdateSharing = <K extends keyof CardSettings['sharing']>(
    field: K,
    value: CardSettings['sharing'][K]
  ) => {
    onUpdate({
      settings: {
        ...settings,
        sharing: {
          ...settings.sharing,
          [field]: value
        }
      }
    });
  };

  const handleSaveSettings = () => {
    toast.success('Configuración guardada exitosamente');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuración Avanzada
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SEO, Analytics y opciones de compartir
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'seo'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          SEO
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('sharing')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'sharing'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'seo' && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                Optimización para Motores de Búsqueda
              </h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título SEO
              </label>
              <input
                type="text"
                value={settings.seo.title || ''}
                onChange={(e) => handleUpdateSEO('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Título optimizado para SEO (50-60 caracteres)"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(settings.seo.title?.length || 0)}/60 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción SEO
              </label>
              <textarea
                value={settings.seo.description || ''}
                onChange={(e) => handleUpdateSEO('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Descripción optimizada para SEO (150-160 caracteres)"
                maxLength={160}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(settings.seo.description?.length || 0)}/160 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Palabras clave
              </label>
              <input
                type="text"
                value={settings.seo.keywords || ''}
                onChange={(e) => handleUpdateSEO('keywords', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="palabra1, palabra2, palabra3"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Separa con comas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL Canónica
              </label>
              <input
                type="url"
                value={settings.seo.canonicalUrl || ''}
                onChange={(e) => handleUpdateSEO('canonicalUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://tudominio.com/tu-tarjeta"
              />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                Analytics y Seguimiento
              </h4>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.analytics.enabled}
                onChange={(e) => handleUpdateAnalytics('enabled', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Habilitar Analytics
              </span>
            </label>

            {settings.analytics.enabled && (
              <>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.analytics.trackViews}
                    onChange={(e) => handleUpdateAnalytics('trackViews', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Rastrear visitas
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.analytics.trackClicks}
                    onChange={(e) => handleUpdateAnalytics('trackClicks', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Rastrear clics en enlaces
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    value={settings.analytics.googleAnalyticsId || ''}
                    onChange={(e) => handleUpdateAnalytics('googleAnalyticsId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="G-XXXXXXXXXX o UA-XXXXXXXXX-X"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    value={settings.analytics.facebookPixelId || ''}
                    onChange={(e) => handleUpdateAnalytics('facebookPixelId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="XXXXXXXXXXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Scripts Personalizados
                  </label>
                  <textarea
                    value={settings.analytics.customScripts || ''}
                    onChange={(e) => handleUpdateAnalytics('customScripts', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-xs"
                    rows={4}
                    placeholder="<script>...</script>"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Scripts personalizados (hotjar, mixpanel, etc.)
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                Opciones de Compartir
              </h4>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.sharing.enabled}
                onChange={(e) => handleUpdateSharing('enabled', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Habilitar opciones de compartir
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.sharing.allowEmbed}
                onChange={(e) => handleUpdateSharing('allowEmbed', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Permitir embeds en otros sitios
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Open Graph Title
              </label>
              <input
                type="text"
                value={settings.sharing.ogTitle || ''}
                onChange={(e) => handleUpdateSharing('ogTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Título al compartir en redes sociales"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Open Graph Description
              </label>
              <textarea
                value={settings.sharing.ogDescription || ''}
                onChange={(e) => handleUpdateSharing('ogDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
                placeholder="Descripción al compartir en redes sociales"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Open Graph Image URL
              </label>
              <input
                type="url"
                value={settings.sharing.ogImage || ''}
                onChange={(e) => handleUpdateSharing('ogImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recomendado: 1200x630px
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-900 dark:text-indigo-200">
          <p className="font-medium mb-1">Configuración Avanzada</p>
          <ul className="list-disc list-inside space-y-1 text-indigo-700 dark:text-indigo-300 text-xs">
            <li>SEO: Mejora tu posicionamiento en buscadores</li>
            <li>Analytics: Rastrea visitas y comportamiento de usuarios</li>
            <li>Compartir: Optimiza cómo se ve tu tarjeta en redes sociales</li>
          </ul>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveSettings}
        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
      >
        Guardar Configuración
      </button>
    </div>
  );
};

export default AdvancedSettingsEditor;
