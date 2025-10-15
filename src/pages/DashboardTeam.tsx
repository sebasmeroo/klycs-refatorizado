import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  Calendar,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  DollarSign,
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TeamService } from '@/services/teamService';
import { UserTeam, TeamProfessional } from '@/types';
import { info } from '@/utils/logger';

const PROFESSIONAL_COLOR_PALETTE = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#0EA5E9', '#14B8A6', '#EC4899', '#F97316', '#6366F1'
];

const ROLE_SUGGESTIONS = [
  'Médico', 'Dentista', 'Enfermero/a', 'Fisioterapeuta', 'Psicólogo/a',
  'Veterinario/a', 'Abogado/a', 'Consultor/a', 'Terapeuta', 'Especialista'
];

const PAYMENT_TYPE_OPTIONS = [
  { value: 'weekly' as const, label: 'Semanal' },
  { value: 'biweekly' as const, label: 'Quincenal' },
  { value: 'monthly' as const, label: 'Mensual' }
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash' as const, label: 'Efectivo' },
  { value: 'transfer' as const, label: 'Transferencia' },
  { value: 'bizum' as const, label: 'Bizum' },
  { value: 'other' as const, label: 'Otro' }
];

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'GBP', label: '£ GBP' }
];

const DashboardTeam: React.FC = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<UserTeam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<TeamProfessional | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isAddingProfessional, setIsAddingProfessional] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  // Estados para crear equipo
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: ''
  });

  // Estados para agregar profesional
  const [professionalForm, setProfessionalForm] = useState({
    name: '',
    email: '',
    role: '',
    color: PROFESSIONAL_COLOR_PALETTE[0],
    hourlyRate: 0,
    hourlyRateCurrency: 'EUR',
    paymentType: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
    paymentDay: 1,
    paymentMethod: 'transfer' as 'cash' | 'transfer' | 'bizum' | 'other',
    permissions: {
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: false,
      canViewAllEvents: true
    }
  });

  // Estados para editar configuración de pagos
  const [paymentEditForm, setPaymentEditForm] = useState({
    hourlyRate: 0,
    hourlyRateCurrency: 'EUR',
    paymentType: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
    paymentDay: 1,
    paymentMethod: 'transfer' as 'cash' | 'transfer' | 'bizum' | 'other'
  });

  // ===== EFFECTS =====
  
  useEffect(() => {
    if (!user?.uid) return;

    const loadTeam = async () => {
      try {
        const userTeam = await TeamService.getUserTeam(user.uid);
        setTeam(userTeam);
      } catch (error) {
        console.error('Error cargando equipo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeam();
  }, [user?.uid]);

  // ===== HANDLERS =====

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid || !teamForm.name.trim()) return;

    setIsCreatingTeam(true);
    
    try {
      console.log('🚀 Creando equipo:', teamForm.name);
      
      const teamId = await TeamService.createTeam(
        user.uid,
        teamForm.name.trim(),
        teamForm.description.trim() || undefined
      );
      
      console.log('✅ Equipo creado con ID:', teamId);
      
      // Recargar datos del equipo
      const newTeam = await TeamService.getUserTeam(user.uid);
      setTeam(newTeam);
      
      // Limpiar formulario
      setTeamForm({ name: '', description: '' });
      
      alert('✅ Equipo creado correctamente! Ahora puedes agregar profesionales.');
      
    } catch (error) {
      console.error('Error creando equipo:', error);
      alert(`❌ Error al crear el equipo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team?.id || !professionalForm.name.trim() || !professionalForm.email.trim()) {
      return;
    }

    setIsAddingProfessional(true);

    try {
      console.log('👨‍⚕️ Agregando profesional:', professionalForm.email);
      
      const professionalId = await TeamService.addProfessional(team.id, {
        name: professionalForm.name.trim(),
        email: professionalForm.email.trim(),
        role: professionalForm.role.trim() || 'Profesional',
        color: professionalForm.color,
        hourlyRate: professionalForm.hourlyRate,
        hourlyRateCurrency: professionalForm.hourlyRateCurrency,
        paymentType: professionalForm.paymentType,
        paymentDay: professionalForm.paymentDay,
        paymentMethod: professionalForm.paymentMethod,
        permissions: professionalForm.permissions
      });
      
      console.log('✅ Profesional agregado con ID:', professionalId);
      
      // Recargar datos del equipo
      const updatedTeam = await TeamService.getUserTeam(user!.uid);
      setTeam(updatedTeam);
      
      // Limpiar formulario
      setProfessionalForm({
        name: '',
        email: '',
        role: '',
        color: PROFESSIONAL_COLOR_PALETTE[Math.floor(Math.random() * PROFESSIONAL_COLOR_PALETTE.length)],
        hourlyRate: 0,
        hourlyRateCurrency: 'EUR',
        paymentType: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
        paymentDay: 1,
        paymentMethod: 'transfer' as 'cash' | 'transfer' | 'bizum' | 'other',
        permissions: {
          canCreateEvents: true,
          canEditEvents: true,
          canDeleteEvents: false,
          canViewAllEvents: true
        }
      });
      
      setShowAddProfessional(false);
      
      alert(`✅ Profesional "${professionalForm.name}" agregado correctamente!\n\n📧 Debe registrarse en: ${window.location.origin}/team/login`);
      
    } catch (error) {
      console.error('Error agregando profesional:', error);
      alert(`❌ Error al agregar profesional: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsAddingProfessional(false);
    }
  };

  const handleRemoveProfessional = async (professionalId: string) => {
    if (!team?.id) return;
    
    const professional = team.professionals.find(p => p.id === professionalId);
    if (!professional) return;

    if (!confirm(`¿Estás seguro de que quieres remover a ${professional.name} del equipo?`)) {
      return;
    }

    try {
      await TeamService.removeProfessional(team.id, professionalId);
      
      // Recargar datos del equipo
      const updatedTeam = await TeamService.getUserTeam(user!.uid);
      setTeam(updatedTeam);
      
      alert(`✅ ${professional.name} ha sido removido del equipo.`);
      
    } catch (error) {
      console.error('Error removiendo profesional:', error);
      alert(`❌ Error al remover profesional: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const copyTeamLoginUrl = () => {
    const loginUrl = `${window.location.origin}/team/login`;
    navigator.clipboard.writeText(loginUrl);
    alert('✅ URL copiada al portapapeles');
  };

  const handleEditPaymentConfig = async (professional: TeamProfessional) => {
    if (!professional.linkedCalendarId) return;

    try {
      // Cargar configuración actual del calendario
      const { CollaborativeCalendarService } = await import('@/services/collaborativeCalendar');
      const calendar = await CollaborativeCalendarService.getCalendar(professional.linkedCalendarId);

      if (calendar) {
        setPaymentEditForm({
          hourlyRate: calendar.hourlyRate || 0,
          hourlyRateCurrency: calendar.hourlyRateCurrency || 'EUR',
          paymentType: calendar.payoutDetails?.paymentType || 'monthly',
          paymentDay: calendar.payoutDetails?.paymentDay || 1,
          paymentMethod: calendar.payoutDetails?.paymentMethod || 'transfer'
        });
        setEditingProfessional(professional);
        setShowEditPayment(true);
      }
    } catch (error) {
      console.error('Error cargando configuración de pagos:', error);
      alert('❌ Error al cargar la configuración de pagos');
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!team?.id || !editingProfessional?.id) return;

    setIsUpdatingPayment(true);

    try {
      console.log('💰 Actualizando configuración de pagos...');

      await TeamService.updateProfessionalPaymentConfig(team.id, editingProfessional.id, {
        hourlyRate: paymentEditForm.hourlyRate,
        hourlyRateCurrency: paymentEditForm.hourlyRateCurrency,
        paymentType: paymentEditForm.paymentType,
        paymentDay: paymentEditForm.paymentDay,
        paymentMethod: paymentEditForm.paymentMethod
      });

      console.log('✅ Configuración de pagos actualizada');

      // Recargar datos del equipo
      const updatedTeam = await TeamService.getUserTeam(user!.uid);
      setTeam(updatedTeam);

      setShowEditPayment(false);
      setEditingProfessional(null);

      alert(`✅ Configuración de pagos actualizada para ${editingProfessional.name}`);

    } catch (error) {
      console.error('Error actualizando configuración de pagos:', error);
      alert(`❌ Error al actualizar configuración de pagos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const getStatusIcon = (professional: TeamProfessional) => {
    if (professional.hasAccount) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    switch (professional.inviteStatus) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (professional: TeamProfessional) => {
    if (professional.hasAccount) {
      return 'Activo';
    }
    
    switch (professional.inviteStatus) {
      case 'accepted':
        return 'Aceptada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  };

  // ===== RENDER =====

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Si no tiene equipo, mostrar formulario de creación
  if (!team) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Crear tu Equipo</h1>
              <p className="text-gray-600">Configura tu equipo para gestionar calendarios profesionales</p>
            </div>
          </div>
        </div>

        {/* Formulario de creación */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleCreateTeam} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del equipo *
              </label>
              <input
                type="text"
                value={teamForm.name}
                onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Clínica Dental Sebi, Consultorio Médico..."
                required
                disabled={isCreatingTeam}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={teamForm.description}
                onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe brevemente tu equipo o tipo de servicios..."
                disabled={isCreatingTeam}
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingTeam || !teamForm.name.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingTeam ? 'Creando equipo...' : 'Crear Equipo'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Vista principal del equipo
  return (
    <div className="space-y-6">
      {/* Header del equipo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">
                {team.description || 'Gestiona tu equipo y profesionales'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddProfessional(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Agregar Profesional</span>
          </button>
        </div>
      </div>

      {/* URL de acceso para profesionales */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">URL de Acceso para Profesionales</h3>
            <p className="text-blue-700 text-sm mb-3">
              Comparte esta URL con tus profesionales para que puedan acceder a sus calendarios
            </p>
            <div className="flex items-center space-x-3">
              <code className="bg-white px-3 py-2 rounded-lg text-sm font-mono text-blue-800 flex-1 border border-blue-200">
                {window.location.origin}/team/login
              </code>
              <button
                onClick={copyTeamLoginUrl}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de profesionales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Profesionales ({team.professionals.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {team.professionals.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aún no hay profesionales
              </h3>
              <p className="text-gray-600 mb-4">
                Agrega profesionales para que puedan acceder a sus calendarios individuales
              </p>
              <button
                onClick={() => setShowAddProfessional(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar primer profesional</span>
              </button>
            </div>
          ) : (
            team.professionals.map(professional => (
              <div key={professional.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: professional.color }}
                    >
                      {professional.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Info */}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{professional.name}</h3>
                        {getStatusIcon(professional)}
                        <span className="text-xs font-medium text-gray-600">
                          {getStatusText(professional)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{professional.role}</p>
                      <p className="text-gray-500 text-sm">{professional.email}</p>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center space-x-2">
                    {professional.linkedCalendarId && (
                      <button
                        onClick={() => {
                          // TODO: Navegar al calendario del profesional
                          alert('Función próximamente: Ver calendario del profesional');
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver calendario"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveProfessional(professional.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover profesional"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Permisos */}
                <div className="mt-4 flex items-center space-x-4 text-xs">
                  {professional.permissions.canCreateEvents && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      Crear eventos
                    </span>
                  )}
                  {professional.permissions.canEditEvents && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Editar eventos
                    </span>
                  )}
                  {professional.permissions.canDeleteEvents && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                      Eliminar eventos
                    </span>
                  )}
                </div>

                {/* Información de pagos y link al dashboard */}
                {professional.linkedCalendarId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-gray-600 font-medium">Configuración de pagos:</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditPaymentConfig(professional)}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Editar Pagos</span>
                        </button>
                        <Link
                          to="/dashboard/pagos"
                          className="flex items-center space-x-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Ver Dashboard</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para agregar profesional */}
      {showAddProfessional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Agregar Profesional</h2>
                <button
                  onClick={() => setShowAddProfessional(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddProfessional} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={professionalForm.name}
                    onChange={(e) => setProfessionalForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Dr. Juan Pérez"
                    required
                    disabled={isAddingProfessional}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email profesional *
                  </label>
                  <input
                    type="email"
                    value={professionalForm.email}
                    onChange={(e) => setProfessionalForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="juan@ejemplo.com"
                    required
                    disabled={isAddingProfessional}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El profesional usará este email para acceder a su calendario
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad/Rol
                  </label>
                  <input
                    type="text"
                    value={professionalForm.role}
                    onChange={(e) => setProfessionalForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Dentista, Médico General..."
                    disabled={isAddingProfessional}
                  />
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ROLE_SUGGESTIONS.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setProfessionalForm(prev => ({ ...prev, role }))}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                        disabled={isAddingProfessional}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color del calendario
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROFESSIONAL_COLOR_PALETTE.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setProfessionalForm(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          professionalForm.color === color
                            ? 'border-gray-900'
                            : 'border-transparent hover:border-gray-300'
                        } transition-colors`}
                        style={{ backgroundColor: color }}
                        disabled={isAddingProfessional}
                      />
                    ))}
                  </div>
                </div>

                {/* Configuración de pagos */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Configuración de Pagos</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tarifa por hora
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={professionalForm.hourlyRate}
                        onChange={(e) => setProfessionalForm(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        disabled={isAddingProfessional}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moneda
                      </label>
                      <select
                        value={professionalForm.hourlyRateCurrency}
                        onChange={(e) => setProfessionalForm(prev => ({ ...prev, hourlyRateCurrency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isAddingProfessional}
                      >
                        {CURRENCY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Periodicidad
                      </label>
                      <select
                        value={professionalForm.paymentType}
                        onChange={(e) => setProfessionalForm(prev => ({
                          ...prev,
                          paymentType: e.target.value as 'weekly' | 'biweekly' | 'monthly'
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isAddingProfessional}
                      >
                        {PAYMENT_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Día de pago
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={professionalForm.paymentDay}
                        onChange={(e) => setProfessionalForm(prev => ({ ...prev, paymentDay: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isAddingProfessional}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {professionalForm.paymentType === 'monthly' && 'Día del mes (1-31)'}
                        {professionalForm.paymentType === 'biweekly' && 'Día del ciclo (1-14)'}
                        {professionalForm.paymentType === 'weekly' && 'Día de la semana (1=Lun, 7=Dom)'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de pago preferido
                    </label>
                    <select
                      value={professionalForm.paymentMethod}
                      onChange={(e) => setProfessionalForm(prev => ({
                        ...prev,
                        paymentMethod: e.target.value as 'cash' | 'transfer' | 'bizum' | 'other'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isAddingProfessional}
                    >
                      {PAYMENT_METHOD_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProfessional(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isAddingProfessional}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingProfessional || !professionalForm.name.trim() || !professionalForm.email.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingProfessional ? 'Agregando...' : 'Agregar Profesional'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar configuración de pagos */}
      {showEditPayment && editingProfessional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Editar Configuración de Pagos</h2>
                  <p className="text-sm text-gray-600 mt-1">{editingProfessional.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditPayment(false);
                    setEditingProfessional(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSavePaymentConfig} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarifa por hora
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentEditForm.hourlyRate}
                      onChange={(e) => setPaymentEditForm(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      disabled={isUpdatingPayment}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={paymentEditForm.hourlyRateCurrency}
                      onChange={(e) => setPaymentEditForm(prev => ({ ...prev, hourlyRateCurrency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isUpdatingPayment}
                    >
                      {CURRENCY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Periodicidad
                    </label>
                    <select
                      value={paymentEditForm.paymentType}
                      onChange={(e) => setPaymentEditForm(prev => ({
                        ...prev,
                        paymentType: e.target.value as 'weekly' | 'biweekly' | 'monthly'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isUpdatingPayment}
                    >
                      {PAYMENT_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Día de pago
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentEditForm.paymentDay}
                      onChange={(e) => setPaymentEditForm(prev => ({ ...prev, paymentDay: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isUpdatingPayment}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentEditForm.paymentType === 'monthly' && 'Día del mes (1-31)'}
                      {paymentEditForm.paymentType === 'biweekly' && 'Día del ciclo (1-14)'}
                      {paymentEditForm.paymentType === 'weekly' && 'Día de la semana (1=Lun, 7=Dom)'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de pago preferido
                  </label>
                  <select
                    value={paymentEditForm.paymentMethod}
                    onChange={(e) => setPaymentEditForm(prev => ({
                      ...prev,
                      paymentMethod: e.target.value as 'cash' | 'transfer' | 'bizum' | 'other'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isUpdatingPayment}
                  >
                    {PAYMENT_METHOD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditPayment(false);
                      setEditingProfessional(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isUpdatingPayment}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPayment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPayment ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTeam;
