import React from 'react';
import { Eye, MousePointer, TrendingUp, ExternalLink } from 'lucide-react';
import { CardPerformance } from '@/hooks/useRealTimeStats';
import { Link } from 'react-router-dom';

interface TopCardsProps {
  cards: CardPerformance[];
  loading?: boolean;
}

const TopCards: React.FC<TopCardsProps> = ({ cards, loading = false }) => {
  if (loading) {
    return (
      <div className="glass-card-ios p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Rendimiento de Tarjetas</h3>
          <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded animate-pulse w-1/2"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-16"></div>
                <div className="h-3 bg-gray-300 rounded animate-pulse w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getConversionColor = (rate: number) => {
    if (rate >= 20) return 'text-green-400';
    if (rate >= 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConversionBadge = (rate: number) => {
    if (rate >= 20) return 'Excelente';
    if (rate >= 10) return 'Bueno';
    if (rate >= 5) return 'Regular';
    return 'Bajo';
  };

  return (
    <div className="glass-card-ios p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Rendimiento de Tarjetas</h3>
        <TrendingUp className="h-4 w-4 text-slate-400" />
      </div>
      
      <div className="space-y-4">
        {cards.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">No hay datos de rendimiento</p>
            <p className="text-slate-500 text-xs mt-1">
              Crea tu primera tarjeta para ver estadísticas
            </p>
            <Link 
              to="/dashboard/cards" 
              className="inline-flex items-center space-x-2 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              <span>Crear tarjeta</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          cards.map((card, index) => (
            <div 
              key={card.id} 
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate group-hover:text-blue-300 transition-colors">
                    {card.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-slate-400 text-sm">
                      <Eye className="h-3 w-3" />
                      <span>{card.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400 text-sm">
                      <MousePointer className="h-3 w-3" />
                      <span>{card.clicks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-bold ${getConversionColor(card.conversionRate)}`}>
                  {card.conversionRate}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {getConversionBadge(card.conversionRate)}
                </div>
              </div>
              
              <Link 
                to={`/dashboard/cards`}
                className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="h-4 w-4 text-slate-400 hover:text-white" />
              </Link>
            </div>
          ))
        )}
      </div>
      
      {cards.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <Link 
            to="/dashboard/cards" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Ver todas las tarjetas →
          </Link>
        </div>
      )}
    </div>
  );
};

export default TopCards;