import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { error } from '@/utils/logger';
import '@/styles/ios-dashboard.css';
import {
  Calendar,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Sparkles,
  Home,
  Wallet,
  Link as LinkIcon,
  Users
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: Home,
      label: 'Inicio',
      path: '/dashboard',
      active: location.pathname === '/dashboard',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: LinkIcon,
      label: 'Tarjetas',
      path: '/dashboard/tarjetas',
      active: location.pathname.startsWith('/dashboard/tarjetas'),
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Calendar,
      label: 'Calendario',
      path: '/dashboard/bookings',
      active: location.pathname.startsWith('/dashboard/bookings'),
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Wallet,
      label: 'Pagos',
      path: '/dashboard/stripe',
      active: location.pathname.startsWith('/dashboard/stripe'),
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: User,
      label: 'Perfil',
      path: '/dashboard/profile',
      active: location.pathname.startsWith('/dashboard/profile'),
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: Users,
      label: 'Equipo',
      path: '/dashboard/team',
      active: location.pathname.startsWith('/dashboard/team'),
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: Settings,
      label: 'Configuración',
      path: '/dashboard/settings',
      active: location.pathname.startsWith('/dashboard/settings'),
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      error('Failed to sign out user', err as Error, { component: 'DashboardLayout', userId: user?.id });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#ffffff' }}>

      {/* iOS Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden ios-overlay"
          onClick={toggleSidebar}
        />
      )}

      {/* iOS Native Sidebar - Compact */}
      <div className={`
        fixed top-0 left-0 h-full w-64 ios-sidebar z-50 transform transition-transform duration-400 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Sidebar Header - Compact */}
        <div className="ios-sidebar-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="ios-app-icon w-8 h-8">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h1 className="ios-app-title text-lg">Klycs</h1>
                <p className="ios-app-subtitle text-xs">Business Cards</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden ios-close-sidebar"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* iOS User Profile - Compact */}
        <div className="ios-user-profile py-3">
          <div className="flex items-center space-x-2">
            <div className="ios-user-avatar w-8 h-8">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="ios-user-name text-sm truncate">{user?.name || 'Usuario'}</h3>
              <p className="ios-user-email text-xs truncate">{user?.email}</p>
            </div>
            <div className="ios-profile-badge">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* iOS Navigation - Compact */}
        <nav className="ios-navigation">
          <div className="space-y-0.5">
            {menuItems.map((item) => (
              <div key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={`ios-nav-item py-2.5 ${
                    item.active ? 'ios-nav-active' : 'ios-nav-inactive'
                  }`}
                >
                  <div className={`ios-nav-icon w-7 h-7 bg-gradient-to-br ${item.color}`}>
                    <item.icon size={16} className="text-white" />
                  </div>
                  <span className="ios-nav-label text-sm">{item.label}</span>
                  {item.active && <div className="ios-nav-indicator"></div>}
                </button>
              </div>
            ))}
          </div>
        </nav>

        {/* iOS Logout Button */}
        <div className="ios-sidebar-footer">
          <button
            onClick={handleLogout}
            className="ios-logout-button"
          >
            <div className="ios-logout-icon">
              <LogOut size={18} className="text-red-500" />
            </div>
            <span className="ios-logout-label">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* iOS Main Content */}
      <div className="lg:ml-64 relative z-10">
        {/* iOS Mobile Header */}
        <div className="lg:hidden ios-mobile-header">
          <button
            onClick={toggleSidebar}
            className="ios-menu-button"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <h1 className="ios-page-title">Klycs</h1>
          <div className="ios-header-actions">
            <button className="ios-icon-button">
              <Bell size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        <main className="ios-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;