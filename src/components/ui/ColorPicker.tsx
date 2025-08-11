import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker, HexColorInput } from 'react-colorful';

interface ColorPickerPopoverProps {
  color: string;
  onChange: (hex: string) => void;
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  presets?: string[];
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChange,
  anchorEl,
  isOpen,
  onClose,
  presets = ['#007aff', '#5856d6', '#34c759', '#ff9500', '#ff3b30', '#0ea5e9', '#1f2937', '#111827']
}) => {
  const popRef = useRef<HTMLDivElement>(null);

  const position = useMemo(() => {
    if (!anchorEl) return { left: 0, top: 0, width: 260 };
    const r = anchorEl.getBoundingClientRect();
    const width = 260;
    const margin = 8;
    const top = Math.min(window.innerHeight - 320, Math.max(8, r.bottom + margin));
    const left = Math.min(window.innerWidth - width - 8, Math.max(8, r.left));
    return { left, top, width };
  }, [anchorEl]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!popRef.current) return;
      if (popRef.current.contains(e.target as Node)) return;
      if (anchorEl && anchorEl.contains(e.target as Node)) return;
      onClose();
    };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      window.addEventListener('click', h);
      window.addEventListener('keydown', k);
    }
    return () => {
      window.removeEventListener('click', h);
      window.removeEventListener('keydown', k);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] pointer-events-none">
      <div
        ref={popRef}
        className="pointer-events-auto rounded-2xl border border-black/20 bg-[#1b1b22] p-3 shadow-2xl"
        style={{ position: 'absolute', top: position.top, left: position.left, width: position.width }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md border border-black/30" style={{ background: color }} />
            <HexColorInput
              color={color}
              onChange={onChange}
              prefixed
              className="w-28 rounded-md bg-[#121218] border border-black/30 px-2 py-1 text-sm text-white outline-none"
            />
          </div>
          <button onClick={onClose} className="text-sm text-white/70 hover:text-white">Cerrar</button>
        </div>
        <HexColorPicker color={color} onChange={onChange} className="!w-full" />
        {presets.length > 0 && (
          <div className="grid grid-cols-8 gap-1 mt-3">
            {presets.map(p => (
              <button
                key={p}
                title={p}
                onClick={() => onChange(p)}
                className="h-6 w-full rounded-md border border-black/30"
                style={{ background: p }}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ColorPickerPopover;


