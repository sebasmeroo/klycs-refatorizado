import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminAuthService } from '@/services/adminAuth';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await adminAuthService.login(email.trim(), password.trim());
      if (!result.success) {
        setError(result.error || 'No se pudo iniciar sesión');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Error de conexión. Inténtalo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await adminAuthService.register(email.trim(), password.trim(), name.trim() || 'Administrador');
      if (!result.success) {
        setError(result.error || 'No se pudo registrar');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Error de conexión. Inténtalo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin KLYCS</h1>
          <p className="text-slate-300">Panel de administración de plantillas</p>
        </div>

        {/* Login / Register Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm ${mode==='login' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70'} transition-colors`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm ${mode==='register' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70'} transition-colors`}
            >
              Registrar admin
            </button>
          </div>

          <form onSubmit={mode==='login' ? handleLogin : handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {mode==='register' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del administrador"
                  required
                  className="bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/30"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email de administrador
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@klycs.com"
                required
                className="bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/30 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password || (mode==='register' && !name)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium rounded-xl transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode==='login' ? 'Iniciando sesión...' : 'Registrando...'}
                </div>
              ) : (
                (mode==='login' ? 'Iniciar Sesión' : 'Registrar')
              )}
            </Button>
          </form>

          {/* Nota temporal */}
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-100 text-xs">
            Este registro de admins es temporal para bootstrap. Luego se deshabilitará y solo quedará el login.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;