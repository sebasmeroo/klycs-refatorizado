import React from 'react';
import { Card } from '@/types';
import { NewCardEditor } from './NewCardEditor';

interface CardEditorProps {
  card: Card;
  onSave: (updatedCard: Card) => void;
  onClose: () => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({ 
  card, 
  onSave,
  onClose 
}) => {
  return (
    <NewCardEditor
      card={card}
      onSave={onSave}
      onClose={onClose}
    />
  );
};

export default CardEditor;