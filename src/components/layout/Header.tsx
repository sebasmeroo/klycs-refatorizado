import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { error } from '@/utils/logger';

export const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      error('Failed to sign out user', err as Error, { component: 'Header', userId: user?.id });
    }
  };

  const isNavLinkActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo Section - Left */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm leading-none">K</span>
            </div>
            <span className="text-lg md:text-xl font-bold text-gray-900 leading-none">Klycs</span>
          </Link>

          {/* Navigation - Center (Hidden on mobile, visible on md+) */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-8 mx-8">
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    isNavLinkActive('/dashboard')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/calendario"
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    isNavLinkActive('/calendario')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Calendario
                </Link>
                <Link
                  to="/mi-tarjeta"
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    isNavLinkActive('/mi-tarjeta')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Mi Tarjeta
                </Link>
              </>
            )}
          </nav>

          {/* User Section - Right */}
          <div className="flex items-center gap-2 md:gap-4">
            {isAuthenticated ? (
              <>
                {/* User Info - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                    {user?.name}
                  </span>
                </div>

                {/* User Actions */}
                <div className="flex items-center gap-1">
                  <Link to="/configuracion">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button variant="primary" size="sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isAuthenticated && (
          <nav className="md:hidden border-t border-gray-200 py-3 space-y-2">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isNavLinkActive('/dashboard')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/calendario"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isNavLinkActive('/calendario')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calendario
            </Link>
            <Link
              to="/mi-tarjeta"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isNavLinkActive('/mi-tarjeta')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Mi Tarjeta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};