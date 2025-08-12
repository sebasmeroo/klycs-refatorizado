import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Sube una imagen a Firebase Storage dentro de la carpeta `templates/`
 * y devuelve la URL pública https.
 */
export async function uploadTemplateImage(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9_\.\-]/g, '_');
  const path = `templates/${Date.now()}_${safeName}`;
  const r = ref(storage, path);
  const snap = await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(snap.ref);
  return url;
}


