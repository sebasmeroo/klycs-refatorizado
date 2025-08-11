import React, { useState } from 'react';
import { IOSSection } from '@/components/ui/IOSControls';
import { Card, CardBooking, CustomField } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Calendar, 
  Plus, 
  Clock, 
  CreditCard, 
  Mail, 
  Smartphone,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface BookingEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const BookingEditor: React.FC<BookingEditorProps> = ({ card, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'calendar' | 'form' | 'payment'>('general');

  const handleBookingUpdate = (updates: Partial<CardBooking>) => {
    onUpdate({
      booking: { ...card.booking, ...updates }
    });
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      name: 'Nuevo Campo',
      type: 'text',
      required: false,
      options: []
    };

    const updatedFields = [...(card.booking?.form.fields || []), newField];
    handleBookingUpdate({
      form: { ...card.booking?.form, fields: updatedFields }
    });
  };

  const updateCustomField = (fieldId: string, updates: Partial<CustomField>) => {
    const updatedFields = (card.booking?.form.fields || []).map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    
    handleBookingUpdate({
      form: { ...card.booking?.form, fields: updatedFields }
    });
  };

  const removeCustomField = (fieldId: string) => {
    const updatedFields = (card.booking?.form.fields || []).filter(field => field.id !== fieldId);
    handleBookingUpdate({
      form: { ...card.booking?.form, fields: updatedFields }
    });
  };

  const addTimeSlot = () => {
    const newSlot = {
      id: `slot-${Date.now()}`,
      time: '09:00',
      available: true
    };

    const updatedSlots = [...(card.booking?.calendar.timeSlots || []), newSlot];
    handleBookingUpdate({
      calendar: { ...card.booking?.calendar, timeSlots: updatedSlots }
    });
  };

  const updateTimeSlot = (slotId: string, updates: any) => {
    const updatedSlots = (card.booking?.calendar.timeSlots || []).map(slot =>
      slot.id === slotId ? { ...slot, ...updates } : slot
    );
    
    handleBookingUpdate({
      calendar: { ...card.booking?.calendar, timeSlots: updatedSlots }
    });
  };

  const removeTimeSlot = (slotId: string) => {
    const updatedSlots = (card.booking?.calendar.timeSlots || []).filter(slot => slot.id !== slotId);
    handleBookingUpdate({
      calendar: { ...card.booking?.calendar, timeSlots: updatedSlots }
    });
  };

  const fieldTypeOptions = [
    { value: 'text', label: 'Texto' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'textarea', label: 'Área de texto' },
    { value: 'select', label: 'Lista desplegable' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'form', label: 'Formulario', icon: Mail },
    { id: 'payment', label: 'Pagos', icon: CreditCard }
  ];

  return (
    <div className="space-y-8">
      <IOSSection title="Sistema de Reservas" icon={<Calendar size={14} />} variant="dark" sectionKey="booking-main">
        <div className="flex items-center justify-end space-x-3">
          <span className="text-sm font-medium text-white/80">Sistema de reservas</span>
          <button
            onClick={() => handleBookingUpdate({ enabled: !card.booking?.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              card.booking?.enabled ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                card.booking?.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </IOSSection>

      {!card.booking?.enabled ? (
        <div className="text-center py-12 bg-[#1b1b22] rounded-xl border-2 border-dashed border-black/20">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Sistema de Reservas Desactivado
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Activa el sistema de reservas para permitir que tus clientes reserven citas contigo
          </p>
          <Button onClick={() => handleBookingUpdate({ enabled: true })}>
            <Calendar className="w-4 h-4 mr-2" />
            Activar Reservas
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="bg-[#121218] rounded-xl border border-black/20 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Configuración General
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título del Sistema de Reservas
                      </label>
                      <Input
                        type="text"
                        value={card.booking?.title || ''}
                        onChange={(e) => handleBookingUpdate({ title: e.target.value })}
                        placeholder="Reserva una Cita"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estilo del Botón
                      </label>
                      <select
                        value={card.booking?.style?.layout || 'inline'}
                        onChange={(e) => handleBookingUpdate({
                          style: { ...card.booking?.style, layout: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="inline">Integrado</option>
                        <option value="modal">Modal</option>
                        <option value="popup">Popup</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={card.booking?.description || ''}
                      onChange={(e) => handleBookingUpdate({ description: e.target.value })}
                      placeholder="Describe tu servicio de reservas..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Horarios Disponibles
                  </h4>
                  <Button onClick={addTimeSlot} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Horario
                  </Button>
                </div>

                <div className="space-y-3">
                  {(card.booking?.calendar.timeSlots || []).length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No hay horarios configurados
                      </p>
                    </div>
                  ) : (
                    (card.booking?.calendar.timeSlots || []).map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Input
                            type="time"
                            value={slot.time}
                            onChange={(e) => updateTimeSlot(slot.id, { time: e.target.value })}
                            className="w-32"
                          />
                          
                          <button
                            onClick={() => updateTimeSlot(slot.id, { available: !slot.available })}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                              slot.available
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}
                          >
                            {slot.available ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span>{slot.available ? 'Disponible' : 'No disponible'}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => removeTimeSlot(slot.id)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'form' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Campos del Formulario
                    </h4>
                    <Button onClick={addCustomField} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Campo
                    </Button>
                  </div>

                  <div className="space-y-4 mb-6">
                    {(card.booking?.form.fields || []).length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Mail className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No hay campos personalizados
                        </p>
                      </div>
                    ) : (
                      (card.booking?.form.fields || []).map((field) => (
                        <div
                          key={field.id}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Nombre del Campo
                              </label>
                              <Input
                                type="text"
                                value={field.name}
                                onChange={(e) => updateCustomField(field.id, { name: e.target.value })}
                                placeholder="Nombre del campo"
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Tipo de Campo
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) => updateCustomField(field.id, { type: e.target.value as any })}
                                className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                              >
                                {fieldTypeOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end space-x-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`required-${field.id}`}
                                  checked={field.required}
                                  onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                  htmlFor={`required-${field.id}`}
                                  className="ml-2 text-xs text-gray-700 dark:text-gray-300"
                                >
                                  Obligatorio
                                </label>
                              </div>
                              
                              <button
                                onClick={() => removeCustomField(field.id)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {field.type === 'select' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Opciones (separadas por comas)
                              </label>
                              <Input
                                type="text"
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => updateCustomField(field.id, { 
                                  options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                                })}
                                placeholder="Opción 1, Opción 2, Opción 3"
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="auto-confirm"
                        checked={card.booking?.form.autoConfirm || false}
                        onChange={(e) => handleBookingUpdate({
                          form: { ...card.booking?.form, autoConfirm: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="auto-confirm" className="text-sm text-gray-700 dark:text-gray-300">
                        Confirmar automáticamente las reservas
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="requires-approval"
                        checked={card.booking?.form.requiresApproval || false}
                        onChange={(e) => handleBookingUpdate({
                          form: { ...card.booking?.form, requiresApproval: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="requires-approval" className="text-sm text-gray-700 dark:text-gray-300">
                        Requiere aprobación manual
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Configuración de Pagos
                    </h4>
                    <button
                      onClick={() => handleBookingUpdate({
                        payment: { ...card.booking?.payment, enabled: !card.booking?.payment?.enabled }
                      })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        card.booking?.payment?.enabled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {card.booking?.payment?.enabled ? 'Activado' : 'Desactivado'}
                    </button>
                  </div>

                  {card.booking?.payment?.enabled ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Procesador de Pagos
                        </label>
                        <select
                          value={card.booking?.payment?.processor || 'stripe'}
                          onChange={(e) => handleBookingUpdate({
                            payment: { ...card.booking?.payment, processor: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="stripe">Stripe</option>
                          <option value="paypal">PayPal</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="requires-deposit"
                            checked={card.booking?.payment?.requiresDeposit || false}
                            onChange={(e) => handleBookingUpdate({
                              payment: { ...card.booking?.payment, requiresDeposit: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="requires-deposit" className="text-sm text-gray-700 dark:text-gray-300">
                            Requiere depósito para confirmar
                          </label>
                        </div>

                        {card.booking?.payment?.requiresDeposit && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Monto del Depósito (€)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={card.booking?.payment?.depositAmount || 0}
                              onChange={(e) => handleBookingUpdate({
                                payment: { 
                                  ...card.booking?.payment, 
                                  depositAmount: parseFloat(e.target.value) || 0 
                                }
                              })}
                              placeholder="0.00"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Los pagos están desactivados. Las reservas serán gratuitas.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingEditor;