import { userTemplatesService } from '@/services/userTemplates';
import { secureLogger } from '@/utils/secureLogger';

// Script para probar que las plantillas individuales de enlaces funcionan correctamente
export async function testIndividualLinkTemplates(cardId: string): Promise<boolean> {
  try {
    secureLogger.devOnly('🧪 Probando sistema de plantillas individuales de enlaces...');
    
    // 1. Verificar estado inicial - no debe haber plantillas
    const initialTemplate = await userTemplatesService.getActiveTemplateForCard(cardId, 'links');
    secureLogger.devOnly(`📋 Estado inicial: ${initialTemplate ? 'Hay plantilla general' : 'Sin plantillas'}`);
    
    // 2. Verificar plantillas para enlaces específicos
    const link1Template = await userTemplatesService.getActiveTemplateForCard(cardId, 'links', 'link-1');
    const link2Template = await userTemplatesService.getActiveTemplateForCard(cardId, 'links', 'link-2');
    
    secureLogger.devOnly(`🔗 Link 1: ${link1Template ? 'Tiene plantilla' : 'Sin plantilla'}`);
    secureLogger.devOnly(`🔗 Link 2: ${link2Template ? 'Tiene plantilla' : 'Sin plantilla'}`);
    
    // 3. Obtener plantillas disponibles
    const availableTemplates = await userTemplatesService.getTemplatesBySection('links');
    if (availableTemplates.length === 0) {
      secureLogger.devOnly('❌ No hay plantillas disponibles para probar');
      return false;
    }
    
    secureLogger.devOnly(`🎨 Plantillas disponibles: ${availableTemplates.length}`);
    availableTemplates.forEach(t => {
      secureLogger.devOnly(`  - ${t.name} (${t.category})`);
    });
    
    // 4. Simular aplicación de plantilla individual
    const testTemplate = availableTemplates[0];
    const testData = { title: 'Enlace de Prueba Individual', backgroundColor: '#ff6b6b' };
    
    secureLogger.devOnly(`🎯 Aplicando plantilla "${testTemplate.name}" al enlace link-1...`);
    
    const instance = await userTemplatesService.applyTemplateToCard(
      testTemplate.id,
      'test-user',
      cardId,
      testData,
      { targetItemId: 'link-1' }
    );
    
    if (!instance) {
      secureLogger.devOnly('❌ Error aplicando plantilla');
      return false;
    }
    
    // 5. Verificar que solo el enlace específico tiene la plantilla
    const generalTemplateAfter = await userTemplatesService.getActiveTemplateForCard(cardId, 'links');
    const link1TemplateAfter = await userTemplatesService.getActiveTemplateForCard(cardId, 'links', 'link-1');
    const link2TemplateAfter = await userTemplatesService.getActiveTemplateForCard(cardId, 'links', 'link-2');
    
    secureLogger.devOnly('📊 Resultados después de aplicar plantilla:');
    secureLogger.devOnly(`  - Plantilla general: ${generalTemplateAfter ? '❌ PRESENTE (mal)' : '✅ AUSENTE (bien)'}`);
    secureLogger.devOnly(`  - Link 1: ${link1TemplateAfter ? '✅ PRESENTE (bien)' : '❌ AUSENTE (mal)'}`);
    secureLogger.devOnly(`  - Link 2: ${link2TemplateAfter ? '❌ PRESENTE (mal)' : '✅ AUSENTE (bien)'}`);
    
    // 6. Verificar que los datos de la instancia son correctos
    if (link1TemplateAfter) {
      secureLogger.devOnly(`🔍 Datos de la instancia: ${JSON.stringify(link1TemplateAfter.instance.data)}`);
      secureLogger.devOnly(`🎯 Target Item ID: ${link1TemplateAfter.instance.targetItemId}`);
    }
    
    // 7. Limpiar plantilla de prueba
    secureLogger.devOnly('🧹 Limpiando plantilla de prueba...');
    await userTemplatesService.removeTemplateFromCard(cardId, 'links', 'link-1');
    
    const success = !generalTemplateAfter && !!link1TemplateAfter && !link2TemplateAfter;
    
    if (success) {
      secureLogger.devOnly('🎉 ¡Prueba exitosa! Las plantillas individuales funcionan correctamente');
      secureLogger.devOnly('');
      secureLogger.devOnly('✨ Instrucciones para el usuario:');
      secureLogger.devOnly('1. Ve al editor de enlaces');
      secureLogger.devOnly('2. Haz clic en la varita mágica (🪄) de un enlace específico');
      secureLogger.devOnly('3. Selecciona una plantilla');
      secureLogger.devOnly('4. La plantilla se aplicará SOLO a ese enlace');
      secureLogger.devOnly('5. Otros enlaces mantendrán su diseño original');
    } else {
      secureLogger.devOnly('❌ Prueba fallida. El sistema no está funcionando correctamente');
    }
    
    return success;
    
  } catch (error) {
    secureLogger.devOnly('💥 Error en la prueba:', error);
    return false;
  }
}

// Función para demostrar el problema anterior (antes de la corrección)
export function explainTheProblem(): void {
  secureLogger.devOnly('📚 EXPLICACIÓN DEL PROBLEMA CORREGIDO:');
  secureLogger.devOnly('');
  secureLogger.devOnly('❌ ANTES (problema):');
  secureLogger.devOnly('  - Al aplicar plantilla a un enlace específico');
  secureLogger.devOnly('  - La plantilla aparecía en TODOS los enlaces');
  secureLogger.devOnly('  - No había separación entre plantillas individuales y generales');
  secureLogger.devOnly('');
  secureLogger.devOnly('✅ DESPUÉS (solucionado):');
  secureLogger.devOnly('  - Cada enlace puede tener su propia plantilla');
  secureLogger.devOnly('  - Las plantillas se aplican solo al enlace seleccionado');
  secureLogger.devOnly('  - Separación clara entre plantillas individuales y generales');
  secureLogger.devOnly('');
  secureLogger.devOnly('🔧 CAMBIOS REALIZADOS:');
  secureLogger.devOnly('  - Corregido filtrado en getActiveTemplateForCard()');
  secureLogger.devOnly('  - Corregido filtrado en subscribeActiveTemplateForCard()');
  secureLogger.devOnly('  - Corregido filtrado en deactivateCardTemplates()');
  secureLogger.devOnly('  - Lógica: targetItemId específico = plantilla específica');
  secureLogger.devOnly('  - Lógica: sin targetItemId = plantilla general');
}

// Añadir funciones al objeto global para pruebas en consola
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.testIndividualLinkTemplates = testIndividualLinkTemplates;
  // @ts-ignore
  window.explainLinkTemplatesProblem = explainTheProblem;
  
  secureLogger.devOnly('🛠️ Funciones de prueba de plantillas individuales disponibles:');
  secureLogger.devOnly('  - testIndividualLinkTemplates(cardId) - Probar sistema completo');
  secureLogger.devOnly('  - explainLinkTemplatesProblem() - Explicar el problema corregido');
}
