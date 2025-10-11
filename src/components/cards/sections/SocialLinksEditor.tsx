import React, { useMemo, useState } from 'react';
import { IOSSection } from '@/components/ui/IOSControls';
import { Card, CardSocialLinks } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Share, 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Trash2,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Github,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/utils/toast';

interface SocialLinksEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
  maxSocialLinks?: number;
  onLimitReached?: () => void;
}

export const SocialLinksEditor: React.FC<SocialLinksEditorProps> = ({ card, onUpdate, maxSocialLinks, onLimitReached }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const socialCount = card.socialLinks?.length || 0;
  const reachedLimit = useMemo(
    () => typeof maxSocialLinks === 'number' && socialCount >= maxSocialLinks,
    [maxSocialLinks, socialCount]
  );

  const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', placeholder: 'tu_usuario' },
    { id: 'twitter', name: 'Twitter / X', icon: Twitter, color: '#1DA1F2', placeholder: 'tu_usuario' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0077B5', placeholder: 'tu-perfil' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2', placeholder: 'tu.perfil' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000', placeholder: '@tu_canal' },
    { id: 'github', name: 'GitHub', icon: Github, color: '#181717', placeholder: 'tu_usuario' },
    { id: 'tiktok', name: 'TikTok', icon: ExternalLink, color: '#000000', placeholder: '@tu_usuario' },
    { id: 'whatsapp', name: 'WhatsApp', icon: ExternalLink, color: '#25D366', placeholder: '1234567890' },
    { id: 'telegram', name: 'Telegram', icon: ExternalLink, color: '#0088CC', placeholder: 'tu_usuario' },
    { id: 'behance', name: 'Behance', icon: ExternalLink, color: '#1769FF', placeholder: 'tu_usuario' },
    { id: 'dribbble', name: 'Dribbble', icon: ExternalLink, color: '#EA4C89', placeholder: 'tu_usuario' },
    { id: 'pinterest', name: 'Pinterest', icon: ExternalLink, color: '#BD081C', placeholder: 'tu_usuario' },
    { id: 'snapchat', name: 'Snapchat', icon: ExternalLink, color: '#FFFC00', placeholder: 'tu_usuario' },
    { id: 'discord', name: 'Discord', icon: ExternalLink, color: '#5865F2', placeholder: 'tu_usuario#1234' }
  ];

  const handleSocialLinksUpdate = (newSocialLinks: CardSocialLinks[]) => {
    onUpdate({ socialLinks: newSocialLinks });
  };

  // Helper function to ensure valid hex color for color inputs
  const getValidHexColor = (color: string | undefined, fallback = '#6B7280') => {
    if (!color) return fallback;
    // If it's already a valid hex color, return it
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    // Otherwise return fallback
    return fallback;
  };

  const notifyLimit = () => {
    if (onLimitReached) {
      onLimitReached();
    }
    if (typeof maxSocialLinks === 'number') {
      toast.error(`Plan FREE: máximo ${maxSocialLinks} redes sociales.`);
    }
  };

  const addSocialLink = () => {
    if (reachedLimit) {
      notifyLimit();
      return;
    }
    if (!selectedPlatform) return;

    const platform = socialPlatforms.find(p => p.id === selectedPlatform);
    if (!platform) return;

    const existingSocial = card.socialLinks?.find(s => s.platform === selectedPlatform);
    if (existingSocial) return; // No duplicados

    const newSocialLink: CardSocialLinks = {
      id: `social-${Date.now()}`,
      platform: selectedPlatform as any,
      username: '',
      url: '',
      isVisible: true,
      order: card.socialLinks?.length || 0,
      style: {
        displayType: 'icon',
        size: 'md',
        color: platform.color,
        shadow: true
      }
    };

    const updatedSocialLinks = [...(card.socialLinks || []), newSocialLink];
    handleSocialLinksUpdate(updatedSocialLinks);
    setSelectedPlatform('');
  };

  const updateSocialLink = (socialId: string, updates: Partial<CardSocialLinks>) => {
    const updatedSocialLinks = (card.socialLinks || []).map(social =>
      social.id === socialId ? { ...social, ...updates } : social
    );
    handleSocialLinksUpdate(updatedSocialLinks);
  };

  const deleteSocialLink = (socialId: string) => {
    const filteredSocialLinks = (card.socialLinks || []).filter(social => social.id !== socialId);
    // Reorder remaining links
    const reorderedSocialLinks = filteredSocialLinks.map((social, index) => ({
      ...social,
      order: index
    }));
    handleSocialLinksUpdate(reorderedSocialLinks);
  };

  const toggleSocialVisibility = (socialId: string) => {
    const social = card.socialLinks?.find(s => s.id === socialId);
    if (social) {
      updateSocialLink(socialId, { isVisible: !social.isVisible });
    }
  };

  const generateUrl = (platform: string, username: string) => {
    const baseUrls: Record<string, string> = {
      instagram: 'https://instagram.com/',
      twitter: 'https://twitter.com/',
      linkedin: 'https://linkedin.com/in/',
      facebook: 'https://facebook.com/',
      youtube: 'https://youtube.com/',
      github: 'https://github.com/',
      tiktok: 'https://tiktok.com/',
      whatsapp: 'https://wa.me/',
      telegram: 'https://t.me/',
      behance: 'https://behance.net/',
      dribbble: 'https://dribbble.com/',
      pinterest: 'https://pinterest.com/',
      snapchat: 'https://snapchat.com/add/',
      discord: 'https://discord.com/users/'
    };

    return baseUrls[platform] + username.replace('@', '');
  };

  const handleDragStart = (socialId: string) => {
    setDraggedItem(socialId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) return;

    const socialLinks = card.socialLinks || [];
    const draggedIndex = socialLinks.findIndex(s => s.id === draggedItem);
    const targetIndex = socialLinks.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSocialLinks = [...socialLinks];
    const [draggedSocial] = newSocialLinks.splice(draggedIndex, 1);
    newSocialLinks.splice(targetIndex, 0, draggedSocial);

    // Update order
    const reorderedSocialLinks = newSocialLinks.map((social, index) => ({
      ...social,
      order: index
    }));

    handleSocialLinksUpdate(reorderedSocialLinks);
    setDraggedItem(null);
  };

  const getSocialIcon = (platformId: string) => {
    const platform = socialPlatforms.find(p => p.id === platformId);
    if (platform) {
      const Icon = platform.icon;
      return <Icon className="w-5 h-5" />;
    }
    return <ExternalLink className="w-5 h-5" />;
  };

  const sortedSocialLinks = [...(card.socialLinks || [])].sort((a, b) => a.order - b.order);
  const availablePlatforms = socialPlatforms.filter(platform => 
    !card.socialLinks?.some(social => social.platform === platform.id)
  );

  return (
    <div className="space-y-8">
      <IOSSection title="Redes Sociales" icon={<Share size={14} />} variant="dark" sectionKey="social-main" />

      {/* Add Social Platform */}
      {reachedLimit && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4" />
          <span>Plan FREE: límite de {maxSocialLinks} perfiles sociales. Mejora tu plan para añadir más.</span>
        </div>
      )}

      {availablePlatforms.length > 0 && !reachedLimit && (
        <div className="bg-[#121218] rounded-xl border border-black/20 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Agregar Red Social
          </h4>
          
          <div className="flex space-x-3">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecciona una plataforma</option>
              {availablePlatforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
            
            <Button
              onClick={addSocialLink}
              disabled={!selectedPlatform}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>
      )}

      {/* Social Links List */}
      <div className="space-y-4">
         {sortedSocialLinks.length === 0 ? (
          <div className="text-center py-12 bg-[#1b1b22] rounded-xl border-2 border-dashed border-black/20">
            <Share className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay redes sociales aún
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Agrega tus primeras redes sociales para conectar con tu audiencia
            </p>
          </div>
        ) : (
          sortedSocialLinks.map((social) => {
            const platform = socialPlatforms.find(p => p.id === social.platform);
            
            return (
              <div
                key={social.id}
                draggable
                onDragStart={() => handleDragStart(social.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, social.id)}
                className={`bg-[#121218] rounded-xl border border-black/20 p-6 transition-all ${
                  draggedItem === social.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
                }`}
              >
                {/* Social Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <GripVertical className="w-5 h-5" />
                    </button>
                    
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: platform?.color || '#6B7280' }}
                    >
                      {getSocialIcon(social.platform)}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {platform?.name || social.platform}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{social.username || 'sin_configurar'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSocialVisibility(social.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        social.isVisible
                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title={social.isVisible ? 'Ocultar enlace' : 'Mostrar enlace'}
                    >
                      {social.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => deleteSocialLink(social.id)}
                      className="p-2 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Eliminar red social"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Social Configuration */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Usuario / Handle
                      </label>
                      <Input
                        type="text"
                        value={social.username}
                        onChange={(e) => {
                          const username = e.target.value;
                          const url = username ? generateUrl(social.platform, username) : '';
                          updateSocialLink(social.id, { username, url });
                        }}
                        placeholder={platform?.placeholder || 'tu_usuario'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL Completa
                      </label>
                      <Input
                        type="url"
                        value={social.url}
                        onChange={(e) => updateSocialLink(social.id, { url: e.target.value })}
                        placeholder={`https://${social.platform}.com/tu_usuario`}
                      />
                    </div>
                  </div>

                  {/* Style Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Visualización
                      </label>
                      <select
                        value={social.style.displayType}
                        onChange={(e) => updateSocialLink(social.id, { 
                          style: { ...social.style, displayType: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="icon">Solo icono</option>
                        <option value="button">Botón</option>
                        <option value="pill">Píldora</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tamaño
                      </label>
                      <select
                        value={social.style.size}
                        onChange={(e) => updateSocialLink(social.id, { 
                          style: { ...social.style, size: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="sm">Pequeño</option>
                        <option value="md">Mediano</option>
                        <option value="lg">Grande</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={getValidHexColor(social.style.color || platform?.color, '#6B7280')}
                          onChange={(e) => updateSocialLink(social.id, { 
                            style: { ...social.style, color: e.target.value }
                          })}
                          className="w-12 h-10 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer"
                        />
                        <button
                          onClick={() => updateSocialLink(social.id, { 
                            style: { ...social.style, color: platform?.color }
                          })}
                          className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Original
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview Section */}
      {sortedSocialLinks.length > 0 && (
        <div className="bg-[#121218] rounded-xl border border-black/20 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Vista Previa
          </h4>
          
          <div className="flex justify-center space-x-4">
            {sortedSocialLinks
              .filter(social => social.isVisible)
              .slice(0, 6)
              .map((social) => {
                const platform = socialPlatforms.find(p => p.id === social.platform);
                const sizeClasses = {
                  sm: 'w-8 h-8',
                  md: 'w-12 h-12',
                  lg: 'w-16 h-16'
                };
                
                return (
                  <div
                    key={social.id}
                    className={`${sizeClasses[social.style.size]} rounded-full flex items-center justify-center text-white ${
                      social.style.shadow ? 'shadow-lg' : ''
                    }`}
                    style={{ backgroundColor: social.style.color || platform?.color || '#6B7280' }}
                  >
                    {getSocialIcon(social.platform)}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialLinksEditor;
