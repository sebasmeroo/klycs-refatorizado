import { userTemplatesService } from '@/services/userTemplates';
import { secureLogger } from '@/utils/secureLogger';

// Script para probar el flujo completo de aplicación de plantillas a enlaces individuales
export async function testLinkTemplateFlow(cardId: string, linkId: string): Promise<boolean> {
  try {
    secureLogger.devOnly('🚀 INICIANDO PRUEBA COMPLETA DE PLANTILLAS INDIVIDUALES');
    secureLogger.devOnly('================================================');
    secureLogger.devOnly(`📋 Card ID: ${cardId}`);
    secureLogger.devOnly(`🔗 Link ID: ${linkId}`);
    secureLogger.devOnly('');
    
    // Paso 1: Verificar estado inicial
    secureLogger.devOnly('📊 PASO 1: Verificando estado inicial...');
    const initialTemplate = await userTemplatesService.getActiveTemplateForCard(cardId, 'links', linkId);
    secureLogger.devOnly(`   Estado inicial: ${initialTemplate ? '❌ Ya tiene plantilla' : '✅ Sin plantilla (correcto)'}`);
    
    // Paso 2: Obtener plantillas disponibles
    secureLogger.devOnly('');
    secureLogger.devOnly('📊 PASO 2: Obteniendo plantillas disponibles...');
    const availableTemplates = await userTemplatesService.getTemplatesBySection('links');
    secureLogger.devOnly(`   Plantillas encontradas: ${availableTemplates.length}`);
    
    if (availableTemplates.length === 0) {
      secureLogger.devOnly('❌ No hay plantillas disponibles para probar');
      return false;
    }
    
    const testTemplate = availableTemplates[0];
    secureLogger.devOnly(`   Usando plantilla: "${testTemplate.name}"`);
    
    // Paso 3: Aplicar plantilla
    secureLogger.devOnly('');
    secureLogger.devOnly('📊 PASO 3: Aplicando plantilla...');
    const testData = {
      title: `Enlace Personalizado ${Date.now()}`,
      backgroundColor: '#ff6b6b',
      textColor: '#ffffff'
    };
    
    const instance = await userTemplatesService.applyTemplateToCard(
      testTemplate.id,
      'test-user',
      cardId,
      testData,
      { targetItemId: linkId }
    );
    
    if (!instance) {
      secureLogger.devOnly('❌ Error aplicando plantilla');
      return false;
    }
    
    secureLogger.devOnly('✅ Plantilla aplicada exitosamente');
    secureLogger.devOnly(`   Instance ID: ${instance.id}`);
    secureLogger.devOnly(`   Target Item: ${instance.targetItemId}`);
    
    // Paso 4: Verificar aplicación
    secureLogger.devOnly('');
    secureLogger.devOnly('📊 PASO 4: Verificando aplicación...');
    
    // Verificar que la plantilla está aplicada al enlace específico
    const appliedTemplate = await userTemplatesService.getActiveTemplateForCard(cardId, 'links', linkId);
    const generalTemplate = await userTemplatesService.getActiveTemplateForCard(cardId, 'links');
    
    secureLogger.devOnly(`   Plantilla específica: ${appliedTemplate ? '✅ ENCONTRADA' : '❌ NO ENCONTRADA'}`);
    secureLogger.devOnly(`   Plantilla general: ${generalTemplate ? '❌ PRESENTE (mal)' : '✅ AUSENTE (bien)'}`);
    
    if (appliedTemplate) {
      secureLogger.devOnly(`   ✓ Plantilla: ${appliedTemplate.template.name}`);
      secureLogger.devOnly(`   ✓ Target: ${appliedTemplate.instance.targetItemId}`);
      secureLogger.devOnly(`   ✓ Datos: ${JSON.stringify(appliedTemplate.instance.data)}`);
    }
    
    // Paso 5: Simular datos del preview
    secureLogger.devOnly('');
    secureLogger.devOnly('📊 PASO 5: Simulando datos del preview...');
    
    if (appliedTemplate) {
      // Simular los datos que debería recibir la plantilla
      const mockLinkData = {
        id: linkId,
        title: 'Título del Enlace de Prueba',
        url: 'https://ejemplo.com',
        description: 'Descripción del enlace',
        icon: '🔗',
        iconType: 'emoji'
      };
      
      const expectedData = {
        // Datos del enlace específico
        currentLink: mockLinkData,
        linkTitle: mockLinkData.title,
        linkUrl: mockLinkData.url,
        linkDescription: mockLinkData.description,
        linkIcon: mockLinkData.icon,
        linkIconType: mockLinkData.iconType,
        
        // Datos de la instancia
        ...appliedTemplate.instance.data
      };
      
      secureLogger.devOnly('   📋 Datos que debería recibir la plantilla:');
      secureLogger.devOnly(`   ✓ linkTitle: "${expectedData.linkTitle}"`);
      secureLogger.devOnly(`   ✓ linkUrl: "${expectedData.linkUrl}"`);
      secureLogger.devOnly(`   ✓ linkIcon: "${expectedData.linkIcon}"`);
      secureLogger.devOnly(`   ✓ backgroundColor: "${expectedData.backgroundColor}"`);
      secureLogger.devOnly(`   ✓ textColor: "${expectedData.textColor}"`);
    }
    
    // Paso 6: Instrucciones para verificar en UI
    secureLogger.devOnly('');
    secureLogger.devOnly('📊 PASO 6: Verificación manual en UI...');
    secureLogger.devOnly('   👀 AHORA VERIFICA EN LA INTERFAZ:');
    secureLogger.devOnly(`   1. Ve al preview de la tarjeta`);
    secureLogger.devOnly(`   2. Busca el enlace con ID: ${linkId}`);
    secureLogger.devOnly(`   3. Debería verse con la plantilla aplicada`);
    secureLogger.devOnly(`   4. Otros enlaces deberían verse normales`);
    secureLogger.devOnly('');
    secureLogger.devOnly('   🔍 EN LA CONSOLA DEBERÍAS VER:');
    secureLogger.devOnly('   - "🔍 SectionRenderer - links/[linkId]: HAS TEMPLATE"');
    secureLogger.devOnly('   - "🎨 TemplatePreview - links/[linkId]: [datos]"');
    secureLogger.devOnly('');
    
    // Paso 7: Limpiar
    secureLogger.devOnly('📊 PASO 7: Limpiando plantilla de prueba...');
    await userTemplatesService.removeTemplateFromCard(cardId, 'links', linkId);
    secureLogger.devOnly('✅ Plantilla removida');
    
    const success = !!appliedTemplate && !generalTemplate;
    
    secureLogger.devOnly('');
    secureLogger.devOnly('🎯 RESULTADO FINAL:');
    if (success) {
      secureLogger.devOnly('✅ PRUEBA EXITOSA - El sistema funciona correctamente');
      secureLogger.devOnly('   Si no ves cambios en el preview, el problema está en:');
      secureLogger.devOnly('   1. El código de la plantilla del admin');
      secureLogger.devOnly('   2. Los datos que está usando la plantilla');
      secureLogger.devOnly('   3. El re-rendering del componente');
    } else {
      secureLogger.devOnly('❌ PRUEBA FALLIDA - Hay problemas en el sistema');
    }
    
    return success;
    
  } catch (error) {
    secureLogger.devOnly('💥 ERROR EN LA PRUEBA:', error);
    return false;
  }
}

// Función para monitorear en tiempo real los cambios de plantillas
export function startTemplateMonitoring(cardId: string, linkIds: string[]): () => void {
  secureLogger.devOnly('👀 INICIANDO MONITOREO DE PLANTILLAS EN TIEMPO REAL');
  secureLogger.devOnly('===================================================');
  
  const unsubscribeFunctions: (() => void)[] = [];
  
  // Monitorear cada enlace específico
  linkIds.forEach(linkId => {
    const unsubscribe = userTemplatesService.subscribeActiveTemplateForCard(
      cardId,
      'links',
      (data) => {
        const timestamp = new Date().toLocaleTimeString();
        if (data) {
          secureLogger.devOnly(`[${timestamp}] 🔗 Link ${linkId}: PLANTILLA APLICADA - ${data.template.name}`);
        } else {
          secureLogger.devOnly(`[${timestamp}] 🔗 Link ${linkId}: SIN PLANTILLA`);
        }
      },
      { targetItemId: linkId }
    );
    unsubscribeFunctions.push(unsubscribe);
  });
  
  // Monitorear plantillas generales
  const unsubscribeGeneral = userTemplatesService.subscribeActiveTemplateForCard(
    cardId,
    'links',
    (data) => {
      const timestamp = new Date().toLocaleTimeString();
      if (data) {
        secureLogger.devOnly(`[${timestamp}] 📋 GENERAL: PLANTILLA APLICADA - ${data.template.name}`);
      } else {
        secureLogger.devOnly(`[${timestamp}] 📋 GENERAL: SIN PLANTILLA`);
      }
    }
  );
  unsubscribeFunctions.push(unsubscribeGeneral);
  
  return () => {
    secureLogger.devOnly('🛑 Deteniendo monitoreo de plantillas');
    unsubscribeFunctions.forEach(fn => fn());
  };
}

// Añadir funciones al objeto global
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.testLinkTemplateFlow = testLinkTemplateFlow;
  // @ts-ignore
  window.startTemplateMonitoring = startTemplateMonitoring;
  
  secureLogger.devOnly('🛠️ Funciones de prueba de flujo disponibles:');
  secureLogger.devOnly('  - testLinkTemplateFlow(cardId, linkId) - Prueba completa');
  secureLogger.devOnly('  - startTemplateMonitoring(cardId, [linkIds]) - Monitoreo en tiempo real');
}
