import React, { useState } from 'react';
import { IOSSection } from '@/components/ui/IOSControls';
import { Card, CardService } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Briefcase, 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Calendar,
  Tag,
  List,
  LayoutGrid
} from 'lucide-react';

interface ServicesEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const ServicesEditor: React.FC<ServicesEditorProps> = ({ card, onUpdate }) => {
  const [editingService, setEditingService] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleServicesUpdate = (newServices: CardService[]) => {
    onUpdate({ services: newServices });
  };

  const addNewService = () => {
    const newService: CardService = {
      id: `service-${Date.now()}`,
      name: 'Nuevo Servicio',
      description: 'Descripción de tu servicio profesional',
      price: 0,
      currency: 'EUR',
      duration: 60,
      isVisible: true,
      order: (card.services || []).length,
      category: '',
      features: [],
      style: {
        layout: 'card',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        shadow: 'md',
        priceStyle: {
          color: '#059669',
          size: '18px',
          position: 'bottom'
        }
      },
      booking: {
        enabled: false,
        requiresApproval: true,
        customFields: []
      }
    };

    handleServicesUpdate([...(card.services || []), newService]);
    setEditingService(newService.id);
  };

  const updateService = (serviceId: string, updates: Partial<CardService>) => {
    const updatedServices = (card.services || []).map(service =>
      service.id === serviceId ? { ...service, ...updates } : service
    );
    handleServicesUpdate(updatedServices);
  };

  const deleteService = (serviceId: string) => {
    const filteredServices = (card.services || []).filter(service => service.id !== serviceId);
    // Reorder remaining services
    const reorderedServices = filteredServices.map((service, index) => ({
      ...service,
      order: index
    }));
    handleServicesUpdate(reorderedServices);
  };

  const toggleServiceVisibility = (serviceId: string) => {
    const service = (card.services || []).find(s => s.id === serviceId);
    if (service) {
      updateService(serviceId, { isVisible: !service.isVisible });
    }
  };

  const handleDragStart = (serviceId: string) => {
    setDraggedItem(serviceId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) return;

    const services = card.services || [];
    const draggedIndex = services.findIndex(s => s.id === draggedItem);
    const targetIndex = services.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newServices = [...services];
    const [draggedService] = newServices.splice(draggedIndex, 1);
    newServices.splice(targetIndex, 0, draggedService);

    // Update order
    const reorderedServices = newServices.map((service, index) => ({
      ...service,
      order: index
    }));

    handleServicesUpdate(reorderedServices);
    setDraggedItem(null);
  };

  const addFeature = (serviceId: string) => {
    const service = (card.services || []).find(s => s.id === serviceId);
    if (service) {
      const newFeatures = [...(service.features || []), 'Nueva característica'];
      updateService(serviceId, { features: newFeatures });
    }
  };

  const updateFeature = (serviceId: string, featureIndex: number, value: string) => {
    const service = (card.services || []).find(s => s.id === serviceId);
    if (service) {
      const newFeatures = [...(service.features || [])];
      newFeatures[featureIndex] = value;
      updateService(serviceId, { features: newFeatures });
    }
  };

  const removeFeature = (serviceId: string, featureIndex: number) => {
    const service = (card.services || []).find(s => s.id === serviceId);
    if (service) {
      const newFeatures = (service.features || []).filter((_, index) => index !== featureIndex);
      updateService(serviceId, { features: newFeatures });
    }
  };

  const currencyOptions = [
    { value: 'EUR', symbol: '€', name: 'Euro' },
    { value: 'USD', symbol: '$', name: 'Dólar' },
    { value: 'GBP', symbol: '£', name: 'Libra' },
    { value: 'MXN', symbol: '$', name: 'Peso Mexicano' }
  ];

  const sortedServices = [...(card.services || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      <IOSSection title="Servicios Profesionales" icon={<Briefcase size={14} />} variant="dark" sectionKey="services-main">
        <div className="flex justify-end">
          <Button onClick={addNewService}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Servicio
          </Button>
        </div>
      </IOSSection>

      {/* Services List */}
      <div className="space-y-4">
        {sortedServices.length === 0 ? (
           <div className="text-center py-12 bg-[#1b1b22] rounded-xl border-2 border-dashed border-black/20">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay servicios aún
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Agrega tus primeros servicios profesionales
            </p>
            <Button onClick={addNewService}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Servicio
            </Button>
          </div>
        ) : (
          sortedServices.map((service) => (
            <div
              key={service.id}
              draggable
              onDragStart={() => handleDragStart(service.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, service.id)}
              className={`bg-[#121218] rounded-xl border border-black/20 p-6 transition-all ${
                draggedItem === service.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
              }`}
            >
              {/* Service Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <button className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <GripVertical className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {service.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {service.price} {service.currency}
                        </span>
                        {service.duration && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {service.duration}min
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleServiceVisibility(service.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      service.isVisible
                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={service.isVisible ? 'Ocultar servicio' : 'Mostrar servicio'}
                  >
                    {service.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => setEditingService(editingService === service.id ? null : service.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      editingService === service.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Editar servicio"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Eliminar servicio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Editor */}
              {editingService === service.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre del Servicio *
                        </label>
                        <Input
                          type="text"
                          value={service.name}
                          onChange={(e) => updateService(service.id, { name: e.target.value })}
                          placeholder="Ej: Consulta de Diseño"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Categoría (opcional)
                        </label>
                        <Input
                          type="text"
                          value={service.category || ''}
                          onChange={(e) => updateService(service.id, { category: e.target.value })}
                          placeholder="Ej: Diseño, Consultoría"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={service.description}
                        onChange={(e) => updateService(service.id, { description: e.target.value })}
                        placeholder="Describe tu servicio detalladamente..."
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Imagen del Servicio (URL)
                      </label>
                      <Input
                        type="url"
                        value={service.image || ''}
                        onChange={(e) => updateService(service.id, { image: e.target.value })}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                  </div>

                  {/* Pricing & Duration */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                    <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Precio y Duración
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Precio
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={service.price}
                          onChange={(e) => updateService(service.id, { price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Moneda
                        </label>
                        <select
                          value={service.currency}
                          onChange={(e) => updateService(service.id, { currency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {currencyOptions.map(currency => (
                            <option key={currency.value} value={currency.value}>
                              {currency.symbol} {currency.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Duración (min)
                        </label>
                        <Input
                          type="number"
                          min="15"
                          step="15"
                          value={service.duration || ''}
                          onChange={(e) => updateService(service.id, { duration: parseInt(e.target.value) || undefined })}
                          placeholder="60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
                        <List className="w-4 h-4 mr-2" />
                        Características Incluidas
                      </h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFeature(service.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(service.features || []).map((feature, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            type="text"
                            value={feature}
                            onChange={(e) => updateFeature(service.id, index, e.target.value)}
                            placeholder="Característica del servicio"
                            className="flex-1"
                          />
                          <button
                            onClick={() => removeFeature(service.id, index)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      {(service.features || []).length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No hay características definidas
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Booking Settings */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Sistema de Reservas
                      </h5>
                      <button
                        onClick={() => updateService(service.id, {
                          booking: { ...service.booking, enabled: !service.booking?.enabled }
                        })}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          service.booking?.enabled
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {service.booking?.enabled ? 'Activado' : 'Desactivado'}
                      </button>
                    </div>

                    {service.booking?.enabled && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id={`approval-${service.id}`}
                            checked={service.booking?.requiresApproval || false}
                            onChange={(e) => updateService(service.id, {
                              booking: { ...service.booking, requiresApproval: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`approval-${service.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                            Requiere aprobación manual
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Los clientes podrán solicitar citas para este servicio directamente desde tu tarjeta
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Style Settings */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      Estilo de Visualización
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Layout
                        </label>
                        <select
                          value={service.style.layout}
                          onChange={(e) => updateService(service.id, {
                            style: { ...service.style, layout: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="card">Tarjeta</option>
                          <option value="list">Lista</option>
                          <option value="minimal">Minimalista</option>
                          <option value="detailed">Detallado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Posición del Precio
                        </label>
                        <select
                          value={service.style.priceStyle?.position || 'bottom'}
                          onChange={(e) => updateService(service.id, {
                            style: { 
                              ...service.style, 
                              priceStyle: { ...service.style.priceStyle, position: e.target.value as any }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="top">Arriba</option>
                          <option value="bottom">Abajo</option>
                          <option value="side">Al lado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ServicesEditor;