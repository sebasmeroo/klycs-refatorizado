import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { error } from '@/utils/logger';

export const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      error('Failed to sign out user', err as Error, { component: 'Header', userId: user?.id });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Klycs</span>
          </Link>

          <nav className="hidden md:flex space-x-8">
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/reservas"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/reservas'
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Reservas
                </Link>
                <Link
                  to="/mi-tarjeta"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/mi-tarjeta'
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Mi Tarjeta
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.name}
                  </span>
                </div>
                <Link to="/configuracion">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};