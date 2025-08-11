import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, Euro, Eye, EyeOff, Briefcase } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
}

interface ServiceManagerProps {
  services: Service[];
  onServiceCreate: (service: Omit<Service, 'id'>) => void;
  onServiceUpdate: (id: string, service: Partial<Service>) => void;
  onServiceDelete: (id: string) => void;
  designStyle?: 'modern' | 'glassmorphism' | 'neon' | 'minimal' | 'retro' | 'liquid' | 'card3d' | 'gradient';
  showTitle?: boolean;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({
  services,
  onServiceCreate,
  onServiceUpdate,
  onServiceDelete,
  designStyle = 'modern',
  showTitle = true
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 50,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onServiceUpdate(editingId, formData);
      setEditingId(null);
    } else {
      onServiceCreate(formData);
      setIsCreating(false);
    }
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: 50,
      isActive: true
    });
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      isActive: service.isActive
    });
    setEditingId(service.id);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: 50,
      isActive: true
    });
  };

  const getContainerStyles = () => {
    switch (designStyle) {
      case 'glassmorphism':
        return 'backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden';
      case 'liquid':
        return 'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl border border-white/30 rounded-[2rem] shadow-2xl p-8 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/10 before:to-purple-500/10 before:rounded-[2rem] before:pointer-events-none';
      case 'neon':
        return 'bg-gray-900 border-2 border-cyan-400 rounded-3xl shadow-2xl shadow-cyan-400/20 p-8 relative overflow-hidden';
      case 'minimal':
        return 'bg-white border border-gray-100 rounded-2xl shadow-sm p-8';
      case 'retro':
        return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-orange-300 rounded-3xl shadow-xl p-8 relative';
      case 'card3d':
        return 'bg-white border-2 border-gray-200 rounded-3xl shadow-2xl p-8 transform hover:scale-[1.02] transition-all duration-300 hover:rotate-1';
      case 'gradient':
        return 'bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-2 border-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 rounded-3xl shadow-xl p-8';
      default:
        return 'bg-white border-2 border-gray-200 rounded-3xl shadow-lg p-8';
    }
  };

  const getTitleStyles = () => {
    switch (designStyle) {
      case 'glassmorphism':
        return 'text-2xl font-bold text-white drop-shadow-lg';
      case 'liquid':
        return 'text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent';
      case 'neon':
        return 'text-2xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]';
      case 'minimal':
        return 'text-xl font-medium text-gray-800';
      case 'retro':
        return 'text-2xl font-black text-orange-800 drop-shadow-md';
      case 'card3d':
        return 'text-2xl font-bold text-gray-900 drop-shadow-sm';
      case 'gradient':
        return 'text-2xl font-bold text-white drop-shadow-lg';
      default:
        return 'text-2xl font-bold text-gray-900';
    }
  };

  const getButtonStyles = () => {
    switch (designStyle) {
      case 'glassmorphism':
        return 'bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:bg-white/30 hover:scale-105 flex items-center space-x-3 shadow-lg';
      case 'liquid':
        return 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:from-blue-600/90 hover:to-purple-600/90 hover:scale-105 flex items-center space-x-3 shadow-xl';
      case 'neon':
        return 'bg-cyan-400 text-gray-900 px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:bg-cyan-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center space-x-3';
      case 'minimal':
        return 'bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-gray-700 flex items-center space-x-2';
      case 'retro':
        return 'bg-gradient-to-r from-orange-400 to-yellow-400 text-orange-900 px-6 py-3 rounded-2xl font-black transition-all duration-200 hover:from-orange-500 hover:to-yellow-500 hover:scale-105 flex items-center space-x-3 border-2 border-orange-600 shadow-lg';
      case 'card3d':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:scale-105 flex items-center space-x-3 shadow-lg transform hover:-translate-y-1';
      case 'gradient':
        return 'bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:bg-gray-50 hover:scale-105 flex items-center space-x-3 shadow-lg border-2 border-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:scale-105 flex items-center space-x-3 shadow-lg transform';
    }
  };

  const getServiceCardStyles = () => {
    switch (designStyle) {
      case 'glassmorphism':
        return 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-200 hover:scale-[1.01]';
      case 'liquid':
        return 'bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-6 hover:from-white/90 hover:to-white/70 transition-all duration-200 hover:scale-[1.01] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/5 before:to-purple-500/5 before:rounded-2xl before:pointer-events-none';
      case 'neon':
        return 'bg-gray-800 border border-cyan-400/50 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-200 hover:scale-[1.01]';
      case 'minimal':
        return 'bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200';
      case 'retro':
        return 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-orange-300 rounded-2xl p-6 hover:from-yellow-200 hover:to-orange-200 hover:border-orange-400 transition-all duration-200 hover:scale-[1.01] shadow-md';
      case 'card3d':
        return 'bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-2xl hover:border-gray-300 transition-all duration-200 hover:scale-[1.01] transform hover:-translate-y-1';
      case 'gradient':
        return 'bg-gradient-to-br from-white to-gray-50 border-2 border-transparent bg-gradient-to-r from-purple-200 via-blue-200 to-cyan-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]';
      default:
        return 'bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 hover:scale-[1.01]';
    }
  };

  return (
    <div className="space-y-8">
      <div className={getContainerStyles()}>
        <div className="flex items-center justify-between mb-8">
          {showTitle && (
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                designStyle === 'glassmorphism' || designStyle === 'liquid' 
                  ? 'bg-white/20 backdrop-blur-md border border-white/30' 
                  : designStyle === 'neon'
                  ? 'bg-cyan-400'
                  : designStyle === 'minimal'
                  ? 'bg-gray-100'
                  : designStyle === 'retro'
                  ? 'bg-gradient-to-br from-orange-400 to-yellow-400 border-2 border-orange-600'
                  : designStyle === 'gradient'
                  ? 'bg-white border-2 border-white'
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}>
                <Briefcase size={20} className={designStyle === 'neon' ? 'text-gray-900' : designStyle === 'gradient' ? 'text-purple-600' : 'text-white'} />
              </div>
              <h3 className={getTitleStyles()}>Servicios</h3>
            </div>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className={getButtonStyles()}
          >
            <Plus size={18} />
            <span>Nuevo Servicio</span>
          </button>
        </div>

        {/* Service Form - Nuevo diseño */}
        {isCreating && (
          <div className={`border-2 rounded-2xl p-6 mb-8 ${
            designStyle === 'glassmorphism' || designStyle === 'liquid'
              ? 'bg-white/10 backdrop-blur-md border-white/20'
              : designStyle === 'neon'
              ? 'bg-gray-800 border-cyan-400/50'
              : designStyle === 'minimal'
              ? 'bg-gray-50 border-gray-200'
              : designStyle === 'retro'
              ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-orange-300'
              : designStyle === 'gradient'
              ? 'bg-gradient-to-br from-white/80 to-gray-50/80 border-purple-200'
              : 'bg-gray-50 border-gray-300'
          }`}>
            <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                <Edit size={16} className="text-white" />
              </div>
              {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-800 text-sm font-bold mb-3 bg-white p-3 rounded-xl border border-gray-300">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border-2 border-gray-400 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all font-medium"
                  placeholder="Consultoría Premium"
                />
              </div>

              <div>
                <label className="block text-gray-800 text-sm font-bold mb-3 bg-white p-3 rounded-xl border border-gray-300">
                  Descripción
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white border-2 border-gray-400 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all resize-none font-medium"
                  rows={3}
                  placeholder="Descripción detallada del servicio"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-800 text-sm font-bold mb-3 bg-white p-3 rounded-xl border border-gray-300">
                    ⏰ Duración (minutos)
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="w-full bg-white border-2 border-gray-400 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 text-sm font-bold mb-3 bg-white p-3 rounded-xl border border-gray-300">
                    💰 Precio (€)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full bg-white border-2 border-gray-400 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border-2 border-gray-300">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-5 h-5 text-green-500 bg-white border-2 border-gray-400 rounded-lg focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="isActive" className="text-gray-800 font-medium">
                    ✅ Servicio activo (visible para reservas)
                  </label>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:scale-105 flex-1 shadow-lg"
                >
                  ❌ Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-200 hover:scale-105 flex-1 shadow-lg"
                >
                  {editingId ? '✏️ Actualizar' : '🚀 Crear'} Servicio
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List - Nuevo diseño */}
        <div className="space-y-4">
          {services.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl border-2 ${
              designStyle === 'glassmorphism' || designStyle === 'liquid'
                ? 'bg-white/10 backdrop-blur-md border-white/20'
                : designStyle === 'neon'
                ? 'bg-gray-800 border-cyan-400/30'
                : designStyle === 'minimal'
                ? 'bg-gray-50 border-gray-200'
                : designStyle === 'retro'
                ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-orange-300'
                : designStyle === 'gradient'
                ? 'bg-gradient-to-br from-white/80 to-gray-50/80 border-purple-200'
                : 'bg-gray-50 border-gray-300'
            }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                designStyle === 'glassmorphism' || designStyle === 'liquid'
                  ? 'bg-white/20 backdrop-blur-md border border-white/30'
                  : designStyle === 'neon'
                  ? 'bg-cyan-400/20 border border-cyan-400/50'
                  : designStyle === 'retro'
                  ? 'bg-gradient-to-br from-orange-400 to-yellow-400 border-2 border-orange-600'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                <Clock size={24} className={designStyle === 'neon' ? 'text-cyan-400' : 'text-white'} />
              </div>
              <p className={`font-bold text-lg mb-2 ${
                designStyle === 'glassmorphism' || designStyle === 'liquid'
                  ? 'text-white'
                  : designStyle === 'neon'
                  ? 'text-cyan-400'
                  : designStyle === 'retro'
                  ? 'text-orange-800'
                  : 'text-gray-900'
              }`}>No hay servicios creados</p>
              <p className={`font-medium ${
                designStyle === 'glassmorphism' || designStyle === 'liquid'
                  ? 'text-white/80'
                  : designStyle === 'neon'
                  ? 'text-gray-300'
                  : designStyle === 'retro'
                  ? 'text-orange-700'
                  : 'text-gray-600'
              }`}>Crea tu primer servicio para comenzar a recibir reservas</p>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className={getServiceCardStyles()}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <Briefcase size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className={`text-lg font-bold ${
                          designStyle === 'glassmorphism' || designStyle === 'liquid' 
                            ? 'text-white drop-shadow-lg' 
                            : designStyle === 'neon'
                            ? 'text-cyan-400'
                            : designStyle === 'retro'
                            ? 'text-orange-800'
                            : 'text-gray-900'
                        }`}>{service.name}</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${
                          service.isActive 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>
                          {service.isActive ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </div>
                    </div>
                    <p className={`font-medium mb-4 leading-relaxed ${
                      designStyle === 'glassmorphism' || designStyle === 'liquid' 
                        ? 'text-white/80' 
                        : designStyle === 'neon'
                        ? 'text-gray-300'
                        : designStyle === 'retro'
                        ? 'text-orange-700'
                        : 'text-gray-700'
                    }`}>{service.description}</p>
                    <div className="flex items-center space-x-6">
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border ${
                        designStyle === 'glassmorphism' || designStyle === 'liquid'
                          ? 'bg-white/20 backdrop-blur-md border-white/30'
                          : designStyle === 'neon'
                          ? 'bg-gray-700 border-cyan-400/50'
                          : designStyle === 'minimal'
                          ? 'bg-gray-50 border-gray-200'
                          : designStyle === 'retro'
                          ? 'bg-yellow-200 border-orange-300'
                          : designStyle === 'gradient'
                          ? 'bg-white/80 border-blue-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <Clock size={16} className={
                          designStyle === 'glassmorphism' || designStyle === 'liquid'
                            ? 'text-white'
                            : designStyle === 'neon'
                            ? 'text-cyan-400'
                            : designStyle === 'retro'
                            ? 'text-orange-700'
                            : 'text-blue-600'
                        } />
                        <span className={`font-bold text-sm ${
                          designStyle === 'glassmorphism' || designStyle === 'liquid'
                            ? 'text-white'
                            : designStyle === 'neon'
                            ? 'text-cyan-400'
                            : designStyle === 'retro'
                            ? 'text-orange-700'
                            : 'text-blue-700'
                        }`}>{service.duration} min</span>
                      </div>
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border ${
                        designStyle === 'glassmorphism' || designStyle === 'liquid'
                          ? 'bg-white/20 backdrop-blur-md border-white/30'
                          : designStyle === 'neon'
                          ? 'bg-gray-700 border-cyan-400/50'
                          : designStyle === 'minimal'
                          ? 'bg-gray-50 border-gray-200'
                          : designStyle === 'retro'
                          ? 'bg-yellow-200 border-orange-300'
                          : designStyle === 'gradient'
                          ? 'bg-white/80 border-green-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <Euro size={16} className={
                          designStyle === 'glassmorphism' || designStyle === 'liquid'
                            ? 'text-white'
                            : designStyle === 'neon'
                            ? 'text-cyan-400'
                            : designStyle === 'retro'
                            ? 'text-orange-700'
                            : 'text-green-600'
                        } />
                        <span className={`font-bold text-sm ${
                          designStyle === 'glassmorphism' || designStyle === 'liquid'
                            ? 'text-white'
                            : designStyle === 'neon'
                            ? 'text-cyan-400'
                            : designStyle === 'retro'
                            ? 'text-orange-700'
                            : 'text-green-700'
                        }`}>{service.price}€</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onServiceUpdate(service.id, { isActive: !service.isActive })}
                      className={`p-3 rounded-2xl border-2 transition-all duration-200 hover:scale-110 ${
                        designStyle === 'glassmorphism' || designStyle === 'liquid'
                          ? service.isActive 
                            ? 'bg-white/20 text-white border-white/30 hover:bg-white/30' 
                            : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
                          : designStyle === 'neon'
                          ? service.isActive
                            ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/30'
                            : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'
                          : designStyle === 'retro'
                          ? service.isActive
                            ? 'bg-green-200 text-green-700 border-green-400 hover:bg-green-300'
                            : 'bg-gray-200 text-gray-600 border-gray-400 hover:bg-gray-300'
                          : service.isActive 
                          ? 'bg-green-100 text-green-600 border-green-300 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                      }`}
                      title={service.isActive ? 'Desactivar servicio' : 'Activar servicio'}
                    >
                      {service.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => handleEdit(service)}
                      className={`p-3 rounded-2xl border-2 transition-all duration-200 hover:scale-110 ${
                        designStyle === 'glassmorphism' || designStyle === 'liquid'
                          ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                          : designStyle === 'neon'
                          ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/30'
                          : designStyle === 'retro'
                          ? 'bg-blue-200 text-blue-700 border-blue-400 hover:bg-blue-300'
                          : 'bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200'
                      }`}
                      title="Editar servicio"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que quieres eliminar "${service.name}"?`)) {
                          onServiceDelete(service.id);
                        }
                      }}
                      className={`p-3 rounded-2xl border-2 transition-all duration-200 hover:scale-110 ${
                        designStyle === 'glassmorphism' || designStyle === 'liquid'
                          ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                          : designStyle === 'neon'
                          ? 'bg-red-400/20 text-red-400 border-red-400/50 hover:bg-red-400/30'
                          : designStyle === 'retro'
                          ? 'bg-red-200 text-red-700 border-red-400 hover:bg-red-300'
                          : 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200'
                      }`}
                      title="Eliminar servicio"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};