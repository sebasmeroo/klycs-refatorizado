import React, { useState } from 'react';
import { IOSSection, IOSToggle } from '@/components/ui/IOSControls';
import '@/styles/ios-dashboard.css';
import { useAuth } from '@/hooks/useAuth';
import { info } from '@/utils/logger';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  // Upload,
  Save,
  Edit3,
  Camera,
  Shield,
  Key,
  Bell,
  Settings,
  Trash2
} from 'lucide-react';

const DashboardProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock profile data - replace with actual data from Firebase
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+34 666 777 888',
    location: 'Madrid, España',
    website: 'https://miwebsite.com',
    bio: 'Consultor profesional especializado en desarrollo de negocio y estrategias digitales.',
    avatar: null as File | null,
    socialLinks: {
      instagram: '@miusuario',
      twitter: '@miusuario',
      linkedin: 'linkedin.com/in/miusuario'
    },
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      bookingReminders: true
    }
  });

  const handleSave = async () => {
    try {
      // Save profile functionality
      info('Saving user profile', { component: 'DashboardProfile', userId: user?.id });
      
      // Import toast dynamically
      const { toast } = await import('@/utils/toast');
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (err) {
      const { toast } = await import('@/utils/toast');
      toast.error('Error al guardar el perfil');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData(prev => ({ ...prev, avatar: file }));
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'notifications', label: 'Notificaciones', icon: Bell }
  ];

  const ProfileTab = () => (
    <div className="space-y-6">
      <IOSSection title="Perfil" icon={<User size={14} />} variant="dark">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="ios-user-avatar w-24 h-24">
              <span className="text-white font-bold text-2xl">
                {profileData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" id="avatar-upload" />
            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 ios-icon-button w-8 h-8 cursor-pointer">
              <Camera size={16} className="text-gray-600" />
            </label>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="ios-section-title">{profileData.name}</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="ios-icon-button">
                <Edit3 size={16} />
              </button>
            </div>
            <p className="ios-stat-label">{profileData.email}</p>
            <p className="ios-stat-label text-sm mt-2">{profileData.bio}</p>
          </div>
        </div>
      </IOSSection>

      <IOSSection title="Información básica" icon={<Settings size={14} />} variant="dark">
        <div className="flex items-center justify-between mb-6">
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="ios-link-button">
              <Edit3 size={16} className="mr-2" />
              Editar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block ios-stat-label text-sm mb-2"><User size={16} className="inline mr-2" />Nombre Completo</label>
            <input type="text" value={profileData.name} onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))} disabled={!isEditing} className="ios-date-input w-full"/>
          </div>
          <div>
            <label className="block ios-stat-label text-sm mb-2"><Mail size={16} className="inline mr-2" />Email</label>
            <input type="email" value={profileData.email} onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))} disabled={!isEditing} className="ios-date-input w-full"/>
          </div>
          <div>
            <label className="block ios-stat-label text-sm mb-2"><Phone size={16} className="inline mr-2" />Teléfono</label>
            <input type="tel" value={profileData.phone} onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))} disabled={!isEditing} className="ios-date-input w-full"/>
          </div>
          <div>
            <label className="block ios-stat-label text-sm mb-2"><MapPin size={16} className="inline mr-2" />Ubicación</label>
            <input type="text" value={profileData.location} onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))} disabled={!isEditing} className="ios-date-input w-full"/>
          </div>
          <div className="md:col-span-2">
            <label className="block ios-stat-label text-sm mb-2"><Globe size={16} className="inline mr-2" />Sitio Web</label>
            <input type="url" value={profileData.website} onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))} disabled={!isEditing} className="ios-date-input w-full"/>
          </div>
        </div>
        <div className="mt-6">
          <label className="block ios-stat-label text-sm mb-2">Biografía</label>
          <textarea value={profileData.bio} onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))} disabled={!isEditing} rows={4} className="ios-date-input w-full resize-none"/>
        </div>
      </IOSSection>

      <IOSSection title="Redes sociales" icon={<Instagram size={14} />} variant="dark">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Instagram size={20} className="text-pink-500" />
            <input type="text" value={profileData.socialLinks.instagram} onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))} disabled={!isEditing} placeholder="@usuario" className="ios-date-input flex-1"/>
          </div>
          <div className="flex items-center space-x-4">
            <Twitter size={20} className="text-blue-500" />
            <input type="text" value={profileData.socialLinks.twitter} onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))} disabled={!isEditing} placeholder="@usuario" className="ios-date-input flex-1"/>
          </div>
          <div className="flex items-center space-x-4">
            <Linkedin size={20} className="text-blue-600" />
            <input type="text" value={profileData.socialLinks.linkedin} onChange={(e) => setProfileData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))} disabled={!isEditing} placeholder="linkedin.com/in/usuario" className="ios-date-input flex-1"/>
          </div>
        </div>
      </IOSSection>

      {isEditing && (
        <div className="rounded-2xl p-6 border border-black/5 bg-white">
          <div className="flex items-center justify-end space-x-4">
            <button onClick={() => setIsEditing(false)} className="ios-link-button">Cancelar</button>
            <button onClick={handleSave} className="ios-cta-button"><Save size={16} className="mr-2"/>Guardar Cambios</button>
          </div>
        </div>
      )}
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-6">
      <IOSSection title="Seguridad de la cuenta" icon={<Shield size={14} />} variant="dark">
          
          <div className="space-y-4">
            <div className="ios-booking-item">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="ios-booking-name mb-1">Contraseña</h4>
                  <p className="ios-booking-time">Última actualización: hace 3 meses</p>
                </div>
                <button className="ios-link-button">
                  <Key size={16} className="mr-2" />
                  Cambiar
                </button>
              </div>
            </div>
            
            <div className="ios-booking-item">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="ios-booking-name mb-1">Autenticación de Dos Factores</h4>
                  <p className="ios-booking-time">Añade una capa extra de seguridad</p>
                </div>
                <button className="ios-cta-button text-sm px-4 py-2">
                  <Shield size={16} className="mr-2" />
                  Activar
                </button>
              </div>
            </div>
            
            <div className="ios-booking-item">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="ios-booking-name mb-1">Sesiones Activas</h4>
                  <p className="ios-booking-time">Gestiona dispositivos conectados</p>
                </div>
                <button className="ios-link-button">
                  <Settings size={16} className="mr-2" />
                  Gestionar
                </button>
              </div>
            </div>
          </div>
      </IOSSection>
      
      <IOSSection title="Zona de peligro" icon={<Trash2 size={14} />} variant="dark">
          <div className="ios-error-card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-red-500 font-semibold mb-1">Eliminar Cuenta</h4>
                <p className="ios-stat-label">Esta acción no se puede deshacer</p>
              </div>
              <button className="ios-error-close">
                <Trash2 size={16} className="mr-2" />
                Eliminar
              </button>
            </div>
          </div>
      </IOSSection>
    </div>
  );

  const NotificationsTab = () => (
    <div className="space-y-6">
      <IOSSection title="Preferencias de notificaciones" icon={<Bell size={14} />} variant="dark">
          
          <div className="space-y-4">
            <div className="ios-booking-item">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="ios-booking-name mb-1">Notificaciones por Email</h4>
                  <p className="ios-booking-time">Recibir notificaciones importantes por email</p>
                </div>
                <IOSToggle label="" checked={profileData.preferences.emailNotifications} onChange={(checked) => setProfileData(prev => ({ ...prev, preferences: { ...prev.preferences, emailNotifications: checked } }))} />
              </div>
            </div>
            
            <div className="ios-booking-item">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="ios-booking-name mb-1">Notificaciones Push</h4>
                  <p className="ios-booking-time">Recibir notificaciones en tiempo real</p>
                </div>
                <IOSToggle label="" checked={profileData.preferences.pushNotifications} onChange={(checked) => setProfileData(prev => ({ ...prev, preferences: { ...prev.preferences, pushNotifications: checked } }))} />
              </div>
            </div>
            
            <div className="ios-booking-item">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="ios-booking-name mb-1">Emails de Marketing</h4>
                  <p className="ios-booking-time">Recibir ofertas y novedades</p>
                </div>
                <IOSToggle label="" checked={profileData.preferences.marketingEmails} onChange={(checked) => setProfileData(prev => ({ ...prev, preferences: { ...prev.preferences, marketingEmails: checked } }))} />
              </div>
            </div>
            
            <div className="ios-booking-item">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="ios-booking-name mb-1">Recordatorios de Reservas</h4>
                  <p className="ios-booking-time">Recibir recordatorios de citas próximas</p>
                </div>
                <IOSToggle label="" checked={profileData.preferences.bookingReminders} onChange={(checked) => setProfileData(prev => ({ ...prev, preferences: { ...prev.preferences, bookingReminders: checked } }))} />
              </div>
            </div>
          </div>
      </IOSSection>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab />;
      case 'security': return <SecurityTab />;
      case 'notifications': return <NotificationsTab />;
      default: return <ProfileTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* iOS Header */}
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="ios-feature-icon bg-gradient-to-br from-purple-500 to-purple-600">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h1 className="ios-page-title">Mi Perfil</h1>
                <p className="ios-page-subtitle">Gestiona tu información personal y preferencias</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Tabs */}
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`ios-tab-button ${
                  activeTab === tab.id ? 'ios-tab-active' : 'ios-tab-inactive'
                }`}
              >
                <tab.icon size={16} />
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default DashboardProfile;