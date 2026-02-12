import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import EnhancedStoreFront from '@/features/affiliate/components/EnhancedStoreFront';

const StorefrontPage: React.FC = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();

  if (!storeSlug) return <Navigate to="/" replace />;

  return <EnhancedStoreFront storeSlug={storeSlug} />;
};

export default StorefrontPage;
