import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  color: string;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  loading = false
}) => {
  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  if (loading) {
    return (
      <div className="glass-card-ios p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
            <div className="h-8 bg-gray-300 rounded animate-pulse w-16"></div>
          </div>
          <div className="h-12 w-12 bg-gray-300 rounded-xl animate-pulse"></div>
        </div>
        <div className="mt-4 h-4 bg-gray-300 rounded animate-pulse w-20"></div>
      </div>
    );
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (title.toLowerCase().includes('ingresos') || title.toLowerCase().includes('revenue')) {
        return `€${val.toLocaleString()}`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className="glass-card-ios p-6 hover:scale-105 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">
            {formatValue(value)}
          </p>
        </div>
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center space-x-2">
        <TrendIcon 
          className={`h-4 w-4 ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`} 
        />
        <span 
          className={`text-sm font-medium ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
        <span className="text-sm text-slate-400">vs mes anterior</span>
      </div>
    </div>
  );
};

export default StatsCard;