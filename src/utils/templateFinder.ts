import { templateDistributionService } from '@/services/templateDistribution';

declare global {
  interface Window {
    findTemplateByName: (name: string) => Promise<void>;
    fixKnownTemplate: () => Promise<void>;
    searchAllTemplates: () => Promise<void>;
  }
}

window.findTemplateByName = async (name: string) => {
  console.log('🔍 Buscando plantilla:', name);
  
  try {
    const templates = await templateDistributionService.getTemplates();
    console.log('📋 Total de plantillas encontradas:', templates.length);
    
    const matching = templates.filter(t => 
      t.name.includes(name) || 
      t.id?.includes(name) ||
      t.name.includes('2025-08-11-90585')
    );
    
    console.log('🎯 Plantillas que coinciden:');
    matching.forEach((template, index) => {
      console.log(`  ${index + 1}. ID: ${template.id}`);
      console.log(`     Nombre: ${template.name}`);
      console.log(`     Sección: ${template.targetSection}`);
      console.log(`     Pública: ${template.isPublic}`);
      console.log(`     Tiene React: ${!!(template.reactCode && template.reactCode.trim())}`);
      console.log(`     Tiene CSS: ${!!(template.cssCode && template.cssCode.trim())}`);
      console.log('');
    });
    
    if (matching.length > 0) {
      console.log(`💡 Para arreglar la primera: fixTemplateById("${matching[0].id}")`);
    }
    
  } catch (error) {
    console.error('❌ Error buscando plantillas:', error);
  }
};

window.fixKnownTemplate = async () => {
  console.log('🎯 Buscando y arreglando la plantilla conocida...');
  
  try {
    const templates = await templateDistributionService.getTemplates();
    
    // Buscar por nombre que contenga "2025-08-11-90585" o similar
    const knownTemplate = templates.find(t => 
      t.name.includes('2025-08-11-90585') ||
      t.name.includes('Plantilla 2025') ||
      t.id?.includes('90585')
    );
    
    if (knownTemplate) {
      console.log('✅ Plantilla encontrada:', knownTemplate.name);
      console.log('🔧 ID:', knownTemplate.id);
      
      await window.fixTemplateById(knownTemplate.id!);
    } else {
      console.log('❌ No se encontró la plantilla conocida');
      console.log('🔍 Buscando todas las plantillas...');
      await window.searchAllTemplates();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

window.searchAllTemplates = async () => {
  console.log('📋 Listando TODAS las plantillas...');
  
  try {
    const templates = await templateDistributionService.getTemplates();
    
    console.log(`📊 Total: ${templates.length} plantillas`);
    console.log('');
    
    templates.forEach((template, index) => {
      const hasContent = !!(template.reactCode && template.reactCode.trim() && 
                           template.cssCode && template.cssCode.trim());
      const status = hasContent ? '✅' : '❌';
      
      console.log(`${status} ${index + 1}. ${template.name}`);
      console.log(`    ID: ${template.id}`);
      console.log(`    Sección: ${template.targetSection}`);
      console.log(`    Pública: ${template.isPublic}`);
      console.log(`    Contenido: React(${template.reactCode?.length || 0}) CSS(${template.cssCode?.length || 0})`);
      console.log('');
    });
    
    const emptyTemplates = templates.filter(t => 
      !(t.reactCode && t.reactCode.trim() && t.cssCode && t.cssCode.trim())
    );
    
    if (emptyTemplates.length > 0) {
      console.log(`⚠️ ${emptyTemplates.length} plantillas sin contenido:`);
      emptyTemplates.forEach(t => {
        console.log(`  - ${t.name} (ID: ${t.id})`);
      });
      console.log('');
      console.log(`💡 Para arreglar la primera: fixTemplateById("${emptyTemplates[0].id}")`);
    }
    
  } catch (error) {
    console.error('❌ Error listando plantillas:', error);
  }
};

console.log('🔍 Template Finder cargado:');
console.log('  - findTemplateByName("nombre") - Busca por nombre');
console.log('  - fixKnownTemplate() - Busca y arregla la plantilla conocida');
console.log('  - searchAllTemplates() - Lista todas las plantillas');
console.log('');
console.log('🎯 EJECUTA: fixKnownTemplate()');

export {};
