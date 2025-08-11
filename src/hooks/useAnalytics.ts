import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/services/analytics';
import { useAuth } from '@/hooks/useAuth';

export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Track page views
  useEffect(() => {
    analyticsService.trackPageView(location.pathname, user?.id);
  }, [location.pathname, user?.id]);

  return {
    trackCardView: (cardId: string) => analyticsService.trackCardView(cardId, user?.id),
    trackLinkClick: (linkUrl: string, cardId?: string) => analyticsService.trackLinkClick(linkUrl, cardId, user?.id),
    trackContactClick: (contactType: string, cardId?: string) => analyticsService.trackContactClick(contactType, cardId, user?.id),
    trackBookingCreated: (bookingId: string, cardId?: string) => analyticsService.trackBookingCreated(bookingId, cardId, user?.id),
    getAnalytics: analyticsService.getAnalytics.bind(analyticsService),
    getMetrics: analyticsService.getMetrics.bind(analyticsService)
  };
};