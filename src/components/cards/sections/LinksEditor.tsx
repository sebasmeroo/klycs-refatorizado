import React, { useState } from 'react';
import { IOSSection } from '@/components/ui/IOSControls';
import { Card, CardLink } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Link, 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Palette,
  Type,
  Smile,
  Image as ImageIcon
} from 'lucide-react';

interface LinksEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const LinksEditor: React.FC<LinksEditorProps> = ({ card, onUpdate }) => {
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleLinksUpdate = (newLinks: CardLink[]) => {
    onUpdate({ links: newLinks });
  };

  // Helper function to ensure valid hex color for color inputs
  const getValidHexColor = (color: string | undefined, fallback = '#3b82f6') => {
    if (!color) return fallback;
    // If it's already a valid hex color, return it
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    // Otherwise return fallback
    return fallback;
  };

  const addNewLink = () => {
    const newLink: CardLink = {
      id: `link-${Date.now()}`,
      title: 'Nuevo Enlace',
      url: '',
      description: '',
      icon: '🔗',
      iconType: 'emoji',
      isVisible: true,
      order: card.links.length,
      style: {
        variant: 'solid',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: '500'
      },
      analytics: {
        clicks: 0
      }
    };

    handleLinksUpdate([...card.links, newLink]);
    setEditingLink(newLink.id);
  };

  const updateLink = (linkId: string, updates: Partial<CardLink>) => {
    const updatedLinks = card.links.map(link =>
      link.id === linkId ? { ...link, ...updates } : link
    );
    handleLinksUpdate(updatedLinks);
  };

  const deleteLink = (linkId: string) => {
    const filteredLinks = card.links.filter(link => link.id !== linkId);
    // Reorder remaining links
    const reorderedLinks = filteredLinks.map((link, index) => ({
      ...link,
      order: index
    }));
    handleLinksUpdate(reorderedLinks);
  };

  const toggleLinkVisibility = (linkId: string) => {
    updateLink(linkId, { isVisible: !card.links.find(l => l.id === linkId)?.isVisible });
  };

  const handleDragStart = (linkId: string) => {
    setDraggedItem(linkId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = card.links.findIndex(l => l.id === draggedItem);
    const targetIndex = card.links.findIndex(l => l.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLinks = [...card.links];
    const [draggedLink] = newLinks.splice(draggedIndex, 1);
    newLinks.splice(targetIndex, 0, draggedLink);

    // Update order
    const reorderedLinks = newLinks.map((link, index) => ({
      ...link,
      order: index
    }));

    handleLinksUpdate(reorderedLinks);
    setDraggedItem(null);
  };

  const linkStylePresets = [
    { name: 'Sólido Azul', style: { variant: 'solid', backgroundColor: '#3b82f6', textColor: '#ffffff' } },
    { name: 'Sólido Negro', style: { variant: 'solid', backgroundColor: '#1f2937', textColor: '#ffffff' } },
    { name: 'Contorno Azul', style: { variant: 'outline', backgroundColor: 'transparent', textColor: '#3b82f6', borderColor: '#3b82f6' } },
    { name: 'Contorno Blanco', style: { variant: 'outline', backgroundColor: 'transparent', textColor: '#ffffff', borderColor: '#ffffff' } },
    { name: 'Glassmorphism', style: { variant: 'glassmorphism', backgroundColor: 'rgba(255,255,255,0.1)', textColor: '#ffffff' } },
    { name: 'Degradado Rosa', style: { variant: 'gradient', backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', textColor: '#ffffff' } },
  ];

  const sortedLinks = [...card.links].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      <IOSSection title="Enlaces Principales" icon={<Link size={14} />} variant="dark" sectionKey="links-main">
        <div className="flex justify-end">
          <Button onClick={addNewLink}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Enlace
          </Button>
        </div>
      </IOSSection>

      {/* Links List */}
      <div className="space-y-4">
        {sortedLinks.length === 0 ? (
           <div className="text-center py-12 bg-[#1b1b22] rounded-xl border-2 border-dashed border-black/20">
            <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay enlaces aún
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Agrega tu primer enlace para comenzar
            </p>
               <Button onClick={addNewLink}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Enlace
            </Button>
          </div>
        ) : (
          sortedLinks.map((link) => (
            <div
              key={link.id}
              draggable
              onDragStart={() => handleDragStart(link.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, link.id)}
               className={`bg-[#121218] rounded-xl border border-black/20 p-6 transition-all ${
                draggedItem === link.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
              }`}
            >
              {/* Link Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <button className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <GripVertical className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {link.iconType === 'emoji' ? link.icon : '🔗'}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {link.title || 'Sin título'}
                      </h4>
                      {link.url && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-48">
                          {link.url}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleLinkVisibility(link.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      link.isVisible
                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={link.isVisible ? 'Ocultar enlace' : 'Mostrar enlace'}
                  >
                    {link.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => setEditingLink(editingLink === link.id ? null : link.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      editingLink === link.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Editar enlace"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Eliminar enlace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Editor */}
              {editingLink === link.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título *
                      </label>
                      <Input
                        type="text"
                        value={link.title}
                        onChange={(e) => updateLink(link.id, { title: e.target.value })}
                        placeholder="Título del enlace"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL *
                      </label>
                      <Input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(link.id, { url: e.target.value })}
                        placeholder="https://ejemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción (opcional)
                    </label>
                    <Input
                      type="text"
                      value={link.description || ''}
                      onChange={(e) => updateLink(link.id, { description: e.target.value })}
                      placeholder="Breve descripción del enlace"
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Icono
                    </label>
                    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-3">
                      <button
                        onClick={() => updateLink(link.id, { iconType: 'emoji' })}
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          link.iconType === 'emoji'
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Smile className="w-4 h-4 mr-2" />
                        Emoji
                      </button>
                      <button
                        onClick={() => updateLink(link.id, { iconType: 'custom' })}
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          link.iconType === 'custom'
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Imagen
                      </button>
                    </div>

                    {link.iconType === 'emoji' ? (
                      <Input
                        type="text"
                        value={link.icon || ''}
                        onChange={(e) => updateLink(link.id, { icon: e.target.value })}
                        placeholder="🔗"
                        className="w-20 text-center"
                      />
                    ) : (
                      <Input
                        type="url"
                        value={link.icon || ''}
                        onChange={(e) => updateLink(link.id, { icon: e.target.value })}
                        placeholder="https://ejemplo.com/icono.svg"
                      />
                    )}
                  </div>

                  {/* Style Presets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Estilos Prediseñados
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {linkStylePresets.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => updateLink(link.id, { 
                            style: { ...link.style, ...preset.style }
                          })}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 transition-colors text-xs font-medium"
                          style={{
                            background: preset.style.backgroundColor,
                            color: preset.style.textColor,
                            borderColor: preset.style.borderColor
                          }}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Style Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color de Fondo
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={getValidHexColor(link.style.backgroundColor, '#3b82f6')}
                          onChange={(e) => updateLink(link.id, { 
                            style: { ...link.style, backgroundColor: e.target.value }
                          })}
                          className="w-12 h-10 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={link.style.backgroundColor || ''}
                          onChange={(e) => updateLink(link.id, { 
                            style: { ...link.style, backgroundColor: e.target.value }
                          })}
                          placeholder="#3b82f6"
                          className="flex-1 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color de Texto
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={getValidHexColor(link.style.textColor, '#ffffff')}
                          onChange={(e) => updateLink(link.id, { 
                            style: { ...link.style, textColor: e.target.value }
                          })}
                          className="w-12 h-10 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={link.style.textColor || ''}
                          onChange={(e) => updateLink(link.id, { 
                            style: { ...link.style, textColor: e.target.value }
                          })}
                          placeholder="#ffffff"
                          className="flex-1 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Radio de Esquinas
                      </label>
                      <select
                        value={link.style.borderRadius || '12px'}
                        onChange={(e) => updateLink(link.id, { 
                          style: { ...link.style, borderRadius: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="0px">Sin redondear</option>
                        <option value="4px">Poco redondeado</option>
                        <option value="8px">Redondeado</option>
                        <option value="12px">Muy redondeado</option>
                        <option value="24px">Píldora</option>
                        <option value="50%">Completamente redondo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tamaño de Fuente
                      </label>
                      <select
                        value={link.style.fontSize || '16px'}
                        onChange={(e) => updateLink(link.id, { 
                          style: { ...link.style, fontSize: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="14px">Pequeño</option>
                        <option value="16px">Normal</option>
                        <option value="18px">Grande</option>
                        <option value="20px">Muy grande</option>
                      </select>
                    </div>
                  </div>

                  {/* Analytics Info */}
                  {link.analytics.clicks > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-center text-blue-700 dark:text-blue-300">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">
                          {link.analytics.clicks} clicks registrados
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LinksEditor;