import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export const Services: React.FC = () => {
  const [services, setServices] = useState([
    {
      id: '1',
      name: 'Consultoría técnica',
      description: 'Sesión de consultoría para resolver problemas técnicos',
      duration: 60,
      price: 150,
      isActive: true,
    },
    {
      id: '2',
      name: 'Desarrollo web',
      description: 'Desarrollo de aplicaciones web personalizadas',
      duration: 120,
      price: 250,
      isActive: true,
    },
    {
      id: '3',
      name: 'Revisión de código',
      description: 'Revisión y optimización de código existente',
      duration: 90,
      price: 120,
      isActive: false,
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 100,
    isActive: true,
  });

  const handleCreateService = () => {
    if (newService.name && newService.description) {
      setServices([...services, {
        ...newService,
        id: Date.now().toString(),
      }]);
      setNewService({
        name: '',
        description: '',
        duration: 60,
        price: 100,
        isActive: true,
      });
      setIsCreating(false);
    }
  };

  const handleUpdateService = () => {
    if (editingService) {
      setServices(services.map(service => 
        service.id === editingService.id ? editingService : service
      ));
      setEditingService(null);
    }
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(service => service.id !== id));
  };

  const toggleServiceStatus = (id: string) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, isActive: !service.isActive } : service
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600">Gestiona los servicios que ofreces</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo servicio
        </Button>
      </div>

      {isCreating && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear nuevo servicio</h3>
          <div className="space-y-4">
            <Input
              label="Nombre del servicio"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              placeholder="Ej: Consultoría técnica"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="Describe brevemente el servicio"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duración (minutos)"
                type="number"
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                min="15"
                step="15"
              />
              <Input
                label="Precio ($)"
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) })}
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateService}>
                Crear servicio
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            {editingService?.id === service.id ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Editar servicio</h3>
                <Input
                  label="Nombre del servicio"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    rows={3}
                    className="input resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Duración (minutos)"
                    type="number"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) })}
                    min="15"
                    step="15"
                  />
                  <Input
                    label="Precio ($)"
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingService(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateService}>
                    Guardar cambios
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{service.description}</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{service.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">${service.price}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleServiceStatus(service.id)}
                  >
                    <ToggleLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingService(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No tienes servicios configurados</p>
            <Button onClick={() => setIsCreating(true)}>
              Crear tu primer servicio
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};