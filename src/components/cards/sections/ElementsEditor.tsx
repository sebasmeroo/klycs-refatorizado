import React, { useState } from 'react';
import { Card, CardElement } from '@/types';
import { Layers, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Type } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ElementsEditorProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export const ElementsEditor: React.FC<ElementsEditorProps> = ({ card, onUpdate }) => {
  const [elements, setElements] = useState<CardElement[]>([...card.elements]);

  const persist = (next: CardElement[]) => {
    setElements(next);
    onUpdate({ elements: next });
  };

  const toggleVisible = (index: number) => {
    const next = elements.map((el, i) => (i === index ? { ...el, isVisible: !el.isVisible } : el));
    persist(next);
  };

  const removeElement = (index: number) => {
    const next = elements.filter((_, i) => i !== index).map((el, i2) => ({ ...el, order: i2 }));
    persist(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= elements.length) return;
    const next = [...elements];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    persist(next.map((el, i) => ({ ...el, order: i })));
  };

  const updateText = (index: number, text: string) => {
    const el = elements[index];
    const next = elements.map((e, i) => (i === index ? { ...e, content: { ...el.content, text } } : e));
    persist(next);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Elementos Adicionales</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Edita o desactiva bloques extra como textos, divisores, etc.</p>
        </div>
      </div>

      {elements.length === 0 ? (
        <div className="text-center py-10 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
          <p className="text-teal-700 dark:text-teal-300">No hay elementos adicionales</p>
        </div>
      ) : (
        <div className="space-y-4">
          {elements
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((el, idx) => (
              <div key={el.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-teal-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{el.type.toUpperCase()}</span>
                    {!el.isVisible && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Oculto</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(idx, -1)} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" title="Subir">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => move(idx, 1)} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" title="Bajar">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleVisible(idx)} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" title={el.isVisible ? 'Ocultar' : 'Mostrar'}>
                      {el.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => removeElement(idx)} className="p-2 text-red-500 hover:text-red-700" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {el.type === 'text' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido del texto</label>
                    <textarea
                      className="w-full min-h-[80px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm p-2"
                      value={(el as any).content?.text || ''}
                      onChange={(e) => updateText(idx, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ElementsEditor;