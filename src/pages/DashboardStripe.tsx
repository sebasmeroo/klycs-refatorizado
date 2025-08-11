import React, { useState } from 'react';
import '@/styles/ios-dashboard.css';
// import { useAuth } from '@/hooks/useAuth';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Settings,
  Plus,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Wallet,
  BarChart3
} from 'lucide-react';

const DashboardStripe: React.FC = () => {
  // const { firebaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'products' | 'settings'>('overview');
  
  // Mock data - replace with actual Stripe data
  const stripeData = {
    account: {
      isConnected: true,
      accountId: 'acct_1234567890',
      country: 'ES',
      currency: 'EUR',
      payoutsEnabled: true,
      chargesEnabled: true
    },
    balance: {
      available: 2847.50,
      pending: 156.30
    },
    recentTransactions: [
      {
        id: 'txn_1',
        type: 'payment',
        amount: 150.00,
        currency: 'EUR',
        status: 'succeeded',
        customer: 'María García',
        description: 'Consulta Premium',
        date: new Date('2024-01-24'),
        fee: 4.65
      },
      {
        id: 'txn_2',
        type: 'payment',
        amount: 80.00,
        currency: 'EUR',
        status: 'succeeded',
        customer: 'Carlos López',
        description: 'Sesión Básica',
        date: new Date('2024-01-23'),
        fee: 2.62
      },
      {
        id: 'txn_3',
        type: 'refund',
        amount: -50.00,
        currency: 'EUR',
        status: 'succeeded',
        customer: 'Ana Rodríguez',
        description: 'Reembolso - Consulta Express',
        date: new Date('2024-01-22'),
        fee: 0
      }
    ],
    products: [
      {
        id: 'prod_1',
        name: 'Consulta Premium',
        price: 150.00,
        currency: 'EUR',
        active: true,
        sales: 12,
        revenue: 1800.00
      },
      {
        id: 'prod_2',
        name: 'Sesión Básica',
        price: 80.00,
        currency: 'EUR',
        active: true,
        sales: 25,
        revenue: 2000.00
      },
      {
        id: 'prod_3',
        name: 'Consulta Express',
        price: 50.00,
        currency: 'EUR',
        active: false,
        sales: 8,
        revenue: 400.00
      }
    ]
  };

  const stats = [
    {
      title: 'Saldo Disponible',
      value: `€${stripeData.balance.available.toFixed(2)}`,
      change: '+12.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Saldo Pendiente',
      value: `€${stripeData.balance.pending.toFixed(2)}`,
      change: '+5.7%',
      trend: 'up',
      icon: RefreshCw,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Ingresos del Mes',
      value: '€4,200',
      change: '+18.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Transacciones',
      value: '47',
      change: '+8.1%',
      trend: 'up',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return <CheckCircle size={16} className="text-green-400" />;
      case 'pending': return <AlertCircle size={16} className="text-yellow-400" />;
      case 'failed': return <XCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'transactions', label: 'Transacciones', icon: CreditCard },
    { id: 'products', label: 'Productos', icon: DollarSign },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* iOS Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={stat.title} 
            className="ios-stat-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="ios-stat-label">{stat.title}</p>
                <p className="ios-stat-value">{stat.value}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {stat.trend === 'up' ? (
                    <TrendingUp size={12} className="text-green-600" />
                  ) : (
                    <TrendingDown size={12} className="text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`ios-stat-icon bg-gradient-to-br ${stat.color}`}>
                <stat.icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* iOS Recent Transactions */}
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="ios-section-title">Transacciones Recientes</h3>
            <button className="ios-link-button">Ver todas</button>
          </div>
          <div className="space-y-3">
            {stripeData.recentTransactions.slice(0, 5).map((transaction, index) => (
              <div key={transaction.id} className="ios-booking-item">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="ios-booking-avatar bg-gradient-to-r from-purple-500 to-blue-500">
                      <CreditCard size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="ios-booking-name">{transaction.customer}</p>
                      <p className="ios-booking-time">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {transaction.amount > 0 ? '+' : ''}€{Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`ios-status-badge ios-status-${transaction.status === 'succeeded' ? 'confirmed' : transaction.status}`}>
                        {getStatusIcon(transaction.status)}
                      </span>
                      <span className="text-gray-500 text-xs">{transaction.date.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TransactionsTab = () => (
    <div className="space-y-6">
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="ios-section-title">Todas las Transacciones</h3>
            <div className="flex items-center space-x-2">
              <button className="ios-link-button">
                <Download size={16} className="mr-2" />
                Exportar
              </button>
              <button className="ios-link-button">
                <RefreshCw size={16} className="mr-2" />
                Actualizar
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {stripeData.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="ios-booking-item">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="ios-booking-avatar bg-gradient-to-r from-purple-500 to-blue-500">
                      <CreditCard size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="ios-booking-name">{transaction.customer}</p>
                      <p className="ios-booking-time">{transaction.description}</p>
                      <p className="text-gray-400 text-xs">ID: {transaction.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {transaction.amount > 0 ? '+' : ''}€{Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-sm">Comisión: €{transaction.fee.toFixed(2)}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`ios-status-badge ios-status-${transaction.status === 'succeeded' ? 'confirmed' : transaction.status}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1 capitalize">{transaction.status}</span>
                      </span>
                      <span className="text-gray-400 text-xs">{transaction.date.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ProductsTab = () => (
    <div className="space-y-6">
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="ios-section-title">Productos y Servicios</h3>
            <button className="ios-cta-button">
              <Plus size={16} className="mr-2" />
              Nuevo Producto
            </button>
          </div>
          <div className="space-y-3">
            {stripeData.products.map((product) => (
              <div key={product.id} className="ios-booking-item">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="ios-booking-avatar bg-gradient-to-r from-blue-500 to-purple-500">
                      <DollarSign size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="ios-booking-name">{product.name}</p>
                      <p className="ios-booking-time">€{product.price.toFixed(2)} {product.currency.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="ios-stat-value text-sm">{product.sales}</p>
                      <p className="ios-stat-label text-xs">Ventas</p>
                    </div>
                    <div className="text-center">
                      <p className="ios-stat-value text-sm">€{product.revenue.toFixed(2)}</p>
                      <p className="ios-stat-label text-xs">Ingresos</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${product.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-gray-500 text-sm">{product.active ? 'Activo' : 'Inactivo'}</span>
                    </div>
                    <button className="ios-icon-button">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="ios-section-title">Configuración de Stripe</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 text-sm font-medium">Conectado</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="ios-booking-card">
              <div className="p-4">
                <h4 className="ios-booking-name mb-4">Información de la Cuenta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="ios-info-row">
                    <span className="ios-info-label">ID de Cuenta</span>
                    <span className="ios-info-value">{stripeData.account.accountId}</span>
                  </div>
                  <div className="ios-info-row">
                    <span className="ios-info-label">País</span>
                    <span className="ios-info-value">{stripeData.account.country}</span>
                  </div>
                  <div className="ios-info-row">
                    <span className="ios-info-label">Moneda</span>
                    <span className="ios-info-value">{stripeData.account.currency.toUpperCase()}</span>
                  </div>
                  <div className="ios-info-row">
                    <span className="ios-info-label">Estado</span>
                    <span className="text-green-600 font-semibold">Verificado</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ios-booking-card">
              <div className="p-4">
                <h4 className="ios-booking-name mb-4">Capacidades</h4>
                <div className="space-y-3">
                  <div className="ios-info-row">
                    <span className="ios-info-label">Recibir Pagos</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-green-600 text-sm font-medium">Habilitado</span>
                    </div>
                  </div>
                  <div className="ios-info-row">
                    <span className="ios-info-label">Transferencias</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-green-600 text-sm font-medium">Habilitado</span>
                    </div>
                  </div>
                  <div className="ios-info-row">
                    <span className="ios-info-label">Reembolsos</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-green-600 text-sm font-medium">Habilitado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ios-booking-card">
              <div className="p-4">
                <h4 className="ios-booking-name mb-4">Configuración de Pagos</h4>
                <div className="space-y-4">
                  <div className="ios-info-row">
                    <div>
                      <p className="ios-info-value">Webhooks</p>
                      <p className="ios-info-label">Configurar eventos automáticos</p>
                    </div>
                    <button className="ios-link-button">Configurar</button>
                  </div>
                  <div className="ios-info-row">
                    <div>
                      <p className="ios-info-value">Métodos de Pago</p>
                      <p className="ios-info-label">Tarjetas, transferencias, etc.</p>
                    </div>
                    <button className="ios-link-button">Gestionar</button>
                  </div>
                  <div className="ios-info-row">
                    <div>
                      <p className="ios-info-value">Facturas</p>
                      <p className="ios-info-label">Configurar facturación automática</p>
                    </div>
                    <button className="ios-link-button">Configurar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'transactions': return <TransactionsTab />;
      case 'products': return <ProductsTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* iOS Header */}
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="ios-feature-icon bg-gradient-to-br from-green-500 to-green-600">
                <Wallet size={24} className="text-white" />
              </div>
              <div>
                <h1 className="ios-page-title">Pagos y Facturación</h1>
                <p className="ios-page-subtitle">Gestiona tus ingresos con Stripe</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-600 text-sm font-medium">Cuenta Conectada</span>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Tabs */}
      <div className="glass-card-ios">
        <div className="p-6">
          <div className="flex items-center space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`ios-tab-button ${
                  activeTab === tab.id ? 'ios-tab-active' : 'ios-tab-inactive'
                }`}
              >
                <tab.icon size={16} />
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default DashboardStripe;