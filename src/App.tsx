import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { error as logError } from '@/utils/logger';

// Import debug helpers for development
import '@/utils/debugHelpers';
import '@/utils/findCardId';
import '@/utils/quickFix';
import '@/utils/templateFinder';
import '@/utils/forcePreview';
import '@/utils/fixTemplateCode';
import '@/utils/createSafeTemplate';
import '@/utils/adminDebug';
import '@/utils/fixFirestoreRules';
import '@/utils/autoFix';
import '@/utils/testIndividualLinkTemplates';
import '@/utils/debugLinkTemplates';
import '@/utils/testLinkTemplateFlow';
import '@/utils/linkTemplatesSummary';
import '@/utils/linkTemplatesFix';

// Migration script
import { fixProfessionalCalendars } from '@/utils/fixProfessionalCalendars';

// Image diagnostics
import '@/utils/diagnoseImages';

// Lazy load pages for better performance with error handling
const Home = React.lazy(() => 
  import('@/pages/Home')
    .then(module => ({ default: module.Home }))
    .catch(err => {
      logError('Failed to load Home component', err, { component: 'App' });
      return { default: () => <div>Error loading Home page</div> };
    })
);

const Login = React.lazy(() => 
  import('@/pages/Login')
    .then(module => ({ default: module.Login }))
    .catch(err => {
      logError('Failed to load Login component', err, { component: 'App' });
      return { default: () => <div>Error loading Login page</div> };
    })
);

const Register = React.lazy(() => 
  import('@/pages/Register')
    .then(module => ({ default: module.Register }))
    .catch(err => {
      logError('Failed to load Register component', err, { component: 'App' });
      return { default: () => <div>Error loading Register page</div> };
    })
);

const DashboardHome = React.lazy(() => 
  import('@/pages/DashboardHome')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load DashboardHome component', err, { component: 'App' });
      return { default: () => <div>Error loading Dashboard Home</div> };
    })
);



const DashboardBookings = React.lazy(() => 
  import('@/pages/DashboardBookings')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load DashboardBookings component', err, { component: 'App' });
      return { default: () => <div>Error loading Dashboard Bookings</div> };
    })
);

const DashboardStripe = React.lazy(() => 
  import('@/pages/DashboardStripe')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load DashboardStripe component', err, { component: 'App' });
      return { default: () => <div>Error loading Dashboard Stripe</div> };
    })
);

const DashboardProfile = React.lazy(() => 
  import('@/pages/DashboardProfile')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load DashboardProfile component', err, { component: 'App' });
      return { default: () => <div>Error loading Dashboard Profile</div> };
    })
);

const DashboardTeam = React.lazy(() => 
  import('@/pages/DashboardTeam')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load DashboardTeam component', err, { component: 'App' });
      return { default: () => <div>Error loading Dashboard Team</div> };
    })
);

const TeamLogin = React.lazy(() => 
  import('@/pages/TeamLogin')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load TeamLogin component', err, { component: 'App' });
      return { default: () => <div>Error loading Team Login</div> };
    })
);

const CalendarView = React.lazy(() => 
  import('@/pages/DashboardBookings')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load CalendarView component', err, { component: 'App' });
      return { default: () => <div>Error loading Calendar View</div> };
    })
);

const DashboardSettings = React.lazy(() => 
  import('@/pages/DashboardSettings')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load DashboardSettings component', err, { component: 'App' });
      return { default: () => <div>Error loading Dashboard Settings</div> };
    })
);

const DashboardCards = React.lazy(() =>
  import('@/pages/DashboardCards')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load DashboardCards component', err, { component: 'App' });
      return { default: () => <div>Error loading Dashboard Cards</div> };
    })
);

const DashboardWorkHours = React.lazy(() =>
  import('@/pages/DashboardWorkHours')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load DashboardWorkHours component', err, { component: 'App' });
      return { default: () => <div>Error loading Dashboard Work Hours</div> };
    })
);

const PublicCard = React.lazy(() => 
  import('@/pages/PublicCard')
    .then(module => ({ default: module.PublicCard }))
    .catch(err => {
      logError('Failed to load PublicCard component', err, { component: 'App' });
      return { default: () => <div>Error loading Public Card</div> };
    })
);

const CardEditorPage = React.lazy(() => 
  import('@/pages/CardEditorPage')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load CardEditorPage component', err, { component: 'App' });
      return { default: () => <div>Error loading Card Editor</div> };
    })
);

const Calendar = React.lazy(() => 
  import('@/pages/Calendar')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load Calendar component', err, { component: 'App' });
      return { default: () => <div>Error loading Calendar page</div> };
    })
);

const Services = React.lazy(() => 
  import('@/pages/Services')
    .then(module => ({ default: module.Services }))
    .catch(err => {
      logError('Failed to load Services component', err, { component: 'App' });
      return { default: () => <div>Error loading Services page</div> };
    })
);

const Product = React.lazy(() => 
  import('@/pages/Product')
    .then(module => ({ default: module.Product }))
    .catch(err => {
      logError('Failed to load Product component', err, { component: 'App' });
      return { default: () => <div>Error loading Product page</div> };
    })
);

const Pricing = React.lazy(() => 
  import('@/pages/Pricing')
    .then(module => ({ default: module.Pricing }))
    .catch(err => {
      logError('Failed to load Pricing component', err, { component: 'App' });
      return { default: () => <div>Error loading Pricing page</div> };
    })
);

const Help = React.lazy(() => 
  import('@/pages/Help')
    .then(module => ({ default: module.Help }))
    .catch(err => {
      logError('Failed to load Help component', err, { component: 'App' });
      return { default: () => <div>Error loading Help page</div> };
    })
);

// Admin pages
const AdminLogin = React.lazy(() => 
  import('@/pages/AdminLogin')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminLogin component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Login</div> };
    })
);

const AdminDashboard = React.lazy(() => 
  import('@/pages/AdminDashboard')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminDashboard component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Dashboard</div> };
    })
);

const AdminTemplates = React.lazy(() => 
  import('@/pages/AdminTemplates')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminTemplates component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Templates</div> };
    })
);

const AdminTemplateCreator = React.lazy(() => 
  import('@/pages/AdminTemplateCreator')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminTemplateCreator component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Template Creator</div> };
    })
);

const AdminPreview = React.lazy(() => 
  import('@/pages/AdminPreview')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminPreview component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Preview</div> };
    })
);

const AdminUsers = React.lazy(() => 
  import('@/pages/AdminUsers')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminUsers component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Users</div> };
    })
);

const AdminAnalytics = React.lazy(() => 
  import('@/pages/AdminAnalytics')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminAnalytics component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Analytics</div> };
    })
);

const AdminSettings = React.lazy(() =>
  import('@/pages/AdminSettings')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminSettings component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Settings</div> };
    })
);

const AdminSubscriptions = React.lazy(() =>
  import('@/pages/AdminSubscriptions')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminSubscriptions component', err, { component: 'App' });
      return { default: () => <div>Error loading Admin Subscriptions</div> };
    })
);

const ProfessionalCalendar = React.lazy(() => 
  import('@/pages/ProfessionalCalendar')
    .then(module => ({ default: module.ProfessionalCalendar }))
    .catch(err => {
      logError('Failed to load ProfessionalCalendar component', err, { component: 'App' });
      return { default: () => <div>Error loading Professional Calendar</div> };
    })
);

const AdminTemplateSync = React.lazy(() => 
  import('@/pages/AdminTemplateSync')
    .then(module => ({ default: module.default }))
    .catch(err => {
      logError('Failed to load AdminTemplateSync component', err, { component: 'App' });
      return { default: () => <div>Error loading Template Sync</div> };
    })
);



// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdminAuthenticated = localStorage.getItem('adminAuth') === 'true';
  return isAdminAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
};

const AdminPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdminAuthenticated = localStorage.getItem('adminAuth') === 'true';
  return !isAdminAuthenticated ? <>{children}</> : <Navigate to="/admin/dashboard" />;
};



const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e293b' }}>
      <div className="text-center max-w-md mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Página no encontrada</h2>
        <p className="text-white/60 mb-6">La URL que intentas acceder no existe</p>
        <div className="space-y-2">
          <button 
            onClick={() => window.location.href = '/'} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Ir al inicio
          </button>
          <button 
            onClick={() => window.history.back()} 
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  // Ejecutar migración de calendarios profesionales solo una vez
  React.useEffect(() => {
    const migrationKey = 'professional_calendars_migration_v1';
    const hasRun = localStorage.getItem(migrationKey);
    
    if (!hasRun) {
      console.log('🔧 Ejecutando migración de calendarios profesionales...');
      fixProfessionalCalendars()
        .then(result => {
          console.log('✅ Migración completada:', result);
          localStorage.setItem(migrationKey, 'true');
        })
        .catch(error => {
          console.error('❌ Error en la migración:', error);
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Layout variant="auto"><Home /></Layout>} />
        
        {/* Public Pages */}
        <Route path="/product" element={<Layout variant="auto"><Product /></Layout>} />
        <Route path="/services" element={<Layout variant="auto"><Services /></Layout>} />
        <Route path="/pricing" element={<Layout variant="auto"><Pricing /></Layout>} />
        <Route path="/help" element={<Layout variant="auto"><Help /></Layout>} />
        
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Team Login Route */}
        <Route 
          path="/team/login" 
          element={
            <PublicRoute>
              <TeamLogin />
            </PublicRoute>
          } 
        />

        {/* Professional Calendar Access Route */}
        <Route 
          path="/calendar/professional/:calendarId" 
          element={<ProfessionalCalendar />} 
        />

        {/* Professional Calendar Route */}
        <Route 
          path="/calendar" 
          element={
            <ProtectedRoute>
              <CalendarView />
            </ProtectedRoute>
          } 
        />
        
        {/* Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardHome />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Ruta de edición eliminada */}
        <Route 
          path="/dashboard/bookings" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardBookings />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/stripe" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardStripe />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/profile" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardProfile />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/team" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardTeam />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/settings" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardSettings />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/dashboard/tarjetas"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardCards />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/horas"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardWorkHours />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Card Editor Route - Standalone page */}
        <Route 
          path="/tarjeta/edit/:slug" 
          element={
            <ProtectedRoute>
              <CardEditorPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Legacy Routes */}
        {/* Ruta legacy de edición eliminada */}
        <Route 
          path="/calendario" 
          element={
            <ProtectedRoute>
              <Layout>
                <Calendar />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/servicios" 
          element={
            <ProtectedRoute>
              <Layout>
                <Services />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Public Card Route */}
        <Route path="/c/:slug" element={<PublicCard />} />

        {/* Admin Routes */}
        <Route 
          path="/admin/login" 
          element={
            <AdminPublicRoute>
              <AdminLogin />
            </AdminPublicRoute>
          } 
        />
        
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/templates" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminTemplates />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/creator" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminTemplateCreator />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/preview" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminPreview />
              </AdminLayout>
            </AdminRoute>
          } 
        />

        <Route 
          path="/admin/sync" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminTemplateSync />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/analytics" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminAnalytics />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/subscriptions"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSubscriptions />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

          {/* Catch-all route for 404s */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
