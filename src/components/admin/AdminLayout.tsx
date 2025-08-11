import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  Palette, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Wand2,
  Eye,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adminAuthService } from '@/services/adminAuth';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: NavItem[] = [
    {
      path: '/admin/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Dashboard',
      description: 'Vista general y analytics'
    },
    {
      path: '/admin/templates',
      icon: <Palette className="w-5 h-5" />,
      label: 'Plantillas',
      description: 'Gestionar plantillas'
    },
    {
      path: '/admin/creator',
      icon: <Wand2 className="w-5 h-5" />,
      label: 'Crear Plantilla',
      description: 'Creador universal de plantillas'
    },
    {
      path: '/admin/preview',
      icon: <Eye className="w-5 h-5" />,
      label: 'Vista Previa',
      description: 'Previsualizar plantillas'
    },
    {
      path: '/admin/sync',
      icon: <RefreshCw className="w-5 h-5" />,
      label: 'Sincronización',
      description: 'Sincronizar plantillas entre sistemas'
    },
    {
      path: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      label: 'Usuarios',
      description: 'Gestión de usuarios'
    },
    {
      path: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analytics',
      description: 'Métricas y reportes'
    },
    {
      path: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
      label: 'Configuración',
      description: 'Ajustes del sistema'
    }
  ];

  const handleLogout = async () => {
    await adminAuthService.logout();
    navigate('/admin/login');
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-gray-950 dark:to-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 admin-glass">
            {/* Sidebar header */}
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-6 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Admin KLYCS</span>
              </div>
              
              <nav className="mt-3 flex-1 px-4 space-y-1">
                {navigationItems.map((item) => {
                  const isActive = isCurrentPath(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`group relative w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors admin-focus ${
                        isActive
                          ? 'admin-pill text-blue-700 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span className={`mr-3 flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'} shadow-sm`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-blue-500/80" />}
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* Sidebar footer */}
            <div className="flex-shrink-0 flex admin-divider p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {adminUser.email || 'Administrador'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 admin-focus rounded-md"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-40">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full admin-glass">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full admin-focus"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow">
                    <Shield className="h-5 w-5" />
                  </div>
                  <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Admin KLYCS</span>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = isCurrentPath(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setSidebarOpen(false);
                        }}
                        className={`group relative w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors admin-focus ${
                          isActive
                            ? 'admin-pill text-blue-700 dark:text-blue-200'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className={`mr-3 flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'} shadow-sm`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-blue-500/80" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 admin-glass flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white admin-focus rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigationItems.find(item => isCurrentPath(item.path))?.label || 'Admin Panel'}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {navigationItems.find(item => isCurrentPath(item.path))?.description || 'Panel de administración'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/admin/creator')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent p-6">
          {children}
        </main>
      </div>
    </div>
  );
};