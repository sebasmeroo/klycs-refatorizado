import React from 'react';
import { Eye, MousePointer, Calendar, User, Clock } from 'lucide-react';
import { ActivityItem } from '@/hooks/useRealTimeStats';

interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, loading = false }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return Eye;
      case 'click':
        return MousePointer;
      case 'booking':
        return Calendar;
      default:
        return User;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'view':
        return 'from-blue-500 to-cyan-500';
      case 'click':
        return 'from-purple-500 to-pink-500';
      case 'booking':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'view':
        return `${activity.user} vio tu ${activity.item}`;
      case 'click':
        return `${activity.user} hizo clic en ${activity.item}`;
      case 'booking':
        return `${activity.user} creó una reserva para ${activity.item}`;
      default:
        return `${activity.user} interactuó con ${activity.item}`;
    }
  };

  if (loading) {
    return (
      <div className="glass-card-ios p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
          <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-ios p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
        <Clock className="h-4 w-4 text-slate-400" />
      </div>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">No hay actividad reciente</p>
            <p className="text-slate-500 text-xs mt-1">
              Las interacciones con tus tarjetas aparecerán aquí
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="flex items-center space-x-4 group hover:bg-slate-800/50 rounded-lg p-2 -m-2 transition-colors">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    hace {activity.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Ver toda la actividad →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;