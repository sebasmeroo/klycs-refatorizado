import React, { useState } from 'react';
import { Palette } from 'lucide-react';

interface UltimateColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  showPresets?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const presetColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F'
];

export const UltimateColorPicker: React.FC<UltimateColorPickerProps> = ({
  color,
  onChange,
  showPresets = true,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className={`${sizeClasses[size]} rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow`}
            style={{ backgroundColor: color }}
          >
            <div className="w-full h-full rounded-md bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
              <Palette size={size === 'sm' ? 12 : size === 'md' ? 16 : 20} className="text-white/80" />
            </div>
          </div>
        </div>
        
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="#000000"
        />
      </div>

      {showPresets && (
        <div className="mt-2 grid grid-cols-5 gap-1">
          {presetColors.map((presetColor) => (
            <button
              key={presetColor}
              onClick={() => onChange(presetColor)}
              className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};