import React from 'react';

interface ArtifactRendererProps {
  htmlTemplate: string; // contiene tokens {{fieldId}}
  cssScoped?: string;
  data: Record<string, any>;
  className?: string;
}

function fillTokens(htmlTemplate: string, data: Record<string, any>): string {
  return htmlTemplate.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, id) => {
    const v = data?.[id];
    return v == null ? '' : String(v);
  });
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ htmlTemplate, cssScoped = '', data, className = '' }) => {
  const styleRef = React.useRef<HTMLStyleElement | null>(null);
  const [html, setHtml] = React.useState('');

  React.useEffect(() => {
    setHtml(fillTokens(htmlTemplate, data));
  }, [htmlTemplate, data]);

  React.useEffect(() => {
    if (styleRef.current) {
      styleRef.current.textContent = cssScoped;
    }
  }, [cssScoped]);

  return (
    <div className={`template-sandbox relative overflow-hidden ${className}`} style={{ isolation: 'isolate', contain: 'layout style paint' }}>
      <style ref={styleRef as any} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default ArtifactRenderer;


