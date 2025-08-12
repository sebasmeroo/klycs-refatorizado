import React from 'react';

interface ReactPreviewSandboxProps {
  code: string;
  data: any;
  className?: string;
  height?: number;
  onError?: (error: string) => void;
  css?: string;
  autoHeight?: boolean;
}

// Sandbox que ejecuta código React real con Babel en un iframe aislado
// Uso: pasar el código JSX del usuario y el objeto data
export const ReactPreviewSandbox: React.FC<ReactPreviewSandboxProps> = ({
  code,
  data,
  className = '',
  height = 400,
  onError,
  css = '',
  autoHeight = false,
}) => {
  const [measuredHeight, setMeasuredHeight] = React.useState<number>(height || 400);
  const frameId = React.useMemo(() => 'rsb_' + Math.random().toString(36).slice(2), []);
  const srcDoc = React.useMemo(() => {
    // Preprocesar: eliminar exports para evitar sintaxis de módulos
    let processed = code
      .replace(/export\s+default\s+/g, '')
      .replace(/\bexport\s+\{[^}]*\};?/g, '')
      .replace(/\bexport\s+(const|let|var|function)\s+/g, '$1 ');

    // Escapar backticks y cierre de script
    const escapeForTemplate = (str: string) =>
      str
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        // Evitar cierre accidental de la etiqueta <script> dentro del template
        .split('</script>').join('<\\/script>');

    // Intentar adivinar el nombre del componente principal (capitalizado)
    const guessFromFunction = processed.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/);
    const guessFromConstArrow = processed.match(/(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\(/);
    const guessFromConstFunction = processed.match(/(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=\s*function\b/);
    const guessedName = (guessFromFunction?.[1] || guessFromConstArrow?.[1] || guessFromConstFunction?.[1] || '').trim();

    const candidateReturns = [
      guessedName && `if (typeof ${guessedName} !== 'undefined') return ${guessedName};`,
      `if (typeof LuxuryCards !== 'undefined') return LuxuryCards;`,
      `if (typeof Template !== 'undefined') return Template;`,
      `if (typeof DefaultComponent !== 'undefined') return DefaultComponent;`,
      `if (typeof App !== 'undefined') return App;`
    ].filter(Boolean).join('\n');

    const wrappedCode = `
      (function(){
        ${processed}
        ${candidateReturns}
        return null;
      })();
    `;

    const csp = `default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline' https:; font-src https: data:; connect-src https:; frame-ancestors 'none';`;

    return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>html,body{margin:0;padding:0;background:transparent;color:#111;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;}</style>
    <style>${css}</style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.templateData = ${JSON.stringify(data)};
      // NOTA: La advertencia de Babel "Be sure to precompile your scripts for production" 
      // es esperada aquí ya que necesitamos transpilación dinámica para el preview sandbox
    </script>
    <script type="text/babel">
      try {
        const Component = ${escapeForTemplate(wrappedCode)}; // IIFE que retorna el componente
        if (!Component) {
          document.getElementById('root').innerHTML = '<div style="padding:12px;color:#b91c1c;font:12px monospace">No se encontró un componente exportado (usa LuxuryCards, Template o DefaultComponent)</div>';
        } else {
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(Component, { data: window.templateData }));
        }
      } catch (e) {
        document.body.innerHTML = '<pre style="color:#b91c1c; font:12px monospace; white-space:pre-wrap">'+e.toString()+'</pre>';
        console.error(e);
      }
    </script>
    <script>
      try {
        const FRAME_ID = ${JSON.stringify(frameId)};
        function reportHeight(){
          try {
            var h = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.offsetHeight
            );
            parent.postMessage({ __rsb: true, frameId: FRAME_ID, type: 'height', height: h }, '*');
          } catch(err) {}
        }
        if (${autoHeight ? 'true' : 'false'}) {
          window.addEventListener('load', reportHeight);
          if (window.ResizeObserver) {
            new ResizeObserver(reportHeight).observe(document.body);
          }
          if (window.MutationObserver) {
            new MutationObserver(reportHeight).observe(document.body, {childList:true, subtree:true, attributes:true, characterData:true});
          }
          setInterval(reportHeight, 700);
        }
      } catch(e) {}
    </script>
  </body>
</html>`;
  }, [code, data, css]);

  React.useEffect(() => {
    if (!autoHeight) return;
    function onMessage(ev: MessageEvent){
      const d: any = ev.data || {};
      if (!d || !d.__rsb || d.frameId !== frameId) return;
      if (d.type === 'height' && typeof d.height === 'number') {
        setMeasuredHeight(Math.min(Math.max(d.height, 520), 1600));
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [autoHeight, frameId]);

  return (
    <iframe
      title="react-runtime-sandbox"
      sandbox="allow-scripts"
      style={{ width: '100%', height: autoHeight ? measuredHeight : height, border: 'none', borderRadius: 12, background: 'transparent', overflow: 'hidden' }}
      className={className}
      srcDoc={srcDoc}
      onError={() => onError?.('Error cargando el sandbox de React')}
    />
  );
};

export default ReactPreviewSandbox;


