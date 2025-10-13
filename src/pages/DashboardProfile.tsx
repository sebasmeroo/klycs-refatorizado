import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Save,
  Camera,
  Shield,
  Bell,
  CheckCircle2,
  X
} from 'lucide-react';

const DashboardProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: user?.displayName || user?.name || '',
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
      setIsSaving(true);
      logger.info('Saving user profile', { component: 'DashboardProfile', userId: user?.uid });

      // Import toast dynamically
      const { toast } = await import('@/utils/toast');

      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (err) {
      const { toast } = await import('@/utils/toast');
      toast.error('Error al guardar el perfil');
      logger.error('Error saving profile', err as Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values if needed
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData(prev => ({ ...prev, avatar: file }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-white/60">Perfil</p>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Mi cuenta</h1>
                <p className="text-gray-600 dark:text-white/60 mt-2">Gestiona tu información personal y preferencias</p>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
                >
                  <User className="h-4 w-4" />
                  Editar Perfil
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Avatar y info básica */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-gray-900 dark:text-white font-bold text-3xl shadow-lg">
                  {profileData.name.charAt(0).toUpperCase() || 'U'}
                </div>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 h-8 w-8 flex items-center justify-center rounded-xl bg-white text-slate-900 cursor-pointer hover:bg-gray-100 transition shadow-lg border border-gray-200"
                    >
                      <Camera size={16} />
                    </label>
                  </>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.name || 'Usuario'}</h2>
                <p className="text-gray-600 dark:text-white/60 mt-1">{profileData.email}</p>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-2">{profileData.bio}</p>
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm rounded-3xl p-6 md:p-8 backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información Personal</h3>
                <p className="text-sm text-gray-600 dark:text-white/60">Datos básicos de tu cuenta</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-50 transition"
                  placeholder="Tu nombre completo"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-50 transition"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-50 transition"
                  placeholder="+34 666 777 888"
                />
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Ubicación
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-50 transition"
                  placeholder="Madrid, España"
                />
              </div>

              {/* Sitio Web */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  <Globe className="inline h-4 w-4 mr-2" />
                  Sitio Web
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-50 transition"
                  placeholder="https://tuwebsite.com"
                />
              </div>

              {/* Biografía */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Biografía
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-50 resize-none transition"
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm rounded-3xl p-6 md:p-8 backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Instagram className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Redes Sociales</h3>
                <p className="text-sm text-gray-600 dark:text-white/60">Conecta tus perfiles sociales</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  <Instagram className="inline h-4 w-4 mr-2 text-pink-400" />
                  Instagram
                </label>
                <input
                  type="text"
                  value={profileData.socialLinks.instagram}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                  }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/60 disabled:opacity-50 transition"
                  placeholder="@usuario"
                />
              </div>

              {/* Twitter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  <Twitter className="inline h-4 w-4 mr-2 text-blue-400" />
                  Twitter
                </label>
                <input
                  type="text"
                  value={profileData.socialLinks.twitter}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                  }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/60 disabled:opacity-50 transition"
                  placeholder="@usuario"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  <Linkedin className="inline h-4 w-4 mr-2 text-blue-600" />
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={profileData.socialLinks.linkedin}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                  }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-600/60 disabled:opacity-50 transition"
                  placeholder="linkedin.com/in/usuario"
                />
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm rounded-3xl p-6 md:p-8 backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferencias de Notificaciones</h3>
                <p className="text-sm text-gray-600 dark:text-white/60">Controla cómo quieres recibir notificaciones</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Notificaciones por Email</p>
                  <p className="text-sm text-gray-600 dark:text-white/60">Recibir notificaciones importantes por email</p>
                </div>
                <button
                  onClick={() => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, emailNotifications: !prev.preferences.emailNotifications }
                  }))}
                  disabled={!isEditing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    profileData.preferences.emailNotifications ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profileData.preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Notificaciones Push</p>
                  <p className="text-sm text-gray-600 dark:text-white/60">Recibir notificaciones en tiempo real</p>
                </div>
                <button
                  onClick={() => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, pushNotifications: !prev.preferences.pushNotifications }
                  }))}
                  disabled={!isEditing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    profileData.preferences.pushNotifications ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profileData.preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Emails */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Emails de Marketing</p>
                  <p className="text-sm text-gray-600 dark:text-white/60">Recibir ofertas y novedades</p>
                </div>
                <button
                  onClick={() => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, marketingEmails: !prev.preferences.marketingEmails }
                  }))}
                  disabled={!isEditing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    profileData.preferences.marketingEmails ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profileData.preferences.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Booking Reminders */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Recordatorios de Reservas</p>
                  <p className="text-sm text-gray-600 dark:text-white/60">Recibir recordatorios de citas próximas</p>
                </div>
                <button
                  onClick={() => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, bookingReminders: !prev.preferences.bookingReminders }
                  }))}
                  disabled={!isEditing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    profileData.preferences.bookingReminders ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profileData.preferences.bookingReminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm rounded-3xl p-6 md:p-8 backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seguridad de la Cuenta</h3>
                <p className="text-sm text-gray-600 dark:text-white/60">Protege tu cuenta con opciones avanzadas</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Cambiar Contraseña</p>
                  <p className="text-sm text-gray-600 dark:text-white/60">Última actualización: hace 3 meses</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white font-medium hover:bg-white/10 transition">
                  Cambiar
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Autenticación de Dos Factores</p>
                  <p className="text-sm text-gray-600 dark:text-white/60">Añade una capa extra de seguridad</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-400 transition">
                  Activar
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Sesiones Activas</p>
                  <p className="text-sm text-gray-600 dark:text-white/60">Gestiona dispositivos conectados</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm text-gray-900 dark:text-white font-medium hover:bg-white/10 transition">
                  Gestionar
                </button>
              </div>
            </div>
          </div>

          {/* Success message al guardar */}
          {!isEditing && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-emerald-700 dark:text-emerald-200">Tu perfil está actualizado y sincronizado</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardProfile;
