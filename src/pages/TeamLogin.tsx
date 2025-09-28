import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Mail, Lock, ArrowRight, Shield, Calendar } from 'lucide-react';
import { authService } from '@/services/auth';
import { TeamService } from '@/services/teamService';
import { useAuth } from '@/hooks/useAuth';

const TeamLogin: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Redirigir si ya está autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/calendar');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔐 Intentando login de profesional con:', formData.email);
      
      // 1. Verificar si es un profesional registrado en algún equipo
      const professionalData = await TeamService.getProfessionalByEmail(formData.email);
      
      if (!professionalData) {
        console.log('❌ Email no encontrado en ningún equipo');
        setErrors({
          general: 'Este email no está registrado como profesional en ningún equipo. Contacta con tu administrador.'
        });
        return;
      }

      console.log('✅ Profesional encontrado en equipo:', professionalData.team.name);
      
      // 2. Intentar login con Firebase Auth
      const loginResult = await authService.signIn(formData.email, formData.password);
      
      if (!loginResult.success) {
        console.log('❌ Error en login:', loginResult.error);
        
        // Si la cuenta no existe, sugerir registro
        if (loginResult.error?.includes('user-not-found') || loginResult.error?.includes('No autorizado')) {
          setErrors({
            general: `Tu cuenta aún no está activada. Por favor registrate primero con este email: ${formData.email}`
          });
        } else {
          setErrors({
            general: loginResult.error || 'Error al iniciar sesión'
          });
        }
        return;
      }

      console.log('✅ Login exitoso, usuario autenticado');

      // 3. Marcar profesional como registrado si es su primer login
      if (!professionalData.professional.hasAccount && loginResult.user) {
        console.log('🎉 Primer login, marcando como registrado...');
        await TeamService.markProfessionalAsRegistered(
          professionalData.team.id,
          formData.email,
          loginResult.user.uid
        );
      }

      // 4. Redirigir al calendario del profesional
      console.log('🚀 Redirigiendo al calendario...');
      navigate('/calendar', { 
        state: { 
          professionalData,
          isTeamMember: true 
        } 
      });

    } catch (error) {
      console.error('💥 Error en login de profesional:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Error inesperado al iniciar sesión'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso de Equipo
          </h1>
          <p className="text-gray-600">
            Inicia sesión para acceder a tu calendario profesional
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email profesional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="tu.email@ejemplo.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-red-800">{errors.general}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <Calendar className="h-5 w-5" />
                  <span>Acceder al Calendario</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
          <div className="text-sm text-gray-600">
            ¿Aún no tienes cuenta? {' '}
            <Link 
              to="/register" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Regístrate aquí
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            ¿Eres administrador? {' '}
            <Link 
              to="/login" 
              className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Login principal
            </Link>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Este acceso es exclusivo para profesionales invitados por su administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLogin;
