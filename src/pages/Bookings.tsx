import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, Mail, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export const Bookings: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const mockBookings = [
    {
      id: '1',
      clientName: 'María García',
      clientEmail: 'maria@example.com',
      clientPhone: '+1 234 567 8901',
      service: 'Consultoría técnica',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
      status: 'confirmed',
      notes: 'Necesita ayuda con migración de base de datos',
    },
    {
      id: '2',
      clientName: 'Carlos López',
      clientEmail: 'carlos@example.com',
      clientPhone: '+1 234 567 8902',
      service: 'Desarrollo web',
      date: '2024-01-16',
      time: '14:00',
      duration: 120,
      status: 'pending',
      notes: 'Proyecto de e-commerce',
    },
    {
      id: '3',
      clientName: 'Ana Martín',
      clientEmail: 'ana@example.com',
      clientPhone: '+1 234 567 8903',
      service: 'Consultoría técnica',
      date: '2024-01-12',
      time: '16:00',
      duration: 60,
      status: 'completed',
      notes: 'Revisión de arquitectura',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const filteredBookings = mockBookings.filter(booking => {
    const matchesSearch = booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || booking.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600">Gestiona tus citas y reservas</p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input min-w-[120px]"
            >
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.clientName}</h3>
                    <p className="text-sm text-gray-600">{booking.service}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(booking.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {booking.time} ({booking.duration} min)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${booking.clientEmail}`} className="text-sm text-primary-600 hover:text-primary-500">
                      {booking.clientEmail}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${booking.clientPhone}`} className="text-sm text-primary-600 hover:text-primary-500">
                      {booking.clientPhone}
                    </a>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <strong>Notas:</strong> {booking.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {booking.status === 'pending' && (
                  <>
                    <Button variant="outline" size="sm">
                      Rechazar
                    </Button>
                    <Button size="sm">
                      Confirmar
                    </Button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <>
                    <Button variant="outline" size="sm">
                      Cancelar
                    </Button>
                    <Button size="sm">
                      Marcar completada
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay reservas que coincidan con tu búsqueda</p>
          </div>
        )}
      </Card>
    </div>
  );
};