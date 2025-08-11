import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

interface TemplateSandboxProps {
  templateCode: string;
  cssCode: string;
  data: any;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  className?: string;
}

interface SecurityValidation {
  hasUnsafeElements: boolean;
  hasScriptTags: boolean;
  hasEventHandlers: boolean;
  hasExternalLinks: boolean;
  errors: string[];
}

// Lista de elementos y atributos peligrosos que no se permiten
const UNSAFE_ELEMENTS = [
  'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'textarea',
  'select', 'button', 'link', 'meta', 'base', 'style'
];

const UNSAFE_ATTRIBUTES = [
  'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 
  'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress',
  'href', 'action', 'formaction', 'javascript:', 'vbscript:'
  // Removemos 'src' y 'data:' que estaban causando problemas
];

const CSS_UNSAFE_PROPERTIES = [
  'position: fixed', // position: absolute y relative están permitidos
  'javascript:', 'vbscript:', 'expression(',
  'background-image: url(javascript:', '@import', 
  'behavior:', '-moz-binding:', 'filter: progid'
  // Removidas: position: absolute, z-index, overflow: hidden, pointer-events, content
  // Estas son propiedades CSS normales y seguras para diseño
];

export const TemplateSandbox: React.FC<TemplateSandboxProps> = ({
  templateCode,
  cssCode,
  data,
  onError,
  onSuccess,
  className = ''
}) => {
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [renderedContent, setRenderedContent] = useState<string>('');
  const sandboxRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement>(null);
  
  // Use refs for callbacks to avoid including them in useEffect dependencies
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);
  
  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
    onSuccessRef.current = onSuccess;
  }, [onError, onSuccess]);

  // Memoize data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => {
    // Create a stable reference for data object
    return data && typeof data === 'object' ? { ...data } : data;
  }, [JSON.stringify(data)]);

  // Valida la seguridad del código antes de renderizarlo
  const validateSecurity = (code: string, css: string): SecurityValidation => {
    const validation: SecurityValidation = {
      hasUnsafeElements: false,
      hasScriptTags: false,
      hasEventHandlers: false,
      hasExternalLinks: false,
      errors: []
    };

    // Validar elementos HTML peligrosos
    const lowerCode = code.toLowerCase();
    for (const element of UNSAFE_ELEMENTS) {
      if (lowerCode.includes(`<${element}`) || lowerCode.includes(`</${element}`)) {
        validation.hasUnsafeElements = true;
        validation.errors.push(`Elemento no permitido: <${element}>`);
      }
    }

    // Validar atributos peligrosos
    for (const attr of UNSAFE_ATTRIBUTES) {
      if (lowerCode.includes(attr.toLowerCase())) {
        validation.hasEventHandlers = true;
        validation.errors.push(`Atributo no permitido: ${attr}`);
      }
    }

    // Validar CSS peligroso
    const lowerCSS = css.toLowerCase();
    for (const prop of CSS_UNSAFE_PROPERTIES) {
      if (lowerCSS.includes(prop)) {
        validation.errors.push(`Propiedad CSS no permitida: ${prop}`);
      }
    }

    // Verificar si hay scripts reales (no palabras que contengan 'script')
    if (lowerCode.includes('<script') || lowerCode.includes('javascript:') || lowerCode.includes('eval(')) {
      validation.hasScriptTags = true;
      validation.errors.push('Código JavaScript no permitido en plantillas');
    }

    return validation;
  };

  // Sanitiza el código CSS para evitar problemas
  const sanitizeCSS = (css: string): string => {
    let sanitized = css;
    
    // Remover imports y URLs externas
    sanitized = sanitized.replace(/@import\s+url\([^)]+\)/gi, '');
    sanitized = sanitized.replace(/url\(\s*["']?(?!data:)[^"')]+["']?\s*\)/gi, '');
    
    // Remover position fixed/absolute que podrían romper el layout
    sanitized = sanitized.replace(/position\s*:\s*(fixed|absolute)/gi, 'position: relative');
    
    // Limitar z-index para evitar que se superponga sobre el admin
    sanitized = sanitized.replace(/z-index\s*:\s*\d+/gi, (match) => {
      const value = parseInt(match.split(':')[1]);
      return `z-index: ${Math.min(value, 100)}`;
    });

    // Encapsular todos los estilos en el contenedor de la plantilla
    const lines = sanitized.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('.template-sandbox') && !trimmed.startsWith('@') && !trimmed.includes('{')) {
        return line;
      } else if (trimmed.startsWith('.') || trimmed.includes('{')) {
        return `.template-sandbox ${line}`;
      }
      return line;
    });

    return lines.join('\n');
  };

  // Procesa el template de React a HTML seguro
  const processTemplate = (code: string, templateData: any): string => {
    try {
      let processed = code;
      
      // Primero, eliminar comentarios JSX
      processed = processed.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      
      // Reemplazar referencias a data.campo con valores reales
      Object.keys(templateData).forEach(key => {
        const value = templateData[key] || '';
        
        // Patrón para {data.campo || "default"}
        const regexWithDefault = new RegExp(
          `\\{\\s*data\\.${key}\\s*\\|\\|\\s*["']([^"']*)["']\\s*\\}`, 
          'g'
        );
        processed = processed.replace(regexWithDefault, (match, defaultVal) => {
          return value || defaultVal;
        });
        
        // Patrón simple para {data.campo}
        const regexSimple = new RegExp(`\\{\\s*data\\.${key}\\s*\\}`, 'g');
        processed = processed.replace(regexSimple, value);
        
        // Para estilos inline: data.campo || "default"
        const regexInStyle = new RegExp(`data\\.${key}\\s*\\|\\|\\s*["']([^"']*)["']`, 'g');
        processed = processed.replace(regexInStyle, (match, defaultVal) => {
          return `"${value || defaultVal}"`;
        });
      });

      // Extraer solo el JSX del return (más tolerante)
      const returnMatch = processed.match(/return\s*\(([\s\S]*?)\)\s*;?/m);
      if (returnMatch) {
        processed = returnMatch[1];
      }

      // Convertir JSX a HTML
      processed = processed
        .replace(/className=/g, 'class=')
        .replace(/htmlFor=/g, 'for=')
        .replace(/style=\{\{([\s\S]*?)\}\}/g, (match, styleContent) => {
          // Parser robusto de objeto de estilos que respeta comas dentro de funciones (rgba, url, gradients) y comillas
          const pairs: string[] = [];
          let current = '';
          let depthParen = 0;
          let inSingle = false;
          let inDouble = false;
          for (let i = 0; i < styleContent.length; i += 1) {
            const ch = styleContent[i];
            const prev = i > 0 ? styleContent[i - 1] : '';
            if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
            else if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
            else if (!inSingle && !inDouble) {
              if (ch === '(') depthParen += 1;
              else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
              else if (ch === ',' && depthParen === 0) {
                pairs.push(current.trim());
                current = '';
                continue;
              }
            }
            current += ch;
          }
          if (current.trim()) pairs.push(current.trim());

          const toCssKey = (key: string) => key.trim().replace(/^["']|["']$/g, '').replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

          const styleProps = pairs
            .map((prop) => {
              if (!prop) return '';
              // dividir por el primer ':' que no esté dentro de comillas ni paréntesis
              let k = '';
              let v = '';
              let local = '';
              let seenColon = false;
              let p = 0; let s = false; let d = false;
              for (let i = 0; i < prop.length; i += 1) {
                const c = prop[i];
                const pv = i > 0 ? prop[i - 1] : '';
                if (c === "'" && !d && pv !== '\\') s = !s;
                else if (c === '"' && !s && pv !== '\\') d = !d;
                else if (!s && !d) {
                  if (c === '(') p += 1; else if (c === ')') p = Math.max(0, p - 1);
                  if (!seenColon && c === ':' && p === 0) {
                    k = local.trim();
                    local = '';
                    seenColon = true;
                    continue;
                  }
                }
                local += c;
              }
              if (seenColon) v = local.trim(); else { k = local.trim(); v = ''; }
              if (!k) return '';
              const cssKey = toCssKey(k);
              const cssValue = v.replace(/^\{\s*|\s*\}$/g, '').replace(/^["']|["']$/g, '');
              if (!cssValue) return '';
              return `${cssKey}: ${cssValue}`;
            })
            .filter(Boolean)
            .join('; ');

          return `style="${styleProps}"`;
        });

      // Limpiar JSX expressions vacías
      processed = processed.replace(/\{\s*\}/g, '');
      
      // Remover líneas vacías y espacios extra
      processed = processed
        .split('\n')
        .filter(line => line.trim())
        .join('\n');

      return processed.trim();
    } catch (error) {
      console.error('Error procesando template:', error);
      throw new Error(`Error procesando template: ${error}`);
    }
  };

  // Renderiza el template de forma segura
  useEffect(() => {
    try {
      // Validar seguridad
      const validation = validateSecurity(templateCode, cssCode);
      
      if (validation.errors.length > 0) {
        setValidationErrors(validation.errors);
        setIsValid(false);
        onErrorRef.current?.(validation.errors.join(', '));
        return;
      }

      // Procesar y renderizar
      const processedHTML = processTemplate(templateCode, memoizedData);
      const sanitizedCSS = sanitizeCSS(cssCode);
      
      setRenderedContent(processedHTML);
      setValidationErrors([]);
      setIsValid(true);
      
      // Aplicar estilos CSS de forma aislada
      if (styleRef.current) {
        styleRef.current.textContent = sanitizedCSS;
      }
      
      onSuccessRef.current?.();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setValidationErrors([errorMessage]);
      setIsValid(false);
      onErrorRef.current?.(errorMessage);
    }
  }, [templateCode, cssCode, memoizedData]);

  if (!isValid && validationErrors.length > 0) {
    return (
      <div className={`template-sandbox-error ${className}`}>
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
              Plantilla no válida
            </h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`template-sandbox-container ${className}`}>
      {/* Indicador de seguridad */}
      <div className="flex items-center gap-2 mb-2 text-xs text-green-600 dark:text-green-400">
        <Shield className="w-3 h-3" />
        <span>Renderizado seguro activo</span>
        <CheckCircle className="w-3 h-3" />
      </div>

      {/* Estilos CSS aislados */}
      <style ref={styleRef} />

      {/* Contenedor sandbox */}
      <div 
        ref={sandboxRef}
        className="template-sandbox relative overflow-hidden"
        style={{
          // Aislamiento del contenido
          isolation: 'isolate',
          contain: 'layout style paint',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  );
};

export default TemplateSandbox;