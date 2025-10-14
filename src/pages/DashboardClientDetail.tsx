import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  useExternalClient,
  useClientServices,
  useClientStats,
  useUpdateClient,
  useCancelService
} from '@/hooks/useExternalClients';
import { ExternalClientService } from '@/types/externalClient';
import '@/styles/ios-dashboard.css';
import {
  ArrowLeft,
  Users,
  Clock,
  Euro,
  Calendar,
  TrendingUp,
  Building2,
  Mail,
  Phone,
  Edit2,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  BarChart3,
  Filter,
  AlertCircle
} from 'lucide-react';

const DashboardClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: client, isLoading: clientLoading } = useExternalClient(clientId);
  const { data: services, isLoading: servicesLoading } = useClientServices(clientId);
  const { data: stats } = useClientStats(clientId);
  const updateClient = useUpdateClient();
  const cancelService = useCancelService();

  const [showEditModal, setShowEditModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d' | 'year'>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ExternalClientService | null>(null);

  // Filtrar servicios por fecha
  const filteredServices = useMemo(() => {
    if (!services || dateFilter === 'all') return services;

    const now = new Date();
    const filterDate = new Date();

    switch (dateFilter) {
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        filterDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return services.filter(service => {
      const serviceDate = service.date instanceof Date ? service.date : service.date.toDate();
      return serviceDate >= filterDate;
    });
  }, [services, dateFilter]);

  const handleCancelService = async () => {
    if (!selectedService || !clientId) return;

    try {
      await cancelService.mutateAsync({
        clientId,
        serviceId: selectedService.id
      });
      setShowCancelModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error canceling service:', error);
    }
  };

  const exportToCSV = () => {
    if (!client || !filteredServices) return;

    const headers = ['Fecha', 'Título', 'Profesional', 'Horas', 'Tarifa', 'Importe', 'Estado'];
    const rows = filteredServices.map(service => [
      (service.date instanceof Date ? service.date : service.date.toDate()).toLocaleDateString('es-ES'),
      service.title,
      service.professionalName,
      service.hours,
      service.professionalRate,
      service.amount,
      service.status === 'completed' ? 'Completado' : 'Cancelado'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${client.name.replace(/\s+/g, '_')}_servicios.csv`;
    link.click();
  };

  if (clientLoading) {
    return (
      <div className="ios-main-content bg-white">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--ios-accent)]"></div>
          <p className="mt-3 text-[#8e8e93]">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="ios-main-content bg-white">
        <div className="text-center py-12">
          <div className="ios-app-icon !w-16 !h-16 mx-auto mb-4 !bg-[#ff3b30]">
            <AlertCircle className="text-white" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">Cliente no encontrado</h3>
          <p className="text-[#8e8e93] mb-4">El cliente que buscas no existe o no tienes acceso.</p>
          <Link to="/dashboard/clientes" className="ios-cta-button mx-auto">
            Volver a Clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ios-main-content ios-smooth-transition bg-white">
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        {/* Header with Back Button */}
        <div className="rounded-2xl p-5 border border-black/5 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard/clientes')}
              className="flex items-center gap-2 text-[var(--ios-accent)] hover:opacity-80 transition-opacity"
            >
              <ArrowLeft size={20} />
              <span>Clientes</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="ios-link-button flex items-center gap-2"
              >
                <Download size={16} />
                Exportar CSV
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="ios-cta-button flex items-center gap-2"
              >
                <Edit2 size={16} />
                Editar
              </button>
            </div>
          </div>

          {/* Client Info */}
          <div className="flex items-start gap-4">
            <div className="ios-app-icon !w-16 !h-16">
              <Users className="text-white" size={28} />
            </div>
            <div className="flex-1">
              <h1 className="text-[24px] font-semibold text-[#1d1d1f] mb-2">{client.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {client.company && (
                  <div className="flex items-center gap-2 text-sm text-[#8e8e93]">
                    <Building2 size={14} />
                    {client.company}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-[#8e8e93]">
                    <Mail size={14} />
                    {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-[#8e8e93]">
                    <Phone size={14} />
                    {client.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Calendar size={18} />}
            label="Total Servicios"
            value={stats?.serviceCount || 0}
            color="#007aff"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Horas Totales"
            value={`${stats?.totalHours || 0}h`}
            color="#34c759"
          />
          <StatCard
            icon={<Euro size={18} />}
            label="Importe Total"
            value={`${client.currency === 'EUR' ? '€' : client.currency === 'USD' ? '$' : ''}${(stats?.totalAmount || 0).toLocaleString()}`}
            color="#ff9500"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Último Servicio"
            value={stats?.lastServiceDate
              ? stats.lastServiceDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
              : 'N/A'}
            color="#5856d6"
          />
        </div>

        {/* Professional Breakdown */}
        {stats?.professionalBreakdown && stats.professionalBreakdown.length > 0 && (
          <div className="rounded-2xl p-5 border border-black/5 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="ios-app-icon !w-10 !h-10">
                <BarChart3 className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1d1d1f]">Desglose por Profesional</h2>
                <p className="text-sm text-[#8e8e93]">Distribución de horas y costes</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.professionalBreakdown.map((prof, index) => (
                <div
                  key={prof.professionalId}
                  className="rounded-xl p-4 bg-black/5 hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#1d1d1f]">{prof.professionalName}</h3>
                    <span className="text-sm text-[#8e8e93]">{prof.serviceCount} servicios</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#8e8e93]">Horas</p>
                      <p className="text-lg font-semibold text-[#1d1d1f]">{prof.hours}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8e8e93]">Importe</p>
                      <p className="text-lg font-semibold text-[#1d1d1f]">
                        {client.currency === 'EUR' ? '€' : client.currency === 'USD' ? '$' : ''}
                        {prof.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services History */}
        <div className="rounded-2xl p-5 border border-black/5 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="ios-app-icon !w-10 !h-10">
                <FileText className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1d1d1f]">Historial de Servicios</h2>
                <p className="text-sm text-[#8e8e93]">
                  {filteredServices?.length || 0} servicios
                  {dateFilter !== 'all' && ' (filtrados)'}
                </p>
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[#8e8e93]" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-black/10 text-sm focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none"
              >
                <option value="all">Todos</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 3 meses</option>
                <option value="year">Último año</option>
              </select>
            </div>
          </div>

          {servicesLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--ios-accent)]"></div>
            </div>
          ) : filteredServices && filteredServices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#8e8e93]">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#8e8e93]">Servicio</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#8e8e93]">Profesional</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#8e8e93]">Horas</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#8e8e93]">Tarifa/h</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#8e8e93]">Importe</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#8e8e93]">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#8e8e93]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      currency={client.currency}
                      onCancel={() => {
                        setSelectedService(service);
                        setShowCancelModal(true);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#8e8e93]">
                {dateFilter === 'all'
                  ? 'No hay servicios registrados para este cliente'
                  : 'No hay servicios en el período seleccionado'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Client Modal */}
      {showEditModal && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onSubmit={async (data) => {
            if (!user?.uid) return;
            await updateClient.mutateAsync({
              clientId: client.id,
              data,
              userId: user.uid
            });
            setShowEditModal(false);
          }}
          isSubmitting={updateClient.isPending}
        />
      )}

      {/* Cancel Service Modal */}
      {showCancelModal && selectedService && (
        <CancelServiceModal
          service={selectedService}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedService(null);
          }}
          onConfirm={handleCancelService}
          isCancelling={cancelService.isPending}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="rounded-2xl p-4 border border-black/5 shadow-sm bg-white">
    <div className="flex items-center gap-3 mb-2">
      <div className="ios-app-icon !w-10 !h-10" style={{ background: color }}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#8e8e93]">{label}</p>
        <p className="text-2xl font-semibold text-[#1d1d1f]">{value}</p>
      </div>
    </div>
  </div>
);

// Service Row Component
const ServiceRow: React.FC<{
  service: ExternalClientService;
  currency: string;
  onCancel: () => void;
}> = ({ service, currency, onCancel }) => {
  const serviceDate = service.date instanceof Date ? service.date : service.date.toDate();
  const isCancelled = service.status === 'cancelled';

  return (
    <tr className={`border-b border-black/5 hover:bg-black/5 transition-colors ${isCancelled ? 'opacity-50' : ''}`}>
      <td className="py-3 px-4 text-sm text-[#1d1d1f]">
        {serviceDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="py-3 px-4 text-sm text-[#1d1d1f] font-medium">{service.title}</td>
      <td className="py-3 px-4 text-sm text-[#8e8e93]">{service.professionalName}</td>
      <td className="py-3 px-4 text-sm text-[#1d1d1f] text-right">{service.hours}h</td>
      <td className="py-3 px-4 text-sm text-[#8e8e93] text-right">
        {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : ''}
        {service.professionalRate}
      </td>
      <td className="py-3 px-4 text-sm text-[#1d1d1f] font-semibold text-right">
        {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : ''}
        {service.amount.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-center">
        {isCancelled ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] text-xs font-medium">
            <XCircle size={12} />
            Cancelado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#34c759]/10 text-[#34c759] text-xs font-medium">
            <CheckCircle size={12} />
            Completado
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        {!isCancelled && (
          <button
            onClick={onCancel}
            className="text-[#ff3b30] hover:opacity-80 transition-opacity text-sm"
          >
            Cancelar
          </button>
        )}
      </td>
    </tr>
  );
};

// Edit Client Modal
const EditClientModal: React.FC<{
  client: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}> = ({ client, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    company: client.company || '',
    currency: client.currency
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl bg-white shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="ios-app-icon !w-10 !h-10">
            <Edit2 className="text-white" size={18} />
          </div>
          <h2 className="text-xl font-semibold text-[#1d1d1f]">Editar Cliente</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Empresa</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Moneda</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
            >
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="GBP">GBP £</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 ios-clear-button">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 ios-cta-button">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Cancel Service Modal
const CancelServiceModal: React.FC<{
  service: ExternalClientService;
  onClose: () => void;
  onConfirm: () => void;
  isCancelling: boolean;
}> = ({ service, onClose, onConfirm, isCancelling }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="rounded-2xl bg-white shadow-xl max-w-md w-full p-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <div className="ios-app-icon !w-10 !h-10 !bg-[#ff3b30]">
          <AlertCircle className="text-white" size={18} />
        </div>
        <h2 className="text-xl font-semibold text-[#1d1d1f]">Cancelar Servicio</h2>
      </div>

      <p className="text-[#8e8e93] mb-4">
        ¿Estás seguro de que deseas cancelar el servicio <strong>{service.title}</strong>?
      </p>

      <div className="rounded-lg bg-[#ff3b30]/10 p-3 mb-4">
        <p className="text-sm text-[#ff3b30]">
          ⚠️ Se restarán {service.hours}h y €{service.amount} del total del cliente.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} disabled={isCancelling} className="flex-1 ios-cta-button">
          Volver
        </button>
        <button
          onClick={onConfirm}
          disabled={isCancelling}
          className="flex-1 ios-clear-button !text-[#ff3b30]"
        >
          {isCancelling ? 'Cancelando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  </div>
);

export { DashboardClientDetail };
export default DashboardClientDetail;
