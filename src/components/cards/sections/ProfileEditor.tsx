import React, { useState } from 'react';
import { IOSSection } from '@/components/ui/IOSControls';
import { Card } from '@/types';
import { Input } from '@/components/ui/Input';
import { 
  User, 
  Camera, 
  Palette, 
  Image as ImageIcon,
  Zap,
  Eye,
  EyeOff,
  Phone,
  Globe
} from 'lucide-react';
import ColorPickerPopover from '@/components/ui/ColorPicker';

interface ProfileEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

// Presets básicos de colores y gradientes
const backgroundPresets = [
  { name: 'Azul océano', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Atardecer', type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Bosque', type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Fuego', type: 'gradient', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Noche', type: 'gradient', value: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' },
  
  { name: 'Azul', type: 'color', value: '#3b82f6' },
  { name: 'Verde', type: 'color', value: '#10b981' },
  { name: 'Púrpura', type: 'color', value: '#8b5cf6' },
  { name: 'Rosa', type: 'color', value: '#ec4899' },
  { name: 'Gris', type: 'color', value: '#6b7280' },
];

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ card, onUpdate }) => {
  const [previewAvatar, setPreviewAvatar] = useState(card.profile.avatar || '');
  const [showBio, setShowBio] = useState(!!card.profile.bio);
  const [pickerOpen, setPickerOpen] = useState(false);
  const colorButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleProfileUpdate = (updates: Partial<Card['profile']>) => {
    onUpdate({
      profile: { ...card.profile, ...updates }
    });
  };

  return (
    <div className="space-y-8">
      {/* Basic Profile Information */}
      <IOSSection title="Información del Perfil" icon={<User size={14} />} variant="dark" sectionKey="profile-info">
        <div className="space-y-4">
          {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto de Perfil
              </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {(previewAvatar || card.profile.avatar) ? (
                  <img 
                    src={previewAvatar || card.profile.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={() => setPreviewAvatar('')}
                  />
                ) : (
                  <Camera className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
              <Input
                type="url"
                  placeholder="URL de la imagen"
                value={previewAvatar}
                onChange={(e) => {
                  setPreviewAvatar(e.target.value);
                  handleProfileUpdate({ avatar: e.target.value });
                }}
              />
            </div>
          </div>
        </div>
        
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre
            </label>
            <Input
              type="text"
              value={card.profile.name || ''}
              onChange={(e) => handleProfileUpdate({ name: e.target.value })}
              placeholder="Tu nombre"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lema o titular
            </label>
            <Input
              type="text"
              value={card.profile.tagline || ''}
              onChange={(e) => handleProfileUpdate({ tagline: e.target.value })}
              placeholder="Ej: Diseñador UX · Ayudo a marcas a conectar con su audiencia"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Teléfono de contacto
              </label>
              <Input
                type="tel"
                value={card.profile.phone || ''}
                onChange={(e) => handleProfileUpdate({ phone: e.target.value })}
                placeholder="Ej: +34 600 123 456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Sitio web o enlace principal
              </label>
              <Input
                type="url"
                value={card.profile.website || ''}
                onChange={(e) => handleProfileUpdate({ website: e.target.value })}
                placeholder="Ej: https://tumarca.com"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Consejo: incluye https:// para que abra correctamente</p>
            </div>
          </div>


          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Biografía
              </label>
              <button
                onClick={() => {
                  setShowBio(!showBio);
                  if (!showBio) {
                    handleProfileUpdate({ bio: card.profile.bio || '' });
                  } else {
                    handleProfileUpdate({ bio: '' });
                  }
                }}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showBio ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showBio ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {showBio && (
                <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-3 min-h-[100px]"
                  value={card.profile.bio || ''}
                  onChange={(e) => handleProfileUpdate({ bio: e.target.value })}
                placeholder="Cuéntanos sobre ti..."
                />
            )}
          </div>

        </div>
      </IOSSection>

      {/* Background Customization */}
      <IOSSection title="Fondo de Perfil" icon={<Palette size={14} />} variant="dark" sectionKey="profile-background">
        {/* Background Type Selector */}
        <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
          <button
            onClick={() => handleProfileUpdate({ backgroundType: 'gradient' })}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              card.profile.backgroundType === 'gradient'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            Degradado
          </button>
          <button
            onClick={() => handleProfileUpdate({ backgroundType: 'color' })}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              card.profile.backgroundType === 'color'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Palette className="w-4 h-4 mr-2" />
            Color Sólido
          </button>
          <button
            onClick={() => handleProfileUpdate({ backgroundType: 'image' })}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              card.profile.backgroundType === 'image'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Imagen
          </button>
        </div>

        {/* Background Presets */}
        {(card.profile.backgroundType === 'gradient' || card.profile.backgroundType === 'color') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Fondos Prediseñados
            </label>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {backgroundPresets
                .filter(preset => 
                  card.profile.backgroundType === 'gradient' ? preset.type === 'gradient' : preset.type === 'color'
                )
                .map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (preset.type === 'gradient') {
                        handleProfileUpdate({ backgroundGradient: preset.value });
                      } else {
                        handleProfileUpdate({ backgroundColor: preset.value });
                      }
                    }}
                    className="w-full aspect-square rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 transition-colors relative overflow-hidden"
                    style={{ background: preset.value }}
                    title={preset.name}
                  >
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"></div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Custom Background Input - solid color */}
        {card.profile.backgroundType === 'color' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Personalizado
            </label>
            <div className="flex items-center gap-3">
              <button
                ref={colorButtonRef}
                onClick={() => setPickerOpen(true)}
                className="w-10 h-10 rounded-lg border border-black/30"
                style={{ background: card.profile.backgroundColor || '#667eea' }}
                aria-label="Elegir color"
                type="button"
              />
              <Input
                type="text"
                value={card.profile.backgroundColor || ''}
                onChange={(e) => handleProfileUpdate({ backgroundColor: e.target.value })}
                placeholder="#667eea"
                className="flex-1"
              />
            </div>
            <ColorPickerPopover
              color={card.profile.backgroundColor || '#667eea'}
              onChange={(hex) => handleProfileUpdate({ backgroundColor: hex })}
              anchorEl={colorButtonRef.current}
              isOpen={pickerOpen}
              onClose={() => setPickerOpen(false)}
            />
          </div>
        )}

        {/* Custom Background Input - gradient */}
        {card.profile.backgroundType === 'gradient' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Degradado Personalizado (CSS)
            </label>
            <Input
              type="text"
              value={card.profile.backgroundGradient || ''}
              onChange={(e) => handleProfileUpdate({ backgroundGradient: e.target.value })}
              placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Usa formato CSS linear-gradient o radial-gradient
            </p>
          </div>
        )}

        {/* Custom Background Input - image */}
        {card.profile.backgroundType === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL de Imagen de Fondo
            </label>
            <Input
              type="url"
              value={card.profile.backgroundImage || ''}
              onChange={(e) => handleProfileUpdate({ backgroundImage: e.target.value })}
              placeholder="https://ejemplo.com/fondo.jpg"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Recomendamos imágenes de al menos 800x600px
            </p>
          </div>
        )}
      </IOSSection>
    </div>
  );
};

export default ProfileEditor;
