import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Smartphone,
  Monitor,
  Settings,
  FileText,
  Code,
  Palette,
  Eye,
  Play,
  Square,
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { templateDistributionService, AdminTemplate } from '@/services/templateDistribution';
import { compileTemplateToArtifact } from '@/services/templateCompiler';
import TemplateSandbox from '@/components/templates/TemplateSandbox';
import DirectTemplateRenderer from '@/components/templates/DirectTemplateRenderer';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { autoFixAdminPermissions } from '@/utils/adminSetup';

interface Section {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'image' | 'color' | 'textarea' | 'select' | 'number';
  defaultValue: string;
  options?: string[];
  editable: boolean;
}

interface TemplateData {
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  reactCode: string;
  cssCode: string;
  jsonConfig: TemplateField[];
  previewType: 'mobile' | 'desktop';
  targetSection: 'profile' | 'links' | 'social' | 'services' | 'booking' | 'portfolio' | 'elements' | 'design';
}

const sections: Section[] = [
  {
    key: 'basic',
    label: 'Información Básica',
    icon: <FileText className="w-4 h-4" />,
    description: 'Nombre, descripción y categoría'
  },
  {
    key: 'react',
    label: 'Componente React',
    icon: <Code className="w-4 h-4" />,
    description: 'Código JSX con estilos inline'
  },
  {
    key: 'config',
    label: 'Configuración JSON',
    icon: <Settings className="w-4 h-4" />,
    description: 'Campos editables por usuarios'
  }
];

const defaultReactCode = `export const Template = ({ data }) => {
  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: data.backgroundColor || '#667eea',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: data.titleColor || '#ffffff'
        }}>
          {data.title || 'Mi Título'}
        </h1>
        <p style={{
          fontSize: '1rem',
          opacity: 0.9,
          margin: 0,
          color: data.subtitleColor || '#ffffff'
        }}>
          {data.subtitle || 'Mi Subtítulo'}
        </p>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#f1f5f9',
          borderRadius: '16px',
          marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          Imagen aquí
        </div>
        <div style={{
          fontSize: '0.95rem',
          lineHeight: 1.6,
          opacity: 0.95,
          textAlign: 'center',
          color: data.textColor || '#ffffff'
        }}>
          {data.description || 'Descripción de la plantilla...'}
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{
          backgroundColor: data.buttonColor || '#3B82F6',
          color: 'white',
          padding: '12px 32px',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 'bold',
          display: 'inline-block'
        }}>
          {data.buttonText || 'Botón de Acción'}
        </div>
      </div>
    </div>
  );
};`;

const defaultJsonConfig: TemplateField[] = [
  {
    id: 'title',
    label: 'Título Principal',
    type: 'text',
    defaultValue: 'Mi Título',
    editable: true
  },
  {
    id: 'subtitle',
    label: 'Subtítulo',
    type: 'text',
    defaultValue: 'Mi Subtítulo',
    editable: true
  },
  {
    id: 'description',
    label: 'Descripción',
    type: 'textarea',
    defaultValue: 'Descripción de la plantilla...',
    editable: true
  },
  {
    id: 'image',
    label: 'Imagen Principal',
    type: 'image',
    defaultValue: '/api/placeholder/400/200',
    editable: true
  },
  {
    id: 'buttonText',
    label: 'Texto del Botón',
    type: 'text',
    defaultValue: 'Botón de Acción',
    editable: true
  },
  {
    id: 'buttonColor',
    label: 'Color del Botón',
    type: 'color',
    defaultValue: '#3B82F6',
    editable: true
  },
  {
    id: 'backgroundColor',
    label: 'Color de Fondo',
    type: 'color',
    defaultValue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    editable: true
  },
  {
    id: 'titleColor',
    label: 'Color del Título',
    type: 'color',
    defaultValue: '#ffffff',
    editable: true
  },
  {
    id: 'textColor',
    label: 'Color del Texto',
    type: 'color',
    defaultValue: '#ffffff',
    editable: true
  }
];

export const AdminTemplateCreator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);
  const { firebaseUser } = useAuth();

  const [currentSection, setCurrentSection] = useState<string>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any>({});
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const [templateData, setTemplateData] = useState<TemplateData>({
    name: '',
    description: '',
    category: 'modern',
    version: '1.0.0',
    author: '',
    reactCode: defaultReactCode,
    cssCode: '', // CSS vacío ahora
    jsonConfig: defaultJsonConfig,
    previewType: 'mobile',
    targetSection: 'profile'
  });

  // Genera/actualiza datos de preview basados en la configuración JSON
  // Importante: NO sobrescribir valores ya presentes en previewData
  // y evitar empujar defaults genéricos que cambien el diseño ("Valor por defecto", cadenas vacías)
  useEffect(() => {
    setPreviewData((prev) => {
      // Si ya había datos de preview, no mutarlos para evitar cambios de diseño
      if (prev && Object.keys(prev).length > 0) {
        return prev;
      }
      // Primera carga: rellenar desde defaults válidos
      const initial: any = {};
      for (const field of templateData.jsonConfig) {
        const v = field.defaultValue;
        const isGeneric = v === undefined || v === null || v === '' || v === 'Valor por defecto';
        if (!isGeneric) initial[field.id] = v;
      }
      return initial;
    });
  }, [templateData.jsonConfig]);

  // Debug UID del usuario para las reglas de Firestore
  useEffect(() => {
    if (firebaseUser?.uid) {
      console.log('🔑 UID del usuario actual:', firebaseUser.uid);
      console.log('✅ Usuario autenticado - permisos habilitados');
    }
  }, [firebaseUser]);

  // Función para corregir permisos manualmente
  const handleFixPermissions = async () => {
    try {
      const result = await autoFixAdminPermissions();
      if (result.success) {
        alert('✅ Permisos de administrador corregidos exitosamente. Ya puedes guardar plantillas.');
      } else {
        alert(`❌ ${result.message}\n\nSi el problema persiste, ve a /admin/login y regístrate como administrador.`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}\n\nVe a /admin/login y regístrate como administrador.`);
    }
  };

  // Cargar plantilla existente cuando estamos editando
  useEffect(() => {
    const loadTemplateForEdit = async () => {
      if (isEditing && editId) {
        try {
          console.log('🔄 Cargando plantilla para editar:', editId);
          const template = await templateDistributionService.getTemplateById(editId);
          
          if (template) {
            console.log('✅ Plantilla cargada para edición:', template);
            
            // Llenar los datos del formulario con la plantilla cargada
            setTemplateData({
              name: template.name,
              description: template.description,
              category: template.category,
              version: template.version,
              author: template.author,
              reactCode: template.reactCode,
              cssCode: template.cssCode || '',
              jsonConfig: template.jsonConfig || [],
              previewType: 'mobile',
              targetSection: template.targetSection
            });
          } else {
            console.error('❌ Plantilla no encontrada:', editId);
            alert('❌ Plantilla no encontrada. Será redirigido al listado.');
            navigate('/admin/templates');
          }
        } catch (error) {
          console.error('❌ Error cargando plantilla:', error);
          alert('❌ Error al cargar la plantilla para edición.');
          navigate('/admin/templates');
        }
      }
    };

    loadTemplateForEdit();
  }, [isEditing, editId, navigate]);

  // Función de emergencia para reconectar a Firebase
  const forceReconnect = async () => {
    setIsReconnecting(true);
    try {
      console.log('🔄 Forzando reconexión a Firebase...');
      
      // Forzar refresh del token
      if (firebaseUser) {
        await firebaseUser.getIdToken(true);
        console.log('✅ Token refrescado');
      }
      
      // Limpiar localStorage relacionado con Firebase
      Object.keys(localStorage).forEach(key => {
        if (key.includes('firebase') || key.includes('firestore')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ Cache limpiado');
      
      // Esperar un momento y mostrar mensaje
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('🔄 Reconexión completada. Intenta guardar de nuevo.');
      
    } catch (error) {
      console.error('❌ Error en reconexión:', error);
      alert('❌ Error en reconexión. Recarga la página manualmente.');
    } finally {
      setIsReconnecting(false);
    }
  };

  const addField = () => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      label: 'Nuevo Campo',
      type: 'text',
      defaultValue: 'Valor por defecto',
      editable: true
    };
    
    setTemplateData(prev => ({
      ...prev,
      jsonConfig: [...prev.jsonConfig, newField]
    }));
  };

  // Función para detectar automáticamente campos en el código React
  const detectFieldsFromCode = () => {
    // 1) Tomar el código actual
    let codeContent = templateData.reactCode || '';

    // 2) Quitar comentarios para evitar falsos positivos
    //    - comentarios de línea // ...
    //    - comentarios de bloque /* ... */
    codeContent = codeContent
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

    // 3) Reconocer diferentes formas de acceso a campos:
    //    - data.campo
    //    - data?.campo
    //    - (data && data.campo)
    //    - data["campo"] o data['campo']
    const detectedFields = new Set<string>();

    // Dot notation con o sin optional chaining y short-circuit
    const dotPattern = /(?:data\s*\?\.\s*|data\s*\.\s*|data\s*&&\s*data\s*\.\s*)([A-Za-z_][A-Za-z0-9_]*)/g;
    let dotMatch: RegExpExecArray | null;
    while ((dotMatch = dotPattern.exec(codeContent)) !== null) {
      const fieldId = dotMatch[1];
      detectedFields.add(fieldId);
    }

    // Bracket notation: data["campo"] o data['campo']
    const bracketPattern = /data\s*\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]/g;
    let bracketMatch: RegExpExecArray | null;
    while ((bracketMatch = bracketPattern.exec(codeContent)) !== null) {
      const fieldId = bracketMatch[1];
      detectedFields.add(fieldId);
    }

    // 4) Preparar nuevos campos a agregar, evitando duplicados con el JSON actual
    const reserved = new Set(['map', 'filter', 'reduce', 'length']);
    const newFields: TemplateField[] = Array.from(detectedFields)
      .filter((fieldId) => !reserved.has(fieldId))
      .filter((fieldId) => !templateData.jsonConfig.some((config) => config.id === fieldId))
      .map((fieldId) => ({
        id: fieldId,
        label: fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/([A-Z])/g, ' $1'),
        type: inferFieldType(fieldId),
        defaultValue: getDefaultValueForField(fieldId),
        editable: true,
      }));

    if (newFields.length > 0) {
      setTemplateData((prev) => ({
        ...prev,
        jsonConfig: [...prev.jsonConfig, ...newFields],
      }));
      alert(`¡Se detectaron ${newFields.length} nuevos campos en tu código React! Se agregaron automáticamente a la configuración JSON.`);
    } else {
      alert('No se detectaron nuevos campos en el código React. Asegúrate de usar la sintaxis data.nombreCampo en tu JSX.');
    }
  };

  // Inferir tipo de campo basado en el nombre
  const inferFieldType = (fieldId: string): TemplateField['type'] => {
    const lowerField = fieldId.toLowerCase();
    
    if (lowerField.includes('color') || lowerField.includes('bg')) return 'color';
    if (lowerField.includes('image') || lowerField.includes('img') || lowerField.includes('photo') || lowerField.includes('avatar')) return 'image';
    if (lowerField.includes('description') || lowerField.includes('bio') || lowerField.includes('content')) return 'textarea';
    // Para tamaños estilados con 'px' conviene editar como texto, no number
    if (lowerField.includes('size') || lowerField.includes('width') || lowerField.includes('height') || lowerField.includes('radius') || lowerField.includes('line')) return 'text';
    
    return 'text';
  };

  // Obtener valor por defecto basado en el nombre del campo
  const getDefaultValueForField = (fieldId: string): string => {
    const lowerField = fieldId.toLowerCase();
    
    if (lowerField.includes('title') && !lowerField.includes('color') && !lowerField.includes('size') && !lowerField.includes('line')) return 'Mi Título';
    if (lowerField.includes('name')) return 'Nombre';
    if (lowerField.includes('subtitle')) return 'Mi Subtítulo';
    if (lowerField.includes('description') || lowerField.includes('bio')) return 'Descripción aquí...';
    if (lowerField.includes('textcolor')) return '#ffffff';
    if (lowerField.includes('titlecolor')) return '#ffffff';
    if (lowerField.includes('subtitlecolor')) return '#b9c0d0';
    if (lowerField.includes('color') || lowerField.includes('bgcolor')) return '#3B82F6';
    if (lowerField.includes('pagebgcolor')) return '#1b1e28';
    if (lowerField.includes('image') || lowerField.includes('img')) return '/api/placeholder/400/200';
    if (lowerField.includes('button')) return 'Botón';
    if (lowerField.includes('link')) return 'https://ejemplo.com';
    if (lowerField.includes('email')) return 'ejemplo@correo.com';
    if (lowerField.includes('phone')) return '+1 234 567 8900';
    if (lowerField.includes('fontfamily')) return 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    if (lowerField.includes('pagepadding')) return '32px';
    if (lowerField.includes('headerpadding')) return '0 0 20px 0';
    if (lowerField.includes('headerfontsize')) return '18px';
    if (lowerField.includes('headersubtitlesize')) return '13px';
    if (lowerField.includes('cardwidth')) return '300px';
    if (lowerField.includes('cardheight')) return '460px';
    if (lowerField.includes('cardradius')) return '32px';
    if (lowerField.includes('cardfallback')) return '#2a2f3a';
    if (lowerField.includes('cardshadow')) return '0 30px 60px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)';
    if (lowerField.includes('cardborder')) return '1px solid rgba(255,255,255,0.06)';
    if (lowerField.includes('statusbg') && !lowerField.includes('2') && !lowerField.includes('3')) return 'rgba(40,199,111,0.92)';
    if (lowerField.includes('statustext') && !lowerField.includes('2') && !lowerField.includes('3')) return '#ffffff';
    if (lowerField.endsWith('status1') || lowerField.includes('status1')) return 'Confirmado';
    if (lowerField.includes('statusbg2')) return 'rgba(32,129,226,0.95)';
    if (lowerField.includes('status2')) return 'Popular';
    if (lowerField.includes('statusbg3')) return 'rgba(130,118,255,0.95)';
    if (lowerField.includes('status3')) return 'Premium';
    if (lowerField.includes('metasize')) return '12px';
    if (lowerField.includes('metacolor')) return '#d3d7e0';
    if (lowerField.includes('metaaltcolor')) return '#e5e7ee';
    if (lowerField.includes('cardtitlesize')) return '28px';
    if (lowerField.includes('cardtitleline')) return '32px';
    if (lowerField.includes('cardtitlecolor')) return '#ffffff';
    
    return 'Valor por defecto';
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    setTemplateData(prev => ({
      ...prev,
      jsonConfig: prev.jsonConfig.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (index: number) => {
    setTemplateData(prev => ({
      ...prev,
      jsonConfig: prev.jsonConfig.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    try {
      // Nombre por defecto si está vacío
      const defaultName = templateData.name?.trim() || `Plantilla ${new Date().toISOString().slice(0,10)}-${Date.now().toString().slice(-5)}`;
      if (!templateData.name?.trim()) {
        setTemplateData(prev => ({ ...prev, name: defaultName }));
      }
      // Compilar a artefacto seguro
      const { artifact, errors } = compileTemplateToArtifact(
        templateData.reactCode,
        templateData.cssCode,
        templateData.jsonConfig as any
      );
      if (errors.length) {
        console.warn('Advertencias de compilación:', errors);
      }

      const adminTemplate: AdminTemplate = {
        id: isEditing ? editId! : undefined,
        name: defaultName,
        description: templateData.description,
        category: templateData.category,
        version: templateData.version,
        author: templateData.author,
        targetSection: templateData.targetSection,
        reactCode: templateData.reactCode,
        cssCode: templateData.cssCode || '',
        jsonConfig: templateData.jsonConfig,
        isPublic: publish,
        artifact
      };

      const savedId = await templateDistributionService.saveTemplate(adminTemplate);
      
      if (savedId) {
        console.log('Plantilla guardada exitosamente:', savedId);
        
        if (publish) {
          // Mostrar mensaje de éxito y redirigir
          alert(`¡Plantilla "${templateData.name}" publicada exitosamente! Los usuarios ya pueden verla en la sección ${templateData.targetSection}.`);
          navigate('/admin/templates');
        } else {
          alert('Plantilla guardada como borrador exitosamente.');
        }
      } else {
        throw new Error('No se pudo guardar la plantilla');
      }
      } catch (error: any) {
        console.error('Error guardando plantilla:', error);
        
        // Auto-corrección automática para errores de permisos
        if (error?.code === 'permission-denied' || 
            error?.message?.includes('Missing or insufficient permissions')) {
          
          console.log('🔧 Error de permisos detectado, intentando auto-corrección...');
          
          try {
            const fixResult = await autoFixAdminPermissions();
            
            if (fixResult.success) {
              // Reintentar guardar después de la corrección
              console.log('✅ Permisos corregidos, reintentando guardar...');
              alert('🔧 Permisos de administrador corregidos automáticamente. Reintentando...');
              
              // Reintentar la operación
              const retryId = await templateDistributionService.saveTemplate(adminTemplate);
              
              if (retryId) {
                console.log('✅ Plantilla guardada exitosamente tras corrección:', retryId);
                
                if (publish) {
                  alert(`¡Plantilla "${templateData.name}" publicada exitosamente! Los usuarios ya pueden verla en la sección ${templateData.targetSection}.`);
                  navigate('/admin/templates');
                } else {
                  alert('Plantilla guardada como borrador exitosamente.');
                }
                return; // Salir exitosamente
              }
            }
            
            // Si la auto-corrección falló, mostrar instrucciones manuales
            alert(`❌ Error de permisos de administrador.\n\n🔧 Auto-corrección: ${fixResult.message}\n\n📋 Si el problema persiste:\n1. Ve a /admin/login\n2. Regístrate como administrador con tu email actual\n3. Tu UID: ${firebaseUser?.uid || 'No disponible'}`);
            
          } catch (fixError) {
            console.error('❌ Error en auto-corrección:', fixError);
            alert(`❌ Error de permisos de administrador.\n\n🔧 Solución:\n1. Ve a /admin/login\n2. Regístrate como administrador\n3. Tu UID actual: ${firebaseUser?.uid || 'No disponible'}`);
          }
          
        } else if (error?.code === 'unavailable' || error?.message?.includes('400')) {
          alert('❌ Error de conexión: Problema de comunicación con Firestore.\n\n🔧 Intenta de nuevo en unos segundos.');
        } else {
          alert(`❌ Error al guardar la plantilla: ${error?.message || 'Error desconocido'}\n\n🔧 Revisa tu conexión y permisos de admin.`);
        }
    } finally {
      setIsSaving(false);
    }
  };

  const [previewError, setPreviewError] = useState<string | null>(null);

  const renderPreview = () => {
    return null; // Preview ahora se renderiza dentro del marco del dispositivo sin panel extra
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  Información Básica de la Plantilla
                </h3>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Define los datos básicos que identificarán tu plantilla en el sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Plantilla *
                </label>
                <Input
                  value={templateData.name}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Tarjeta Moderna de Presentación"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Versión
                </label>
                <Input
                  value={templateData.version}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0.0"
                  className="text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={templateData.description}
                onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe qué hace especial esta plantilla, qué problema resuelve y cómo puede beneficiar a los usuarios..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={templateData.category}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="minimal">🎯 Minimal</option>
                  <option value="modern">✨ Modern</option>
                  <option value="creative">🎨 Creative</option>
                  <option value="luxury">💎 Luxury</option>
                  <option value="business">💼 Business</option>
                  <option value="artistic">🖼️ Artistic</option>
                  <option value="tech">⚡ Tech</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Sección de Tarjeta *
                </label>
                <select
                  value={templateData.targetSection}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, targetSection: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="profile">👤 Perfil</option>
                  <option value="links">🔗 Enlaces</option>
                  <option value="social">📱 Redes Sociales</option>
                  <option value="services">💼 Servicios</option>
                  <option value="booking">📅 Reservas</option>
                  <option value="portfolio">🖼️ Portfolio</option>
                  <option value="elements">🧩 Elementos</option>
                  <option value="design">🎨 Diseño</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Autor
                </label>
                <Input
                  value={templateData.author}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Tu nombre o empresa"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'react':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Componente React con Estilos Inline
                </h3>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm mb-3">
                Escribe un único componente y usa <code className="bg-green-200 dark:bg-green-800 px-1 rounded">data.campo</code> para valores editables.
              </p>
              <div className="bg-green-100 dark:bg-green-900 rounded p-3 text-sm">
                <strong className="text-green-800 dark:text-green-200">✅ SÍ permitido:</strong>
                <ul className="text-green-700 dark:text-green-300 mt-1 ml-4 list-disc text-xs">
                  <li>Firma: <code>{'export default function Nombre({ data }) { return ( ... ) }'}</code></li>
                  <li>Etiquetas: <code>div, span, h1–h6, p, ul, li</code></li>
                  <li>Datos: <code>{'data.campo'}</code>, <code>{'(data && data.campo)'}</code> o <code>{'data.campo || "Default"'}</code></li>
                  <li>Estilos inline: <code>{'style={{ ... }}'}</code> con valores string. Admite <code>rgba()</code>, <code>linear-gradient()</code>, <code>box-shadow</code>.</li>
                  <li>Imágenes fijas con <code>backgroundImage: "url(https://...)"</code></li>
                </ul>
                <strong className="text-red-800 dark:text-red-200 mt-2 block">❌ NO permitido:</strong>
                <ul className="text-red-700 dark:text-red-300 mt-1 ml-4 list-disc text-xs">
                  <li><code>import</code>, hooks, funciones/handlers, eventos <code>on*</code></li>
                  <li>Bucles o lógica: <code>.map()</code>, <code>.filter()</code>, <code>if/else</code></li>
                  <li>Plantillas CSS con datos: <code>{'url(\${data.image})'}</code></li>
                  <li>Tags peligrosos: <code>script, iframe, form, img[src]</code></li>
                </ul>
                <p className="text-green-700 dark:text-green-300 mt-2 text-xs">
                  Nota: el preview ejecuta React real; al publicar se compila a HTML/CSS seguro y algunas propiedades se normalizan para no afectar la app.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Código JSX del Componente
              </label>
              <div className="relative">
                <textarea
                  value={templateData.reactCode}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, reactCode: e.target.value }))}
                  className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Escribe tu código React con estilos inline aquí..."
                  spellCheck={false}
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                    JSX/TSX + Styles
                  </span>
                </div>
              </div>
            </div>
          </div>
        );


      case 'config':
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Configuración de Campos
                </h3>
              </div>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                Define qué elementos podrán editar los usuarios sin tocar código. Cada campo se vinculará con tu componente React.
              </p>
            </div>

            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Campos Editables ({templateData.jsonConfig.length})
              </h4>
              <div className="flex gap-2">
                <Button
                  onClick={detectFieldsFromCode}
                  variant="outline"
                  size="sm"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Auto-detectar
                </Button>
                <Button
                  onClick={addField}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Campo
                </Button>
              </div>
            </div>

            {/* Instrucciones para auto-detección */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    💡 Detección Automática
                  </h5>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                    En tu código React, usa <code className="bg-green-200 dark:bg-green-800 px-1 rounded font-mono">data.nombreCampo</code> para referenciar campos editables:
                  </p>
                  <div className="bg-green-100 dark:bg-green-900 rounded p-2 font-mono text-xs">
                    <div className="text-green-800 dark:text-green-200">&lt;h1&gt;{'{data.title}'}&lt;/h1&gt;</div>
                    <div className="text-green-800 dark:text-green-200">&lt;img src={'{data.image}'} /&gt;</div>
                    <div className="text-green-800 dark:text-green-200">&lt;p&gt;{'{data.description}'}&lt;/p&gt;</div>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Haz clic en "Auto-detectar" para generar automáticamente los campos JSON basados en tu código.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {templateData.jsonConfig.map((field, index) => (
                <div key={field.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        ID del Campo
                      </label>
                      <Input
                        value={field.id}
                        onChange={(e) => updateField(index, { id: e.target.value })}
                        className="text-sm"
                        size="sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Etiqueta Visible
                      </label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="text-sm"
                        size="sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Tipo de Campo
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as any })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="text">📝 Texto</option>
                        <option value="textarea">📄 Texto Largo</option>
                        <option value="image">🖼️ Imagen</option>
                        <option value="color">🎨 Color</option>
                        <option value="number">🔢 Número</option>
                        <option value="select">📋 Lista</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Valor Por Defecto
                        </label>
                        <Input
                          value={field.defaultValue}
                          onChange={(e) => updateField(index, { defaultValue: e.target.value })}
                          className="text-sm"
                          size="sm"
                        />
                      </div>
                      
                      <Button
                        onClick={() => removeField(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Sección en desarrollo</div>;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex overflow-hidden">
      {/* Sidebar */}
      <div className="bg-slate-800/90 backdrop-blur text-white border-r border-slate-700/50 flex flex-col w-80">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/admin/templates')}
              className="flex items-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Plantillas
            </button>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">
              {isEditing ? '✏️ Editar Plantilla' : '✨ Crear Nueva Plantilla'}
            </h1>
            <p className="text-sm text-slate-400">
              {templateData.name || 'Plantilla sin nombre'}
            </p>
            {templateData.name && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-400">Guardado automático activado</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-4">
            {sections.map((section) => {
              const isActive = currentSection === section.key;
              const isCompleted = section.key === 'basic' ? templateData.name.length > 0 : false;
              
              return (
                <button
                  key={section.key}
                  onClick={() => setCurrentSection(section.key)}
                  className={`w-full flex items-center px-4 py-4 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-200 shadow-lg border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 shadow-lg' 
                      : isCompleted 
                        ? 'bg-green-600' 
                        : 'bg-slate-700'
                  }`}>
                    {isCompleted && section.key === 'basic' ? 
                      <CheckCircle className="w-5 h-5 text-white" /> : 
                      section.icon
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{section.label}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {section.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer - Save Buttons */}
        <div className="p-4 border-t border-slate-700/50 space-y-3">
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving || isReconnecting}
            className="w-full bg-slate-600 text-white hover:bg-slate-500 disabled:bg-slate-800"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Borrador'}
          </Button>
          
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving || isReconnecting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Guardar y Publicar
          </Button>
          
          {/* Botón de emergencia */}
          <Button
            onClick={forceReconnect}
            disabled={isReconnecting}
            variant="outline"
            className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
          >
            {isReconnecting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            {isReconnecting ? 'Reconectando...' : '🆘 Forzar Reconexión'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0">
        {/* Editor Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
          {/* Content Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  {sections.find(s => s.key === currentSection)?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {sections.find(s => s.key === currentSection)?.label}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {sections.find(s => s.key === currentSection)?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Editor Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {renderCurrentSection()}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-[420px] bg-slate-900 border-l border-slate-700 flex flex-col">
          <div className="bg-slate-800 border-b border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-slate-300" />
                <h3 className="font-semibold text-white">Vista Previa</h3>
              </div>
              <div className="flex items-center space-x-1 bg-slate-700 rounded-lg p-1">
                <button 
                  onClick={() => setTemplateData(prev => ({ ...prev, previewType: 'mobile' }))}
                  className={`p-2 rounded-md transition-all ${
                    templateData.previewType === 'mobile' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-600'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setTemplateData(prev => ({ ...prev, previewType: 'desktop' }))}
                  className={`p-2 rounded-md transition-all ${
                    templateData.previewType === 'desktop' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-600'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Actualización en tiempo real</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-slate-900 p-4">
            {(() => {
              const isMobile = templateData.previewType === 'mobile';
              const deviceWidth = isMobile ? 360 : 820;
              const deviceHeight = isMobile ? 740 : 520;
              return (
                <div className="mx-auto flex justify-center">
                  <div
                    className="relative bg-black rounded-[32px] shadow-2xl border border-neutral-800"
                    style={{ width: deviceWidth, height: deviceHeight }}
                  >
                    {/* Pantalla con bisel */}
                    <div className="absolute inset-[12px] rounded-[24px] bg-black overflow-hidden">
                      <div className="w-full h-full bg-black">
                        <DirectTemplateRenderer
                          jsxCode={templateData.reactCode}
                          data={previewData}
                          className="w-full h-full direct-template-renderer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTemplateCreator;