import React from 'react';
import { useParams } from 'react-router-dom';
import { CardViewer } from '@/components/cards/CardViewer';

export const PublicCard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  return <CardViewer slug={slug} />;
};