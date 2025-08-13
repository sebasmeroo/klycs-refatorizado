import { userTemplatesService } from '@/services/userTemplates';
import { secureLogger } from '@/utils/secureLogger';

// Función para debuggear qué datos recibe una plantilla de enlace específico
export function debugTemplateData() {
  secureLogger.devOnly('🐛 DEBUG: Datos que las plantillas de enlaces deberían recibir:');
  secureLogger.devOnly('');
  secureLogger.devOnly('📋 Datos disponibles para plantillas de enlaces individuales:');
  secureLogger.devOnly('  - data.linkTitle - Título del enlace específico');
  secureLogger.devOnly('  - data.linkUrl - URL del enlace específico');
  secureLogger.devOnly('  - data.linkDescription - Descripción del enlace');
  secureLogger.devOnly('  - data.linkIcon - Icono del enlace');
  secureLogger.devOnly('  - data.linkIconType - Tipo de icono (emoji/custom)');
  secureLogger.devOnly('  - data.currentLink - Objeto completo del enlace');
  secureLogger.devOnly('');
  secureLogger.devOnly('📋 Datos adicionales configurables:');
  secureLogger.devOnly('  - data.backgroundColor - Color de fondo personalizable');
  secureLogger.devOnly('  - data.textColor - Color de texto personalizable');
  secureLogger.devOnly('  - data.borderRadius - Radio de bordes personalizable');
  secureLogger.devOnly('  - data.hoverColor - Color hover personalizable');
  secureLogger.devOnly('');
  secureLogger.devOnly('🎯 Ejemplo de plantilla que FUNCIONA:');
  secureLogger.devOnly(`
function EnlacePersonalizado({ data }) {
  const {
    linkTitle = 'Mi Enlace',
    linkUrl = '#',
    linkIcon = '🔗',
    backgroundColor = '#3b82f6',
    textColor = '#ffffff'
  } = data;

  return (
    <a 
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
      style={{
        background: backgroundColor,
        color: textColor,
        display: 'block',
        padding: '16px',
        borderRadius: '12px',
        textDecoration: 'none',
        marginBottom: '8px'
      }}
    >
      <span style={{ marginRight: '8px' }}>{linkIcon}</span>
      {linkTitle}
    </a>
  );
}
`);
}

// Función para crear una plantilla de prueba que muestre los datos del enlace
export async function createTestLinkTemplate(): Promise<string | null> {
  try {
    secureLogger.devOnly('🧪 Creando plantilla de prueba para enlaces...');
    
    const testTemplate = {
      id: 'test-link-debug',
      name: 'DEBUG: Enlace de Prueba',
      description: 'Plantilla para probar datos de enlaces individuales',
      category: 'debug',
      version: '1.0.0',
      author: 'Sistema Debug',
      targetSection: 'links' as const,
      isPublic: true,
      reactCode: `
function DebugLinkTemplate({ data }) {
  const {
    linkTitle = 'TÍTULO NO ENCONTRADO',
    linkUrl = 'URL NO ENCONTRADA',
    linkIcon = '❓',
    backgroundColor = '#ff6b6b',
    textColor = '#ffffff',
    borderRadius = '12px'
  } = data;

  return (
    <div 
      style={{
        background: backgroundColor,
        color: textColor,
        padding: '16px',
        borderRadius: borderRadius,
        marginBottom: '8px',
        border: '2px solid #00ff00'
      }}
    >
      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>
        [DEBUG TEMPLATE - Individual Link]
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '20px', marginRight: '12px' }}>{linkIcon}</span>
        <div>
          <div style={{ fontWeight: 'bold' }}>{linkTitle}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>{linkUrl}</div>
        </div>
      </div>
      <div style={{ fontSize: '10px', marginTop: '8px', opacity: 0.6 }}>
        Datos: {JSON.stringify(Object.keys(data))}
      </div>
    </div>
  );
}`,
      cssCode: `
/* Estilos adicionales para la plantilla debug */
.debug-link-template {
  transition: all 0.3s ease;
}
.debug-link-template:hover {
  transform: scale(1.02);
}`,
      jsonConfig: [
        {
          id: 'backgroundColor',
          type: 'color',
          label: 'Color de fondo',
          defaultValue: '#ff6b6b',
          editable: true
        },
        {
          id: 'textColor',
          type: 'color',
          label: 'Color de texto',
          defaultValue: '#ffffff',
          editable: true
        },
        {
          id: 'borderRadius',
          type: 'text',
          label: 'Radio de bordes',
          defaultValue: '12px',
          editable: true
        }
      ],
      tags: ['debug', 'test', 'enlaces']
    };

    // Simular guardado (en un caso real se guardaría en Firebase)
    secureLogger.devOnly('✅ Plantilla debug creada (conceptualmente)');
    secureLogger.devOnly('🎯 Esta plantilla mostraría:');
    secureLogger.devOnly('  - Título del enlace específico');
    secureLogger.devOnly('  - URL del enlace específico');
    secureLogger.devOnly('  - Icono del enlace específico');
    secureLogger.devOnly('  - Datos disponibles en JSON');
    secureLogger.devOnly('  - Borde verde para indicar que es plantilla individual');
    
    return testTemplate.id;
  } catch (error) {
    secureLogger.devOnly('❌ Error creando plantilla debug:', error);
    return null;
  }
}

// Función para verificar si los datos están llegando correctamente
export async function verifyLinkTemplateData(cardId: string, linkId: string): Promise<void> {
  try {
    secureLogger.devOnly(`🔍 Verificando datos de plantilla para enlace ${linkId}...`);
    
    const templateData = await userTemplatesService.getActiveTemplateForCard(cardId, 'links', linkId);
    
    if (!templateData) {
      secureLogger.devOnly('❌ No hay plantilla aplicada a este enlace');
      return;
    }
    
    secureLogger.devOnly('✅ Plantilla encontrada:');
    secureLogger.devOnly(`  - Plantilla: ${templateData.template.name}`);
    secureLogger.devOnly(`  - Target Item: ${templateData.instance.targetItemId}`);
    secureLogger.devOnly(`  - Datos: ${JSON.stringify(templateData.instance.data, null, 2)}`);
    
    if (templateData.instance.targetItemId !== linkId) {
      secureLogger.devOnly('⚠️ PROBLEMA: targetItemId no coincide');
    } else {
      secureLogger.devOnly('✅ targetItemId correcto');
    }
    
  } catch (error) {
    secureLogger.devOnly('❌ Error verificando datos:', error);
  }
}

// Instrucciones para el usuario
export function showLinkTemplateInstructions(): void {
  secureLogger.devOnly('📚 INSTRUCCIONES PARA PROBAR PLANTILLAS INDIVIDUALES:');
  secureLogger.devOnly('');
  secureLogger.devOnly('1️⃣ Crear enlace:');
  secureLogger.devOnly('   - Ve al editor de enlaces');
  secureLogger.devOnly('   - Haz clic en "Agregar Enlace"');
  secureLogger.devOnly('   - Rellena título y URL');
  secureLogger.devOnly('');
  secureLogger.devOnly('2️⃣ Aplicar plantilla individual:');
  secureLogger.devOnly('   - Haz clic en la varita mágica (🪄) del enlace específico');
  secureLogger.devOnly('   - Selecciona una plantilla de la galería');
  secureLogger.devOnly('   - La plantilla se aplica SOLO a ese enlace');
  secureLogger.devOnly('');
  secureLogger.devOnly('3️⃣ Verificar en preview:');
  secureLogger.devOnly('   - El enlace con plantilla debe verse diferente');
  secureLogger.devOnly('   - Otros enlaces mantienen el diseño por defecto');
  secureLogger.devOnly('   - Los datos del enlace (título, URL, icono) deben aparecer');
  secureLogger.devOnly('');
  secureLogger.devOnly('🐛 Para debug:');
  secureLogger.devOnly('   - debugTemplateData() - Ver qué datos están disponibles');
  secureLogger.devOnly('   - verifyLinkTemplateData(cardId, linkId) - Verificar datos específicos');
  secureLogger.devOnly('   - createTestLinkTemplate() - Crear plantilla de prueba');
}

// Añadir funciones al objeto global
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.debugTemplateData = debugTemplateData;
  // @ts-ignore
  window.createTestLinkTemplate = createTestLinkTemplate;
  // @ts-ignore
  window.verifyLinkTemplateData = verifyLinkTemplateData;
  // @ts-ignore
  window.showLinkTemplateInstructions = showLinkTemplateInstructions;
  
  secureLogger.devOnly('🛠️ Funciones debug disponibles:');
  secureLogger.devOnly('  - debugTemplateData() - Ver datos disponibles');
  secureLogger.devOnly('  - createTestLinkTemplate() - Crear plantilla debug');
  secureLogger.devOnly('  - verifyLinkTemplateData(cardId, linkId) - Verificar datos');
  secureLogger.devOnly('  - showLinkTemplateInstructions() - Ver instrucciones');
}
