import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DesignEditor } from '@/components/design/DesignEditor';

// Mock GrapesJS
vi.mock('grapesjs', () => ({
  default: {
    init: vi.fn(() => ({
      getHtml: vi.fn(() => '<div>Test HTML</div>'),
      getCss: vi.fn(() => '.test { color: red; }'),
      setComponents: vi.fn(),
      setStyle: vi.fn(),
      on: vi.fn(),
      Commands: {
        run: vi.fn(),
        add: vi.fn(),
      },
      BlockManager: {
        add: vi.fn(),
        render: vi.fn(),
      },
      StyleManager: {
        render: vi.fn(),
      },
      LayerManager: {
        render: vi.fn(),
      },
      TraitManager: {
        render: vi.fn(),
      },
    })),
  },
}));

// Mock React GrapesJS
vi.mock('@grapesjs/react', () => ({
  default: ({ children, onEditor }: any) => {
    // Simulate editor initialization
    setTimeout(() => {
      onEditor && onEditor({
        getHtml: () => '<div>Test HTML</div>',
        getCss: () => '.test { color: red; }',
        setComponents: vi.fn(),
        setStyle: vi.fn(),
        Commands: { run: vi.fn(), add: vi.fn() },
        BlockManager: { add: vi.fn(), render: vi.fn() },
        StyleManager: { render: vi.fn() },
        LayerManager: { render: vi.fn() },
        TraitManager: { render: vi.fn() },
      });
    }, 100);
    return <div data-testid="grapes-editor">{children}</div>;
  },
  Canvas: () => <div data-testid="grapes-canvas">Canvas</div>,
  WithEditor: ({ children }: any) => <div data-testid="with-editor">{children}</div>,
}));

const mockCard = {
  id: '1',
  title: 'Test Card',
  type: 'business',
  layout: {
    customHtml: '<div>Existing HTML</div>',
    customCss: '.existing { color: blue; }',
  },
};

const mockProps = {
  card: mockCard,
  onCardUpdate: vi.fn(),
  isOpen: true,
  onClose: vi.fn(),
};

describe('DesignEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<DesignEditor {...mockProps} isOpen={false} />);
    
    expect(screen.queryByTestId('grapes-editor')).not.toBeInTheDocument();
  });

  it('should render editor when isOpen is true', () => {
    render(<DesignEditor {...mockProps} />);
    
    expect(screen.getByTestId('grapes-editor')).toBeInTheDocument();
    expect(screen.getByTestId('grapes-canvas')).toBeInTheDocument();
  });

  it('should display card title in header', () => {
    render(<DesignEditor {...mockProps} />);
    
    expect(screen.getByText('Editor Visual - Test Card')).toBeInTheDocument();
  });

  it('should render device selector buttons', () => {
    render(<DesignEditor {...mockProps} />);
    
    expect(screen.getByText('🖥️ Desktop')).toBeInTheDocument();
    expect(screen.getByText('📱 Tablet')).toBeInTheDocument();
    expect(screen.getByText('📱 Mobile')).toBeInTheDocument();
  });

  it('should render save and exit buttons', () => {
    render(<DesignEditor {...mockProps} />);
    
    expect(screen.getByText('💾 Guardar')).toBeInTheDocument();
    expect(screen.getByText('Salir')).toBeInTheDocument();
  });

  it('should call onClose when exit button is clicked', () => {
    render(<DesignEditor {...mockProps} />);
    
    const exitButton = screen.getByText('Salir');
    fireEvent.click(exitButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should save changes when save button is clicked', async () => {
    render(<DesignEditor {...mockProps} />);
    
    // Wait for editor to initialize
    await waitFor(() => {
      expect(screen.getByTestId('grapes-editor')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('💾 Guardar');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onCardUpdate).toHaveBeenCalledWith({
        layout: {
          ...mockCard.layout,
          customHtml: '<div>Test HTML</div>',
          customCss: '.test { color: red; }',
        },
      });
    });
  });

  it('should show save feedback when save is successful', async () => {
    render(<DesignEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('grapes-editor')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('💾 Guardar');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('✅ Guardado')).toBeInTheDocument();
    });
  });

  it('should render toolbox panels', () => {
    render(<DesignEditor {...mockProps} />);
    
    expect(screen.getByText('🧱 Bloques')).toBeInTheDocument();
    expect(screen.getByText('🎨 Estilos')).toBeInTheDocument();
    expect(screen.getByText('📋 Capas')).toBeInTheDocument();
    expect(screen.getByText('⚙️ Propiedades')).toBeInTheDocument();
  });

  it('should show welcome guide initially', () => {
    render(<DesignEditor {...mockProps} />);
    
    expect(screen.getByText('¡Bienvenido al Editor Visual!')).toBeInTheDocument();
    expect(screen.getByText(/Usa las Plantillas del panel izquierdo/)).toBeInTheDocument();
  });

  it('should hide guide when close button is clicked', () => {
    render(<DesignEditor {...mockProps} />);
    
    const closeGuideButton = screen.getByText('✕');
    fireEvent.click(closeGuideButton);
    
    expect(screen.queryByText('¡Bienvenido al Editor Visual!')).not.toBeInTheDocument();
  });

  it('should render WithEditor components for panel rendering', () => {
    render(<DesignEditor {...mockProps} />);
    
    const withEditorComponents = screen.getAllByTestId('with-editor');
    expect(withEditorComponents.length).toBeGreaterThan(0);
  });

  it('should handle save error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    mockProps.onCardUpdate.mockImplementationOnce(() => {
      throw new Error('Save failed');
    });

    render(<DesignEditor {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('grapes-editor')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('💾 Guardar');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error al guardar los cambios');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should show loading state for blocks container', () => {
    render(<DesignEditor {...mockProps} />);
    
    expect(screen.getByText('Cargando bloques...')).toBeInTheDocument();
  });

  it('should show placeholder text for empty panels', () => {
    render(<DesignEditor {...mockProps} />);
    
    expect(screen.getByText('Selecciona un elemento para editar sus estilos')).toBeInTheDocument();
    expect(screen.getByText('Agrega elementos para ver las capas')).toBeInTheDocument();
    expect(screen.getByText('Selecciona un elemento para ver sus propiedades')).toBeInTheDocument();
  });
});