import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Analytics } from '@/components/analytics/Analytics';

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock analytics service
const mockAnalyticsData = {
  totalViews: 1250,
  totalShares: 84,
  totalClicks: 156,
  conversionRate: 12.5,
  viewsData: [
    { date: '2024-01-01', views: 45 },
    { date: '2024-01-02', views: 52 },
    { date: '2024-01-03', views: 38 },
  ],
  deviceData: [
    { device: 'Mobile', value: 65 },
    { device: 'Desktop', value: 35 },
  ],
  topCards: [
    { id: '1', title: 'Business Card', views: 425 },
    { id: '2', title: 'Portfolio Card', views: 389 },
    { id: '3', title: 'Personal Card', views: 436 },
  ],
};

vi.mock('@/services/analyticsService', () => ({
  getAnalyticsData: vi.fn(() => Promise.resolve(mockAnalyticsData)),
}));

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render analytics dashboard with all sections', async () => {
    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Panel de Analíticas')).toBeInTheDocument();
    });

    // Check main metrics
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Total views
    expect(screen.getByText('84')).toBeInTheDocument(); // Total shares
    expect(screen.getByText('156')).toBeInTheDocument(); // Total clicks
    expect(screen.getByText('12.5%')).toBeInTheDocument(); // Conversion rate

    // Check section titles
    expect(screen.getByText('Vistas por Día')).toBeInTheDocument();
    expect(screen.getByText('Distribución por Dispositivo')).toBeInTheDocument();
    expect(screen.getByText('Tarjetas Más Populares')).toBeInTheDocument();
  });

  it('should render charts correctly', async () => {
    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<Analytics />);

    expect(screen.getByText('Cargando analíticas...')).toBeInTheDocument();
  });

  it('should display top cards with correct data', async () => {
    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Business Card')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Card')).toBeInTheDocument();
      expect(screen.getByText('Personal Card')).toBeInTheDocument();
      
      expect(screen.getByText('425 vistas')).toBeInTheDocument();
      expect(screen.getByText('389 vistas')).toBeInTheDocument();
      expect(screen.getByText('436 vistas')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    const { getAnalyticsData } = await import('@/services/analyticsService');
    (getAnalyticsData as any).mockRejectedValueOnce(new Error('Failed to load analytics'));

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar las analíticas')).toBeInTheDocument();
    });
  });

  it('should display metric cards with correct styling', async () => {
    render(<Analytics />);

    await waitFor(() => {
      const metricCards = screen.getAllByRole('article');
      expect(metricCards).toHaveLength(4);
    });
  });

  it('should format large numbers correctly', async () => {
    const { getAnalyticsData } = await import('@/services/analyticsService');
    (getAnalyticsData as any).mockResolvedValueOnce({
      ...mockAnalyticsData,
      totalViews: 15000,
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });
  });

  it('should show percentage values with correct formatting', async () => {
    render(<Analytics />);

    await waitFor(() => {
      const percentageElements = screen.getAllByText(/\d+\.?\d*%/);
      expect(percentageElements.length).toBeGreaterThan(0);
    });
  });

  it('should render responsive containers for charts', async () => {
    render(<Analytics />);

    await waitFor(() => {
      const responsiveContainers = screen.getAllByTestId('responsive-container');
      expect(responsiveContainers.length).toBeGreaterThan(0);
    });
  });
});