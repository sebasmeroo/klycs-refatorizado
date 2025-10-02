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
  MoreVertical,
  Copy
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

  const addNewLink = async () => {
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
        variant: 'modern',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: '0px',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: '500'
      },
      analytics: {
        clicks: 0
      }
    };

    const nextLinks = [...card.links, newLink];
    handleLinksUpdate(nextLinks);
    setEditingLink(newLink.id);
  };

  const updateLink = (linkId: string, updates: Partial<CardLink>) => {
    const updatedLinks = card.links.map(link =>
      link.id === linkId ? { ...link, ...updates } : link
    );
    handleLinksUpdate(updatedLinks);
  };

  const deleteLink = (linkId: string) => {
    const updatedLinks = card.links.filter(link => link.id !== linkId);
    handleLinksUpdate(updatedLinks);
    if (editingLink === linkId) {
      setEditingLink(null);
    }
  };

  const toggleLinkVisibility = (linkId: string) => {
    updateLink(linkId, { isVisible: !card.links.find(l => l.id === linkId)?.isVisible });
  };

  const moveLink = (linkId: string, direction: 'up' | 'down') => {
    const currentIndex = card.links.findIndex(link => link.id === linkId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= card.links.length) return;

    const newLinks = [...card.links];
    [newLinks[currentIndex], newLinks[newIndex]] = [newLinks[newIndex], newLinks[currentIndex]];
    
    // Update orders
    newLinks.forEach((link, index) => {
      link.order = index;
    });

    handleLinksUpdate(newLinks);
  };

  const duplicateLink = (linkId: string) => {
    const originalLink = card.links.find(l => l.id === linkId);
    if (!originalLink) return;

    const duplicatedLink: CardLink = {
      ...originalLink,
      id: `link-${Date.now()}`,
      title: `${originalLink.title} (Copia)`,
      order: card.links.length
    };

    handleLinksUpdate([...card.links, duplicatedLink]);
  };

  const handleDragStart = (e: React.DragEvent, linkId: string) => {
    setDraggedItem(linkId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLinkId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetLinkId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = card.links.findIndex(link => link.id === draggedItem);
    const targetIndex = card.links.findIndex(link => link.id === targetLinkId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newLinks = [...card.links];
    const [draggedLink] = newLinks.splice(draggedIndex, 1);
    newLinks.splice(targetIndex, 0, draggedLink);

    // Update orders
    newLinks.forEach((link, index) => {
      link.order = index;
    });

    handleLinksUpdate(newLinks);
    setDraggedItem(null);
  };

  const sortedLinks = [...card.links].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {/* Enlaces Principales */}
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
          <div className="text-center py-10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <Link className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-blue-700 dark:text-blue-300 font-medium">No hay enlaces configurados</p>
            <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">Agrega tu primer enlace para comenzar</p>
          </div>
        ) : (
          sortedLinks.map((link) => (
            <div
              key={link.id}
              draggable
              onDragStart={(e) => handleDragStart(e, link.id)}
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
                  {/* Menú de acciones (duplicar, etc.) */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.currentTarget.nextElementSibling?.classList.toggle('hidden');
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                      title="Más acciones"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="hidden absolute right-0 mt-2 w-40 bg-[#1b1b22] border border-black/20 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => duplicateLink(link.id)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </button>
                      <button
                        onClick={() => moveLink(link.id, 'up')}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                      >
                        Mover arriba
                      </button>
                      <button
                        onClick={() => moveLink(link.id, 'down')}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
                      >
                        Mover abajo
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleLinkVisibility(link.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      link.isVisible
                        ? 'text-green-400 hover:text-green-300 hover:bg-green-900/20'
                        : 'text-gray-500 hover:text-gray-400 hover:bg-gray-700/40'
                    }`}
                    title={link.isVisible ? 'Ocultar enlace' : 'Mostrar enlace'}
                  >
                    {link.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => setEditingLink(editingLink === link.id ? null : link.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      editingLink === link.id
                        ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 bg-blue-900/10'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/40'
                    }`}
                    title="Editar enlace"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar enlace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingLink === link.id && (
                <div className="space-y-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título
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
                        URL
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Icono (emoji)
                    </label>
                    <Input
                      type="text"
                      value={link.icon}
                      onChange={(e) => updateLink(link.id, { icon: e.target.value, iconType: 'emoji' })}
                      placeholder="🔗"
                      className="text-center"
                      maxLength={2}
                    />
                  </div>

                  {/* Diseño del Botón */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Diseño del Botón
                    </label>
                    <select
                      value={link.style.variant || 'modern'}
                      onChange={(e) => updateLink(link.id, {
                        style: { ...link.style, variant: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="modern">Modern - Diseño limpio y actual</option>
                      <option value="neumorphic">Neumorphic - Efecto 3D suave</option>
                      <option value="minimal">Minimal - Ultra minimalista</option>
                      <option value="gradient">Gradient - Degradado moderno</option>
                      <option value="glassmorphic">Glassmorphic - Efecto cristal</option>
                    </select>
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
                        Color del Texto
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
                  </div>

                  {/* Opciones de Borde */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color del Borde
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={getValidHexColor(link.style.borderColor, '#3b82f6')}
                          onChange={(e) => updateLink(link.id, {
                            style: { ...link.style, borderColor: e.target.value }
                          })}
                          className="w-12 h-10 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={link.style.borderColor || ''}
                          onChange={(e) => updateLink(link.id, {
                            style: { ...link.style, borderColor: e.target.value }
                          })}
                          placeholder="#3b82f6"
                          className="flex-1 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ancho del Borde
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="8"
                          step="1"
                          value={parseInt(link.style.borderWidth || '0')}
                          onChange={(e) => updateLink(link.id, {
                            style: { ...link.style, borderWidth: `${e.target.value}px` }
                          })}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                          {link.style.borderWidth || '0px'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Opciones de Bordes Redondeados */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Redondeo de Bordes
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="2"
                        value={parseInt(link.style.borderRadius || '12')}
                        onChange={(e) => updateLink(link.id, {
                          style: { ...link.style, borderRadius: `${e.target.value}px` }
                        })}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                        {link.style.borderRadius || '12px'}
                      </span>
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