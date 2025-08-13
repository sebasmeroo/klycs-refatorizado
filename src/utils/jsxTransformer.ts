import React from 'react';

// Cache para componentes compilados
const compiledComponentsCache = new Map<string, React.ComponentType<any>>();

/**
 * Transforma código JSX a un componente React ejecutable
 */
export function transformJSXToComponent(jsxCode: string, data: any): React.ComponentType<any> | null {
  try {
    // Crear una key única para el cache basada en el código
    const cacheKey = jsxCode.trim();
    
    // Si ya está en cache, retornar el componente cacheado
    if (compiledComponentsCache.has(cacheKey)) {
      return compiledComponentsCache.get(cacheKey)!;
    }

    // Limpiar y preparar el código JSX
    let cleanCode = jsxCode.trim();
    
    // Asegurar que el código tenga una función exportada
    if (!cleanCode.includes('export') && !cleanCode.includes('function')) {
      // Si no hay función, envolver el JSX en una función por defecto
      cleanCode = `
        export default function Template({ data }) {
          return (
            ${cleanCode}
          );
        }
      `;
    }

    // Transformar JSX usando Function constructor (más seguro que eval)
    // Crear un scope controlado con React y las dependencias necesarias
    const componentFunction = new Function(
      'React',
      'data',
      `
        const { createElement, Fragment } = React;
        const h = createElement;
        
        // Transformar JSX a createElement calls
        ${transformJSXSyntax(cleanCode)}
        
        // Buscar la función/componente exportado
        if (typeof Template !== 'undefined') return Template;
        if (typeof LuxuryCards !== 'undefined') return LuxuryCards;
        if (typeof LuxPillButton !== 'undefined') return LuxPillButton;
        if (typeof App !== 'undefined') return App;
        if (typeof DefaultComponent !== 'undefined') return DefaultComponent;
        
        return null;
      `
    );

    // Ejecutar la función para obtener el componente
    const Component = componentFunction(React, data);
    
    if (!Component) {
      console.error('No se pudo encontrar un componente exportado');
      return null;
    }

    // Crear un wrapper que pase las props correctamente
    const WrappedComponent: React.FC<{ data: any }> = (props) => {
      return React.createElement(Component, props);
    };

    // Cachear el componente
    compiledComponentsCache.set(cacheKey, WrappedComponent);
    
    return WrappedComponent;
    
  } catch (error) {
    console.error('Error transformando JSX:', error);
    return null;
  }
}

/**
 * Transforma sintaxis JSX básica a React.createElement
 */
function transformJSXSyntax(code: string): string {
  // Esta es una implementación simplificada
  // Para casos más complejos, sería mejor usar @babel/standalone
  
  let transformed = code;
  
  // Reemplazar elementos JSX simples con React.createElement
  // Esto es una aproximación básica - para casos complejos usar Babel
  
  // Por ahora, retornar el código tal como está
  // ya que el navegador moderno puede manejar JSX con Babel standalone
  
  return transformed;
}

/**
 * Transforma JSX a JavaScript usando transformación básica
 */
function transformJSXToJS(jsxCode: string): string {
  let js = jsxCode;
  
  // Transformar JSX tags básicos a React.createElement
  // Esta es una aproximación simple - para casos complejos habría que usar Babel
  
  // Transformar elementos auto-cerrados <div />
  js = js.replace(/<(\w+)([^>]*?)\/>/g, (match, tag, attrs) => {
    const props = attrs.trim() ? `, ${parseAttributes(attrs)}` : '';
    return `React.createElement('${tag}'${props})`;
  });
  
  // Transformar elementos con contenido <div>content</div>
  js = js.replace(/<(\w+)([^>]*?)>(.*?)<\/\1>/gs, (match, tag, attrs, content) => {
    const props = attrs.trim() ? `, ${parseAttributes(attrs)}` : '';
    const children = content.trim() ? `, ${parseChildren(content)}` : '';
    return `React.createElement('${tag}'${props}${children})`;
  });
  
  return js;
}

/**
 * Parsea atributos JSX a props de objeto JavaScript
 */
function parseAttributes(attrs: string): string {
  if (!attrs.trim()) return '{}';
  
  // Esta es una implementación muy básica
  // Para casos reales se necesitaría un parser más robusto
  const cleanAttrs = attrs.trim();
  
  // Si tiene llaves, probablemente ya es un objeto
  if (cleanAttrs.startsWith('{') && cleanAttrs.endsWith('}')) {
    return cleanAttrs;
  }
  
  // Transformación básica de atributos
  return `{${cleanAttrs}}`;
}

/**
 * Parsea children JSX
 */
function parseChildren(content: string): string {
  const trimmed = content.trim();
  
  // Si empieza con {}, es JavaScript
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed.slice(1, -1);
  }
  
  // Si contiene JSX, aplicar transformación
  if (trimmed.includes('<')) {
    return transformJSXToJS(trimmed);
  }
  
  // Es texto plano
  return `"${trimmed.replace(/"/g, '\\"')}"`;
}

/**
 * Ejecuta componente directamente usando Babel browser para JSX
 */
export function executeJSXDirectly(jsxCode: string, data: any): Promise<React.ComponentType<any> | null> {
  return new Promise((resolve) => {
    try {
      // Verificar si Babel está disponible globalmente
      const Babel = (window as any).Babel;
      
      if (!Babel) {
        // Fallback sin Babel - intentar ejecutar si ya está compilado
        if (jsxCode.includes('React.createElement')) {
          return executeCompiledCode(jsxCode, data, resolve);
        } else {
          throw new Error('Babel no está disponible y el código contiene JSX sin compilar');
        }
      }
      
      // Preparar el código JSX para transformación
      let codeToTransform = jsxCode.trim();
      
      // Detectar si necesita ser envuelto en una función
      const hasExportDefault = codeToTransform.includes('export default');
      const hasFunction = codeToTransform.includes('function') || codeToTransform.includes('=>');
      
      if (!hasFunction && !hasExportDefault) {
        // Si es solo JSX, envolverlo en una función
        codeToTransform = `
          function Template({ data = {} }) {
            return (
              ${codeToTransform}
            );
          }
          export default Template;
        `;
      }
      
      // Transformar JSX a JavaScript usando Babel
      const transformedResult = Babel.transform(codeToTransform, {
        presets: ['react'],
        plugins: []
      });
      
      let transformedCode = transformedResult.code || '';
      
      // Limpiar exports y convertir a return
      transformedCode = transformedCode.replace(/export\s+default\s+/g, 'return ');
      
      // Si no tiene return, agregar búsqueda de componentes
      if (!transformedCode.includes('return ')) {
        transformedCode = `
          ${transformedCode}
          
          // Buscar componente exportado
          if (typeof Template !== 'undefined') return Template;
          if (typeof LuxuryCards !== 'undefined') return LuxuryCards;
          if (typeof LuxPillButton !== 'undefined') return LuxPillButton;
          if (typeof App !== 'undefined') return App;
          if (typeof DefaultComponent !== 'undefined') return DefaultComponent;
          
          return null;
        `;
      }
      
      return executeCompiledCode(transformedCode, data, resolve);
      
    } catch (error) {
      console.error('Error ejecutando JSX:', error);
      
      // Fallback: crear componente de error
      try {
        const ErrorComponent: React.FC<{ data: any }> = ({ data }) => {
          return React.createElement('div', {
            style: { 
              padding: '1rem', 
              border: '1px solid #ef4444', 
              borderRadius: '0.5rem', 
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap'
            }
          }, `Error compilando JSX:\n${error instanceof Error ? error.message : 'Error desconocido'}`);
        };
        resolve(ErrorComponent);
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        resolve(null);
      }
    }
  });
}

/**
 * Ejecuta código JavaScript ya compilado
 */
function executeCompiledCode(compiledCode: string, data: any, resolve: (component: React.ComponentType<any> | null) => void) {
  try {
    // Crear el componente usando una función segura
    const componentCreator = new Function(
      'React',
      'data',
      `
        const { createElement: h, Fragment, useState, useEffect, useMemo, useCallback } = React;
        
        try {
          ${compiledCode}
        } catch (error) {
          console.error('Error en ejecución de template:', error);
          return null;
        }
      `
    );
    
    const Component = componentCreator(React, data);
    
    if (Component && typeof Component === 'function') {
      // Crear wrapper que pase las props correctamente
      const WrappedComponent: React.FC<{ data: any }> = (props) => {
        return React.createElement(Component, props);
      };
      resolve(WrappedComponent);
    } else {
      console.warn('No se encontró un componente válido en el código compilado');
      resolve(null);
    }
  } catch (error) {
    console.error('Error ejecutando código compilado:', error);
    resolve(null);
  }
}

/**
 * Limpia el cache de componentes compilados
 */
export function clearComponentCache() {
  compiledComponentsCache.clear();
}