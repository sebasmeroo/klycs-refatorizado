import React, { useState } from 'react';
import { CardTemplate, cardTemplates, getTemplatesByCategory, applyTemplate } from '@/data/templates';
import { Card } from '@/types';
import { Eye, Check, Sparkles, Briefcase, Palette, Minus, Laptop, Crown } from 'lucide-react';
import { error } from '@/utils/logger';

interface TemplateSelectorProps {
  onSelectTemplate: (template: Partial<Card>) => void;
  onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<CardTemplate['category'] | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'Todos', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
    { id: 'business', name: 'Negocios', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
    { id: 'creative', name: 'Creativo', icon: Palette, color: 'from-orange-500 to-red-500' },
    { id: 'minimal', name: 'Minimalista', icon: Minus, color: 'from-gray-500 to-gray-600' },
    { id: 'modern', name: 'Moderno', icon: Laptop, color: 'from-indigo-500 to-purple-500' },
    { id: 'luxury', name: 'Lujo', icon: Crown, color: 'from-yellow-500 to-orange-500' },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? cardTemplates 
    : getTemplatesByCategory(selectedCategory);

  const handleTemplateSelect = (template: CardTemplate) => {
    setSelectedTemplate(template.id);
    // Don't apply immediately, just select
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Plantillas Prediseñadas</h2>
                <p className="text-purple-100">Elige una plantilla para empezar rápidamente</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200 p-6 pb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <category.icon size={16} />
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`group relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl ${
                  selectedTemplate === template.id
                    ? 'border-purple-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                {/* Template Preview */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {/* Mock template preview based on theme */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ 
                      background: template.theme.background?.type === 'gradient' 
                        ? template.theme.background.color
                        : template.theme.background?.color || template.theme.backgroundColor || '#f3f4f6'
                    }}
                  >
                    <div className="text-center p-4">
                      <div 
                        className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                        style={{ backgroundColor: template.theme.colors?.accent || template.theme.primaryColor || '#8b5cf6' }}
                      >
                        <span className="text-white font-bold text-lg">
                          {template.sampleData.basicInfo.fullName.charAt(0)}
                        </span>
                      </div>
                      <h3 
                        className="font-bold text-lg mb-1"
                        style={{ 
                          color: template.theme.colors?.text || template.theme.textColor || '#1f2937',
                          fontFamily: template.theme.font?.family || template.theme.fontFamily || 'Inter'
                        }}
                      >
                        {template.sampleData.basicInfo.fullName}
                      </h3>
                      <p 
                        className="text-sm opacity-80"
                        style={{ color: template.theme.colors?.text || template.theme.textColor || '#1f2937' }}
                      >
                        {template.sampleData.basicInfo.title}
                      </p>
                      <div className="mt-3 flex justify-center space-x-2">
                        {template.sampleData.links.slice(0, 2).map((link, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 rounded-full opacity-60"
                            style={{ backgroundColor: template.theme.colors?.accent || template.theme.primaryColor || '#8b5cf6' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 rounded-full p-2">
                        <Eye size={20} className="text-gray-700" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedTemplate === template.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.category === 'business' ? 'bg-blue-100 text-blue-800' :
                      template.category === 'creative' ? 'bg-orange-100 text-orange-800' :
                      template.category === 'minimal' ? 'bg-gray-100 text-gray-800' :
                      template.category === 'modern' ? 'bg-indigo-100 text-indigo-800' :
                      template.category === 'luxury' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>{filteredTemplates.length}</strong> plantillas disponibles
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              {selectedTemplate && (
                <button 
                  onClick={() => {
                    const template = cardTemplates.find(t => t.id === selectedTemplate);
                    if (template) {
                      try {
                        const cardData = applyTemplate(template);
                        onSelectTemplate(cardData);
                      } catch (err) {
                        error('Failed to apply template', err as Error, { component: 'TemplateSelector', templateId: template.id });
                        alert('Error al aplicar la plantilla. Por favor intenta de nuevo.');
                      }
                    }
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                >
                  Usar Esta Plantilla
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;