import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { validateRegisterForm, sanitizeEmail, sanitizeString, type RegisterFormData } from '@/utils/validation';
import { info, error as logError } from '@/utils/logger';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Sanitize and validate form data
    const formData: RegisterFormData = {
      name: sanitizeString(name),
      email: sanitizeEmail(email),
      password: password.trim(),
      confirmPassword: confirmPassword.trim()
    };

    const validation = validateRegisterForm(formData);
    
    if (!validation.success) {
      setFieldErrors(validation.errors || {});
      setLoading(false);
      return;
    }

    try {
      const result = await authService.signUp(formData.email, formData.password, formData.name);
      
      if (result.success) {
        info('Registration successful', { component: 'register', email: formData.email });
        navigate('/dashboard');
      } else {
        setError(result.error || 'Error al crear la cuenta');
      }
    } catch (error: any) {
      logError('Registration failed', error, { component: 'register', email: formData.email });
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fadeInUp">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-3 mb-8">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-3xl font-bold text-white">Klycs</span>
          </Link>
          <h2 className="text-4xl font-bold text-white mb-2">
            Crear cuenta
          </h2>
          <p className="text-slate-300">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-200 text-sm font-medium mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  // Clear field error on change
                  if (fieldErrors.name) {
                    setFieldErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                required
                placeholder="Tu nombre"
                className={`input w-full ${fieldErrors.name ? 'border-red-500 bg-red-500/10' : ''}`}
              />
              {fieldErrors.name && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-200 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear field error on change
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                required
                placeholder="tu@email.com"
                className={`input w-full ${fieldErrors.email ? 'border-red-500 bg-red-500/10' : ''}`}
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-200 text-sm font-medium mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Clear field error on change
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                required
                placeholder="Al menos 6 caracteres"
                className={`input w-full ${fieldErrors.password ? 'border-red-500 bg-red-500/10' : ''}`}
              />
              {fieldErrors.password && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-200 text-sm font-medium mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  // Clear field error on change
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                required
                placeholder="Repite tu contraseña"
                className={`input w-full ${fieldErrors.confirmPassword ? 'border-red-500 bg-red-500/10' : ''}`}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Al crear una cuenta, aceptas nuestros{' '}
              <Link to="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                términos de servicio
              </Link>{' '}
              y{' '}
              <Link to="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                política de privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};