import React, { useEffect, useMemo, useState } from 'react';
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
  Users,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PaymentFailedBanner } from '@/components/subscription/PaymentFailedBanner';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const shouldExpandForPath = (pathname: string): boolean => (
  pathname === '/dashboard' ||
  pathname.startsWith('/dashboard/settings') ||
  pathname.startsWith('/dashboard/profile') ||
  pathname.startsWith('/dashboard/tarjetas') ||
  pathname.startsWith('/dashboard/horas')
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => !shouldExpandForPath(location.pathname));
  const { user } = useAuth();
  const navigate = useNavigate();
  const { planName, isLoading: planLoading } = useSubscriptionStatus();

  const normalizedPlan = (planName || 'FREE').toUpperCase();
  const isFreePlan = normalizedPlan === 'FREE';

  const baseMenuItems = [
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
      icon: Clock,
      label: 'Horas Trabajadas',
      path: '/dashboard/horas',
      active: location.pathname.startsWith('/dashboard/horas'),
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: Wallet,
      label: 'Pagos',
      path: '/dashboard/pagos',
      active: location.pathname.startsWith('/dashboard/pagos'),
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
      icon: Settings,
      label: 'Configuración',
      path: '/dashboard/settings',
      active: location.pathname.startsWith('/dashboard/settings'),
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const menuItems = useMemo(() => {
    if (planLoading) {
      return baseMenuItems;
    }

    if (isFreePlan) {
      return baseMenuItems.filter(item => {
        const restrictedPaths = ['/dashboard/bookings', '/dashboard/horas', '/dashboard/pagos'];
        return !restrictedPaths.includes(item.path);
      });
    }

    return baseMenuItems;
  }, [baseMenuItems, isFreePlan, planLoading]);

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

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const sidebarClasses = [
    'fixed top-0 left-0 h-full ios-sidebar z-50 transform transition-[transform,width] duration-400 ease-out',
    isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    'lg:translate-x-0',
    isSidebarCollapsed ? 'ios-sidebar--collapsed' : ''
  ].join(' ');

  const contentOffsetClass = isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-64';

  useEffect(() => {
    const shouldExpand = shouldExpandForPath(location.pathname);
    setIsSidebarCollapsed(prev => {
      const next = !shouldExpand;
      return prev === next ? prev : next;
    });
  }, [location.pathname]);

  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex" style={{ background: '#ffffff' }}>

      {/* iOS Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden ios-overlay"
          onClick={toggleSidebar}
        />
      )}

      {/* iOS Native Sidebar - Compact */}
      <div className={sidebarClasses}>
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
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebarCollapsed}
                className="hidden lg:flex ios-collapse-toggle"
                aria-label={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight size={18} className="text-gray-500" />
                ) : (
                  <ChevronLeft size={18} className="text-gray-500" />
                )}
              </button>
              <button
                onClick={toggleSidebar}
                className="lg:hidden ios-close-sidebar"
              >
                <X size={18} className="text-gray-500" />
              </button>
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
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  data-label={item.label}
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
      <div className={`${contentOffsetClass} flex-1 relative z-10 transition-all duration-300 flex flex-col min-h-screen overflow-hidden`}>        
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

        <main className="flex-1 overflow-y-auto">
          <div>
            <PaymentFailedBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
