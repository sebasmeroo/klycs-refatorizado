import React, { useState, useEffect, useRef } from 'react';
import { Card, CardCalendar, TeamProfessional } from '@/types';
import { Calendar, Users, Settings, Eye, EyeOff, AlertCircle, Clock, CheckCircle, Camera, Upload } from 'lucide-react';
import { CollaborativeCalendarService } from '@/services/collaborativeCalendar';
import { StorageService } from '@/services/storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/utils/toast';

interface CalendarEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const CalendarEditor: React.FC<CalendarEditorProps> = ({ card, onUpdate }) => {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<TeamProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const calendar: CardCalendar = card.calendar || {
    enabled: false,
    isVisible: true,
    title: 'Reserva tu Cita',
    description: 'Selecciona un profesional y reserva tu cita',
    order: 5,
    showProfessionals: true,
    allowDirectBooking: true,
    linkedCalendarId: undefined,
    bookingConfig: {
      requireApproval: false,
      showAvailability: true,
      defaultDuration: 30,
      maxAdvanceBookingDays: 30,
      customFields: []
    },
    style: {
      layout: 'grid',
      showPhotos: true,
      showRoles: true,
      accentColor: '#3B82F6'
    }
  };

  useEffect(() => {
    if (user) {
      loadCalendars();
    }
  }, [user]);

  const loadCalendars = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userCalendars = await CollaborativeCalendarService.getUserCalendars(user.uid);
      setCalendars(userCalendars);

      // Vincular automáticamente el primer calendario si existe y no hay uno vinculado
      if (userCalendars.length > 0 && !calendar.linkedCalendarId) {
        const firstCalendar = userCalendars[0];
        onUpdate({
          calendar: {
            ...calendar,
            linkedCalendarId: firstCalendar.id
          }
        });
        // Cargar profesionales del usuario
        const profs = await CollaborativeCalendarService.getProfessionals(user.uid);
        setProfessionals(profs);
      } else if (calendar.linkedCalendarId) {
        // Si ya hay un calendario vinculado, cargar los profesionales del usuario
        const profs = await CollaborativeCalendarService.getProfessionals(user.uid);
        setProfessionals(profs);
      }
    } catch (error) {
      console.error('Error loading calendars:', error);
      toast.error('Error al cargar calendarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = () => {
    onUpdate({
      calendar: {
        ...calendar,
        enabled: !calendar.enabled
      }
    });
    toast.success(calendar.enabled ? 'Calendario deshabilitado' : 'Calendario habilitado');
  };

  const handleToggleVisibility = () => {
    onUpdate({
      calendar: {
        ...calendar,
        isVisible: !calendar.isVisible
      }
    });
  };

  const handleUpdateField = <K extends keyof CardCalendar>(field: K, value: CardCalendar[K]) => {
    onUpdate({
      calendar: {
        ...calendar,
        [field]: value
      }
    });
  };

  const handleLinkCalendar = async (calendarId: string) => {
    try {
      const profs = await CollaborativeCalendarService.getProfessionals(calendarId);
      setProfessionals(profs);
      
      onUpdate({
        calendar: {
          ...calendar,
          linkedCalendarId: calendarId
        }
      });
      
      toast.success('Calendario vinculado exitosamente');
    } catch (error) {
      console.error('Error linking calendar:', error);
      toast.error('Error al vincular calendario');
    }
  };

  const handlePhotoUpload = async (professionalId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !calendar.linkedCalendarId) return;

    try {
      setUploadingPhoto(professionalId);

      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten imágenes');
        return;
      }

      // Subir imagen a Storage
      const timestamp = Date.now();
      const fileName = `professional_${professionalId}_${timestamp}`;
      const path = `calendars/${calendar.linkedCalendarId}/professionals/${fileName}`;
      
      // Usar el servicio de storage para subir
      const { downloadURL } = await StorageService.uploadFile(file, path);

      // Actualizar el profesional en el calendario colaborativo
      await CollaborativeCalendarService.updateProfessional(
        calendar.linkedCalendarId,
        professionalId,
        { avatar: downloadURL }
      );

      // Actualizar el estado local
      setProfessionals(prev => 
        prev.map(p => p.id === professionalId ? { ...p, avatar: downloadURL } : p)
      );

      toast.success('Foto actualizada exitosamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploadingPhoto(null);
      // Limpiar el input
      if (fileInputRefs.current[professionalId]) {
        fileInputRefs.current[professionalId]!.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Calendario y Profesionales
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Conecta tu calendario para mostrar profesionales y permitir reservas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleVisibility}
            className={`p-2 rounded-lg transition-colors ${
              calendar.isVisible
                ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700'
            }`}
            title={calendar.isVisible ? 'Ocultar' : 'Mostrar'}
          >
            {calendar.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={handleToggleEnabled}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              calendar.enabled
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {calendar.enabled ? 'Habilitado' : 'Deshabilitado'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Cargando calendarios...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Configuración Básica */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <h4 className="font-medium text-gray-900 dark:text-white">Configuración Básica</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={calendar.title}
                  onChange={(e) => handleUpdateField('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Reserva tu Cita"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={calendar.description || ''}
                  onChange={(e) => handleUpdateField('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Selecciona un profesional y reserva tu cita"
                />
              </div>

              {calendars.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    ✓ Calendario detectado: <strong>{calendars[0]?.name || 'Principal'}</strong>
                    {calendars[0]?.professionals?.length > 0 && (
                      <span className="ml-2">({calendars[0].professionals.length} profesionales)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configuración de Visualización */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visualización
            </h4>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={calendar.showProfessionals}
                  onChange={(e) => handleUpdateField('showProfessionals', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrar lista de profesionales
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={calendar.allowDirectBooking}
                  onChange={(e) => handleUpdateField('allowDirectBooking', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Permitir reservas directas
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Layout
                </label>
                <select
                  value={calendar.style.layout}
                  onChange={(e) => handleUpdateField('style', { ...calendar.style, layout: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="list">Lista</option>
                  <option value="grid">Cuadrícula</option>
                  <option value="carousel">Carrusel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Profesionales Vinculados */}
          {calendar.linkedCalendarId && professionals.length > 0 && (
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <h4 className="font-medium text-green-900 dark:text-green-200 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Profesionales Vinculados
              </h4>
              <div className="space-y-2">
                {professionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {/* Avatar con foto */}
                    <div className="relative group">
                      {prof.avatar ? (
                        <img
                          src={prof.avatar}
                          alt={prof.name}
                          className="w-12 h-12 rounded-full object-cover border-2"
                          style={{ borderColor: prof.color }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: prof.color }}
                        >
                          {prof.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Botón de subir foto */}
                      <button
                        onClick={() => fileInputRefs.current[prof.id]?.click()}
                        disabled={uploadingPhoto === prof.id}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {uploadingPhoto === prof.id ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </button>
                      
                      {/* Input oculto */}
                      <input
                        ref={(el) => (fileInputRefs.current[prof.id] = el)}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(prof.id, e)}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{prof.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{prof.role}</p>
                    </div>
                    
                    {prof.isActive && (
                      <div className="text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-medium mb-1">¿Cómo funciona?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                <li>Vincula un calendario colaborativo para mostrar profesionales</li>
                <li>Los visitantes podrán ver los profesionales y sus horarios</li>
                <li>Las reservas se registran automáticamente en el calendario</li>
                <li>Si no muestras profesionales, las reservas llegan sin asignar</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarEditor;
