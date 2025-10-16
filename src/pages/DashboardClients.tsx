import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExternalClients, useCreateClient, useDeleteClient, useClientServices, useClientStats, useUpdateClient, useCancelService } from '@/hooks/useExternalClients';
import { ExternalClient, ExternalClientService } from '@/types/externalClient';
import '@/styles/ios-dashboard.css';
import {
  Users,
  Plus,
  Search,
  Clock,
  Euro,
  Calendar,
  TrendingUp,
  Building2,
  Mail,
  Phone,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Download,
  FileText,
  BarChart3,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  hourlyRate: number;
  currency: string;
}

const DashboardClients: React.FC = () => {
  const { user } = useAuth();
  const { data: clients, isLoading } = useExternalClients(user?.uid);
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ExternalClient | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);

  // Filtrar clientes según búsqueda
  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas generales
  const stats = React.useMemo(() => {
    if (!clients) return { totalClients: 0, totalHours: 0, totalAmount: 0, activeClients: 0 };

    const totalHours = clients.reduce((sum, c) => sum + (c.totalHours || 0), 0);
    const totalAmount = clients.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const activeClients = clients.filter(c => c.lastServiceDate).length;

    return {
      totalClients: clients.length,
      totalHours: Math.round(totalHours * 10) / 10,
      totalAmount: Math.round(totalAmount * 100) / 100,
      activeClients
    };
  }, [clients]);

  const handleCreateClient = async (data: ClientFormData) => {
    if (!user?.uid) return;

    try {
      await createClient.mutateAsync({
        userId: user.uid,
        data
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user?.uid) return;

    try {
      await deleteClient.mutateAsync({ clientId, userId: user.uid });
      setShowDeleteModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  return (
    <div className="ios-main-content ios-smooth-transition bg-white flex h-full">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showDetailsSidebar ? 'mr-[700px]' : ''}`}>
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="rounded-2xl p-5 border border-black/5 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="ios-app-icon !w-12 !h-12">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Clientes Externos</h1>
                <p className="text-[#8e8e93] text-sm">Gestiona tus clientes y seguimiento de horas facturables</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="ios-cta-button flex items-center gap-2"
            >
              <Plus size={18} />
              Nuevo Cliente
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users size={18} />}
            label="Total Clientes"
            value={stats.totalClients}
            color="#007aff"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Horas Totales"
            value={`${stats.totalHours}h`}
            color="#34c759"
          />
          <StatCard
            icon={<Euro size={18} />}
            label="Importe Total"
            value={`€${stats.totalAmount.toLocaleString()}`}
            color="#ff9500"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Clientes Activos"
            value={stats.activeClients}
            color="#5856d6"
          />
        </div>

        {/* Search Bar */}
        <div className="rounded-2xl p-4 border border-black/5 shadow-sm bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93]" size={18} />
            <input
              type="text"
              placeholder="Buscar clientes por nombre, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Clients List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--ios-accent)]"></div>
            <p className="mt-3 text-[#8e8e93]">Cargando clientes...</p>
          </div>
        ) : filteredClients && filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onDelete={() => {
                  setSelectedClient(client);
                  setShowDeleteModal(true);
                }}
                onViewDetails={() => {
                  setSelectedClient(client);
                  setShowDetailsSidebar(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-12 border border-black/5 bg-white text-center">
            <div className="ios-app-icon !w-16 !h-16 mx-auto mb-4">
              <Users className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes aún'}
            </h3>
            <p className="text-[#8e8e93] mb-4">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea tu primer cliente para empezar a hacer seguimiento de horas facturables'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="ios-cta-button mx-auto"
              >
                <Plus size={18} className="mr-2" />
                Crear Primer Cliente
              </button>
            )}
          </div>
        )}
        </div>

        {/* Create Client Modal */}
        {showCreateModal && (
          <CreateClientModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateClient}
            isSubmitting={createClient.isPending}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedClient && (
          <DeleteClientModal
            client={selectedClient}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedClient(null);
            }}
            onConfirm={() => handleDeleteClient(selectedClient.id)}
            isDeleting={deleteClient.isPending}
          />
        )}
      </div>

      {/* Client Details Sidebar */}
      {showDetailsSidebar && selectedClient && (
        <ClientDetailsSidebar
          client={selectedClient}
          onClose={() => {
            setShowDetailsSidebar(false);
            setSelectedClient(null);
          }}
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

// Client Card Component
const ClientCard: React.FC<{
  client: ExternalClient;
  onDelete: () => void;
  onViewDetails: () => void;
}> = ({ client, onDelete, onViewDetails }) => {
  const [showMenu, setShowMenu] = useState(false);

  const lastServiceDate = client.lastServiceDate
    ? (client.lastServiceDate instanceof Date
        ? client.lastServiceDate
        : client.lastServiceDate.toDate())
    : null;

  const formatDate = (date: Date | null) => {
    if (!date) return 'Sin servicios';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="rounded-2xl p-5 border border-black/5 shadow-sm bg-white hover:shadow-md transition-shadow relative">
      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
        >
          <MoreVertical size={18} className="text-[#8e8e93]" />
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-1 w-48 rounded-xl border border-black/10 shadow-lg bg-white py-1 z-10">
            <button
              onClick={() => {
                setShowMenu(false);
                onViewDetails();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5 transition-colors w-full text-left"
            >
              <Eye size={16} />
              Ver Detalles
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#ff3b30] hover:bg-[#ff3b30]/5 transition-colors w-full text-left"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Client Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#1d1d1f] mb-1 pr-8">{client.name}</h3>
        {client.company && (
          <div className="flex items-center gap-1.5 text-sm text-[#8e8e93] mb-1">
            <Building2 size={14} />
            {client.company}
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-1.5 text-sm text-[#8e8e93] mb-1">
            <Mail size={14} />
            {client.email}
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-1.5 text-sm text-[#8e8e93]">
            <Phone size={14} />
            {client.phone}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg bg-black/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#8e8e93] mb-1">
            <Clock size={12} />
            Horas
          </div>
          <p className="text-lg font-semibold text-[#1d1d1f]">{client.totalHours || 0}h</p>
        </div>
        <div className="rounded-lg bg-black/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#8e8e93] mb-1">
            <Euro size={12} />
            Importe
          </div>
          <p className="text-lg font-semibold text-[#1d1d1f]">
            {client.currency === 'EUR' ? '€' : client.currency === 'USD' ? '$' : ''}
            {(client.totalAmount || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Last Service */}
      <div className="flex items-center gap-1.5 text-sm text-[#8e8e93]">
        <Calendar size={14} />
        <span>Último servicio: {formatDate(lastServiceDate)}</span>
      </div>

      {/* View Details Button */}
      <button
        onClick={onViewDetails}
        className="mt-4 ios-cta-button w-full flex items-center justify-center gap-2"
      >
        <Eye size={16} />
        Ver Detalles
      </button>
    </div>
  );
};

// Create Client Modal
const CreateClientModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  isSubmitting: boolean;
}> = ({ onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    hourlyRate: 0,
    currency: 'EUR'
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
            <Plus className="text-white" size={18} />
          </div>
          <h2 className="text-xl font-semibold text-[#1d1d1f]">Nuevo Cliente</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">
              Nombre del cliente *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
              placeholder="Ej: María García"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">
              Empresa
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
              placeholder="Ej: Tech Solutions S.L."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">
              Tarifa Horaria *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none transition-all"
              placeholder="Ej: 50.00"
            />
            <p className="text-xs text-[#8e8e93] mt-1">
              Tarifa por hora que cobra este cliente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1">
              Moneda
            </label>
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
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 ios-clear-button"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 ios-cta-button"
            >
              {isSubmitting ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Client Modal
const DeleteClientModal: React.FC<{
  client: ExternalClient;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}> = ({ client, onClose, onConfirm, isDeleting }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="rounded-2xl bg-white shadow-xl max-w-md w-full p-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <div className="ios-app-icon !w-10 !h-10 !bg-[#ff3b30]">
          <AlertCircle className="text-white" size={18} />
        </div>
        <h2 className="text-xl font-semibold text-[#1d1d1f]">Eliminar Cliente</h2>
      </div>

      <p className="text-[#8e8e93] mb-4">
        ¿Estás seguro de que deseas eliminar a <strong>{client.name}</strong>?
      </p>

      <div className="rounded-lg bg-[#ff3b30]/10 p-3 mb-4">
        <p className="text-sm text-[#ff3b30]">
          ⚠️ Solo se pueden eliminar clientes sin servicios asociados.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="flex-1 ios-cta-button"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 ios-clear-button !text-[#ff3b30]"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  </div>
);

// Client Details Sidebar Component
const ClientDetailsSidebar: React.FC<{
  client: ExternalClient;
  onClose: () => void;
}> = ({ client, onClose }) => {
  const { user } = useAuth();
  const { data: services, isLoading: servicesLoading } = useClientServices(client.id);
  const { data: stats } = useClientStats(client.id);
  const updateClient = useUpdateClient();
  const cancelService = useCancelService();

  const [showEditModal, setShowEditModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ExternalClientService | null>(null);

  // Filtrar servicios por fecha
  const filteredServices = React.useMemo(() => {
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
    }

    return services.filter(service => {
      const serviceDate = service.date instanceof Date ? service.date : service.date.toDate();
      return serviceDate >= filterDate;
    });
  }, [services, dateFilter]);

  const handleCancelService = async () => {
    if (!selectedService) return;

    try {
      await cancelService.mutateAsync({
        clientId: client.id,
        serviceId: selectedService.id
      });
      setShowCancelModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error canceling service:', error);
    }
  };

  const exportToCSV = () => {
    if (!filteredServices) return;

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

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[700px] bg-white shadow-2xl z-40 overflow-y-auto border-l border-black/10">
        <div className="sticky top-0 z-10 bg-white border-b border-black/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-[#1d1d1f]">Detalles del Cliente</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X size={20} className="text-[#8e8e93]" />
            </button>
          </div>

          {/* Client Info Header */}
          <div className="flex items-start gap-4">
            <div className="ios-app-icon !w-14 !h-14">
              <Users className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">{client.name}</h3>
              <div className="space-y-1">
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
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="ios-link-button flex items-center gap-2"
              >
                <Download size={16} />
                CSV
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
        </div>

        <div className="p-5 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-xs text-blue-600">Servicios</span>
              </div>
              <p className="text-2xl font-semibold text-blue-900">{stats?.serviceCount || 0}</p>
            </div>
            <div className="rounded-xl p-4 bg-green-50 border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-green-600" />
                <span className="text-xs text-green-600">Horas</span>
              </div>
              <p className="text-2xl font-semibold text-green-900">{stats?.totalHours || 0}h</p>
            </div>
            <div className="rounded-xl p-4 bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <Euro size={16} className="text-orange-600" />
                <span className="text-xs text-orange-600">Total</span>
              </div>
              <p className="text-2xl font-semibold text-orange-900">
                {client.currency === 'EUR' ? '€' : client.currency === 'USD' ? '$' : ''}
                {(stats?.totalAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl p-4 bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-purple-600" />
                <span className="text-xs text-purple-600">Último</span>
              </div>
              <p className="text-sm font-semibold text-purple-900">
                {stats?.lastServiceDate
                  ? stats.lastServiceDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Professional Breakdown */}
          {stats?.professionalBreakdown && stats.professionalBreakdown.length > 0 && (
            <div className="rounded-xl p-4 border border-black/10 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={18} className="text-[#007aff]" />
                <h4 className="font-semibold text-[#1d1d1f]">Desglose por Profesional</h4>
              </div>
              <div className="space-y-2">
                {stats.professionalBreakdown.map((prof) => (
                  <div key={prof.professionalId} className="rounded-lg p-3 bg-black/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#1d1d1f]">{prof.professionalName}</span>
                      <span className="text-xs text-[#8e8e93]">{prof.serviceCount} servicios</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8e8e93]">{prof.hours}h</span>
                      <span className="font-semibold text-[#1d1d1f]">
                        {client.currency === 'EUR' ? '€' : client.currency === 'USD' ? '$' : ''}
                        {prof.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services History */}
          <div className="rounded-xl p-4 border border-black/10 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#007aff]" />
                <h4 className="font-semibold text-[#1d1d1f]">Historial de Servicios</h4>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[#8e8e93]" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="px-2 py-1 rounded-lg border border-black/10 text-xs focus:border-[var(--ios-accent)] focus:ring-2 focus:ring-[var(--ios-accent)]/20 outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="7d">7 días</option>
                  <option value="30d">30 días</option>
                  <option value="90d">90 días</option>
                </select>
              </div>
            </div>

            {servicesLoading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--ios-accent)]"></div>
              </div>
            ) : filteredServices && filteredServices.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredServices.map((service) => {
                  const serviceDate = service.date instanceof Date ? service.date : service.date.toDate();
                  const isCancelled = service.status === 'cancelled';

                  return (
                    <div
                      key={service.id}
                      className={`rounded-lg p-3 border transition-all ${
                        isCancelled
                          ? 'bg-red-50 border-red-100 opacity-60'
                          : 'bg-green-50 border-green-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-[#1d1d1f]">{service.title}</span>
                            {isCancelled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">
                                <XCircle size={10} />
                                Cancelado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                                <CheckCircle size={10} />
                                Completado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8e8e93]">{service.professionalName}</p>
                          <p className="text-xs text-[#8e8e93]">
                            {serviceDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#1d1d1f]">
                            {client.currency === 'EUR' ? '€' : client.currency === 'USD' ? '$' : ''}
                            {service.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-[#8e8e93]">{service.hours}h</p>
                          {!isCancelled && (
                            <button
                              onClick={() => {
                                setSelectedService(service);
                                setShowCancelModal(true);
                              }}
                              className="text-xs text-red-600 hover:opacity-80 transition-opacity mt-1"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-6 text-[#8e8e93] text-sm">
                {dateFilter === 'all'
                  ? 'No hay servicios registrados'
                  : 'No hay servicios en el período seleccionado'}
              </p>
            )}
          </div>
        </div>

        {/* Edit Modal */}
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

// Edit Client Modal
const EditClientModal: React.FC<{
  client: ExternalClient;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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
          ⚠️ Se restarán {service.hours}h y {service.amount} del total del cliente.
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

export { DashboardClients };
export default DashboardClients;
