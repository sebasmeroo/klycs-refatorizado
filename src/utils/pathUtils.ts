import type { PathValue } from '@/types/templatePack';

/**
 * Obtiene un valor de un objeto usando un path de punto (ej: "component.props.primary")
 */
export function getValueByPath(obj: any, path: string): PathValue {
  if (!obj || typeof obj !== 'object') {
    return { value: undefined, exists: false };
  }

  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    
    if (current === null || current === undefined) {
      return { value: undefined, exists: false };
    }
    
    if (typeof current !== 'object') {
      return { value: undefined, exists: false };
    }
    
    if (!(key in current)) {
      return { value: undefined, exists: false };
    }
    
    current = current[key];
  }
  
  return { value: current, exists: true };
}

/**
 * Establece un valor en un objeto usando un path de punto
 * Crea la estructura intermedia si no existe
 */
export function setValueByPath(obj: any, path: string, value: any): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const keys = path.split('.');
  let current = obj;
  
  // Navegar hasta el penúltimo nivel, creando estructura si es necesario
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    
    if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
      // Determinar si el próximo nivel debe ser array u objeto
      const isArrayIndex = /^\d+$/.test(nextKey);
      current[key] = isArrayIndex ? [] : {};
    }
    
    current = current[key];
  }
  
  // Establecer el valor final
  const finalKey = keys[keys.length - 1];
  current[finalKey] = value;
  
  return true;
}

/**
 * Elimina una propiedad de un objeto usando un path de punto
 */
export function deleteValueByPath(obj: any, path: string): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const keys = path.split('.');
  let current = obj;
  
  // Navegar hasta el penúltimo nivel
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
      return false; // El path no existe
    }
    
    current = current[key];
  }
  
  // Eliminar la propiedad final
  const finalKey = keys[keys.length - 1];
  if (finalKey in current) {
    delete current[finalKey];
    return true;
  }
  
  return false;
}

/**
 * Verifica si un path existe en un objeto
 */
export function pathExists(obj: any, path: string): boolean {
  return getValueByPath(obj, path).exists;
}

/**
 * Obtiene todos los paths posibles de un objeto de forma recursiva
 */
export function getAllPaths(obj: any, prefix: string = '', maxDepth: number = 10): string[] {
  if (maxDepth <= 0 || obj === null || obj === undefined) {
    return [];
  }

  const paths: string[] = [];
  
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const currentPath = prefix ? `${prefix}.${index}` : `${index}`;
        paths.push(currentPath);
        paths.push(...getAllPaths(item, currentPath, maxDepth - 1));
      });
    } else {
      Object.keys(obj).forEach(key => {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        paths.push(currentPath);
        paths.push(...getAllPaths(obj[key], currentPath, maxDepth - 1));
      });
    }
  }
  
  return paths;
}

/**
 * Clona profundamente un objeto
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Valida que un path tenga el formato correcto
 */
export function isValidPath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  // Debe contener solo letras, números, puntos y guiones bajos
  const pathRegex = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
  return pathRegex.test(path);
}

/**
 * Convierte un path en una descripción legible
 */
export function pathToLabel(path: string): string {
  return path
    .split('.')
    .map(segment => {
      // Convertir camelCase a palabras separadas
      return segment
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    })
    .join(' → ');
}
