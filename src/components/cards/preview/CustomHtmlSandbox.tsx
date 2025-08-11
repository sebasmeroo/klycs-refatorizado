import React from 'react';

type Props = {
  html?: string;
  css?: string;
  js?: string;
  height?: number;
};

// Renderiza código de usuario en un iframe sandboxed sin same-origin para aislar storage/cookies
// Permite scripts y forms; bloquea navegación top. Usa srcDoc con una CSP estricta.
export const CustomHtmlSandbox: React.FC<Props> = ({ html = '', css = '', js = '', height = 320 }) => {
  const srcDoc = React.useMemo(() => {
    const csp = `default-src 'none'; img-src data: https:; media-src https: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src https: data:; connect-src https:; frame-ancestors 'none';`;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0;background:transparent;color:#111;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;} ${css}</style>
</head>
<body>
  ${html}
  <script>(function(){ try { ${js} } catch(e){ console.error('Custom JS error:', e); }})();</script>
</body>
</html>`;
  }, [html, css, js]);

  return (
    <iframe
      title="custom-html"
      sandbox="allow-scripts allow-forms"
      style={{ width: '100%', height, border: 'none', borderRadius: 12, background: 'transparent' }}
      srcDoc={srcDoc}
    />
  );
};

export default CustomHtmlSandbox;


