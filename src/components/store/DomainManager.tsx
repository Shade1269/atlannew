import { ReactNode } from 'react';

interface DomainManagerProps {
  children: ReactNode;
}

/**
 * DomainManager - Simplified, no domain redirects
 */
const DomainManager = ({ children }: DomainManagerProps) => {
  return <>{children}</>;
};

export default DomainManager;
