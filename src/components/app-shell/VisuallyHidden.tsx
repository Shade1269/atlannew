import { ReactNode } from 'react';

interface VisuallyHiddenProps {
  children: ReactNode;
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, 'aria-live': ariaLive }) => {
  return (
    <span 
      className="sr-only" 
      aria-live={ariaLive}
      style={{ 
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0
      }}
    >
      {children}
    </span>
  );
};
