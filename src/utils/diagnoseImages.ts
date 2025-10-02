/**
 * Script de diagnóstico para problemas de imágenes
 */

export async function diagnoseImageIssues() {
  console.group('🔍 DIAGNÓSTICO DE IMÁGENES');
  
  // 1. Verificar si Firebase Storage está configurado
  try {
    const { storage } = await import('@/lib/firebase');
    console.log('✅ Firebase Storage configurado:', {
      bucket: storage.app.options.storageBucket,
      app: storage.app.name
    });
  } catch (error) {
    console.error('❌ Error cargando Firebase Storage:', error);
  }
  
  // 2. Probar cargar una imagen de prueba
  try {
    const testUrl = 'https://firebasestorage.googleapis.com/v0/b/test/o/test.jpg?alt=media';
    const response = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
    console.log('🌐 CORS test:', response);
  } catch (error) {
    console.error('❌ Error de CORS:', error);
  }
  
  // 3. Verificar el estado del usuario actual
  try {
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    console.log('👤 Usuario actual:', user ? {
      uid: user.uid,
      email: user.email
    } : 'No autenticado');
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
  }
  
  // 4. Buscar imágenes en el DOM
  const images = document.querySelectorAll('img');
  const brokenImages: { src: string; naturalWidth: number; error: boolean }[] = [];
  
  images.forEach(img => {
    if (img.src.includes('firebasestorage')) {
      const isLoaded = img.naturalWidth > 0;
      if (!isLoaded) {
        brokenImages.push({
          src: img.src,
          naturalWidth: img.naturalWidth,
          error: img.complete && img.naturalWidth === 0
        });
      }
    }
  });
  
  console.log(`📊 Imágenes de Firebase en el DOM: ${images.length}`);
  console.log(`❌ Imágenes rotas: ${brokenImages.length}`);
  
  if (brokenImages.length > 0) {
    console.group('🔴 Imágenes rotas:');
    brokenImages.forEach((img, idx) => {
      console.log(`${idx + 1}. ${img.src}`);
      // Extraer el path de la URL
      const match = img.src.match(/\/o\/([^?]+)/);
      if (match) {
        const path = decodeURIComponent(match[1]);
        console.log(`   Path: ${path}`);
      }
    });
    console.groupEnd();
  }
  
  // 5. Verificar reglas de Storage
  console.log('\n📋 Verifica las reglas de Storage en Firebase Console:');
  console.log('   1. Ve a Firebase Console > Storage > Rules');
  console.log('   2. Asegúrate que las reglas permitan lectura pública:');
  console.log('      allow read: if true;');
  console.log('\n   Si las reglas están bien, ejecuta en la consola:');
  console.log('   firebase deploy --only storage');
  
  console.groupEnd();
  
  return {
    totalImages: images.length,
    brokenImages: brokenImages.length,
    details: brokenImages
  };
}

// Exponer globalmente para usar en consola
if (typeof window !== 'undefined') {
  (window as any).diagnoseImages = diagnoseImageIssues;
  console.log('💡 Ejecuta diagnoseImages() en la consola para diagnosticar problemas de imágenes');
}

