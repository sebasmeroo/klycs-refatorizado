import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RotateCcw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CssGlobalEditorProps {
  value: string;
  onChange: (css: string) => void;
  className?: string;
}

const defaultCSS = `/* CSS personalizado para la plantilla */
.template-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
  border-radius: 20px;
}

.profile-section {
  text-align: center;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 15px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.profile-name {
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.profile-bio {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  line-height: 1.5;
}

.links-section {
  margin-bottom: 30px;
}

.link-item {
  display: block;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.link-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.social-section {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.social-link {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}`;

export const CssGlobalEditor: React.FC<CssGlobalEditorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(lines);
  }, [value]);

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres resetear el CSS a los valores por defecto?')) {
      onChange(defaultCSS);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Manejar tab para indentación
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Restaurar posición del cursor
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Global CSS
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Custom CSS that will be applied to the template
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-2"
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="w-4 h-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Preview
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="relative">
        {isPreviewMode ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              CSS Preview
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded border p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {value}
              </pre>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 rounded-l-lg flex flex-col text-xs text-gray-500 dark:text-gray-400 pt-3 pb-3">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className="px-2 leading-6 text-right">
                  {i + 1}
                </div>
              ))}
            </div>
            
            {/* Editor */}
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-96 pl-14 pr-4 py-3 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/* Escribe tu CSS personalizado aquí... */"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Info y tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Tips for writing CSS
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.template-container</code> as the main wrapper</li>
          <li>• Classes like <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.profile-section</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.link-item</code> are available</li>
          <li>• Use CSS variables with <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">var(--primary-color)</code> for dynamic colors</li>
          <li>• Prefer iOS-style effects: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">backdrop-filter: blur()</code>, rounded corners, subtle shadows</li>
          <li>• The CSS will be scoped to prevent conflicts with the admin interface</li>
        </ul>
      </div>

      {/* Character count */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{lineCount} lines</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
};
