export interface TemplateFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'image' | 'number' | 'select' | 'boolean';
  defaultValue: any;
  options?: string[];
  editable: boolean;
}

export interface TemplateArtifact {
  engine: 'html-token-v1';
  htmlTemplate: string; // contiene tokens {{fieldId}}
  cssScoped: string; // CSS encapsulado para .template-sandbox
  fields: TemplateFieldConfig[];
}

const UNSAFE_ELEMENTS = ['script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'textarea', 'select', 'button', 'link', 'meta', 'base', 'style'];
const UNSAFE_ATTRS = ['href', 'javascript:', 'vbscript:'];

function validateSecurity(code: string): string[] {
  const errs: string[] = [];
  const lower = code.toLowerCase();
  
  // Verificar elementos no permitidos
  for (const el of UNSAFE_ELEMENTS) {
    if (lower.includes(`<${el}`)) errs.push(`Elemento no permitido: <${el}>`);
  }
  
  // Verificar atributos no permitidos generales
  for (const a of UNSAFE_ATTRS) {
    if (lower.includes(`${a}=`) || lower.includes(a)) errs.push(`Atributo no permitido: ${a}`);
  }
  
  // Verificar específicamente event handlers (on*)
  const eventHandlerPattern = /\s+on[a-z]+\s*=/gi;
  if (eventHandlerPattern.test(code)) {
    errs.push(`Atributo no permitido: event handlers (onClick, onSubmit, etc.)`);
  }
  
  return errs;
}

function sanitizeAndScopeCSS(css: string): string {
  let sanitized = css || '';
  // eliminar @import url(...)
  sanitized = sanitized.replace(/@import\s+url\([^)]+\);?/gi, '');
  // bloquear urls externas no data:
  sanitized = sanitized.replace(/url\(\s*["']?(?!data:)[^"')]+["']?\s*\)/gi, '');
  // limitar position fija/absoluta
  sanitized = sanitized.replace(/position\s*:\s*(fixed|absolute)/gi, 'position: relative');
  // limitar z-index
  sanitized = sanitized.replace(/z-index\s*:\s*(\d+)/gi, (_, g1) => `z-index: ${Math.min(parseInt(g1, 10), 100)}`);
  // scope: prefijar selectores simples con .template-sandbox
  const lines = sanitized.split('\n').map((line) => {
    const t = line.trim();
    if (!t) return line;
    if (t.startsWith('@')) return line; // @media etc
    return `.template-sandbox ${line}`;
  });
  return lines.join('\n');
}

// Parser robusto del objeto style={{ ... }} reutilizando la lógica del sandbox
function convertStyleObjectToInline(styleObjectSource: string): string {
  const pairs: string[] = [];
  let current = '';
  let depthParen = 0;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < styleObjectSource.length; i += 1) {
    const ch = styleObjectSource[i];
    const prev = i > 0 ? styleObjectSource[i - 1] : '';
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

  const toCssKey = (key: string) => key.trim().replace(/^["']|["']$/g, '').replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

  const styleProps = pairs
    .map((prop) => {
      if (!prop) return '';
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
}

export function compileTemplateToArtifact(
  reactCode: string,
  cssCode: string,
  jsonConfig: TemplateFieldConfig[]
): { artifact: TemplateArtifact; errors: string[] } {
  const errors: string[] = [];
  // Seguridad básica
  errors.push(...validateSecurity(reactCode));
  if (errors.length) {
    return {
      artifact: {
        engine: 'html-token-v1',
        htmlTemplate: '',
        cssScoped: sanitizeAndScopeCSS(cssCode),
        fields: jsonConfig,
      },
      errors,
    };
  }

  try {
    let processed = reactCode;
    // eliminar comentarios JSX
    processed = processed.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    // extraer contenido del return(...)
    // Extraer el primer return JSX sin exigir fin de archivo
    const match = processed.match(/return\s*\(([\s\S]*?)\)\s*;?/m);
    if (match) processed = match[1];

    // className/htmlFor
    processed = processed.replace(/className=/g, 'class=').replace(/htmlFor=/g, 'for=');

    // styles: style={{ ... }} → style="..."
    processed = processed.replace(/style=\{\{([\s\S]*?)\}\}/g, (_m, styleObj) => convertStyleObjectToInline(styleObj));

    // tokens de datos → {{campo}}
    // {data.campo || "Default"}
    processed = processed.replace(/\{\s*data\.([a-zA-Z0-9_]+)\s*\|\|\s*['"][^'"]*['"]\s*\}/g, (_m, id) => `{{${id}}}`);
    // {data.campo}
    processed = processed.replace(/\{\s*data\.([a-zA-Z0-9_]+)\s*\}/g, (_m, id) => `{{${id}}}`);
    // (data && data.campo) || "Default"
    processed = processed.replace(/\(\s*data\s*&&\s*data\.([a-zA-Z0-9_]+)\s*\)\s*\|\|\s*['"][^'"]*['"]/g, (_m, id) => `{{${id}}}`);
    // (data && data.campo)
    processed = processed.replace(/\(\s*data\s*&&\s*data\.([a-zA-Z0-9_]+)\s*\)/g, (_m, id) => `{{${id}}}`);
    // dentro de atributos o strings: data.campo → {{campo}}
    processed = processed.replace(/data\.([a-zA-Z0-9_]+)/g, (_m, id) => `{{${id}}}`);

    // limpiar expresiones vacías
    processed = processed.replace(/\{\s*\}/g, '');

    // normalizar líneas
    const htmlTemplate = processed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');

    const cssScoped = sanitizeAndScopeCSS(cssCode);

    return {
      artifact: {
        engine: 'html-token-v1',
        htmlTemplate,
        cssScoped,
        fields: jsonConfig,
      },
      errors: [],
    };
  } catch (e: any) {
    errors.push(e?.message || String(e));
    return {
      artifact: {
        engine: 'html-token-v1',
        htmlTemplate: '',
        cssScoped: sanitizeAndScopeCSS(cssCode),
        fields: jsonConfig,
      },
      errors,
    };
  }
}


