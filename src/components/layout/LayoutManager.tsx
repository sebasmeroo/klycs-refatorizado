import React, { useState } from 'react';
import { Eye, EyeOff, GripVertical, User, FileText, Link, Phone, Briefcase, Camera, Share2, Settings, Calendar } from 'lucide-react';
import { LayoutModule, ModuleStyle } from '@/types';

interface LayoutManagerProps {
  modules: LayoutModule[];
  onModulesUpdate: (modules: LayoutModule[]) => void;
}

const MODULE_ICONS = {
  profile: User,
  bio: FileText,
  links: Link,
  contact: Phone,
  services: Briefcase,
  portfolio: Camera,
  social: Share2,
  booking: Calendar
};

const MODULE_LABELS = {
  profile: 'Perfil',
  bio: 'Biografía',
  links: 'Enlaces',
  contact: 'Contacto',
  services: 'Servicios',
  portfolio: 'Portfolio',
  social: 'Redes Sociales',
  booking: 'Reservas'
};

const MODULE_COLORS = {
  profile: 'bg-blue-100 text-blue-600 border-blue-200',
  bio: 'bg-green-100 text-green-600 border-green-200',
  links: 'bg-purple-100 text-purple-600 border-purple-200',
  contact: 'bg-orange-100 text-orange-600 border-orange-200',
  services: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  portfolio: 'bg-pink-100 text-pink-600 border-pink-200',
  social: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  booking: 'bg-emerald-100 text-emerald-600 border-emerald-200'
};

export const LayoutManager: React.FC<LayoutManagerProps> = ({
  modules,
  onModulesUpdate
}) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newModules = [...modules];
    const draggedModule = newModules[draggedIndex];
    
    // Remove from old position
    newModules.splice(draggedIndex, 1);
    // Insert at new position
    newModules.splice(index, 0, draggedModule);

    // Update order numbers
    const updatedModules = newModules.map((module, idx) => ({
      ...module,
      order: idx
    }));

    onModulesUpdate(updatedModules);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleModuleVisibility = (moduleId: string) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? { ...module, isVisible: !module.isVisible }
        : module
    );
    onModulesUpdate(updatedModules);
  };

  const toggleModuleTitle = (moduleId: string) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? { ...module, showTitle: !module.showTitle }
        : module
    );
    onModulesUpdate(updatedModules);
  };

  const updateModuleStyle = (moduleId: string, style: Partial<ModuleStyle>) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? { ...module, style: { ...module.style, ...style } }
        : module
    );
    onModulesUpdate(updatedModules);
  };

  // Ordenar módulos por orden
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-3xl shadow-lg p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
              <Settings size={20} className="text-white" />
            </div>
            Estructura de la Tarjeta
          </h3>
          <p className="text-gray-600 text-base leading-relaxed">
            Arrastra las secciones para reordenar y personaliza su apariencia
          </p>
        </div>

        <div className="space-y-4 p-6 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50">
          {sortedModules.map((module, index) => {
            const Icon = MODULE_ICONS[module.type] || Settings;
            const moduleColor = MODULE_COLORS[module.type] || 'bg-gray-100 text-gray-600 border-gray-200';
            
            return (
              <div
                key={module.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-white border-2 border-gray-200 rounded-2xl p-6 transition-all duration-200 cursor-move hover:shadow-md hover:border-gray-300 ${
                  draggedIndex === index ? 'opacity-50 scale-95 rotate-2' : 'hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Grip handle */}
                  <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl hover:bg-gray-100">
                    <GripVertical size={20} />
                  </div>

                  {/* Icon con color específico */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${moduleColor} transition-all duration-200`}>
                    <Icon size={20} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-gray-900 font-bold text-lg">
                          {MODULE_LABELS[module.type] || module.type}
                        </h4>
                        <p className="text-gray-500 text-sm font-medium mt-1">
                          {module.isVisible ? '✅ Visible en la tarjeta' : '❌ Oculto'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Visibility toggle */}
                        <button
                          onClick={() => toggleModuleVisibility(module.id)}
                          className={`p-3 rounded-2xl transition-all duration-200 hover:scale-110 ${
                            module.isVisible
                              ? 'bg-green-100 text-green-600 border-2 border-green-200 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:bg-gray-200'
                          }`}
                          title={module.isVisible ? 'Ocultar sección' : 'Mostrar sección'}
                        >
                          {module.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>

                        {/* Settings button */}
                        <button
                          onClick={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
                          className={`p-3 rounded-2xl transition-all duration-200 hover:scale-110 ${
                            selectedModule === module.id
                              ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                              : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'
                          }`}
                          title="Configurar sección"
                        >
                          <Settings size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Module settings panel */}
                    {selectedModule === module.id && (
                      <div className="mt-6 p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
                        <h5 className="text-gray-900 font-bold text-lg mb-4 flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                            <Settings size={14} className="text-white" />
                          </div>
                          Configuración de {MODULE_LABELS[module.type]}
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-gray-800 text-sm font-bold mb-3 bg-white p-3 rounded-xl border border-gray-300">
                              Mostrar Título
                            </label>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleModuleTitle(module.id)}
                                className={`flex-1 p-4 rounded-xl border-2 font-medium transition-all ${
                                  module.showTitle
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : 'bg-gray-100 text-gray-600 border-gray-300'
                                }`}
                              >
                                {module.showTitle ? '✅ Mostrar' : '❌ Ocultar'}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-gray-800 text-sm font-bold mb-3 bg-white p-3 rounded-xl border border-gray-300">
                              Espaciado Interno
                            </label>
                            <select
                              value={module.style?.padding || '1rem'}
                              onChange={(e) => updateModuleStyle(module.id, {
                                padding: e.target.value
                              })}
                              className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                            >
                              <option value="0.5rem">🔸 Compacto</option>
                              <option value="1rem">🔹 Normal</option>
                              <option value="1.5rem">🔷 Amplio</option>
                              <option value="2rem">💎 Extra amplio</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end mt-6">
                          <button
                            onClick={() => setSelectedModule(null)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-105 transform shadow-lg"
                          >
                            ✨ Aplicar Cambios
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
          <p className="text-blue-700 text-sm font-medium">
            💡 Arrastra las secciones para cambiar el orden en tu tarjeta
          </p>
        </div>
      </div>
    </div>
  );
};
