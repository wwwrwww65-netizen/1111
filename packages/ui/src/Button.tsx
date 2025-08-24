import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, ...props }: ButtonProps) {
  return (
    <button {...props} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
      {children}
    </button>
  );
}
